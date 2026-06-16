# Adam — Personal Agent Template

A durable personal AI assistant built with [Eve](https://eve.dev), Nuxt 4, and Better Auth.

## Features

- **Web chat** with thread persistence and resume
- **Slack** DMs and mentions with account linking
- **Linear** via Vercel Connect MCP
- **Profile & memory** (Raycast-style import from ChatGPT / other assistants)
- **`save_memory` tool** with user approval in chat
- **Daily summary** skill + home quick action (on demand)

## Setup

```bash
pnpm install
cp .env.example .env   # if present — set BETTER_AUTH_SECRET, BETTER_AUTH_URL, INTERNAL_API_SECRET
pnpm db:migrate
pnpm dev
```

### Required env

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Auth signing |
| `BETTER_AUTH_URL` | Public app URL |
| `INTERNAL_API_SECRET` | Agent ↔ Nuxt internal API (memory, Slack link) |

### Vercel Connect

- **Linear**: `mcp.linear.app/linear`
- **Slack**: `slack/adam`

Connect clients in Integrations, then link Slack with `link <code>` in DM.

Link a phone number on **Profile** (E.164, e.g. `+33612345678`) for future SMS/iMessage channels.

## Memory

1. Open **Profile → Import Memory**
2. Copy the export prompt into ChatGPT (or Claude, etc.)
3. Paste the response → **Add to Memory**

Memory is injected into every Eve session for linked users (web + Slack). Requires `INTERNAL_API_SECRET` in `.env` (see `.env.example`). Start a **new chat** after importing memory so the agent picks up the latest context.

Adam can also propose saving facts via **`save_memory`** — approve or deny in chat.
