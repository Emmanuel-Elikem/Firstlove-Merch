# Supabase storage (optional, storage-only)

The Express backend (`server.ts`) can persist data in **Supabase Storage** when configured. There are **no database tables** — orders and basontas live as JSON files in a private bucket; images live in a public photos bucket.

## When Supabase is used

Set **both** server-side environment variables:

- `SUPABASE_URL` — e.g. `https://cudktvjmvanwejtexuhe.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — the **service role** key from Supabase → Project Settings → API

If either is missing, the server keeps today’s behavior: `data/orders.json`, `data/basontas.json`, and `public/images/*`.

**Never** put the service role key in client code, `VITE_*` vars, commits, or the React bundle. Buckets use the service role for writes; `merch-data` is private.

## Buckets (already created)

| Bucket | Access | Contents |
|---|---|---|
| `merch-photos` | Public read | Shirt / banner images (png/jpg/webp, 5 MB). Public URL: `{SUPABASE_URL}/storage/v1/object/public/merch-photos/<key>.<ext>` |
| `merch-data` | Private | Single JSON documents: `orders.json`, `basontas.json` (5 MB). Read/written via Storage REST with the service role (`x-upsert: true`). |

The server serializes writes in-process (mutex) and uses read-modify-write for order updates so concurrent requests do not clobber the JSON documents.

## One-time migration from local files

With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment (e.g. a local `.env`), run:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

This uploads:

- `data/orders.json` → `merch-data/orders.json`
- `data/basontas.json` → `merch-data/basontas.json`
- every image under `public/images/` → `merch-photos/` (including all basonta shirt photos)

Demo order seeding remains file-fallback only and is not written to Supabase by the server at startup.

## AI Studio / Google deploy

Leave Supabase unset in AI Studio if you want local-file behavior. To use Supabase in a hosted deploy, add the two secrets there (server-only). Response shapes for `/api/orders`, `/api/basontas`, and `/api/photos*` stay the same so the React front end needs no storage-related changes.
