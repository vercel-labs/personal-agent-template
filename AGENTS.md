# Personal Agent Template

Durable personal AI assistant built with Eve and Nuxt.

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Generate Nuxt types, then start Nuxt + Eve |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (`pnpm lint:fix` to autofix) |
| `pnpm typecheck` | TypeScript check — app/server/shared plus `agent/` |
| `pnpm build:agent` | Build the Eve agent on its own |
| `pnpm auth:schema` | Regenerate the Better Auth Drizzle schema |
| `pnpm db:generate` | Regenerate the auth schema, then the Drizzle migration |
| `pnpm db:migrate` | Apply migrations |

## Structure

```
personal-agent-template/
├── agent/          # Eve agent (channels, tools, skills, connections)
├── app/            # Nuxt UI (pages, components, composables)
├── server/         # Nitro API, Drizzle schema, server utils
├── shared/         # Cross-layer types and helpers
└── docs/           # Architecture, environment, customization
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, request flows, internal API
- [Environment](docs/ENVIRONMENT.md) — Environment variables
- [Customization](docs/CUSTOMIZATION.md) — Rename agent, add tools, integrations
- [README](README.md) — Quick start and feature overview

## Eve Framework

This project uses Eve with a Nuxt frontend (`eve/nuxt` module). Before writing agent code, read the relevant guide in `node_modules/eve/docs/` — start with `docs/README.md`, which maps each task to its page.

`nuxt typecheck` does not cover `agent/`, and `eve build` bundles without typechecking. `pnpm typecheck` runs both halves; keep it that way when adding agent code.

## Internal API Pattern

The Eve agent calls Nuxt over HTTP:

```
agent/lib/*-internal.ts  →  /api/internal/*  →  server/utils/*
```

Authenticated with `Authorization: Bearer <INTERNAL_API_SECRET>`. See [`server/utils/internal-api.ts`](server/utils/internal-api.ts).

## Memory

Eve's `fileMemory()` provider, bound in [`agent/memory/profile.ts`](agent/memory/profile.ts)
and scoped per principal. Documents live in private Vercel Blob storage; the
agent maintains them with `profile__save_memory` and `profile__remove_memory`.

## Customization Checklist

- [`shared/agent.ts`](shared/agent.ts) — branding
- [`agent/instructions.ts`](agent/instructions.ts) — persona
- [`agent/channels/slack.ts`](agent/channels/slack.ts) — Slack Connect slug
- [`agent/agent.ts`](agent/agent.ts) — AI model

See [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) for details.
