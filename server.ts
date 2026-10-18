import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {
  supabaseEnabled,
  listOrders as sbListOrders,
  getOrder as sbGetOrder,
  upsertOrder as sbUpsertOrder,
  patchOrder as sbPatchOrder,
  findOrderByPaystackReference as sbFindByPaystackRef,
  findOrderByMomoReference as sbFindByMomoRef,
  listBasontas as sbListBasontas,
  saveBasontas as sbSaveBasontas,
  upsertBasonta as sbUpsertBasonta,
  deleteBasonta as sbDeleteBasonta,
  listDeletedBasontaIds as sbListDeletedBasontaIds,
  saveDeletedBasontaIds as sbSaveDeletedBasontaIds,
  markBasontaDeleted as sbMarkBasontaDeleted,
  unmarkBasontaDeleted as sbUnmarkBasontaDeleted,
  uploadPhoto as sbUploadPhoto,
  listPhotos as sbListPhotos,
} from './supabase-store.ts';
import {
  BASONTA_SHIRTS,
  BASONTA_CATALOG_IDS,
  mergeBasontasWithDefaults,
  isStaleDefaultBasontaImage,
} from './src/data/merchData.ts';

/** Pricing: basonta shirts GHC 35; First Love merch GHC 60 (standard) / 100 (premium). Server recomputes — does not trust client unit prices. */
const BASONTA_PRICE_GHC = 35;
const MERCH_STANDARD_PRICE_GHC = 60;
const MERCH_PREMIUM_PRICE_GHC = 100;
const FEE_PER_SHIRT_GHC = 1;
const FIRST_LOVE_COLOR_IDS = new Set([
  'black-cyan',
  'blue-yellow',
  'white-purple',
  'purple-yellow',
  'white-teal',
  'sand-green',
]);

function unitPriceForItem(colorId: string, edition: string, basontaIds: Set<string>): number {
  // Basonta / ministry shirts (known catalog or custom non-merch ids) → GHC 35
  if (basontaIds.has(colorId) || !FIRST_LOVE_COLOR_IDS.has(colorId)) {
    return BASONTA_PRICE_GHC;
  }
  // First Love merch: standard GHC 60, premium/heavyweight GHC 100
  if (edition === 'premium') return MERCH_PREMIUM_PRICE_GHC;
  return MERCH_STANDARD_PRICE_GHC;
}

async function loadBasontaIdSet(): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const list = await getMergedBasontas({ persistHeal: false });
    for (const b of list || []) {
      if (b?.id) ids.add(b.id);
    }
  } catch {
    // ignore
  }
  // Always include catalog defaults even if file empty
  for (const id of BASONTA_CATALOG_IDS) {
    ids.add(id);
  }
  return ids;
}

function normalizeOrderPricing(order: any, basontaIds: Set<string>) {
  if (!Array.isArray(order.items)) {
    throw new Error('Invalid order items');
  }
  let subtotalGhc = 0;
  let shirtCount = 0;
  const items = order.items.map((item: any) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = unitPriceForItem(String(item.color || ''), String(item.edition || 'standard'), basontaIds);
    const subtotal = unitPrice * qty;
    subtotalGhc += subtotal;
    shirtCount += qty;
    return { ...item, quantity: qty, unitPrice, subtotal };
  });
  const processingFeeGhc = shirtCount * FEE_PER_SHIRT_GHC;
  const totalAmountGhc = subtotalGhc + processingFeeGhc;
  return {
    ...order,
    items,
    subtotalGhc,
    processingFeeGhc,
    feePerShirtGhc: FEE_PER_SHIRT_GHC,
    totalAmountGhc,
  };
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paystack keys: env only — no hard-coded fallbacks
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.VITE_PAYSTACK_PUBLIC_KEY || '';

function paystackNotConfigured(res: Response, asJson = true) {
  const message =
    'Paystack is not configured. Set PAYSTACK_SECRET_KEY (and VITE_PAYSTACK_PUBLIC_KEY) in the server environment.';
  if (asJson) {
    res.status(503).json({ success: false, message });
  } else {
    res.status(503).send(message);
  }
}

