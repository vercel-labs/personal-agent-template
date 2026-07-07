# Environment Variables

> Back to [README](../README.md) | See also: [Architecture](./ARCHITECTURE.md), [Customization](./CUSTOMIZATION.md)

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

## Quick start (minimum required)

| Variable | How to get it |
|----------|---------------|
| `BETTER_AUTH_SECRET` | Run `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` locally, or your production URL |
| `INTERNAL_API_SECRET` | Run `openssl rand -base64 32` (must match on web + eve services) |

These three variables are enough for local development. On Vercel, set them on **both** the `web` and `eve` services.

### `NUXT_PUBLIC_SITE_URL` (optional)

Canonical URL for SEO — used for Open Graph images, Twitter cards, and canonical links. Set to your production URL (e.g. `https://your-app.vercel.app`). Falls back to the request origin when unset.

## Authentication

### `BETTER_AUTH_SECRET` (required)

Random secret used by [Better Auth](https://www.better-auth.com/docs/installation#set-environment-variables) to sign sessions and tokens.

```bash
openssl rand -base64 32
```

### `BETTER_AUTH_URL` (required)

Public URL of the Nuxt app. Used for auth callbacks and as the base URL for agent → Nuxt internal API calls.

| Environment | Value |
|-------------|-------|
| Local | `http://localhost:3000` |
| Production | `https://your-domain.vercel.app` |

## Internal API

### `INTERNAL_API_SECRET` (required)

Shared bearer token between the Eve agent service and the Nuxt internal API (`/api/internal/*`).

Used for:

- Memory read/write from the agent
- Slack account linking
- Sendblue / iMessage phone linking lookup

**Must be identical** on both Vercel services (`web` and `eve`). If missing or mismatched, memory injection, Slack linking, and iMessage auth will fail silently or return 401.

## Sendblue (iMessage, optional)

Reach the agent over iMessage via [Sendblue](https://chat-sdk.dev/adapters/vendor-official/sendblue). Set these on the **eve** service (and `BETTER_AUTH_URL` on both services so the agent can resolve phone links):

| Variable | Required | Description |
|----------|----------|-------------|
| `SENDBLUE_API_KEY` | Yes | API key ID from the [Sendblue dashboard](https://dashboard.sendblue.com) |
| `SENDBLUE_API_SECRET` | Yes | API secret key |
| `SENDBLUE_FROM_NUMBER` | Yes | Your Sendblue line in E.164 format (e.g. `+15551234567`) |
| `SENDBLUE_WEBHOOK_SECRET` | Recommended | Shared secret verified via the `sb-signing-secret` header |
| `SENDBLUE_STATUS_CALLBACK_URL` | No | Delivery status callbacks for outbound messages |
| `SENDBLUE_ALLOWED_SERVICES` | No | Comma-separated list; defaults to `iMessage` only. Use `iMessage,SMS,RCS` to accept all |

Setup:

1. Create a Sendblue account and note your API credentials and assigned number (`sendblue show-keys`, `sendblue lines`).
2. Set the env vars above on the **eve** Vercel service.
3. Configure the Sendblue **receive webhook** to:

   `https://<your-domain>/_eve_internal/eve/eve/v1/sendblue/webhook`

4. Users add their personal phone number (E.164) in **Settings → Profile** before messaging the Sendblue number.

See [Customization](./CUSTOMIZATION.md#sendblue-imessage) for the full linking flow.

## AI provider

This template does not define AI keys in `.env.example`. The default model is set in [`agent/agent.ts`](../agent/agent.ts):

```typescript
model: "anthropic/claude-sonnet-4.6"
```

On Vercel, Eve handles provider configuration through the platform. For local development, follow [Eve docs](https://eve.dev) for your chosen provider.

## Vercel Connect (optional)

Integrations use [Vercel Connect](https://vercel.com/docs/connect) — no extra env vars in this repo for Linear or GitHub OAuth, but you must:

1. Create Connect resources (GitHub, Linear MCP, Slack) in your Vercel team
2. Update connector UIDs in [`server/connectors.ts`](../server/connectors.ts) and [`agent/lib/github-auth.ts`](../agent/lib/github-auth.ts) (GitHub) or [`agent/channels/slack.ts`](../agent/channels/slack.ts) (Slack, default: `slack/v`)
3. Connect clients in **Settings → Integrations** in the app

See [Customization](./CUSTOMIZATION.md#integrations) for setup steps.

## GitHub (optional)

GitHub tools use per-user OAuth via Vercel Connect in production. For local development without Connect, set a personal access token on the **eve** service:

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | No | GitHub PAT with `repo` scope — fallback when Vercel Connect is not configured |

If both Connect and `GITHUB_TOKEN` are set, `GITHUB_TOKEN` takes precedence at session start.

## Local-only files

These paths are gitignored and should never be committed:

| Path | Purpose |
|------|---------|
| `.env` | Local secrets |
| `.data/` | SQLite database (NuxtHub) |
| `.eve/` | Eve dev cache |
| `.vercel/` | Vercel CLI link metadata |

Reset the local database:

```bash
rm -rf .data/db && pnpm db:migrate
```

### Eve dev timeout

If `pnpm dev` fails with `Timed out waiting for Eve to print its server URL`, clear stale Eve artifacts and retry:

```bash
rm -rf .eve node_modules/.cache/eve
pnpm dev
```
