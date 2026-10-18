# Supabase storage (optional)

The Express backend (`server.ts`) can store orders, basontas, and merch photos in Supabase instead of local JSON/files.

## When Supabase is used

Set **both** server-side environment variables:

- `SUPABASE_URL` — e.g. `https://cudktvjmvanwejtexuhe.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — the **service role** key from Supabase → Project Settings → API

If either is missing, the server keeps today’s behavior: `data/orders.json`, `data/basontas.json`, and `public/images/*`.

**Never** put the service role key in client code, `VITE_*` vars, commits, or the React bundle. RLS is enabled with no anon policies; only the service role can read/write.

## Schema (already applied)

Do not create migrations from this app. Expected tables/bucket:

| Resource | Notes |
|---|---|
| `public.orders` | `id` text PK, `data` jsonb (full order object), generated cols `payment_status`, `collection_status`, `momo_reference` |
| `public.basontas` | `id` text PK, `data` jsonb, `sort_order` int |
| `public.photos` | `key` text PK, `url` text |
| Storage bucket `merch-photos` | public read; png/jpg/webp; 5 MB |

## One-time migration from local files

With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment (e.g. a local `.env`), run:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

This upserts `data/orders.json`, `data/basontas.json`, and files under `public/images/` into Supabase. Demo order seeding remains file-fallback only and is not written to Supabase by the server.

## AI Studio / Google deploy

Leave Supabase unset in AI Studio if you want local-file behavior. To use Supabase in a hosted deploy, add the two secrets there (server-only). Response shapes for `/api/orders`, `/api/basontas`, and `/api/photos*` stay the same so the React front end needs no changes.
