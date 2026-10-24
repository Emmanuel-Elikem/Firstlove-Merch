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
  saveOrders as sbSaveOrders,
  getOrder as sbGetOrder,
  upsertOrder as sbUpsertOrder,
  patchOrder as sbPatchOrder,
  deleteOrder as sbDeleteOrder,
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
  FIRST_LOVE_MERCH_SHIRTS,
  FEE_PER_SHIRT_GHC,
  mergeBasontasWithDefaults,
  isStaleDefaultBasontaImage,
  processingFeeFor,
} from './src/data/merchData.ts';
import { deliveryListEnabled, buildDeliveryItems, pushToDeliveryList } from './delivery-list.ts';

/** Pricing: basonta shirts GHC 35; First Love merch GHC 60 (standard) / 100 (premium). Server recomputes — does not trust client unit prices. */
const BASONTA_PRICE_GHC = 35;
const MERCH_STANDARD_PRICE_GHC = 60;
const MERCH_PREMIUM_PRICE_GHC = 100;
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
  const processingFeeGhc = processingFeeFor(subtotalGhc, shirtCount);
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

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      // Paystack signs the exact bytes it sent; re-serialising req.body can differ.
      (req as any).rawBody = buf;
    },
  })
);
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

// Initial orders seed if file doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

const MOCK_ORDER_IDS = new Set(['FLC-8020', 'FLC-8021', 'FLC-8022', 'FLC-8023']);

function getStoredOrdersFromFile(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) {
        return list.filter((o: any) => o && !MOCK_ORDER_IDS.has(o.id));
      }
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  return [];
}

function saveOrdersToFile(orders: any[]) {
  try {
    const cleaned = (orders || []).filter((o: any) => o && !MOCK_ORDER_IDS.has(o.id));
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(cleaned, null, 2));
  } catch (err) {
    console.error('Error saving orders file:', err);
  }
}

async function getStoredOrders(): Promise<any[]> {
  if (supabaseEnabled) {
    try {
      const orders = await sbListOrders();
      if (Array.isArray(orders) && orders.length > 0) {
        const cleaned = orders.filter((o: any) => o && !MOCK_ORDER_IDS.has(o.id));
        // Keep local orders.json in sync as a resilient backup
        saveOrdersToFile(cleaned);
        return cleaned;
      }
      // If Supabase returned empty but local file has orders, seed Supabase!
      const fileOrders = getStoredOrdersFromFile();
      if (fileOrders.length > 0) {
        sbSaveOrders(fileOrders).catch((err: any) => console.error('Error seeding Supabase orders:', err));
        return fileOrders;
      }
      return [];
    } catch (err) {
      console.error('Error fetching Supabase orders, falling back to local file:', err);
      return getStoredOrdersFromFile();
    }
  }
  return getStoredOrdersFromFile();
}

