import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_7ab4632845aa9862bfcac7ed10351a25acde9964';
const PAYSTACK_PUBLIC_KEY = process.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_37e05050fff4f47cfd468ebb25b1b8de04139759';

// Persistent storage setup
const DATA_DIR = path.resolve(__dirname, 'data');
const ORDERS_FILE = path.resolve(DATA_DIR, 'orders.json');
const PHOTOS_FILE = path.resolve(DATA_DIR, 'photos.json');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const IMAGES_DIR = path.resolve(PUBLIC_DIR, 'images');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Ensure images from photos.json are written to public/images/ on startup
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
syncPhotosToDisk();

function getStoredPhotoUrls(): Record<string, string> {
  const result: Record<string, string> = {
    'banner': '/images/banner.png',
    'black-cyan': '/images/black-cyan.jpg',
    'blue-yellow': '/images/blue-yellow.png',
    'white-purple': '/images/white-purple.png',
    'purple-yellow': '/images/purple-yellow.png',
    'white-teal': '/images/white-teal.png',
    'sand-green': '/images/sand-green.png'
  };

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
  const initialOrders = [
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
          subtotal: 100
        }
      ],
      totalAmountGhc: 100,
      currency: 'GHS',
      paystackReference: 'T_FLC_8021_KOF',
      paymentStatus: 'paid',
      collectionStatus: 'ready_for_pickup',
      channel: 'mobile_money',
      paidAt: '2026-10-15T14:30:00Z',
      createdAt: '2026-10-15T14:28:10Z'
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
          subtotal: 120
        },
        {
          id: 'item-3',
          edition: 'premium',
          color: 'sand-green',
          size: 'XL',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100
        }
      ],
      totalAmountGhc: 220,
      currency: 'GHS',
      paystackReference: 'T_FLC_8022_ABE',
      paymentStatus: 'paid',
      collectionStatus: 'collected',
      channel: 'mobile_money',
      paidAt: '2026-10-15T15:10:00Z',
      createdAt: '2026-10-15T15:08:45Z'
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
          subtotal: 100
        },
        {
          id: 'item-5',
          edition: 'standard',
          color: 'white-purple',
          size: 'M',
          quantity: 1,
          unitPrice: 60,
          subtotal: 60
        }
      ],
      totalAmountGhc: 160,
      currency: 'GHS',
      paystackReference: 'T_FLC_8023_EMM',
      paymentStatus: 'paid',
      collectionStatus: 'pending',
      channel: 'card',
      paidAt: '2026-10-15T16:02:00Z',
      createdAt: '2026-10-15T15:59:12Z'
    }
  ];
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2));
}

function getStoredOrders(): any[] {
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

function saveOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error('Error saving orders file:', err);
  }
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
    appUrl: baseUrl
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
            value: metadata?.customerName || 'First Love Member'
          },
          {
            display_name: 'Phone Number',
            variable_name: 'customer_phone',
            value: metadata?.customerPhone || ''
          },
          {
            display_name: 'Items Subtotal',
            variable_name: 'subtotal_ghc',
            value: metadata?.subtotalGhc ? `GHC ${Number(metadata.subtotalGhc).toFixed(2)}` : ''
          },
          {
            display_name: 'Processing Fee (GHC 2/shirt)',
            variable_name: 'processing_fee_ghc',
            value: metadata?.processingFeeGhc ? `GHC ${Number(metadata.processingFeeGhc).toFixed(2)}` : 'GHC 2.00 / shirt'
          },
          {
            display_name: 'Total Paid',
            variable_name: 'total_paid_ghc',
            value: `GHC ${Number(amountGhc).toFixed(2)}`
          }
        ]
      }
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Paystack initialization failed',
        data
      });
    }

    res.json({
      success: true,
      data: data.data
    });
  } catch (error: any) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Paystack Verify Payment Endpoint
app.get('/api/verify-payment/:reference', async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference required' });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Verification failed',
        data
      });
    }

    const transaction = data.data;
    const isSuccess = transaction.status === 'success';

    // Update order in persistent store if found
    if (isSuccess) {
      const orders = getStoredOrders();
      const existingOrderIndex = orders.findIndex((o: any) => o.paystackReference === reference);

      if (existingOrderIndex >= 0) {
        orders[existingOrderIndex].paymentStatus = 'paid';
        orders[existingOrderIndex].channel = transaction.channel;
        orders[existingOrderIndex].paidAt = transaction.paid_at || new Date().toISOString();
        saveOrders(orders);
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
        customer: transaction.customer
      }
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Paystack Webhook Handler
app.post('/api/paystack-webhook', (req: Request, res: Response) => {
  try {
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
      const orders = getStoredOrders();
      const order = orders.find((o: any) => o.paystackReference === reference);

      if (order) {
        order.paymentStatus = 'paid';
        order.channel = data.channel;
        order.paidAt = data.paid_at || new Date().toISOString();
        saveOrders(orders);
      }
    }

    res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook error');
  }
});

