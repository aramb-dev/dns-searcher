# DNS Searcher

DNS Searcher is a developer-friendly domain registrar meta-search app built with Next.js App Router and Bun. It generates domain candidates from one root term, checks multiple registrar APIs, and presents a normalized comparison focused on registry-level availability, pricing, premium status, and provider support.

## Why this exists

Most domain search tools collapse several different questions into one vague answer:

- Is the domain generally available to register?
- Which registrar supports that TLD?
- Which provider has the best first-year price?
- Is it a premium domain?
- Which option is best if you plan to host on Vercel or manage DNS elsewhere?

This app separates those concerns. Availability is treated as a registry-level outcome, while provider rows describe support, pricing, and premium behavior.

## Current MVP

The first version includes:

- a single search page built with Next.js App Router
- candidate generation from a root query and a TLD set
- provider adapters for Cloudflare, Namecheap, and Vercel
- a normalized internal result model shared by the UI and API
- a comparison table for availability, best provider, first-year price, renewal, premium flag, and provider support
- Bun-based tests for core search logic and route behavior

Not included yet:

- auth
- favorites or saved lists
- history
- provider-side purchase flows
- DNS setup automation
- persistent caching or rate limiting

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Bun

## Project structure

```txt
app/
  _components/
    DomainSearchApp.tsx
  api/domains/search/
    route.ts
lib/
  domainSearch/
    aggregateResults.ts
    constants.ts
    generateCandidates.ts
    searchDomains.ts
    searchRoute.ts
    types.ts
    providers/
      cloudflareProvider.ts
      namecheapProvider.ts
      vercelProvider.ts
      providerUtils.ts
types/
  bun-test.d.ts
```

## How it works

### 1. Candidate generation

The app takes a root query such as `jobticket`, normalizes it, and combines it with a default prefix list:

- `""`
- `get`
- `use`
- `try`
- `go`
- `my`

It then applies the selected TLDs:

- `com`
- `dev`
- `app`
- `ai`
- `io`
- `co`
- `net`
- `org`

### 2. Provider fan-out

The backend fans out the generated domains across the selected providers concurrently:

- Cloudflare
- Namecheap
- Vercel

Each provider adapter returns the same internal shape so the rest of the app does not need provider-specific logic.

### 3. Aggregation

Provider responses are grouped by domain and summarized into a domain-level result that includes:

- top-level availability
- whether any provider reported premium status
- cheapest first-year price
- cheapest renewal price
- best provider based on cheapest visible registration price

### 4. UI rendering

The frontend renders those aggregated results in a table and keeps the wording honest:

- “Available to register”
- “Already registered”
- “Premium listing”
- “Unsupported by selected providers”

It avoids misleading phrasing like “available on Cloudflare but unavailable on Namecheap.”

## Local development

### Requirements

- Bun 1.3+

### Install

```bash
bun install
```

### Environment

Create a local env file from the example:

```bash
cp .env.example .env.local
```

### Run the app

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
bun run build
bun run start
```

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

If credentials are missing, the app does not fake the result. Instead, the corresponding provider returns error rows so you can still validate the rest of the flow locally.

## API

### `POST /api/domains/search`

Searches generated domain candidates across the selected providers.

Request body:

```json
{
  "query": "jobticket",
  "tlds": ["com", "dev", "app"],
  "providers": ["cloudflare", "namecheap", "vercel"]
}
```

Response shape:

```json
{
  "query": "jobticket",
  "candidates": [
    "jobticket.com",
    "jobticket.dev",
    "getjobticket.com"
  ],
  "results": [
    {
      "domain": "jobticket.dev",
      "availability": "available",
      "bestProvider": "cloudflare",
      "cheapestRegistration": {
        "provider": "cloudflare",
        "currency": "USD",
        "registration": 12,
        "renewal": 14
      },
      "cheapestRenewal": {
        "provider": "cloudflare",
        "currency": "USD",
        "registration": 12,
        "renewal": 14
      },
      "premium": false,
      "providerResults": [],
      "checkedAt": "2026-06-08T12:00:00.000Z"
    }
  ],
  "checkedAt": "2026-06-08T12:00:00.000Z"
}
```

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run test
bun run typecheck
bun run lint
```

## Testing

Current automated coverage includes:

- candidate normalization and deduplication
- provider response normalization
- aggregation of cheapest registration and renewal prices
- degraded behavior when one provider fails
- route success and validation failure handling

Run everything relevant for this repo with:

```bash
bun run test
bun run typecheck
bun run build
```

## Notes and caveats

- This app is only as accurate as the provider APIs it can reach and authenticate against.
- Namecheap pricing and check responses are XML-based and normalized into the shared result format.
- Vercel support depends on the TLDs their registrar endpoints expose.
- Cloudflare and Namecheap support batched requests more naturally than Vercel-style per-domain price lookups.
- The app currently favors clarity and correctness over aggressive caching or throughput optimization.

## Next steps

Reasonable follow-up improvements:

- add favorites and shortlist export
- add search history
- persist cached result snapshots
- add Route 53 and DNSimple adapters
- add setup helpers for Vercel and Cloudflare
- support bulk multi-query search

## License

This project is licensed under [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/).

That means people can use, study, and modify the code for noncommercial purposes, but they do not get commercial-use rights by default. Commercial use requires separate permission from you as the licensor.