function dedupeBasontas(data: any[]): any[] {
  const seen = new Set<string>();
  let fragranceSeen = false;
  return data.filter((item: any) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    // Filter out removed basontas like flowing-waters
    if (item.id === 'flowing-waters') {
      return false;
    }
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
  const fileIds = readDeletedBasontaIdsFromFile();
  if (supabaseEnabled) {
    try {
      const sbIds = await sbListDeletedBasontaIds();
      return Array.from(new Set([...fileIds, ...sbIds]));
    } catch (err) {
      console.error('Error loading deleted basonta ids from Supabase:', err);
      return fileIds;
    }
  }
  return fileIds;
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

function requestBaseUrl(req: Request): string {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return process.env.APP_URL || `${protocol}://${host}`;
}

async function findOrderByPaystackReference(reference: string): Promise<any | null> {
  if (supabaseEnabled) {
    try {
      const found = await sbFindByPaystackRef(reference);
      if (found) return found;
    } catch (err) {
      console.error('Supabase lookup by Paystack reference failed, using local file:', err);
    }
  }
  return getStoredOrdersFromFile().find((o: any) => o.paystackReference === reference) ?? null;
}

async function saveOrder(order: any): Promise<any> {
  const orders = getStoredOrdersFromFile();
  const idx = orders.findIndex((o: any) => o.id === order.id);
  if (idx >= 0) orders[idx] = { ...orders[idx], ...order };
  else orders.unshift(order);
  saveOrdersToFile(orders);

  if (supabaseEnabled) {
    try {
      return await sbUpsertOrder(order);
    } catch (err) {
      console.error('Error saving order to Supabase, kept in local file backup:', err);
    }
  }
  return order;
}

async function patchOrder(id: string, patch: Record<string, any>): Promise<any | null> {
  const orders = getStoredOrdersFromFile();
  const local = orders.find((o: any) => o.id === id);
  if (local) {
    Object.assign(local, patch);
    saveOrdersToFile(orders);
  }
  if (supabaseEnabled) {
    try {
      const updated = await sbPatchOrder(id, patch);
      if (updated) return updated;
    } catch (err) {
      console.error('Failed to patch order in Supabase:', err);
    }
  }
  return local ?? null;
}

async function generateOrderId(): Promise<string> {
  const taken = new Set((await getStoredOrders()).map((o: any) => o.id));
  for (let i = 0; i < 20; i++) {
    const id = `FLC-${crypto.randomInt(10000, 100000)}`;
    if (!taken.has(id)) return id;
  }
  return `FLC-${Date.now().toString().slice(-7)}`;
}

async function ministryNameResolver(): Promise<(colorId: string, edition: string) => string> {
  const names = new Map<string, string>();
  try {
    for (const b of await getMergedBasontas({ persistHeal: false })) {
      if (b?.id && b?.name) names.set(b.id, b.name);
    }
  } catch {
    // fall back to code defaults below
  }
  for (const b of BASONTA_SHIRTS) if (!names.has(b.id)) names.set(b.id, b.name);
  return (colorId, edition) => {
    const merch = FIRST_LOVE_MERCH_SHIRTS.find((m) => m.id === colorId);
    if (merch) {
      return `First Love Merch · ${merch.shortName} ${edition === 'premium' ? 'Premium' : 'Standard'}`;
    }
    return names.get(colorId) || colorId;
  };
}

/** Sends a paid order's shirts to the FLC Shirts delivery list once; safe to call repeatedly. */
async function syncOrderToDeliveryList(order: any): Promise<any> {
  if (!deliveryListEnabled || order.deliveryListSyncedAt) return order;
  try {
    const rows = buildDeliveryItems(order, await ministryNameResolver());
    await pushToDeliveryList(rows);
    return (
      (await patchOrder(order.id, { deliveryListSyncedAt: new Date().toISOString(), deliveryListError: null })) ||
      order
    );
  } catch (err: any) {
    console.error(`[Delivery list] Failed to sync ${order.id}:`, err);
    return (await patchOrder(order.id, { deliveryListError: String(err?.message || err) })) || order;
  }
}

/**
 * Single place a Paystack transaction turns an order into "paid" — used by both the
 * customer redirect (verify) and the webhook, so whichever arrives first wins and the
 * other is a no-op.
 */
async function fulfillPaystackTransaction(tx: any): Promise<{ order: any | null; verified: boolean; message?: string }> {
  const order = await findOrderByPaystackReference(String(tx?.reference || ''));
  if (!order) return { order: null, verified: false, message: 'Order not found for this payment reference' };

  if (tx.status !== 'success') {
    return { order, verified: false, message: `Payment ${tx.status || 'not completed'}` };
  }

  const expectedPesewas = Math.round(Number(order.totalAmountGhc) * 100);
  if (tx.currency !== 'GHS' || Number(tx.amount) < expectedPesewas) {
    const updated = await patchOrder(order.id, {
      paymentStatus: 'failed',
      paymentNote: `Paystack amount ${tx.currency} ${Number(tx.amount) / 100} did not match order total GHS ${order.totalAmountGhc}`,
    });
    return { order: updated || order, verified: false, message: 'Paid amount does not match the order total' };
  }

  let current = order;
  if (order.paymentStatus !== 'paid') {
    current =
      (await patchOrder(order.id, {
        paymentStatus: 'paid',
        channel: tx.channel || order.channel,
        paidAt: tx.paid_at || tx.paidAt || new Date().toISOString(),
        paystackTransactionId: tx.id,
        paystackFeesGhc: typeof tx.fees === 'number' ? tx.fees / 100 : undefined,
        paystackMomoNumber: tx.authorization?.mobile_money_number || undefined,
        paystackProvider: tx.authorization?.bank || undefined,
      })) || order;
  }

  current = await syncOrderToDeliveryList(current);
  return { order: current, verified: true };
}

async function fetchPaystackTransaction(reference: string): Promise<any> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw Object.assign(new Error(data.message || 'Paystack verification failed'), { status: response.status });
  }
  return data.data;
}

