import { createMCPClient } from "@ai-sdk/mcp";

const LINEAR_MCP_URL = "https://mcp.linear.app/mcp";
const PREFERRED_TOOLS = ["list_issues", "search_issues", "listIssues", "get_issues"];
const MAX_RESULTS = 5;

interface LinearIssueShape {
  identifier?: string;
  title?: string;
  name?: string;
}

function formatIssue(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const issue = value as LinearIssueShape;
  if (issue.identifier && issue.title) {
    return `${issue.identifier} — ${issue.title}`;
  }

  return issue.title ?? issue.name;
}

/** Linear returns issues as a JSON blob inside a text content block. */
function issuesFromToolResult(content: unknown): string[] {
  if (!Array.isArray(content)) {
    return [];
  }

  const issues: string[] = [];

  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const { type, text } = block as { type?: string; text?: string };
    if (type !== "text" || !text) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    }
    catch {
      issues.push(text.trim());
      continue;
    }

    const rows = Array.isArray(parsed)
      ? parsed
      : [
          (parsed as { items?: unknown[] })?.items,
          (parsed as { issues?: unknown[] })?.issues,
          (parsed as { nodes?: unknown[] })?.nodes,
        ].find(Array.isArray) ?? [];

    for (const row of rows) {
      const formatted = formatIssue(row);
      if (formatted) issues.push(formatted);
    }
  }

  return issues.slice(0, MAX_RESULTS);
}

/**
 * Prove a Linear Connect grant works by talking to the same MCP server the
 * agent connection uses. Lists a few issues when the server exposes an issue
 * tool, and otherwise falls back to naming the tools it does expose.
 */
export async function fetchLinearIssuesViaMcp(token: string): Promise<string[]> {
  const client = await createMCPClient({
    transport: {
      type: "http",
      url: LINEAR_MCP_URL,
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  try {
    const { tools } = await client.listTools();
    const listTool = PREFERRED_TOOLS.map(name => tools.find(tool => tool.name === name)).find(Boolean)
      ?? tools.find(tool => /issues/i.test(tool.name));

    if (!listTool) {
      if (!tools.length) {
        throw new Error("Linear MCP exposed no tools");
      }
      return tools.slice(0, MAX_RESULTS).map(tool => tool.name);
    }

    const properties = listTool.inputSchema?.properties ?? {};
    const args = "limit" in properties
      ? { limit: MAX_RESULTS }
      : "first" in properties
        ? { first: MAX_RESULTS }
        : {};

    const result = await client.callTool({ name: listTool.name, arguments: args });
    if (result.isError) {
      throw new Error(`Linear MCP ${listTool.name} failed`);
    }

    const issues = issuesFromToolResult(result.content);
    return issues.length ? issues : ["Connected (no issues yet)"];
  }
  finally {
    await client.close().catch(() => undefined);
  }
}
