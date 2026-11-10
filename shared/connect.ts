/**
 * Issuer passed to Vercel Connect for user-scoped tokens.
 * Must match Eve's `appSession()` authenticator in `agent/channels/eve.ts`.
 */
export const CONNECT_USER_ISSUER = "app";

/** Vercel Connect connector UID — keep in sync with `server/connectors.ts`. */
export const GITHUB_CONNECTOR = "github/personal-agent";

/**
 * Tool preset the agent mounts: which GitHub tools the model can call. A tool
 * whose permission the GitHub App behind the connector lacks fails on its own.
 */
export const GITHUB_PRESET = "maintainer" as const;