// Checkout: server prices the cart, saves a pending order, and opens a Paystack payment for it.
app.post('/api/checkout', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res);
    }

    const { customerName, customerPhone, customerEmail, items } = req.body || {};
    const name = String(customerName || '').trim();
    const phone = String(customerPhone || '').trim();
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your bag is empty' });
    }

    const id = await generateOrderId();
    const email = String(customerEmail || '').trim() || `${phone.replace(/\D/g, '') || 'customer'}@firstlove.org`;
    const basontaIds = await loadBasontaIdSet();
    const order = normalizeOrderPricing(
      {
        id,
        churchBranch: 'First Love Cape Coast',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        pickupNotes: '',
        items: items.map((i: any) => ({
          id: String(i.id || crypto.randomUUID()),
          color: String(i.color || ''),
          edition: i.edition === 'premium' ? 'premium' : 'standard',
          size: String(i.size || ''),
          quantity: i.quantity,
        })),
        currency: 'GHS',
        paystackReference: id,
        paymentMode: PAYSTACK_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
        paymentStatus: 'pending',
        collectionStatus: 'pending',
        channel: 'paystack',
        createdAt: new Date().toISOString(),
      },
      basontaIds
    );

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(order.totalAmountGhc * 100),
        currency: 'GHS',
        reference: order.paystackReference,
        callback_url: `${requestBaseUrl(req)}/payment-callback`,
        channels: ['mobile_money', 'card'],
        metadata: {
          orderId: order.id,
          customerName: name,
          customerPhone: phone,
          custom_fields: [
            { display_name: 'Ticket', variable_name: 'ticket', value: order.id },
            { display_name: 'Customer Name', variable_name: 'customer_name', value: name },
            { display_name: 'Phone Number', variable_name: 'customer_phone', value: phone },
            {
              display_name: 'Shirts',
              variable_name: 'shirts',
              value: order.items.map((i: any) => `${i.quantity}x ${i.color} (${i.size})`).join(', '),
            },
          ],
        },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      return res.status(502).json({ success: false, message: data.message || 'Could not start Paystack payment' });
    }

    const saved = await saveOrder(order);
    res.json({
      success: true,
      order: saved,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Called by the store after Paystack redirects the customer back.
app.get('/api/verify-payment/:reference', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res);
    }
    const tx = await fetchPaystackTransaction(req.params.reference);
    const result = await fulfillPaystackTransaction(tx);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Paystack Webhook: confirms payments even if the customer closes the tab before returning.
app.post('/api/paystack-webhook', async (req: Request, res: Response) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return paystackNotConfigured(res, false);
    }

    const rawBody: Buffer | undefined = (req as any).rawBody;
    const signature = String(req.headers['x-paystack-signature'] || '');
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody || '').digest('hex');
    if (
      !rawBody ||
      signature.length !== hash.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))
    ) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event?.event === 'charge.success' && event.data) {
      await fulfillPaystackTransaction(event.data);
    }
    res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook error');
  }
});

// Staff retry for a paid order whose delivery-list push failed.
app.post('/api/orders/:id/sync-delivery', async (req: Request, res: Response) => {
  try {
    const order = (await getStoredOrders()).find((o: any) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Only paid orders go to the delivery list' });
    }
    const updated = await syncOrderToDeliveryList({ ...order, deliveryListSyncedAt: undefined });
    res.json({ success: !updated.deliveryListError, order: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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

    // 1. Always save to local file as persistent backup first
    const orders = getStoredOrdersFromFile();
    const existingIndex = orders.findIndex(
      (o: any) => o.id === newOrder.id || (newOrder.momoReference && o.momoReference === newOrder.momoReference)
    );

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrder, id: orders[existingIndex].id };
    } else {
      orders.unshift(newOrder);
    }
    saveOrdersToFile(orders);

    // 2. If Supabase is enabled, save to Supabase Storage
    if (supabaseEnabled) {
      try {
        const saved = await sbUpsertOrder(newOrder);
        return res.json({ success: true, order: saved });
      } catch (sbErr) {
        console.error('Error saving order to Supabase, but preserved in local file backup:', sbErr);
        // Do not fail customer order submission if Supabase storage has a temporary hiccup
        return res.json({ success: true, order: newOrder });
      }
    }

    res.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error creating order:', error);
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

    // Always update local file
    const orders = getStoredOrdersFromFile();
    const order = orders.find((o: any) => o.id === id);
    if (order) {
      order.collectionStatus = collectionStatus;
      saveOrdersToFile(orders);
    }

    if (supabaseEnabled) {
      try {
        const updated = await sbPatchOrder(id, { collectionStatus });
        if (updated) {
          return res.json({ success: true, order: updated });
        }
      } catch (sbErr) {
        console.error('Failed to update status in Supabase:', sbErr);
      }
    }

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

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

    // Always update local file
    const orders = getStoredOrdersFromFile();
    const order = orders.find((o: any) => o.id === id);
    if (order) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !order.paidAt) {
        order.paidAt = new Date().toISOString();
      }
      saveOrdersToFile(orders);
    }

    if (supabaseEnabled) {
      try {
        const current = await sbGetOrder(id);
        const patch: Record<string, any> = { paymentStatus };
        if (paymentStatus === 'paid' && (!current || !current.paidAt)) {
          patch.paidAt = new Date().toISOString();
        }
        const updated = await sbPatchOrder(id, patch);
        if (updated) {
          return res.json({ success: true, order: updated });
        }
      } catch (sbErr) {
        console.error('Failed to update payment status in Supabase:', sbErr);
      }
    }

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orders = getStoredOrdersFromFile();
    const filtered = orders.filter((o: any) => o.id !== id);
    saveOrdersToFile(filtered);

    if (supabaseEnabled) {
      try {
        await sbDeleteOrder(id);
      } catch (err) {
        console.error('Failed to delete order from Supabase:', err);
      }
    }

    res.json({ success: true, message: `Order ${id} deleted successfully`, remaining: filtered.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders/:id/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orders = getStoredOrdersFromFile();
    const filtered = orders.filter((o: any) => o.id !== id);
    saveOrdersToFile(filtered);

    if (supabaseEnabled) {
      try {
        await sbDeleteOrder(id);
      } catch (err) {
        console.error('Failed to delete order from Supabase:', err);
      }
    }

    res.json({ success: true, message: `Order ${id} deleted successfully`, remaining: filtered.length });
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
