// Storage-only Supabase layer for Firstlove-Merch server.ts. No new npm packages (uses fetch).
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server-side only — never VITE_ / never client).
// Buckets: merch-photos (public images), merch-data (private JSON: orders.json, basontas.json).
// No PostgREST / database tables.
import dotenv from 'dotenv';
dotenv.config();

function supabaseUrl(): string {
  return process.env.SUPABASE_URL || '';
}
function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export const supabaseEnabled = Boolean(supabaseUrl() && supabaseKey());

const PHOTOS_BUCKET = 'merch-photos';
const DATA_BUCKET = 'merch-data';
const ORDERS_OBJECT = 'orders.json';
const BASONTAS_OBJECT = 'basontas.json';
const DELETED_BASONTAS_OBJECT = 'deleted-basontas.json';

/** Simple in-process mutex so concurrent Storage read-modify-writes don't clobber. */
let writeChain: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function authHeaders(contentType?: string): Record<string, string> {
  const KEY = supabaseKey();
  const h: Record<string, string> = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'x-upsert': 'true',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}

async function downloadJson<T>(objectPath: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(
      `${supabaseUrl()}/storage/v1/object/${DATA_BUCKET}/${objectPath}`,
      { headers: authHeaders() }
    );
    if (r.status === 404) return fallback;
    if (!r.ok) {
      const text = await r.text();
      // Supabase Storage returns 400 with NoSuchKey / not_found / statusCode 404 when object doesn't exist
      if (
        r.status === 400 &&
        (text.includes('NoSuchKey') ||
          text.includes('not_found') ||
          text.includes('Object not found') ||
          text.includes('"statusCode":"404"'))
      ) {
        return fallback;
      }
      throw new Error(`Storage download ${objectPath} ${r.status}: ${text}`);
    }
    const text = await r.text();
    if (!text || text.trim() === '') return fallback;
    return JSON.parse(text) as T;
  } catch (err: any) {
    if (
      err?.message &&
      (err.message.includes('NoSuchKey') ||
        err.message.includes('not_found') ||
        err.message.includes('Object not found') ||
        err.message.includes('404'))
    ) {
      return fallback;
    }
    throw err;
  }
}

async function uploadJson(objectPath: string, data: unknown): Promise<void> {
  const body = JSON.stringify(data, null, 2);
  const r = await fetch(
    `${supabaseUrl()}/storage/v1/object/${DATA_BUCKET}/${objectPath}`,
    {
      method: 'POST',
      headers: authHeaders('application/json'),
      body,
    }
  );
  if (!r.ok) throw new Error(`Storage upload ${objectPath} ${r.status}: ${await r.text()}`);
}

// ─── ORDERS (single JSON document in merch-data/orders.json) ───

export async function listOrders(): Promise<any[]> {
  const orders = await downloadJson<any[]>(ORDERS_OBJECT, []);
  return Array.isArray(orders) ? orders : [];
}

export async function saveOrders(orders: any[]): Promise<void> {
  await withLock(async () => {
    await uploadJson(ORDERS_OBJECT, orders);
  });
}

/** Read-modify-write a single order (or insert) under the write lock. */
export async function upsertOrder(order: any): Promise<any> {
  return withLock(async () => {
    const orders = await downloadJson<any[]>(ORDERS_OBJECT, []);
    const list = Array.isArray(orders) ? orders : [];
    const idx = list.findIndex(
      (o: any) =>
        o.id === order.id ||
        (order.momoReference && o.momoReference === order.momoReference)
    );
    let saved: any;
    if (idx >= 0) {
      saved = { ...list[idx], ...order, id: list[idx].id };
      list[idx] = saved;
    } else {
      saved = order;
      list.unshift(order);
    }
    await uploadJson(ORDERS_OBJECT, list);
    return saved;
  });
}

export async function getOrder(id: string): Promise<any | null> {
  const orders = await listOrders();
  return orders.find((o: any) => o.id === id) ?? null;
}

export async function patchOrder(id: string, patch: Record<string, any>): Promise<any | null> {
  return withLock(async () => {
    const orders = await downloadJson<any[]>(ORDERS_OBJECT, []);
    const list = Array.isArray(orders) ? orders : [];
    const idx = list.findIndex((o: any) => o.id === id);
    if (idx < 0) return null;
    const updated = { ...list[idx], ...patch };
    list[idx] = updated;
    await uploadJson(ORDERS_OBJECT, list);
    return updated;
  });
}

export async function deleteOrder(id: string): Promise<boolean> {
  return withLock(async () => {
    const orders = await downloadJson<any[]>(ORDERS_OBJECT, []);
    const list = Array.isArray(orders) ? orders : [];
    const idx = list.findIndex((o: any) => o.id === id);
    if (idx < 0) return false;
    list.splice(idx, 1);
    await uploadJson(ORDERS_OBJECT, list);
    return true;
  });
}

