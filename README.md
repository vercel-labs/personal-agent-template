<img src="./public/banner.png" width="100%" alt="Personal Agent Template" />

# Personal Agent Template

[![CI](https://img.shields.io/github/actions/workflow/status/vercel-labs/personal-agent-template/ci.yml?branch=main&color=black)](https://github.com/vercel-labs/personal-agent-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/vercel-labs/personal-agent-template?color=black)](https://github.com/vercel-labs/personal-agent-template/blob/main/LICENSE)
[![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)

**Template.** Fork it, customize it, and deploy your own personal agent.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fpersonal-agent-template&env=BETTER_AUTH_SECRET,BETTER_AUTH_URL,INTERNAL_API_SECRET&envDescription=BETTER_AUTH_SECRET%3A%20run%20openssl%20rand%20-base64%2032%20%7C%20BETTER_AUTH_URL%3A%20your%20production%20URL%20%7C%20INTERNAL_API_SECRET%3A%20shared%20secret%20for%20web%20%2B%20eve&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fpersonal-agent-template%2Fblob%2Fmain%2Fdocs%2FENVIRONMENT.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%7D%5D&project-name=personal-agent&repository-name=personal-agent)

Open source personal agent template. Web chat, Slack, GitHub, Linear, and persistent memory — one codebase, durable sessions.

## Features

### Web Chat — Threads That Persist

Chat with your agent in the browser. Threads resume across sessions and tool calls render in real time. Eve holds the transcript, so the app stores a session id and nothing else.

### Slack — Same Agent, Different Surface

DMs and @mentions on Slack. Link your Slack account to your web profile so memory and context follow you across channels.

### GitHub — Repos, PRs, and CI

Connect GitHub via Vercel Connect. Ask about repositories, pull requests, issues, and workflows — the agent mounts the [@github-tools/eve-extension](https://github-tools.com/frameworks/eve) tools with durable approval on writes.

### Linear — Issues On Demand

Connect Linear via Vercel Connect MCP. Ask about issues, projects, and cycles — the agent queries Linear tools, never guesses from memory.

### Persistent Memory — Eve's Memory Slot

A bounded, model-maintained list of durable facts, scoped per user by Eve's [`fileMemory()`](https://eve.dev/docs/memory) provider. Recalled before every turn and after compaction; the agent saves and removes entries as the conversation warrants.

### Daily Summary — On Demand

Morning briefing skill: active focus from recalled memory, assigned Linear issues, and a suggested next action. Trigger from the home quick action or ask in chat.

## [Architecture](./docs/ARCHITECTURE.md)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Web chat · Slack DMs / mentions                 │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Eve agent (channels, tools, skills)                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │ /api/internal/* (Bearer auth)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│         Nuxt (UI + Nitro API + Better Auth + SQLite)           │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
                      Vercel Connect (Linear, Slack)
```

On Vercel the deployment splits into two services: `web` (Nuxt) and `eve` (agent runtime). The `eve/nuxt` module generates the eve service and its `/eve/v1/*` route during the build — nothing to declare in `vercel.json`.

## Quick Start

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fpersonal-agent-template&env=BETTER_AUTH_SECRET,BETTER_AUTH_URL,INTERNAL_API_SECRET&envDescription=BETTER_AUTH_SECRET%3A%20run%20openssl%20rand%20-base64%2032%20%7C%20BETTER_AUTH_URL%3A%20your%20production%20URL%20%7C%20INTERNAL_API_SECRET%3A%20shared%20secret%20for%20web%20%2B%20eve&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fpersonal-agent-template%2Fblob%2Fmain%2Fdocs%2FENVIRONMENT.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%7D%5D&project-name=personal-agent&repository-name=personal-agent)

### Self-hosting

**Requirements:** Node.js 24+, pnpm

```bash
git clone https://github.com/vercel-labs/personal-agent-template.git
cd personal-agent-template

pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start chatting.

**Required environment variables:**

```bash
BETTER_AUTH_SECRET=...       # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
INTERNAL_API_SECRET=...      # openssl rand -base64 32 — same on web + eve
```

See [ENVIRONMENT.md](./docs/ENVIRONMENT.md) for the full reference.

Fresh local database:

```bash
rm -rf .data/db && pnpm db:migrate
```

## Customization

Personal Agent Template ships with **V** as the example persona. See the [Customization Guide](./docs/CUSTOMIZATION.md) for how to:

- Rename your agent (name, slug, persona)
- Change the AI model
- Add tools and skills
- Configure Slack and Linear integrations
- Theme the UI
- Deploy your fork

## Memory

The `profile` slot ([`agent/memory/profile.ts`](agent/memory/profile.ts)) binds Eve's `fileMemory()` provider to one document per authenticated principal. Eve recalls it before every turn and after compaction, and gives the agent `profile__save_memory` and `profile__remove_memory` to maintain it.

Documents live in private Vercel Blob storage — attach a Blob store to the project before deploying.

## How It Works

> For the full technical deep-dive, see [Architecture](./docs/ARCHITECTURE.md).

1. **Auth**: Users sign in via Better Auth (email/password)
2. **Each turn**: Eve recalls the `profile` memory slot for the authenticated principal
3. **Chat**: Web UI streams through Eve; Slack events hit the slack channel
4. **Tools**: Agent calls weather, GitHub, Linear MCP and its memory tools as needed
5. **Internal API**: Agent reads Slack and phone links via authenticated Nitro routes

## Development

```bash
pnpm dev          # Nuxt + Eve (eve/nuxt module — see Eve docs)
pnpm typecheck    # TypeScript check
pnpm build        # Production build
pnpm db:generate  # Regenerate the auth schema, then the migration
pnpm db:migrate   # Apply migrations
```

See [AGENTS.md](./AGENTS.md) for notes aimed at AI coding assistants.

## Built With

- [Eve](https://eve.dev) — Durable agent framework
- [Nuxt](https://nuxt.com) — Full-stack Vue framework
- [Nuxt UI](https://ui.nuxt.com) — UI component library
- [NuxtHub](https://hub.nuxt.com) — SQLite database
- [Better Auth](https://www.better-auth.com) — Authentication
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe database queries
- [Vercel Connect](https://vercel.com/docs/connect) — Linear and Slack integrations

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get involved.

## License

[MIT](./LICENSE)
