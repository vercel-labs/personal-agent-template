/**
 * Opt-in persistent workspace: a Vercel Sandbox Drive per user, mounted into
 * the agent's sandbox. Off unless `AGENT_DRIVE_ENABLED=1` is set where the
 * agent is built and where it runs. See docs/CUSTOMIZATION.md.
 */
export const DRIVE_ENABLED = process.env.AGENT_DRIVE_ENABLED === "1";

/**
 * A Drive lives in one region and the sandbox must run next to it. It cannot
 * be changed once Drives exist, so pick it before turning the feature on.
 */
export const DRIVE_REGION = process.env.AGENT_DRIVE_REGION?.trim() || "iad1";

/** Outside `/workspace`, which eve manages and which ends with the session. */
export const DRIVE_MOUNT_PATH = "/data";
