export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
}

export interface ThreadRecord extends ThreadSummary {
  /**
   * The eve session backing this thread, or `null` before its first message.
   *
   * eve owns the transcript. The client replays it from the durable session
   * stream, so the app stores the identifier and nothing else.
   */
  sessionId: string | null;
}

export function truncateThreadTitle(text: string, maxLength = 60): string {
  const line = text.trim().split("\n")[0]?.trim() || "New chat";
  if (line.length <= maxLength) {
    return line;
  }

  return `${line.slice(0, maxLength - 1)}…`;
}
