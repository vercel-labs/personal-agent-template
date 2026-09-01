# Customization Guide

> Back to [README](../README.md) | See also: [Environment](./ENVIRONMENT.md), [Architecture](./ARCHITECTURE.md)

Personal Agent Template ships with **V** as the example persona. This guide covers how to fork and make it yours.

## 1. Rename your agent

### Branding metadata

Edit [`shared/agent.ts`](../shared/agent.ts):

```typescript
export const agent = {
  name: "My Agent",
  slug: "my-agent",
  tagline: "Your personal AI assistant",
  description: "Remembers your context across conversations and channels.",
  avatar: {
    icon: "i-lucide-bot", // or any Lucide icon
  },
} as const;
```

Also update site metadata in [`app/app.config.ts`](../app/app.config.ts) (`site.name`, `site.title`, `site.description`, `site.tagline`).

Replace branding assets in [`public/`](../public/):

| File | Purpose |
|------|---------|
| `banner.png` | README hero banner |
| `og.png` | Open Graph / Twitter card preview |
| `favicon.ico` | Browser tab icon |

Use your own design files when ready — keep them in `public/` and update `site.ogImage` in [`app/app.config.ts`](../app/app.config.ts) if the path changes.

This name appears in the navbar, settings, and integration cards.

### Persona and behavior

Edit [`agent/instructions.ts`](../agent/instructions.ts) — system prompt, tone, tool usage rules, memory behavior.

Search the codebase for `V` to update remaining UI copy in Vue components.

### Package metadata

Update [`package.json`](../package.json) `name`, `description`, and `repository` if you publish your fork.

## 2. Change the AI model

Edit [`agent/agent.ts`](../agent/agent.ts):

```typescript
export default defineAgent({
  model: "anthropic/claude-sonnet-5", // change provider/model
  // ...
});
```

See Eve docs for supported models and provider options.

## 3. Memory

The `profile` slot binds Eve's `fileMemory()` provider to one document per
principal — [`agent/memory/profile.ts`](../agent/memory/profile.ts):

```typescript
export default defineMemory({
  description: "Stable facts and preferences about the person you are talking to.",
  provider: fileMemory(),
  scope: byPrincipal,
});
```

- `description` is prepended to both memory tool descriptions, so it is how you
  tell the model what belongs in this slot.
- `scope` decides who shares a document. `byPrincipal` gives one per
  authenticated caller; pass your own resolver for a tenant or workspace scope.
- `fileMemory({ maxCharacters })` caps the recalled message. It defaults to
  4,000 characters and rejects rather than truncates.
- Add `agent/memory/<slot>.ts` for a second, independent slot.

See the [Eve memory guide](https://eve.dev/docs/memory) for backends and custom
providers.

## 4. Add a tool

1. Create `agent/tools/my-tool.ts` using Eve's `defineTool`
2. Register it in Eve's tool discovery (auto-loaded from `agent/tools/` by convention — verify in Eve docs)
3. Add a UI component in `app/components/chat/tool/` if the tool needs custom rendering
4. Wire the component in [`app/components/chat/message/MessageContentEve.vue`](../app/components/chat/message/MessageContentEve.vue)

See [`agent/tools/weather.ts`](../agent/tools/weather.ts) for a worked example.

## 5. Add a skill

Skills are markdown files in [`agent/skills/`](../agent/skills/). See [`daily-summary.md`](../agent/skills/daily-summary.md) for an example. Reference skills from home quick actions in [`app/pages/index.vue`](../app/pages/index.vue).

## 6. Integrations

### GitHub

Uses Vercel Connect OAuth and the [@github-tools/eve-extension](https://github-tools.com/frameworks/eve) mount. Connector UID: [`shared/connect.ts`](../shared/connect.ts) (`GITHUB_CONNECTOR`), registry: [`server/connectors.ts`](../server/connectors.ts), mount: [`agent/extensions/github.ts`](../agent/extensions/github.ts).

The mount filename is the namespace, so tools reach the model as `github__listPullRequests`, `github__createIssue`, and so on. Narrow the catalog with `preset`, `include` and `exclude`, and set per-tool approval with `requireApproval`.

`connect.subject` resolves per caller, so each user reaches GitHub through their
own Connect grant. Leave it out and the extension mints `{ type: "app" }` — the
project's own installation — which every signed-in user would share whether or
not they connected an account.

1. Create a GitHub connector in Vercel Connect:

   ```bash
   vercel connect create github --name personal-agent
   vercel connect attach github/personal-agent
   ```

2. Update `GITHUB_CONNECTOR` in [`shared/connect.ts`](../shared/connect.ts) if it differs from `vercel connect list`
3. Open **Settings → Integrations** and connect
4. Ask about repos, PRs, or issues in chat

### Linear

Uses Vercel Connect MCP (`mcp.linear.app/linear`). Connection logic: [`agent/connections/linear.ts`](../agent/connections/linear.ts).

1. Create a Linear MCP connector in Vercel Connect
2. Open **Settings → Integrations** and connect
3. Ask about issues in chat

### Slack

1. Create a Slack connector in Vercel Connect
2. Replace the slug in [`agent/channels/slack.ts`](../agent/channels/slack.ts):

```typescript
credentials: connectSlackCredentials("slack/your-slug"),
```

3. Connect in **Settings → Integrations**
4. Link accounts: generate a code in the app, then DM `link <code>` to the bot

Slack linking uses the internal API — `INTERNAL_API_SECRET` must be set.

### iMessage (Photon)

`eve add channel/photon-imessage` walks through the Photon project, the agent's
phone number and the Vercel Connect connector. Put the connector slug it prints
into [`agent/channels/photon.ts`](../agent/channels/photon.ts).

Inbound senders are recognised by the E.164 number they set on **Profile**,
stored in `phone_links`. A number nobody claimed still gets an answer, without
the caller's memory or integrations.

## 7. Theme the UI

- Global styles: [`app/assets/css/main.css`](../app/assets/css/main.css)
- Nuxt UI config: [`app/app.config.ts`](../app/app.config.ts)
- Layout and navigation: [`app/layouts/default.vue`](../app/layouts/default.vue), [`app/components/Navbar.vue`](../app/components/Navbar.vue)

## 8. Deploy your fork

See [Deploy on Vercel](../README.md#deploy-on-vercel) in the README. Remember:

- Dual services: `web` + `eve`, generated by the `eve/nuxt` module at build time
- Same env vars on both services
- Run migrations for production database
