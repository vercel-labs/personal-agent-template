import type { EveMessageData, UseEveAgentSnapshot } from "eve/vue";
import type { ThreadRecord, ThreadState } from "#shared/types/thread";
import type { ChatSessionOptions, EveStreamEvent } from "~/composables/chat/types";
import { refreshThreadList } from "~/composables/chat/navigation";

export function resumeOptionsFromThread(thread: ThreadRecord): ChatSessionOptions {
  const events = thread.state?.events;
  if (!events?.length) {
    return {};
  }

  const session = thread.state?.session ?? { streamIndex: 0 };

  return {
    initialSession: {
      ...session,
      streamIndex: Math.max(session.streamIndex ?? 0, events.length),
    },
    initialEvents: events as readonly EveStreamEvent[],
  };
}

export async function persistThreadState(
  threadId: string,
  snapshot: UseEveAgentSnapshot<EveMessageData>,
) {
  if (!snapshot.events.length) {
    return;
  }

  const state: ThreadState = {
    session: {
      sessionId: snapshot.session.sessionId,
      continuationToken: snapshot.session.continuationToken,
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