// Orders Management Endpoints
app.get('/api/orders', (_req: Request, res: Response) => {
  const orders = getStoredOrders().map((o: any) => ({
    ...o,
    paymentMode: o.paymentMode || 'live',
  }));
  res.json({ success: true, orders });
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const newOrder = req.body;
    if (!newOrder.id || !newOrder.items || !newOrder.totalAmountGhc) {
      return res.status(400).json({ success: false, message: 'Invalid order payload' });
    }

    if (!newOrder.paymentMode) {
      newOrder.paymentMode = 'live';
    }

    const orders = getStoredOrders();
    const existingIndex = orders.findIndex((o: any) => o.id === newOrder.id || (newOrder.momoReference && o.momoReference === newOrder.momoReference));

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...newOrder };
    } else {
      orders.unshift(newOrder);
    }

    saveOrders(orders);
    res.json({ success: true, order: newOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { collectionStatus } = req.body;

  if (!['pending', 'ready_for_pickup', 'collected'].includes(collectionStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid collection status' });
  }

  const orders = getStoredOrders();
  const order = orders.find((o: any) => o.id === id);

  if (!order) {
    return res.status(400).json({ success: false, message: 'Order not found' });
  }

  order.collectionStatus = collectionStatus;
  saveOrders(orders);
  res.json({ success: true, order });
});

app.post('/api/orders/:id/payment-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!['paid', 'pending', 'failed'].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status' });
  }

  const orders = getStoredOrders();
  const order = orders.find((o: any) => o.id === id);

  if (!order) {
    return res.status(400).json({ success: false, message: 'Order not found' });
  }

  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid' && !order.paidAt) {
    order.paidAt = new Date().toISOString();
  }
  saveOrders(orders);
  res.json({ success: true, order });
});

// Basontas Management Endpoints
const BASONTAS_FILE = path.resolve(DATA_DIR, 'basontas.json');

app.get('/api/basontas', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(BASONTAS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        const seen = new Set<string>();
        let fragranceSeen = false;
        const deduped = data.filter((item: any) => {
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
        return res.json({ success: true, basontas: deduped });
      }
    }
  } catch (err) {
    console.error('Error reading basontas:', err);
  }
  res.json({ success: true, basontas: [] });
});

app.post('/api/basontas', (req: Request, res: Response) => {
  try {
    const { basonta } = req.body;
    if (!basonta || !basonta.id || !basonta.name) {
      return res.status(400).json({ success: false, message: 'Invalid basonta payload' });
    }
    let list: any[] = [];
    if (fs.existsSync(BASONTAS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
      } catch {
        list = [];
      }
    }
    const idx = list.findIndex((b: any) => b.id === basonta.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...basonta };
    } else {
      list.push(basonta);
    }
    // Guarantee no duplicates and no duplicate fragrance
    const seen = new Set<string>();
    let fragranceSeen = false;
    const dedupedList = list.filter((b: any) => {
      if (!b || !b.id || seen.has(b.id)) return false;
      if (b.id === 'fragrance-stars' || (b.id === 'fragrance' && seen.has('fragrance-ministry'))) {
        return false;
      }
      if (b.id.includes('fragrance') || (b.name && b.name.toLowerCase().includes('fragrance'))) {
        if (fragranceSeen) return false;
        fragranceSeen = true;
      }
      seen.add(b.id);
      return true;
    });
    fs.writeFileSync(BASONTAS_FILE, JSON.stringify(dedupedList, null, 2));
    res.json({ success: true, basontas: dedupedList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/basontas/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let list: any[] = [];
    if (fs.existsSync(BASONTAS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
      } catch {
        list = [];
      }
    }
    const filtered = list.filter((b: any) => b.id !== id);
    fs.writeFileSync(BASONTAS_FILE, JSON.stringify(filtered, null, 2));
    res.json({ success: true, basontas: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Photo Management Endpoints
app.get('/api/photos', (_req: Request, res: Response) => {
  const photos = getStoredPhotoUrls();
  res.json({ success: true, photos });
});

app.post('/api/photos/upload', (req: Request, res: Response) => {
  try {
    const { key, dataUrl } = req.body;
    if (!key || !dataUrl) {
      return res.status(400).json({ success: false, message: 'Key and dataUrl required' });
    }

    let savedUrl = '';
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const buffer = Buffer.from(match[2], 'base64');
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

    const photos = getStoredPhotoUrls();
    const finalUrl = savedUrl || photos[key] || '';
    res.json({ success: true, photos, updatedKey: key, url: finalUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/photos/reset', (_req: Request, res: Response) => {
  try {
    // Re-sync base photos
    syncPhotosToDisk();
    const photos = getStoredPhotoUrls();
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
    etag: true
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
    console.log(`[First Love Merch] Server running on port ${PORT} (dev: ${!isProduction})`);
  });
}

startServer();
