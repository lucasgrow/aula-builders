# cloudflare-builder

SaaS starter template on Cloudflare. Auth, database, storage, and deploy — all wired up.

## Features

- **Auth**: Google OAuth + magic link (Resend)
- **Database**: Cloudflare D1 via Drizzle ORM
- **Storage**: Cloudflare R2 with presigned uploads
- **UI**: HeroUI + dark mode + customizable color palettes
- **Deploy**: One command to Cloudflare Workers

## Prerequisites

- [bun](https://bun.sh) 1.1+
- [Node.js](https://nodejs.org) 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- [Google Cloud project](https://console.cloud.google.com) with OAuth credentials
- [Resend account](https://resend.com) for magic-link emails

> **Using Claude Code?** Open the project and say "help me set up" — it will walk you through everything.

## Getting Started

```bash
git clone https://github.com/youruser/cloudflare-builder.git
cd cloudflare-builder
bun install
bun run setup
bun dev
```

The setup script will:
1. Create a D1 database
2. Create an R2 bucket
3. Configure Google OAuth + Resend credentials
4. Apply the initial migration
5. Generate your `.dev.vars`

## Deploy

```bash
bun run deploy
```

## License

MIT
