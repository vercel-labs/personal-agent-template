import type { EveMessageData, UseEveAgentOptions } from "eve/vue";

type StreamEvent = Parameters<NonNullable<UseEveAgentOptions<EveMessageData>["onEvent"]>>[0];
type FailureEvent = Extract<StreamEvent, { type: "turn.failed" | "session.failed" }>;

const errorsByChatId = ref<Record<string, string>>({});

function messageFor(event: FailureEvent): string {
  const detail = event.data.message?.trim();

  if (event.type === "session.failed") {
    return detail
      ? `This conversation could not recover: ${detail}`
      : "This conversation could not recover. Send a new message to start again.";
  }

  return detail
    ? `The agent could not finish this turn: ${detail}`
    : "The agent could not finish this turn.";
}

/**
 * A failed turn leaves an assistant message with no visible parts, so without
 * this the stream simply goes quiet and the chat shows nothing at all.
 */
export function recordTurnFailure(chatId: string, event: FailureEvent) {
  errorsByChatId.value = { ...errorsByChatId.value, [chatId]: messageFor(event) };
}

export function clearTurnFailure(chatId: string) {
  if (!(chatId in errorsByChatId.value)) return;
  const { [chatId]: _removed, ...rest } = errorsByChatId.value;
  errorsByChatId.value = rest;
}

export function turnFailure(chatId: string): string | undefined {
  return errorsByChatId.value[chatId];
}