// Persistent storage setup (local file fallback when Supabase is not configured)
const DATA_DIR = path.resolve(__dirname, 'data');
const ORDERS_FILE = path.resolve(DATA_DIR, 'orders.json');
const PHOTOS_FILE = path.resolve(DATA_DIR, 'photos.json');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const IMAGES_DIR = path.resolve(PUBLIC_DIR, 'images');
const BASONTAS_FILE = path.resolve(DATA_DIR, 'basontas.json');
const DELETED_BASONTAS_FILE = path.resolve(DATA_DIR, 'deleted-basontas.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ensure images from photos.json are written to public/images/ on startup (file mode only)
function syncPhotosToDisk() {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const content = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      const data = JSON.parse(content);
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'string' && val.startsWith('data:image/')) {
          const match = val.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const buffer = Buffer.from(match[2], 'base64');
            const targetPath = path.join(IMAGES_DIR, `${key}.${ext}`);
            fs.writeFileSync(targetPath, buffer);
            console.log(`[Photos] Wrote ${key} to ${targetPath} (${buffer.length} bytes)`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing photos to disk:', err);
  }
}
if (!supabaseEnabled) {
  syncPhotosToDisk();
}

const DEFAULT_PHOTO_URLS: Record<string, string> = {
  banner: '/images/banner.png',
  'black-cyan': '/images/black-cyan.jpg',
  'blue-yellow': '/images/blue-yellow.png',
  'white-purple': '/images/white-purple.png',
  'purple-yellow': '/images/purple-yellow.png',
  'white-teal': '/images/white-teal.png',
  'sand-green': '/images/sand-green.png',
};

async function getStoredPhotoUrls(): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...DEFAULT_PHOTO_URLS };

  if (supabaseEnabled) {
    try {
      const remote = await sbListPhotos();
      Object.assign(result, remote);
    } catch (err) {
      console.error('Error listing Supabase photos:', err);
    }
    return result;
  }

  // Check if custom uploaded files exist in public/images
  try {
    if (fs.existsSync(IMAGES_DIR)) {
      const files = fs.readdirSync(IMAGES_DIR);
      for (const file of files) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext.replace('.', '').toLowerCase())) {
          result[base] = `/images/${file}`;
        }
      }
    }
  } catch (err) {
    console.error('Error scanning images dir:', err);
  }
  return result;
}

