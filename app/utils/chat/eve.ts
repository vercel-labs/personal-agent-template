import { isDynamicToolUIPart, isToolUIPart } from "ai";
import type { DynamicToolUIPart, UIMessage } from "ai";
import type { EveMessage, EveMessagePart, EveToolPart, Interaction } from "eve/vue";

type UIPart = UIMessage["parts"][number];

/**
 * An eve tool call in the AI SDK shape the chat components render, with the
 * native part kept on `eve` for what that shape cannot say: the readable
 * label, and the approval or question attached to the call.
 */
export type EveUiToolPart = DynamicToolUIPart & { eve: EveToolPart };

/** The data part a standalone interaction (question, sign-in, budget) becomes. */
export const EVE_INTERACTION_PART = "data-eve-interaction";

export function isEveUiToolPart(part: UIPart): part is EveUiToolPart {
  return isDynamicToolUIPart(part) && "eve" in part;
}

/** The interaction carried by a `data-eve-interaction` part. */
export function getInteraction(part: UIPart): Interaction | undefined {
  return part.type === EVE_INTERACTION_PART ? part.data as Interaction : undefined;
}

function toUIToolPart(part: EveToolPart): EveUiToolPart {
  const base = {
    type: "dynamic-tool" as const,
    toolName: part.name,
    toolCallId: part.callId,
    title: part.label,
    eve: part,
  };

  if (part.state === "streaming") {
    return { ...base, state: "input-streaming", rawInput: part.inputText };
  }

  const input = part.input ?? {};
  const interaction = part.interaction;

  switch (part.state) {
    case "completed":
      // `output` is absent when eve withheld it or kept it out of the stream line.
      return { ...base, state: "output-available", input, output: part.output ?? null };
    case "failed":
      return { ...base, state: "output-error", input, errorText: part.error?.message ?? "Tool failed" };
    case "rejected":
      return { ...base, state: "output-error", input, errorText: part.error?.message ?? "Denied" };
    case "cancelled":
      return { ...base, state: "output-error", input, errorText: part.error?.message ?? "Cancelled" };
    default:
      // Waiting on a person: not running, so it must not shimmer. A call
      // blocked on a sign-in has no interaction of its own — the sign-in is a
      // standalone part — so go by the call state as well.
      if (interaction?.status === "open" || part.state === "approval" || part.state === "blocked") {
        return {
          ...base,
          state: "approval-requested",
          input,
          approval: { id: interaction?.interactionId ?? part.callId },
        };
      }
      return { ...base, state: "input-available", input };
  }
}

function toUIPart(part: EveMessagePart): UIPart {
  switch (part.type) {
    case "text":
    case "reasoning":
      return { type: part.type, text: part.text, ...(part.state ? { state: part.state } : {}) };
    case "file":
      return { type: "file", mediaType: part.mediaType, filename: part.filename, url: part.url ?? "" };
    case "interaction":
      return { type: EVE_INTERACTION_PART, id: part.interactionId, data: part };
    case "tool":
      return toUIToolPart(part);
  }
}

/**
 * Adapts one message's parts, leaving out what the chat never shows and
 * joining consecutive text into one part so it renders as a single block.
 */
function toUIParts(parts: readonly EveMessagePart[]): UIPart[] {
  const result: UIPart[] = [];
  let lastTextStep: number | undefined;

  for (const part of parts) {
    // A tool that sets `label: false` asks to be left out of activity.
    if (part.type === "tool" && part.hidden) continue;
    // Reasoning arrives empty unless the model is asked to summarize it.
    if (part.type === "reasoning" && part.text.trim().length === 0) continue;

    const previous = result.at(-1);
    if (part.type === "text" && previous?.type === "text") {
      // Text from a later model step is a new paragraph; text split within one
      // step is the same sentence continuing.
      const separator = part.stepIndex !== lastTextStep ? "\n\n" : "";
      result[result.length - 1] = {
        type: "text",
        text: `${previous.text}${separator}${part.text}`,
        ...(part.state ? { state: part.state } : {}),
      };
    }
    else {
      result.push(toUIPart(part));
    }

    if (part.type === "text") lastTextStep = part.stepIndex;
  }

  return result;
}

/**
 * eve's own messages, adapted to the AI SDK `UIMessage[]` that the Nuxt UI chat
 * components and the tool renderers are typed against.
 */
export function toUIMessages(messages: readonly EveMessage[]): UIMessage[] {
  return messages
    // eve opens an empty assistant message as soon as the model starts. The
    // chat already shows its own indicator until the first part arrives.
    .filter(message => message.role === "user" || message.parts.length > 0)
    .map(message => ({
      id: message.id,
      role: message.role,
      metadata: message.metadata,
      parts: toUIParts(message.parts),
    }));
}

export function hasVisibleParts(parts: UIMessage["parts"]): boolean {
  return parts.some((part) => {
    if (part.type === "text" || part.type === "file") return true;
    // Mirrors what the message renders: empty reasoning is filtered out, and
    // sign-ins are shown as cards above the prompt rather than inline.
    if (part.type === "reasoning") return part.text.trim().length > 0;
    if (part.type === EVE_INTERACTION_PART) return getInteraction(part)?.request.kind !== "sign-in";
    return isToolUIPart(part) || isDynamicToolUIPart(part);
  });
}

export function normalizeEveParts(parts: UIMessage["parts"]): UIMessage["parts"] {
  return parts.filter((part) => {
    // Reasoning arrives empty unless the model is asked to summarize it.
    if (part.type === "reasoning") return part.text.trim().length > 0;
    return true;
  });
}

export function shouldShowToolInput(part: EveUiToolPart): boolean {
  const request = part.eve.interaction?.request;
  if (!request) {
    return true;
  }
  return request.display === "confirmation";
}

/**
 * Turns a qualified tool id into something readable: extension mounts namespace
 * their tools as `github__listIssues`, and eve's own tools are snake_case.
 */
export function getToolDisplayName(part: EveUiToolPart): string {
  if (part.toolName === "ask_question") {
    return part.eve.interaction?.request.prompt ?? "Question";
  }

  const name = part.toolName.split("__").at(-1) ?? part.toolName;
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The mount namespace of a qualified tool id, when it has one. */
export function getToolNamespace(part: EveUiToolPart): string | undefined {
  const [namespace, ...rest] = part.toolName.split("__");
  return rest.length > 0 ? namespace : undefined;
}
