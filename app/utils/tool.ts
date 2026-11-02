import type { EveToolPart } from "eve/vue";

export interface Source {
  url: string;
  title?: string;
}

interface GoogleGroundingChunk {
  web?: { uri?: string; title?: string };
}

interface SearchOutput {
  sources?: { url: string; type?: string }[];
  groundingChunks?: GoogleGroundingChunk[];
  groundingMetadata?: { groundingChunks?: GoogleGroundingChunk[] };
}

export function getSearchQuery(part: EveToolPart): string | undefined {
  return (part.input as { query?: string } | undefined)?.query;
}

export function getSources(part: EveToolPart): Source[] {
  const output = part.output;
  if (!output) return [];

  if (Array.isArray(output)) {
    return output
      .filter((s: Source) => s.url)
      .map((s: Source) => ({ url: s.url, title: s.title }));
  }

  const typed = output as SearchOutput;

  if (typed.sources) {
    return typed.sources.filter((s) => s.url).map((s) => ({ url: s.url }));
  }

  const chunks = typed.groundingChunks ?? typed.groundingMetadata?.groundingChunks;
  if (chunks) {
    return chunks
      .filter((c) => c.web?.uri)
      .map((c) => ({ url: c.web!.uri!, title: c.web!.title }));
  }

  return [];
}