// Initial orders seed if file doesn't exist — only when file fallback is active
if (!supabaseEnabled && !fs.existsSync(ORDERS_FILE)) {
  const initialOrders = [
    {
      id: 'FLC-8020',
      churchBranch: 'First Love Cape Coast',
      customerName: 'Ama Boateng',
      customerPhone: '0244001122',
      customerEmail: 'ama.boateng@gmail.com',
      pickupNotes: 'Basonta desk',
      items: [
        {
          id: 'item-0',
          edition: 'standard',
          color: 'culinary-stars',
          size: 'M',
          quantity: 1,
          unitPrice: 35,
          subtotal: 35,
        },
      ],
      subtotalGhc: 35,
      processingFeeGhc: 1,
      feePerShirtGhc: 1,
      totalAmountGhc: 36,
      currency: 'GHS',
      paymentStatus: 'paid',
      collectionStatus: 'pending',
      channel: 'mobile_money',
      paidAt: '2026-10-15T13:00:00Z',
      createdAt: '2026-10-15T12:58:00Z',
    },
    {
      id: 'FLC-8021',
      churchBranch: 'First Love Cape Coast',
      customerName: 'Kofi Mensah',
      customerPhone: '0244123456',
      customerEmail: 'kofi.mensah@gmail.com',
      pickupNotes: 'Valco Hall / North Zone',
      items: [
        {
          id: 'item-1',
          edition: 'premium',
          color: 'black-cyan',
          size: 'L',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        },
      ],
      subtotalGhc: 100,
      processingFeeGhc: 1,
      feePerShirtGhc: 1,
      totalAmountGhc: 101,
      currency: 'GHS',
      paystackReference: 'T_FLC_8021_KOF',
      paymentStatus: 'paid',
      collectionStatus: 'ready_for_pickup',
      channel: 'mobile_money',
      paidAt: '2026-10-15T14:30:00Z',
      createdAt: '2026-10-15T14:28:10Z',
    },
    {
      id: 'FLC-8022',
      churchBranch: 'First Love Cape Coast',
      customerName: 'Abena Osei',
      customerPhone: '0559876543',
      customerEmail: 'abena.osei@yahoo.com',
      pickupNotes: 'Adehye Hall',
      items: [
        {
          id: 'item-2',
          edition: 'standard',
          color: 'blue-yellow',
          size: 'M',
          quantity: 2,
          unitPrice: 60,
          subtotal: 120,
        },
        {
          id: 'item-3',
          edition: 'premium',
          color: 'sand-green',
          size: 'XL',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        },
      ],
      totalAmountGhc: 220,
      currency: 'GHS',
      paystackReference: 'T_FLC_8022_ABE',
      paymentStatus: 'paid',
      collectionStatus: 'collected',
      channel: 'mobile_money',
      paidAt: '2026-10-15T15:10:00Z',
      createdAt: '2026-10-15T15:08:45Z',
    },
    {
      id: 'FLC-8023',
      churchBranch: 'First Love Cape Coast',
      customerName: 'Emmanuel Ansah',
      customerPhone: '0207654321',
      customerEmail: 'eansah@gmail.com',
      pickupNotes: 'Casford Hall',
      items: [
        {
          id: 'item-4',
          edition: 'premium',
          color: 'purple-yellow',
          size: 'XL',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        },
        {
          id: 'item-5',
          edition: 'standard',
          color: 'white-purple',
          size: 'M',
          quantity: 1,
          unitPrice: 60,
          subtotal: 60,
        },
      ],
      totalAmountGhc: 160,
      currency: 'GHS',
      paystackReference: 'T_FLC_8023_EMM',
      paymentStatus: 'paid',
      collectionStatus: 'pending',
      channel: 'card',
      paidAt: '2026-10-15T16:02:00Z',
      createdAt: '2026-10-15T15:59:12Z',
    },
  ];
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2));
}

function getStoredOrdersFromFile(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  return [];
}

function saveOrdersToFile(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error saving orders file:', err);
  }
}

async function getStoredOrders(): Promise<any[]> {
  if (supabaseEnabled) {
    return sbListOrders();
  }
  return getStoredOrdersFromFile();
}

function dedupeBasontas(data: any[]): any[] {
  const seen = new Set<string>();
  let fragranceSeen = false;
  return data.filter((item: any) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    // Filter out duplicate fragrance entries like fragrance-stars or generic fragrance
    if (item.id === 'fragrance-stars' || (item.id === 'fragrance' && seen.has('fragrance-ministry'))) {
      return false;
    }
    if (item.id.includes('fragrance') || (item.name && item.name.toLowerCase().includes('fragrance'))) {
      if (fragranceSeen) return false;
      fragranceSeen = true;
    }
    seen.add(item.id);
    return true;
  });
}

