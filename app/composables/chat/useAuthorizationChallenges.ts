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

const challengesByName = ref<Map<string, AuthorizationChallengeState>>(new Map());

type AuthorizationEvent = {
  type: "interaction.opened";
  data: {
    interactionId: string;
    request: {
      kind: string;
      prompt: string;
      signIn?: {
        name: string;
        displayName?: string;
        url?: string;
        userCode?: string;
        expiresAt?: string;
        instructions?: string;
        callbackUrl?: string;
      };
    };
  };
} | {
  type: "interaction.settled";
  data: {
    interactionId: string;
    outcome: AuthorizationChallengeState["outcome"];
    reason?: string;
  };
};

export function recordAuthorizationEvent(event: AuthorizationEvent) {
  if (event.type === "interaction.opened") {
    const { data } = event;

    if (data.request.kind !== "sign-in" || !data.request.signIn) {
      return;
    }

    const signIn = data.request.signIn;

    const next = new Map(challengesByName.value);
    next.set(signIn.name, {
      interactionId: data.interactionId,
      name: signIn.name,
      description: data.request.prompt,
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
    const { data } = event;

    const existing = [...challengesByName.value.values()].find(
      challenge => challenge.interactionId === data.interactionId,
    );
    if (!existing) {
      return;
    }

    const next = new Map(challengesByName.value);

    if (data.outcome === "accepted") {
      next.delete(existing.name);
    }
    else {
      next.set(existing.name, {
        ...existing,
        outcome: data.outcome,
        reason: data.reason,
      });
    }

    challengesByName.value = next;
  }
}

export function getPendingChallenge(connectionName: string) {
  const challenge = challengesByName.value.get(connectionName);
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

  const next = new Map(challengesByName.value);
  next.delete(connectionName);
  challengesByName.value = next;
  return true;
}

export function clearAuthorizationChallenges() {
  challengesByName.value = new Map();
}

export function useAuthorizationChallenges() {
  const pendingChallenges = computed(() =>
    [...challengesByName.value.values()].filter((challenge) => !challenge.outcome),
  );

  const failedChallenges = computed(() =>
    [...challengesByName.value.values()].filter((challenge) => !!challenge.outcome && challenge.outcome !== "accepted"),
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
