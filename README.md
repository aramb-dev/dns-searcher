# DNS Searcher

Developer-friendly domain registrar meta-search built with Next.js App Router and Bun.

## What it does

- Generates domain candidates from one root query
- Checks Cloudflare, Namecheap, and Vercel through server-side adapters
- Normalizes provider responses into one shared result model
- Compares registry-level availability, first-year price, renewal price, premium flags, and provider support

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Bun for install, dev, test, and typecheck

## Getting started

```bash
bun install
cp .env.example .env.local
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

### Cloudflare

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

### Namecheap

- `NAMECHEAP_API_KEY`
- `NAMECHEAP_API_USER`
- `NAMECHEAP_USERNAME`
- `NAMECHEAP_CLIENT_IP`
- `NAMECHEAP_API_BASE_URL`

### Vercel

- `VERCEL_API_TOKEN`
- `VERCEL_TEAM_ID`

If provider credentials are missing, the app returns provider-specific error rows instead of pretending the domain state is known.

## API

### `POST /api/domains/search`

Request:

```json
{
  "query": "jobticket",
  "tlds": ["com", "dev", "app"],
  "providers": ["cloudflare", "namecheap", "vercel"]
}
```

Response:

```json
{
  "query": "jobticket",
  "candidates": ["jobticket.com", "jobticket.dev"],
  "results": [],
  "checkedAt": "2026-06-08T12:00:00.000Z"
}
```

## Commands

```bash
bun run dev
bun run build
bun run start
bun run test
bun run typecheck
```

## Testing

Current automated coverage includes:

- candidate generation normalization and deduplication
- provider normalization helpers
- aggregate pricing selection
- degraded responses when a provider fails
- route success and validation failure handling