function readBasontasFromFile(): any[] {
  try {
    if (fs.existsSync(BASONTAS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading basontas:', err);
  }
  return [];
}

function readDeletedBasontaIdsFromFile(): string[] {
  try {
    if (fs.existsSync(DELETED_BASONTAS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DELETED_BASONTAS_FILE, 'utf-8'));
      if (Array.isArray(data)) return data.filter((id) => typeof id === 'string' && id);
    }
  } catch (err) {
    console.error('Error reading deleted basontas:', err);
  }
  return [];
}

function saveDeletedBasontaIdsToFile(ids: string[]) {
  const unique = Array.from(new Set(ids.filter((id) => typeof id === 'string' && id)));
  fs.writeFileSync(DELETED_BASONTAS_FILE, JSON.stringify(unique, null, 2));
}

async function loadDeletedBasontaIds(): Promise<string[]> {
  if (supabaseEnabled) {
    try {
      return await sbListDeletedBasontaIds();
    } catch (err) {
      console.error('Error loading deleted basonta ids from Supabase:', err);
      return [];
    }
  }
  return readDeletedBasontaIdsFromFile();
}

/**
 * Merge code defaults (BASONTA_SHIRTS) with stored list so stale runtime catalogs
 * (e.g. old 6-entry basontas.json) still expose new default wings. Explicitly
 * DELETE'd default ids stay hidden via deletedIds.
 */
async function getMergedBasontas(options?: { persistHeal?: boolean }): Promise<any[]> {
  const persistHeal = options?.persistHeal !== false;
  const stored = supabaseEnabled ? await sbListBasontas() : readBasontasFromFile();
  const deletedIds = await loadDeletedBasontaIds();
  const merged = mergeBasontasWithDefaults(
    Array.isArray(stored) ? stored : [],
    deletedIds,
    BASONTA_SHIRTS as any[]
  );
  const deduped = dedupeBasontas(merged);

  // Self-heal stale stored catalogs when new defaults were missing
  if (persistHeal) {
    const storedIds = new Set((Array.isArray(stored) ? stored : []).map((b: any) => b?.id).filter(Boolean));
    const addedDefaults = BASONTA_SHIRTS.some((d) => !deletedIds.includes(d.id) && !storedIds.has(d.id));
    const missingOrStaleImages = (Array.isArray(stored) ? stored : []).some((b: any) => {
      if (!b?.id || !BASONTA_CATALOG_IDS.has(b.id)) return false;
      const def = BASONTA_SHIRTS.find((d) => d.id === b.id);
      if (!def) return false;
      const path = b.imageFile && String(b.imageFile).trim();
      return !path || isStaleDefaultBasontaImage(b.id, path);
    });
    if (addedDefaults || missingOrStaleImages) {
      try {
        if (supabaseEnabled) {
          await sbSaveBasontas(deduped);
        } else {
          fs.writeFileSync(BASONTAS_FILE, JSON.stringify(deduped, null, 2));
        }
        console.log('[Basontas] Healed stored catalog with code defaults');
      } catch (e) {
        console.error('[Basontas] Failed to persist healed catalog:', e);
      }
    }
  }

  return deduped;
}

// Paystack Config Endpoint (Provides callback and webhook URLs for Paystack Dashboard)
app.get('/api/paystack-config', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

  const isLive = PAYSTACK_PUBLIC_KEY.startsWith('pk_live_');
  res.json({
    publicKey: PAYSTACK_PUBLIC_KEY,
    secretKeyConfigured: Boolean(PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_')),
    isLiveMode: isLive,
    paymentMode: isLive ? 'live' : 'test',
    callbackUrl: `${baseUrl}/payment-callback`,
    webhookUrl: `${baseUrl}/api/paystack-webhook`,
    appUrl: baseUrl,
  });
});

// Paystack Callback Route: When customer is redirected back from Paystack
app.get('/payment-callback', (req: Request, res: Response) => {
  const reference = req.query.reference || req.query.trxref;
  if (reference) {
    res.redirect(`/?reference=${encodeURIComponent(String(reference))}&status=success`);
  } else {
    res.redirect('/');
  }
});

// Paystack Initialize Payment Endpoint (Supports popup & standard redirect)
app.post('/api/initialize-payment', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res);
    }

    const { email, amountGhc, reference, metadata } = req.body;

    if (!email || !amountGhc || !reference) {
      return res.status(400).json({ success: false, message: 'Missing email, amount, or reference' });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    // Paystack takes amount in pesewas (1 GHS = 100 pesewas)
    const amountInPesewas = Math.round(Number(amountGhc) * 100);

    const payload = {
      email,
      amount: amountInPesewas,
      currency: 'GHS',
      reference,
      callback_url: `${baseUrl}/payment-callback`,
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: metadata?.customerName || 'First Love Member',
          },
          {
            display_name: 'Phone Number',
            variable_name: 'customer_phone',
            value: metadata?.customerPhone || '',
          },
          {
            display_name: 'Items Subtotal',
            variable_name: 'subtotal_ghc',
            value: metadata?.subtotalGhc ? `GHC ${Number(metadata.subtotalGhc).toFixed(2)}` : '',
          },
          {
            display_name: 'Processing Fee (GHC 2/shirt)',
            variable_name: 'processing_fee_ghc',
            value: metadata?.processingFeeGhc
              ? `GHC ${Number(metadata.processingFeeGhc).toFixed(2)}`
              : 'GHC 2.00 / shirt',
          },
          {
            display_name: 'Total Paid',
            variable_name: 'total_paid_ghc',
            value: `GHC ${Number(amountGhc).toFixed(2)}`,
          },
        ],
      },
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Paystack initialization failed',
        data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error: any) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Paystack Verify Payment Endpoint
