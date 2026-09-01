import { isDynamicToolUIPart, isToolUIPart } from "ai";
import type { UIMessage } from "ai";
import type { EveDynamicToolPart } from "eve/vue";

export function hasVisibleParts(parts: UIMessage["parts"]): boolean {
  return parts.some((part) => {
    if (part.type === "text" || part.type === "reasoning") return true;
    return isToolUIPart(part) || isDynamicToolUIPart(part);
  });
}

export function normalizeEveParts(parts: UIMessage["parts"]): UIMessage["parts"] {
  return parts.filter((part) => {
    if (part.type === "step-start") return false;
    // Reasoning arrives empty unless the model is asked to summarize it.
    if (part.type === "reasoning") return part.text.trim().length > 0;
    return true;
  });
}

export function shouldShowToolInput(part: EveDynamicToolPart): boolean {
  const request = part.toolMetadata?.eve?.inputRequest;
  if (!request) {
    return true;
  }
  return request.display === "confirmation";
}

/**
 * Turns a qualified tool id into something readable: extension mounts namespace
 * their tools as `github__listIssues`, and eve's own tools are snake_case.
 */
export function getToolDisplayName(part: EveDynamicToolPart): string {
  if (part.toolName === "ask_question") {
    return part.toolMetadata?.eve?.inputRequest?.prompt ?? "Question";
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
export function getToolNamespace(part: EveDynamicToolPart): string | undefined {
  const [namespace, ...rest] = part.toolName.split("__");
  return rest.length > 0 ? namespace : undefined;
}
