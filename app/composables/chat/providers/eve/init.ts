import type { EveMessageData, UseEveAgentReturn } from "eve/vue";
import type { ChatSessionOptions } from "~/composables/chat/types";
import { recordAuthorizationEvent } from "~/composables/chat/useAuthorizationChallenges";
import { persistThreadSession } from "./thread-session";
import { recordStreamEvent } from "./stream-log";
import { recordTurnFailure } from "./turn-errors";

const agentsByChatId = new Map<string, UseEveAgentReturn<EveMessageData>>();

export function getOrCreateEveAgent(chatId: string, options?: ChatSessionOptions) {
  let agent = agentsByChatId.get(chatId);
  if (!agent) {
    const knownSessionId = options?.initialSession?.sessionId;

    agent = useEveAgent({
      initialSession: options?.initialSession,
      resume: options?.resume,
      onSessionChange: (session) => {
        if (session && session.sessionId !== knownSessionId) {
          void persistThreadSession(chatId, session.sessionId);
        }
      },
      onEvent: (event) => {
        if (event.type === "authorization.required" || event.type === "authorization.completed") {
          recordAuthorizationEvent(event);
        }

        if (event.type === "turn.failed" || event.type === "session.failed") {
          recordTurnFailure(chatId, event);
        }

        if (!import.meta.dev) return;
        recordStreamEvent(event.type);
      },
    });
    agentsByChatId.set(chatId, agent);
  }
  return agent;
}

export function removeEveAgent(chatId: string) {
  agentsByChatId.delete(chatId);
}
