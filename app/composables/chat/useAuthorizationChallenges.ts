import type { SessionStreamEvent } from "eve/client";
import type { InteractionOutcome } from "eve/events";

export type AuthorizationChallengeState = {
  name: string;
  /** The provider's readable name, when the sign-in carries one. */
  displayName?: string;
  description: string;
  instructions?: string;
  url?: string;
  userCode?: string;
  expiresAt?: string;
  webhookUrl?: string;
  outcome?: "authorized" | "declined" | "failed" | "timed-out";
  reason?: string;
};

const challengesByName = ref<Map<string, AuthorizationChallengeState>>(new Map());

/**
 * A settled interaction names only its id, which for a sign-in is the attempt
 * rather than the connection, so remember which connection each one opened for.
 */
const namesByInteractionId = new Map<string, string>();

/** How a sign-in that did not connect ended, or `undefined` when it was withdrawn. */
function outcomeFor(outcome: InteractionOutcome): AuthorizationChallengeState["outcome"] {
  switch (outcome) {
    case "accepted":
      return "authorized";
    case "declined":
      return "declined";
    case "expired":
      return "timed-out";
    case "failed":
    case "invalid":
      return "failed";
    default:
      // Withdrawn, interrupted or abandoned: the agent moved on, nothing failed.
      return undefined;
  }
}

/**
 * Tracks sign-in interactions from the session stream. Replayed events are
 * observed too, so the pending cards rebuild when a thread is reopened.
 */
export function recordAuthorizationEvent(event: SessionStreamEvent) {
  // A sign-in that failed belongs to the turn it failed in. Replay observes
  // old turns too, so without this an attempt that expired weeks ago would
  // show its "Retry" card on every reopen of the thread.
  if (event.type === "turn.started") {
    const settled = [...challengesByName.value.values()].filter(challenge => challenge.outcome);
    if (settled.length > 0) {
      const next = new Map(challengesByName.value);
      for (const challenge of settled) next.delete(challenge.name);
      challengesByName.value = next;
    }
    return;
  }

  if (event.type === "interaction.opened") {
    const { interactionId, request } = event.data;
    const signIn = request.signIn;

    // A sign-in that waits on another shares that one's card.
    if (request.kind !== "sign-in" || !signIn || signIn.waitsOn) {
      return;
    }

    namesByInteractionId.set(interactionId, signIn.name);

    const next = new Map(challengesByName.value);
    next.set(signIn.name, {
      name: signIn.name,
      displayName: signIn.displayName,
      description: request.prompt,
      instructions: signIn.instructions,
      url: signIn.url,
      userCode: signIn.userCode,
      expiresAt: signIn.expiresAt,
      webhookUrl: signIn.callbackUrl,
    });
    challengesByName.value = next;
    return;
  }

  if (event.type === "interaction.settled") {
    const name = namesByInteractionId.get(event.data.interactionId);
    if (!name) {
      return;
    }
    namesByInteractionId.delete(event.data.interactionId);

    const existing = challengesByName.value.get(name);
    if (!existing) {
      return;
    }

    const next = new Map(challengesByName.value);
    const outcome = outcomeFor(event.data.outcome);

    if (!outcome || outcome === "authorized") {
      next.delete(name);
    }
    else {
      next.set(name, {
        ...existing,
        outcome,
        reason: event.data.reason,
      });
    }

    challengesByName.value = next;
  }
}

type ConnectorRef = { connectionName: string; connectorUid: string };

/** The sign-in a connector is being asked for, if one is still pending. */
export function getPendingChallenge(connector: ConnectorRef) {
  return [...challengesByName.value.values()].find(
    challenge => !challenge.outcome && signInMatchesConnector(challenge.name, connector),
  );
}

export async function resumeEveAuthorization(webhookUrl: string) {
  await fetch(webhookUrl, {
    method: "GET",
    credentials: "include",
  });
}

export async function resolveAuthorizationChallenge(connector: ConnectorRef) {
  const challenge = getPendingChallenge(connector);
  if (!challenge) {
    return false;
  }

  if (challenge.webhookUrl) {
    await resumeEveAuthorization(challenge.webhookUrl);
  }

  const next = new Map(challengesByName.value);
  next.delete(challenge.name);
  challengesByName.value = next;
  return true;
}

export function clearAuthorizationChallenges() {
  namesByInteractionId.clear();
  challengesByName.value = new Map();
}

export function useAuthorizationChallenges() {
  const pendingChallenges = computed(() =>
    [...challengesByName.value.values()].filter((challenge) => !challenge.outcome),
  );

  const failedChallenges = computed(() =>
    [...challengesByName.value.values()].filter((challenge) => !!challenge.outcome && challenge.outcome !== "authorized"),
  );

  async function tryResumeConnectedChallenges(options?: { skipIfBusy?: boolean }) {
    if (options?.skipIfBusy) {
      return;
    }

    const pending = pendingChallenges.value.filter((challenge) => challenge.webhookUrl);
    if (!pending.length) {
      return;
    }

    let connectors: Array<ConnectorRef & { status: { state: string } }>;
    try {
      connectors = await $fetch("/api/connectors");
    }
    catch {
      return;
    }

    for (const challenge of pending) {
      const connector = connectors.find(entry => signInMatchesConnector(challenge.name, entry));
      if (connector?.status.state === "connected") {
        await resolveAuthorizationChallenge(connector);
      }
    }
  }

  return {
    pendingChallenges,
    failedChallenges,
    clearAuthorizationChallenges,
    tryResumeConnectedChallenges,
  };
}
