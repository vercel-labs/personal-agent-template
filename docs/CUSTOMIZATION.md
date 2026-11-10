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

`actAs: "caller"` runs each call with the GitHub token of the person driving
the turn, so the agent can do what that user can do and nothing more. Someone
who has not connected GitHub gets a sign-in prompt in the conversation — in the
web chat, Slack or iMessage — and connecting from **Settings → Integrations**
works too. For signed-in users and linked Slack or iMessage accounts both use
the same Connect grant. An unlinked Slack or iMessage sender is a separate
identity: a sign-in they complete in the thread is tied to that identity, does
not show in Settings, and is not carried over when they link. Only a turn no
user drives (a schedule, a service caller) falls back to the project's GitHub
App installation; the Slack channel drops messages from other apps so a bot
cannot reach it. Use `actAs: "user"` to refuse those turns instead, or
`{ read, write }` and `overrides.<tool>.actAs` to choose per tool.

User tokens carry the connector's full grant, so Settings requests the same
(`scopes: []` in [`server/connectors.ts`](../server/connectors.ts)). What a
tool can do is then bounded by the GitHub App behind the connector. The
`maintainer` preset (`GITHUB_PRESET`) includes tools that need these
permissions; without them those tools fail. The App-installation fallback
requests every scope in the preset explicitly
(`connectGithubScopesForPreset("maintainer")` lists them) and can be refused a
token outright if the App lacks one:

| Permission | Access |
|------------|--------|
| Commit statuses | Read and write |
| Code scanning alerts | Read |
| Dependabot alerts | Read |
| Secret scanning alerts | Read |

To avoid widening the App, drop the tools instead with `exclude` on the mount.

1. Create a GitHub connector in Vercel Connect:

   ```bash
   vercel connect create github --name personal-agent
   vercel connect attach github/personal-agent
   ```

2. Grant the GitHub App the permissions listed above
3. Update `GITHUB_CONNECTOR` in [`shared/connect.ts`](../shared/connect.ts) if it differs from `vercel connect list`
4. Open **Settings → Integrations** and connect
5. Ask about repos, PRs, or issues in chat

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

The channel relies on a few Slack scopes and events beyond the connector's
defaults. Open **Advanced** on the connector, add what you need, then
**reinstall the Slack app** — Slack only grants new scopes on install:

| Feature | Bot scopes | Trigger events |
|---------|-----------|----------------|
| Sender names in the agent's context (`messageContext.users`) | `users:read` | — |
| Email stored when an account is linked | `users:read.email` | — |
| Follow-ups without a mention in a thread the agent is answering | `channels:history` (`groups:history` for private channels) | `message.channels` (`message.groups`) |
| Group DMs, and edits to messages in them | `mpim:history` | `message.mpim` |
| Inbound file attachments | `files:read` | — |
| Long replies uploaded as a snippet | `files:write` | — |

Nothing breaks without them: Slack simply never sends an event the app is not
subscribed to, and a sender lookup that fails is left out. Mentions and DMs
keep working.

An edited message goes through the same hook a new one would, so the agent
sees corrections; an edited `link <code>` is ignored. Earlier replies in a
thread are loaded by eve (`threadContext`), each attributed to its sender.

### iMessage (Photon)

`eve add channel/photon-imessage` walks through the Photon project, the agent's
phone number and the Vercel Connect connector. Put the connector slug it prints
into [`agent/channels/photon.ts`](../agent/channels/photon.ts).

Inbound senders are recognised by the E.164 number they set on **Profile**,
stored in `phone_links`. A number nobody claimed still gets an answer, without
the caller's memory or integrations.

## 7. Persistent workspace (optional)

Off by default. Each conversation gets its own sandbox for the agent's file
and shell tools, and what it writes there is gone when the conversation ends.
Turning this on gives every user a [Vercel Sandbox Drive](https://vercel.com/docs/sandbox/concepts/drives)
mounted at `/data`, so files survive across conversations: notes, downloads,
cloned repositories, generated reports. Memory stays what it is — short facts
recalled every turn; the Drive holds files the agent opens when it needs them.

Code: [`agent/sandbox.ts`](../agent/sandbox.ts) (the mount),
[`agent/lib/drive.ts`](../agent/lib/drive.ts) (the switches), and a
`# Workspace` section [`agent/instructions.ts`](../agent/instructions.ts) adds
when the feature is on — the model does not know `/data` exists unless told.

To turn it on:

1. Set `AGENT_DRIVE_ENABLED=1` on the Vercel project, for builds and for both
   services. Optionally set `AGENT_DRIVE_REGION` (default `iad1`) — choose it
   first, because a Drive's region cannot change after it is created.
2. Redeploy. The flag is read when the agent is built and again when it runs,
   and the two must agree.

What to know before you do:

- **Vercel only.** Drives mount only into Vercel Sandboxes, so the flag also
  pins the sandbox provider. A local build or `eve dev` with the flag on needs
  the project linked (`vercel link`, `vercel env pull`); leave it unset locally
  to keep using Docker or just-bash, without `/data`.
- **Web chat only.** The Drive is chosen when a conversation's sandbox is
  created, from whoever started it, and the agent reads `/data` for anyone it
  answers. A Slack thread or group chat can be joined by other people, so
  conversations started there get no Drive. Widen `driveOwner()` in
  `agent/sandbox.ts` only if you are sure a channel is one person. A web
  thread is tied to its owner by this app, which only hands a thread's session
  id to the user who owns it.
- **One conversation at a time.** A Drive takes a single read-write mount. If
  a user has two conversations running, the second opens without `/data` and
  stays that way; the agent is told to say so rather than save elsewhere. The
  Drive frees up when the first conversation's sandbox stops.
- **Check the logs after enabling it.** Any failure to create or mount the
  Drive — a busy Drive, but also missing credentials, a region mismatch or a
  quota — falls back to a sandbox without `/data` and logs
  `[sandbox] workspace Drive unavailable`. If `/data` never appears, that line
  says why.
- **Slower first tool call.** eve runs its base setup on every sandbox that
  has a Drive mount.
- **Nothing deletes a Drive.** It outlives the conversation, the session and
  the user account, and is billed for the storage used. Names are
  `workspace-<hash>` (see `driveName()`); delete a user's Drive when you delete
  their account, after their sandboxes have stopped.
- **The contents are untrusted input.** A file the agent saved from the web
  can carry instructions aimed at the model. The instructions tell it to treat
  `/data` as data; consider a `networkPolicy` on `open()` if that matters.

## 8. Theme the UI

- Global styles: [`app/assets/css/main.css`](../app/assets/css/main.css)
- Nuxt UI config: [`app/app.config.ts`](../app/app.config.ts)
- Layout and navigation: [`app/layouts/default.vue`](../app/layouts/default.vue), [`app/components/Navbar.vue`](../app/components/Navbar.vue)

## 9. Deploy your fork

See [Deploy on Vercel](../README.md#deploy-on-vercel) in the README. Remember:

- Dual services: `web` + `eve`, generated by the `eve/nuxt` module at build time
- Same env vars on both services
- Run migrations for production database
