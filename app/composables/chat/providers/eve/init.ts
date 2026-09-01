import type { EveMessageData, UseEveAgentReturn } from "eve/vue";
import type { ChatSessionOptions } from "~/composables/chat/types";
import { recordAuthorizationEvent } from "~/composables/chat/useAuthorizationChallenges";
import { persistThreadSession } from "./thread-session";
import { recordStreamEvent } from "./stream-log";

const agentsByChatId = new Map<string, UseEveAgentReturn<EveMessageData>>();

export function getOrCreateEveAgent(chatId: string, options?: ChatSessionOptions) {
  let agent = agentsByChatId.get(chatId);
  if (!agent) {
    const knownSessionId = options?.initialSession?.sessionId;

    agent = useEveAgent({
      initialSession: options?.initialSession,
      resume: options?.resume,
      onSessionChange: (session) => {
        // eve mints the session on the first message. Bind it to the thread
        // once; every later turn reuses the same id.
        if (session && session.sessionId !== knownSessionId) {
          void persistThreadSession(chatId, session.sessionId);
        }
      },
      onEvent: (event) => {
        if (event.type === "authorization.required" || event.type === "authorization.completed") {
          recordAuthorizationEvent(event);
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

export function resetAllEveAgents() {
  for (const agent of agentsByChatId.values()) {
    agent.reset();
  }
  agentsByChatId.clear();
}
