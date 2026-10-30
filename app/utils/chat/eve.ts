import type { EveMessagePart, EveToolPart } from "eve/vue";

export function hasVisibleParts(parts: readonly EveMessagePart[]): boolean {
  return parts.some((part) => {
    if (part.type === "text" || part.type === "reasoning") return true;
    return part.type === "tool" || part.type === "interaction";
  });
}

export function normalizeEveParts(parts: readonly EveMessagePart[]): EveMessagePart[] {
  return parts.filter((part) => {
    // Reasoning arrives empty unless the model is asked to summarize it.
    if (part.type === "reasoning") return part.text.trim().length > 0;
    return true;
  });
}

/**
 * Turns a qualified tool id into something readable: extension mounts namespace
 * their tools as `github__listIssues`, and eve's own tools are snake_case.
 */
export function getToolDisplayName(part: EveToolPart): string {
  if (part.name === "ask_question") {
    return part.interaction?.request.prompt ?? "Question";
  }

  const name = part.name.split("__").at(-1) ?? part.name;
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The mount namespace of a qualified tool id, when it has one. */
export function getToolNamespace(part: EveToolPart): string | undefined {
  const [namespace, ...rest] = part.name.split("__");
  return rest.length > 0 ? namespace : undefined;
}
