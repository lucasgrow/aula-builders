# cloudflare-builder

SaaS template: Next.js 14, HeroUI, Drizzle ORM, Cloudflare D1/R2.

## Quick Start

```bash
# 1. Install deps
bun install

# 2. Run interactive setup (creates D1, R2, .dev.vars, applies migration)
bun run setup

# 3. Start dev server
bun dev
```

## Onboarding Guide

When a user asks for help setting up, walk them through these steps:

### Prerequisites
Check: `bun --version` (need 1.1+), `node --version` (need 18+), `npx wrangler --version`.
If missing, link to https://bun.sh and https://nodejs.org.

### Step 1: Install dependencies
```bash
bun install
```

### Step 2: Login to Cloudflare
```bash
npx wrangler login
```
Opens browser for OAuth. Verify with `npx wrangler whoami`.

### Step 3: Google OAuth credentials
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret for the setup script

### Step 4: Resend API key
1. Go to https://resend.com/api-keys
2. Create an API key
3. **Sandbox note**: free tier only delivers to your account email. Add a domain at https://resend.com/domains for other recipients.

### Step 5: Run setup
```bash
bun run setup
```
Prompts for: project name, Google OAuth creds, Resend key, sender email. Creates D1/R2, writes `.dev.vars`, applies migration.

### Step 6: Start dev server
```bash
bun dev
```
Verify at http://localhost:3000. Login with Google or magic link.

### Step 7 (optional): R2 presigned uploads
Only needed if the app uses file uploads.
1. CF dashboard → R2 → **Manage R2 API Tokens** → Create API Token
2. Copy Access Key ID, Secret Access Key, and Account ID
3. Add to `.dev.vars`:
   ```
   R2_ACCESS_KEY_ID=your-key
   R2_SECRET_ACCESS_KEY=your-secret
   R2_ACCOUNT_ID=your-account-id
   R2_BUCKET_NAME=your-project-storage
   ```
4. Restart dev server

### Troubleshooting
- **`redirect_uri_mismatch`**: Google Console redirect URI must be exactly `http://localhost:3000/api/auth/callback/google`
- **R2 error on upload**: R2 vars are optional — app starts fine without them. Set them per step 7 when needed.
- **D1 not found**: Run `npx wrangler d1 list` to verify the database exists. Re-run `bun run setup` if needed.
- **Resend won't send**: Free tier only sends to your account email. Verify domain at https://resend.com/domains.
- **`env validation failed`**: Check `.dev.vars` has all required auth vars filled in (AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_RESEND_KEY, AUTH_EMAIL_FROM).

## Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: HeroUI + Tailwind CSS v3 + Iconify
- **Auth**: NextAuth v5 beta (Google OAuth + Resend magic link)
- **DB**: Drizzle ORM → Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (presigned uploads via aws4fetch)
- **Deploy**: opennextjs-cloudflare → Cloudflare Workers

## Patterns

- DB: `getDb()` from `@/server/db`, all schema re-exported from there
- Auth: `auth()` from `@/server/auth`, `session!.user.id`
- API routes: auth check → `getDb()` → Drizzle query → `NextResponse.json()`
- IDs: prefixed UUIDs (e.g. `ust_` for user_settings)
- Edge runtime: `eval("require")` to hide Node imports from webpack in dev

## Key Files

- `src/server/db/schema.ts` — all DB tables
- `src/server/auth/base.ts` — NextAuth config (Google + Resend)
- `src/server/auth.ts` — lazy auth instance, re-exports
- `src/app/(authenticated)/layout-client.tsx` — sidebar + header
- `scripts/setup.ts` — interactive project setup
- `wrangler.toml` — Cloudflare bindings

## Gotchas

- D1 local migrations: `npx wrangler d1 execute <name>-d1 --local --file=drizzle/XXXX.sql`
- D1 remote migrations: same but `--remote` instead of `--local`
- HeroUI requires Tailwind v3 (not v4)
- D1/SQLite: no `RETURNING` in some contexts, use separate queries
- Resend magic link requires verified domain on resend.com

## Deploy

```bash
bun run deploy
```

Ensure `wrangler.toml` has correct database_id and bucket_name.
Set secrets in Cloudflare dashboard or via `wrangler secret put`.

## Adding Pages

1. Create route in `src/app/(authenticated)/your-page/page.tsx`
2. Add to `sidebarItems` in `src/app/(authenticated)/layout-client.tsx`
3. Add to `mobileNavItems` if needed
4. Add breadcrumb label to `breadcrumbLabels` object