app.get('/api/verify-payment/:reference', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res);
    }

    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference required' });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
        data,
      });
    }

    const transaction = data.data;
    const isSuccess = transaction.status === 'success';

    // Update order in persistent store if found
    if (isSuccess) {
      if (supabaseEnabled) {
        const existing = await sbFindByPaystackRef(reference);
        if (existing) {
          await sbPatchOrder(existing.id, {
            paymentStatus: 'paid',
            channel: transaction.channel,
            paidAt: transaction.paid_at || new Date().toISOString(),
          });
        }
      } else {
        const orders = getStoredOrdersFromFile();
        const existingOrderIndex = orders.findIndex((o: any) => o.paystackReference === reference);

        if (existingOrderIndex >= 0) {
          orders[existingOrderIndex].paymentStatus = 'paid';
          orders[existingOrderIndex].channel = transaction.channel;
          orders[existingOrderIndex].paidAt = transaction.paid_at || new Date().toISOString();
          saveOrdersToFile(orders);
        }
      }
    }

    res.json({
      success: true,
      verified: isSuccess,
      transaction: {
        reference: transaction.reference,
        amountGhc: transaction.amount / 100,
        currency: transaction.currency,
        status: transaction.status,
        channel: transaction.channel,
        paidAt: transaction.paid_at,
        customer: transaction.customer,
      },
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Paystack Webhook Handler
app.post('/api/paystack-webhook', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res, false);
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signature = req.headers['x-paystack-signature'];

    // Verify webhook signature if present
    if (signature && signature !== hash) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      if (supabaseEnabled) {
        const order = await sbFindByPaystackRef(reference);
        if (order) {
          await sbPatchOrder(order.id, {
            paymentStatus: 'paid',
            channel: data.channel,
            paidAt: data.paid_at || new Date().toISOString(),
          });
        }
      } else {
        const orders = getStoredOrdersFromFile();
        const order = orders.find((o: any) => o.paystackReference === reference);

        if (order) {
          order.paymentStatus = 'paid';
          order.channel = data.channel;
          order.paidAt = data.paid_at || new Date().toISOString();
          saveOrdersToFile(orders);
        }
      }
    }

    res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook error');
  }
});

