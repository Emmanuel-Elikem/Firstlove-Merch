/**
 * One-time migration: local data/*.json + public/images → Supabase.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Run: npx tsx scripts/migrate-to-supabase.ts
 *
 * Never commit the service role key.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import {
  supabaseEnabled,
  upsertOrder,
  upsertBasonta,
  uploadPhoto,
} from '../supabase-store.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ORDERS_FILE = path.join(ROOT, 'data', 'orders.json');
const BASONTAS_FILE = path.join(ROOT, 'data', 'basontas.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

function mimeForExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'webp') return 'image/webp';
  return 'image/png';
}

async function main() {
  if (!supabaseEnabled) {
    console.error(
      'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Set both in the environment (or .env) and retry.'
    );
    process.exit(1);
  }

  let ordersMigrated = 0;
  let basontasMigrated = 0;
  let photosMigrated = 0;

  if (fs.existsSync(ORDERS_FILE)) {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    if (Array.isArray(orders)) {
      for (const order of orders) {
        if (!order?.id) continue;
        await upsertOrder(order);
        ordersMigrated += 1;
        console.log(`[orders] upserted ${order.id}`);
      }
    }
  } else {
    console.log('[orders] data/orders.json not found — skipped');
  }

  if (fs.existsSync(BASONTAS_FILE)) {
    const basontas = JSON.parse(fs.readFileSync(BASONTAS_FILE, 'utf-8'));
    if (Array.isArray(basontas)) {
      for (let i = 0; i < basontas.length; i++) {
        const b = basontas[i];
        if (!b?.id) continue;
        await upsertBasonta(b, i);
        basontasMigrated += 1;
        console.log(`[basontas] upserted ${b.id} (sort_order=${i})`);
      }
    }
  } else {
    console.log('[basontas] data/basontas.json not found — skipped');
  }

  if (fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      const ext = path.extname(file).replace('.', '').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) continue;
      const key = path.basename(file, path.extname(file));
      const buf = fs.readFileSync(path.join(IMAGES_DIR, file));
      const url = await uploadPhoto(key, ext === 'jpeg' ? 'jpg' : ext, buf, mimeForExt(ext));
      photosMigrated += 1;
      console.log(`[photos] uploaded ${key} → ${url}`);
    }
  } else {
    console.log('[photos] public/images not found — skipped');
  }

  console.log(
    `\nDone. Migrated ${ordersMigrated} orders, ${basontasMigrated} basontas, ${photosMigrated} photos.`
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
