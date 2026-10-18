/**
 * One-time migration: local data + images → Supabase Storage (no database tables).
 *
 * Uploads:
 *   - data/orders.json  → merch-data/orders.json   (private bucket)
 *   - data/basontas.json → merch-data/basontas.json (private bucket)
 *   - public/images/*   → merch-photos/<file>      (public bucket; includes all basonta
 *     shirt photos such as culinary-stars, worship-stars, sheep-seeking, film-stars,
 *     fragrance-ministry, hearing-and-seeing, dancing-stars, etc.)
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
  uploadDataFile,
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
  if (e === 'json') return 'application/json';
  return 'image/png';
}

async function main() {
  if (!supabaseEnabled) {
    console.error(
      'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Set both in the environment (or .env) and retry.'
    );
    process.exit(1);
  }

  let dataFiles = 0;
  let photosMigrated = 0;

  if (fs.existsSync(ORDERS_FILE)) {
    const buf = fs.readFileSync(ORDERS_FILE);
    await uploadDataFile('orders.json', buf, 'application/json');
    dataFiles += 1;
    console.log('[merch-data] uploaded orders.json');
  } else {
    console.log('[merch-data] data/orders.json not found — skipped');
  }

  if (fs.existsSync(BASONTAS_FILE)) {
    const buf = fs.readFileSync(BASONTAS_FILE);
    await uploadDataFile('basontas.json', buf, 'application/json');
    dataFiles += 1;
    console.log('[merch-data] uploaded basontas.json');
  } else {
    console.log('[merch-data] data/basontas.json not found — skipped');
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
      console.log(`[merch-photos] uploaded ${key} → ${url}`);
    }
  } else {
    console.log('[merch-photos] public/images not found — skipped');
  }

  console.log(
    `\nDone. Uploaded ${dataFiles} JSON doc(s) to merch-data and ${photosMigrated} image(s) to merch-photos.`
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
