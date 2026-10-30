import type { InteractionFact } from "eve/events";

export type AuthorizationChallengeState = {
  interactionId: string;
  name: string;
  description: string;
  instructions?: string;
  url?: string;
  userCode?: string;
  expiresAt?: string;
  webhookUrl?: string;
  outcome?: "accepted" | "declined" | "invalid" | "failed" | "withdrawn" | "interrupted" | "abandoned" | "expired";
  reason?: string;
};

const challengesById = ref<Map<string, AuthorizationChallengeState>>(new Map());

export function recordAuthorizationEvent(event: InteractionFact) {
  if (event.type === "interaction.opened") {
    const { data } = event;

    if (data.request.kind !== "sign-in" || !data.request.signIn) {
      return;
    }

    const signIn = data.request.signIn;

    const next = new Map(challengesById.value);
    next.set(data.interactionId, {
      interactionId: data.interactionId,
      name: signIn.name,
      description: data.request.prompt,
      instructions: signIn.instructions,
      url: signIn.url,
      userCode: signIn.userCode,
      expiresAt: signIn.expiresAt,
      webhookUrl: signIn.callbackUrl,
    });
    challengesById.value = next;
    return;
  }

  if (event.type === "interaction.settled") {
    const { data } = event;

    const existing = challengesById.value.get(data.interactionId);
    if (!existing) {
      return;
    }

    const next = new Map(challengesById.value);

    if (data.outcome === "accepted") {
      next.delete(existing.interactionId);
    }
    else {
      next.set(existing.interactionId, {
        ...existing,
        outcome: data.outcome,
        reason: data.reason,
      });
    }

    challengesById.value = next;
  }
}

export function getPendingChallenge(connectionName: string) {
  const challenge = [...challengesById.value.values()].find(
    item => item.name === connectionName,
  );
  if (!challenge || challenge.outcome) {
    return undefined;
  }
  return challenge;
}

export async function resumeEveAuthorization(webhookUrl: string) {
  await fetch(webhookUrl, {
    method: "GET",
    credentials: "include",
  });
}

export async function resolveAuthorizationChallenge(connectionName: string) {
  const challenge = getPendingChallenge(connectionName);
  if (!challenge) {
    return false;
  }

  if (challenge.webhookUrl) {
    await resumeEveAuthorization(challenge.webhookUrl);
  }

  const next = new Map(challengesById.value);
  next.delete(challenge.interactionId);
  challengesById.value = next;
  return true;
}

export function clearAuthorizationChallenges() {
  challengesById.value = new Map();
}

export function useAuthorizationChallenges() {
  const pendingChallenges = computed(() =>
    [...challengesById.value.values()].filter((challenge) => !challenge.outcome),
  );

  const failedChallenges = computed(() =>
    [...challengesById.value.values()].filter((challenge) =>
      challenge.outcome === "failed" || challenge.outcome === "expired",
    ),
  );

  async function tryResumeConnectedChallenges(options?: { skipIfBusy?: boolean }) {
    if (options?.skipIfBusy) {
      return;
    }

    const pending = pendingChallenges.value.filter((challenge) => challenge.webhookUrl);
    if (!pending.length) {
      return;
    }

    let connectors: Array<{ connectionName: string; status: { state: string } }>;
    try {
      connectors = await $fetch("/api/connectors");
    }
    catch {
      return;
    }

    for (const challenge of pending) {
      const connector = connectors.find((entry) => entry.connectionName === challenge.name);
      if (connector?.status.state === "connected") {
        await resolveAuthorizationChallenge(challenge.name);
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
