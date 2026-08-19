import type { EveMessageData, UseEveAgentSnapshot } from "eve/vue";
import type { ThreadRecord, ThreadState } from "#shared/types/thread";
import type { ChatSessionOptions, EveStreamEvent } from "~/composables/chat/types";
import { refreshThreadList } from "~/composables/chat/navigation";

export function resumeOptionsFromThread(thread: ThreadRecord): ChatSessionOptions {
  const events = thread.state?.events;
  if (!events?.length) {
    return {};
  }

  const session = thread.state?.session;
  const sessionId = session?.sessionId;
  const streamIndex = Math.max(session?.streamIndex ?? 0, events.length);

  return {
    ...(sessionId
      ? { initialSession: { sessionId, streamIndex } }
      : {}),
    initialEvents: events as readonly EveStreamEvent[],
  };
}

export async function persistThreadState(
  threadId: string,
  snapshot: UseEveAgentSnapshot<EveMessageData>,
) {
  if (!snapshot.events.length || !snapshot.session?.sessionId) {
    return;
  }

  const state: ThreadState = {
    session: {
      sessionId: snapshot.session.sessionId,
      streamIndex: snapshot.events.length,
    },
    events: [...snapshot.events],
  };

  await $fetch(`/api/threads/${threadId}`, {
    method: "PATCH",
    body: { state },
  });

  void refreshThreadList();
}
