import { createHash } from "node:crypto";
import type { SessionAuthContext } from "eve/context";
import { DefaultSandbox, defineSandbox } from "eve/sandbox";
import { VercelSandbox } from "eve/sandbox/vercel";
import { CONNECT_USER_ISSUER } from "../shared/connect.js";
import { DRIVE_ENABLED, DRIVE_MOUNT_PATH, DRIVE_REGION } from "./lib/drive.js";

// Drives mount only into Vercel Sandboxes, so turning the feature on also
// pins the provider. Left off, this file is the same as having no sandbox
// file: eve picks Vercel Sandbox on Vercel, Docker or just-bash locally.
const driveEnvironment = DRIVE_ENABLED
  ? VercelSandbox.environment({ region: DRIVE_REGION })
  : undefined;

export const environment = driveEnvironment ?? DefaultSandbox.environment();

/**
 * Whose workspace a session gets, or `undefined` for none.
 *
 * Only a conversation started from the web chat by a signed-in user qualifies.
 * The mount is fixed when the session's sandbox is created and the agent reads
 * `/data` for anyone it answers, so a Slack thread or group chat that other
 * people can join must not carry its starter's files.
 */
function driveOwner(initiator: SessionAuthContext | null): string | undefined {
  if (
    initiator?.principalType !== "user"
    || initiator.authenticator !== CONNECT_USER_ISSUER
    || initiator.attributes?.slack_user_id !== undefined
    || initiator.attributes?.phone_number !== undefined
  ) {
    return undefined;
  }

  return initiator.principalId;
}

/** Hashed so the Drive list holds no user ids and any id is a valid name. */
function driveName(owner: string) {
  const digest = createHash("sha256").update(JSON.stringify(["user", CONNECT_USER_ISSUER, owner])).digest("hex");
  return `workspace-${digest.slice(0, 32)}`;
}

export default defineSandbox(async ({ session }) => {
  if (!driveEnvironment) {
    return environment.open();
  }

  const owner = driveOwner(session.auth.initiator);
  if (!owner) {
    return driveEnvironment.open();
  }

  try {
    // Loaded here so the SDK stays out of the way while the feature is off.
    const { Drive } = await import("@vercel/sandbox");
    const drive = await Drive.getOrCreate({ name: driveName(owner), region: DRIVE_REGION });
    return await driveEnvironment.open({
      mounts: { [DRIVE_MOUNT_PATH]: { drive: drive.name, mode: "read-write" } },
    });
  }
  catch (error) {
    // The expected cause is a busy Drive: it takes one read-write mount at a
    // time, so a second conversation by the same user cannot attach it while
    // the first one's sandbox runs. Work without it rather than leave this
    // conversation with no sandbox at all. Credential, region and quota
    // errors land here too and would affect every conversation, so log the
    // reason loudly — this line is what to look for if `/data` never appears.
    console.error(`[sandbox] workspace Drive unavailable, opening without ${DRIVE_MOUNT_PATH}:`, error);
    return driveEnvironment.open();
  }
});
