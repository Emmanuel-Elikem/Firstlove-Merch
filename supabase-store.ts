// Drop-in storage layer for Firstlove-Merch server.ts. No new npm packages (uses fetch).
// Needs two server-side secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never VITE_ / never client side).
import dotenv from 'dotenv';
dotenv.config();

function supabaseUrl(): string {
  return process.env.SUPABASE_URL || '';
}
function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export const supabaseEnabled = Boolean(supabaseUrl() && supabaseKey());

function headers(): Record<string, string> {
  const KEY = supabaseKey();
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// ORDERS (same JSON shape the app already uses, kept whole in the `data` column)
export async function listOrders(): Promise<any[]> {
  const rows = await rest('orders?select=data');
  const orders = (rows || []).map((r: any) => r.data).filter(Boolean);
  // Prefer newest first using the order object's createdAt when present
  orders.sort((a: any, b: any) => {
    const ta = Date.parse(a?.createdAt || '') || 0;
    const tb = Date.parse(b?.createdAt || '') || 0;
    return tb - ta;
  });
  return orders;
}

export async function upsertOrder(order: any) {
  await rest('orders?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: order.id, data: order }),
  });
}

export async function getOrder(id: string): Promise<any | null> {
  const rows = await rest(`orders?id=eq.${encodeURIComponent(id)}&select=data`);
  return rows?.[0]?.data ?? null;
}

export async function patchOrder(id: string, patch: Record<string, any>) {
  const current = await getOrder(id);
  if (!current) return null;
  const data = { ...current, ...patch };
  await rest(`orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ data }),
  });
  return data;
}

export async function findOrderByPaystackReference(reference: string): Promise<any | null> {
  const rows = await rest(
    `orders?data->>paystackReference=eq.${encodeURIComponent(reference)}&select=data`
  );
  return rows?.[0]?.data ?? null;
}

export async function findOrderByMomoReference(reference: string): Promise<any | null> {
  // Prefer generated column when available; fall back to jsonb path
  try {
    const rows = await rest(
      `orders?momo_reference=eq.${encodeURIComponent(reference)}&select=data`
    );
    if (rows?.length) return rows[0].data;
  } catch {
    // ignore and try jsonb path
  }
  const rows = await rest(
    `orders?data->>momoReference=eq.${encodeURIComponent(reference)}&select=data`
  );
  return rows?.[0]?.data ?? null;
}

// BASONTAS (ministry shirts)
export async function listBasontas(): Promise<any[]> {
  return (await rest('basontas?select=data&order=sort_order.asc')).map((r: any) => r.data);
}

export async function upsertBasonta(b: any, sortOrder?: number) {
  const row: Record<string, unknown> = { id: b.id, data: b };
  if (typeof sortOrder === 'number') row.sort_order = sortOrder;
  await rest('basontas?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(row),
  });
}

export async function deleteBasonta(id: string) {
  await rest(`basontas?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// PHOTOS -> Storage bucket `merch-photos` (public read, server-only write)
export async function uploadPhoto(key: string, ext: string, buf: Buffer, mime: string): Promise<string> {
  const KEY = supabaseKey();
  const URL_ = supabaseUrl();
  const objectPath = `${key}.${ext}`;
  const r = await fetch(`${URL_}/storage/v1/object/merch-photos/${objectPath}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buf),
  });
  if (!r.ok) throw new Error(`Storage ${r.status}: ${await r.text()}`);
  const url = `${URL_}/storage/v1/object/public/merch-photos/${objectPath}`;
  await rest('photos?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key, url }),
  });
  return url;
}

export async function listPhotos(): Promise<Record<string, string>> {
  const rows = await rest('photos?select=key,url');
  return Object.fromEntries((rows || []).map((r: any) => [r.key, r.url]));
}