// Orders Management Endpoints
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const orders = (await getStoredOrders()).map((o: any) => ({
      ...o,
      paymentMode: o.paymentMode || 'live',
    }));
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const incoming = req.body;
    if (!incoming.id || !incoming.items) {
      return res.status(400).json({ success: false, message: 'Invalid order payload' });
    }

    if (!incoming.paymentMode) {
      incoming.paymentMode = 'live';
    }

    const basontaIds = await loadBasontaIdSet();
    const newOrder = normalizeOrderPricing(incoming, basontaIds);

    if (supabaseEnabled) {
      const saved = await sbUpsertOrder(newOrder);
      return res.json({ success: true, order: saved });
    }

    const orders = getStoredOrdersFromFile();
    const existingIndex = orders.findIndex(
      (o: any) => o.id === newOrder.id || (newOrder.momoReference && o.momoReference === newOrder.momoReference)
    );

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrder, id: orders[existingIndex].id };
      saveOrdersToFile(orders);
      return res.json({ success: true, order: orders[existingIndex] });
    }

    orders.unshift(newOrder);
    saveOrdersToFile(orders);
    res.json({ success: true, order: newOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { collectionStatus } = req.body;

    if (!['pending', 'ready_for_pickup', 'collected'].includes(collectionStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid collection status' });
    }

    if (supabaseEnabled) {
      const order = await sbPatchOrder(id, { collectionStatus });
      if (!order) {
        return res.status(400).json({ success: false, message: 'Order not found' });
      }
      return res.json({ success: true, order });
    }

    const orders = getStoredOrdersFromFile();
    const order = orders.find((o: any) => o.id === id);

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    order.collectionStatus = collectionStatus;
    saveOrdersToFile(orders);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders/:id/payment-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['paid', 'pending', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    if (supabaseEnabled) {
      const current = await sbGetOrder(id);
      if (!current) {
        return res.status(400).json({ success: false, message: 'Order not found' });
      }
      const patch: Record<string, any> = { paymentStatus };
      if (paymentStatus === 'paid' && !current.paidAt) {
        patch.paidAt = new Date().toISOString();
      }
      const order = await sbPatchOrder(id, patch);
      return res.json({ success: true, order });
    }

    const orders = getStoredOrdersFromFile();
    const order = orders.find((o: any) => o.id === id);

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid' && !order.paidAt) {
      order.paidAt = new Date().toISOString();
    }
    saveOrdersToFile(orders);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Basontas Management Endpoints
app.get('/api/basontas', async (_req: Request, res: Response) => {
  try {
    const basontas = await getMergedBasontas({ persistHeal: true });
    return res.json({ success: true, basontas });
  } catch (err) {
    console.error('Error reading basontas:', err);
  }
  // Fallback to code defaults if storage fails
  res.json({
    success: true,
    basontas: dedupeBasontas(mergeBasontasWithDefaults([], [], BASONTA_SHIRTS as any[])),
  });
});

app.post('/api/basontas', async (req: Request, res: Response) => {
  try {
    const { basonta } = req.body;
    if (!basonta || !basonta.id || !basonta.name) {
      return res.status(400).json({ success: false, message: 'Invalid basonta payload' });
    }

    // Re-adding a previously deleted default (or any id) clears the tombstone
    if (supabaseEnabled) {
      try {
        await sbUnmarkBasontaDeleted(basonta.id);
      } catch (e) {
        console.error('Failed to clear deleted basonta mark:', e);
      }
    } else {
      const deleted = readDeletedBasontaIdsFromFile().filter((id) => id !== basonta.id);
      saveDeletedBasontaIdsToFile(deleted);
    }

    if (supabaseEnabled) {
      let list = await sbListBasontas();
      const deletedIds = await loadDeletedBasontaIds();
      const idx = list.findIndex((b: any) => b.id === basonta.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...basonta };
      } else {
        list.push(basonta);
      }
      const merged = mergeBasontasWithDefaults(list, deletedIds, BASONTA_SHIRTS as any[]);
      const dedupedList = dedupeBasontas(merged);
      await sbSaveBasontas(dedupedList);
      return res.json({ success: true, basontas: dedupedList });
    }

    let list: any[] = readBasontasFromFile();
    const deletedIds = readDeletedBasontaIdsFromFile();
    const idx = list.findIndex((b: any) => b.id === basonta.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...basonta };
    } else {
      list.push(basonta);
    }
    const merged = mergeBasontasWithDefaults(list, deletedIds, BASONTA_SHIRTS as any[]);
    const dedupedList = dedupeBasontas(merged);
    fs.writeFileSync(BASONTAS_FILE, JSON.stringify(dedupedList, null, 2));
    res.json({ success: true, basontas: dedupedList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/basontas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDefaultCatalog = BASONTA_CATALOG_IDS.has(id);

    if (supabaseEnabled) {
      await sbDeleteBasonta(id);
      // Tombstone default catalog ids so merge does not re-inject them
      if (isDefaultCatalog) {
        await sbMarkBasontaDeleted(id);
      }
      const deletedIds = await loadDeletedBasontaIds();
      const list = await sbListBasontas();
      const merged = dedupeBasontas(
        mergeBasontasWithDefaults(list, deletedIds, BASONTA_SHIRTS as any[])
      );
      return res.json({ success: true, basontas: merged });
    }

    let list: any[] = readBasontasFromFile();
    const filtered = list.filter((b: any) => b.id !== id);
    fs.writeFileSync(BASONTAS_FILE, JSON.stringify(filtered, null, 2));
    if (isDefaultCatalog) {
      const deleted = readDeletedBasontaIdsFromFile();
      if (!deleted.includes(id)) {
        deleted.push(id);
        saveDeletedBasontaIdsToFile(deleted);
      }
    }
    const deletedIds = readDeletedBasontaIdsFromFile();
    const merged = dedupeBasontas(
      mergeBasontasWithDefaults(filtered, deletedIds, BASONTA_SHIRTS as any[])
    );
    res.json({ success: true, basontas: merged });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Photo Management Endpoints
app.get('/api/photos', async (_req: Request, res: Response) => {
  try {
    const photos = await getStoredPhotoUrls();
    res.json({ success: true, photos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/photos/upload', async (req: Request, res: Response) => {
  try {
    const { key, dataUrl } = req.body;
    if (!key || !dataUrl) {
      return res.status(400).json({ success: false, message: 'Key and dataUrl required' });
    }

    let savedUrl = '';
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const rawExt = match[1] === 'jpeg' ? 'jpg' : match[1];
        const ext = rawExt.toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        const mime =
          ext === 'jpg' || ext === 'jpeg'
            ? 'image/jpeg'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/png';

        if (supabaseEnabled) {
          savedUrl = await sbUploadPhoto(key, ext, buffer, mime);
          console.log(`[Photos] Uploaded ${key} to Supabase storage`);

          // Update basonta imageFile if this key matches a basonta
          try {
            const currentBasontas = await sbListBasontas();
            const idx = currentBasontas.findIndex((b: any) => b.id === key);
            if (idx >= 0) {
              const updated = { ...currentBasontas[idx], imageFile: savedUrl };
              await sbUpsertBasonta(updated);
              console.log(`[Photos] Updated basonta imageFile for ${key}`);
            }
          } catch (e) {
            console.error('Error updating basonta imageFile:', e);
          }
        } else {
          const targetPath = path.join(IMAGES_DIR, `${key}.${ext}`);
          fs.writeFileSync(targetPath, buffer);
          savedUrl = `/images/${key}.${ext}`;
          console.log(`[Photos] Uploaded and saved ${key} to ${targetPath}`);

          // Also sync to dist/images if built
          const distImagesDir = path.resolve(__dirname, 'dist', 'images');
          if (fs.existsSync(distImagesDir)) {
            try {
              fs.writeFileSync(path.join(distImagesDir, `${key}.${ext}`), buffer);
            } catch (e) {}
          }

          // Also update basontas.json if this key matches a basonta
          if (fs.existsSync(BASONTAS_FILE)) {
            try {
              const currentBasontas = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
              if (Array.isArray(currentBasontas)) {
                const idx = currentBasontas.findIndex((b: any) => b.id === key);
                if (idx >= 0) {
                  currentBasontas[idx].imageFile = savedUrl;
                  fs.writeFileSync(BASONTAS_FILE, JSON.stringify(currentBasontas, null, 2));
                  console.log(`[Photos] Updated basontas.json imageFile for ${key}`);
                }
              }
            } catch (e) {
              console.error('Error updating basontas.json imageFile:', e);
            }
          }
        }
      }
    }

    const photos = await getStoredPhotoUrls();
    const finalUrl = savedUrl || photos[key] || '';
    res.json({ success: true, photos, updatedKey: key, url: finalUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/photos/reset', async (_req: Request, res: Response) => {
  try {
    // Re-sync base photos (file mode only)
    if (!supabaseEnabled) {
      syncPhotosToDisk();
    }
    const photos = await getStoredPhotoUrls();
    res.json({ success: true, photos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Vite Middleware mounting in development or static serve in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  // Serve static images directly with fast revalidation
  app.use('/images', express.static(IMAGES_DIR, {
    maxAge: '1h',
    etag: true,
  }));
  app.use(express.static(PUBLIC_DIR));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const storageMode = supabaseEnabled ? 'supabase' : 'local-files';
    console.log(`[First Love Merch] Server running on port ${PORT} (dev: ${!isProduction}, storage: ${storageMode})`);
  });
}

startServer();
