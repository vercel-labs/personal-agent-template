import type { EveMessageData, UseEveAgentSnapshot } from "eve/vue";
import type { ThreadRecord, ThreadState } from "#shared/types/thread";
import type { ChatSessionOptions, EveStreamEvent } from "~/composables/chat/types";
import { refreshThreadList } from "~/composables/chat/navigation";

export function resumeOptionsFromThread(thread: ThreadRecord): ChatSessionOptions {
  const state = thread.state;
  const events = state?.events;
  if (!state || !events?.length) {
    return {};
  }

  return {
    initialSession: {
      sessionId: state.session.sessionId,
      streamIndex: Math.max(state.session.streamIndex, events.length),
    },
    initialEvents: events as readonly EveStreamEvent[],
  };
}

export async function persistThreadState(
  threadId: string,
  snapshot: UseEveAgentSnapshot<EveMessageData>,
) {
  const session = snapshot.session;
  if (!session || !snapshot.events.length) {
    return;
  }

  const state: ThreadState = {
    session: {
      sessionId: session.sessionId,
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