export async function findOrderByPaystackReference(reference: string): Promise<any | null> {
  const orders = await listOrders();
  return orders.find((o: any) => o.paystackReference === reference) ?? null;
}

export async function findOrderByMomoReference(reference: string): Promise<any | null> {
  const orders = await listOrders();
  return orders.find((o: any) => o.momoReference === reference) ?? null;
}

// ─── BASONTAS (single JSON document in merch-data/basontas.json) ───

export async function listBasontas(): Promise<any[]> {
  const list = await downloadJson<any[]>(BASONTAS_OBJECT, []);
  return Array.isArray(list) ? list : [];
}

export async function saveBasontas(list: any[]): Promise<void> {
  await withLock(async () => {
    await uploadJson(BASONTAS_OBJECT, list);
  });
}

export async function upsertBasonta(b: any): Promise<any[]> {
  return withLock(async () => {
    const current = await downloadJson<any[]>(BASONTAS_OBJECT, []);
    const list = Array.isArray(current) ? [...current] : [];
    const idx = list.findIndex((x: any) => x.id === b.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...b };
    else list.push(b);
    await uploadJson(BASONTAS_OBJECT, list);
    return list;
  });
}

export async function deleteBasonta(id: string): Promise<any[]> {
  return withLock(async () => {
    const current = await downloadJson<any[]>(BASONTAS_OBJECT, []);
    const list = (Array.isArray(current) ? current : []).filter((x: any) => x.id !== id);
    await uploadJson(BASONTAS_OBJECT, list);
    return list;
  });
}

/** Explicitly deleted default basonta ids — prevents re-injection on catalog merge. */
export async function listDeletedBasontaIds(): Promise<string[]> {
  const list = await downloadJson<string[]>(DELETED_BASONTAS_OBJECT, []);
  return Array.isArray(list) ? list.filter((id) => typeof id === 'string' && id) : [];
}

export async function saveDeletedBasontaIds(ids: string[]): Promise<void> {
  const unique = Array.from(new Set((ids || []).filter((id) => typeof id === 'string' && id)));
  await withLock(async () => {
    await uploadJson(DELETED_BASONTAS_OBJECT, unique);
  });
}

export async function markBasontaDeleted(id: string): Promise<string[]> {
  return withLock(async () => {
    const current = await downloadJson<string[]>(DELETED_BASONTAS_OBJECT, []);
    const list = Array.isArray(current) ? [...current] : [];
    if (id && !list.includes(id)) list.push(id);
    await uploadJson(DELETED_BASONTAS_OBJECT, list);
    return list;
  });
}

export async function unmarkBasontaDeleted(id: string): Promise<string[]> {
  return withLock(async () => {
    const current = await downloadJson<string[]>(DELETED_BASONTAS_OBJECT, []);
    const list = (Array.isArray(current) ? current : []).filter((x) => x !== id);
    await uploadJson(DELETED_BASONTAS_OBJECT, list);
    return list;
  });
}

// ─── PHOTOS (merch-photos bucket, public URLs) ───

export async function uploadPhoto(key: string, ext: string, buf: Buffer, mime: string): Promise<string> {
  const objectPath = `${key}.${ext}`;
  const r = await fetch(`${supabaseUrl()}/storage/v1/object/${PHOTOS_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: authHeaders(mime),
    body: new Uint8Array(buf),
  });
  if (!r.ok) throw new Error(`Storage ${r.status}: ${await r.text()}`);
  return `${supabaseUrl()}/storage/v1/object/public/${PHOTOS_BUCKET}/${objectPath}`;
}

/** List objects in merch-photos and map basename → public URL. */
export async function listPhotos(): Promise<Record<string, string>> {
  const r = await fetch(`${supabaseUrl()}/storage/v1/object/list/${PHOTOS_BUCKET}`, {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify({ prefix: '', limit: 1000 }),
  });
  if (!r.ok) throw new Error(`Storage list ${r.status}: ${await r.text()}`);
  const items = (await r.json()) as Array<{ name?: string }>;
  const result: Record<string, string> = {};
  for (const item of items || []) {
    const name = item?.name;
    if (!name || name.endsWith('/')) continue;
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) continue;
    const key = name.slice(0, name.lastIndexOf('.'));
    result[key] = `${supabaseUrl()}/storage/v1/object/public/${PHOTOS_BUCKET}/${name}`;
  }
  return result;
}

/** Upload a raw JSON/file blob to merch-data (used by migrate script). */
export async function uploadDataFile(objectPath: string, buf: Buffer, mime: string): Promise<void> {
  const r = await fetch(`${supabaseUrl()}/storage/v1/object/${DATA_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: authHeaders(mime),
    body: new Uint8Array(buf),
  });
  if (!r.ok) throw new Error(`Storage upload ${objectPath} ${r.status}: ${await r.text()}`);
}
