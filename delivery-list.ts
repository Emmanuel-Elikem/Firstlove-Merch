// Pushes paid orders into the FLC Shirts delivery list (flc-shirts.vercel.app).
// That app reads rows from the `flc_items` table in the same Supabase project via its
// `flc_sync` RPC, so inserting here makes the shirts show up there on the next sync.
// Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server-side only).
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const deliveryListEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

export interface DeliveryListItem {
  id: string;
  name: string;
  ministry: string;
  size: string;
  phone?: string;
  momoNumber?: string;
  reference?: string;
  ticket?: string;
  txid?: string;
  paid?: number;
  paidAt?: string;
  part?: string;
  note?: string;
  addedBy?: string;
}

/** Same short format the delivery app uses for manually added rows, e.g. "24 Oct, 03:04". */
export function formatDeliveryPaidAt(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Accra',
  });
}

/**
 * One delivery row per physical shirt so staff can tick them off individually.
 * Row ids are derived from the order id, so re-sending the same order never duplicates rows.
 */
export function buildDeliveryItems(
  order: any,
  ministryNameFor: (colorId: string, edition: string) => string
): DeliveryListItem[] {
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const shirtCount = items.reduce((n, i) => n + Math.max(1, Number(i.quantity) || 1), 0);
  const perShirtPaid =
    shirtCount > 0 ? Math.round((Number(order.totalAmountGhc) / shirtCount) * 100) / 100 : undefined;

  const rows: DeliveryListItem[] = [];
  let n = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    for (let i = 0; i < qty; i++) {
      n += 1;
      const row: DeliveryListItem = {
        id: `ps-${order.id}-${n}`,
        name: order.customerName,
        ministry: ministryNameFor(String(item.color || ''), String(item.edition || 'standard')),
        size: String(item.size || ''),
        phone: order.customerPhone,
        momoNumber: order.paystackMomoNumber,
        reference: order.paystackReference,
        ticket: order.id,
        txid: order.paystackTransactionId ? String(order.paystackTransactionId) : undefined,
        paid: perShirtPaid,
        paidAt: formatDeliveryPaidAt(order.paidAt),
        part: shirtCount > 1 ? `${n} of ${shirtCount}` : undefined,
        note: `Paid online via Paystack${order.channel ? ` (${String(order.channel).replace(/_/g, ' ')})` : ''}`,
        addedBy: 'Merch store',
      };
      for (const key of Object.keys(row) as (keyof DeliveryListItem)[]) {
        if (row[key] === undefined || row[key] === null || row[key] === '') delete row[key];
      }
      rows.push(row);
    }
  }
  return rows;
}

export async function pushToDeliveryList(rows: DeliveryListItem[]): Promise<void> {
  if (!deliveryListEnabled) {
    throw new Error('Delivery list sync needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  if (rows.length === 0) return;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/flc_items?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    // flc_items.source is CHECK-limited to preorder | momo | manual | app; 'app' rows get a Remove button there.
    body: JSON.stringify(rows.map((data) => ({ id: data.id, source: 'momo', data }))),
  });
  if (!r.ok) {
    throw new Error(`Delivery list insert ${r.status}: ${await r.text()}`);
  }
}
