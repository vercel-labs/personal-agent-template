/**
 * Issuer passed to Vercel Connect for user-scoped tokens.
 * Must match Eve's `appSession()` authenticator in `agent/channels/eve.ts`.
 */
export const CONNECT_USER_ISSUER = "app";

/** Vercel Connect connector UID — keep in sync with `server/connectors.ts`. */
export const GITHUB_CONNECTOR = "github/personal-agent";

/**
 * Tool preset the agent mounts. The Connect grant the web app requests is
 * derived from it, so the permissions a user authorizes are exactly the ones
 * the agent asks for — otherwise Settings reports "Connected" while every tool
 * call fails with `UserAuthorizationRequiredError`.
 */
export const GITHUB_PRESET = "maintainer" as const;
