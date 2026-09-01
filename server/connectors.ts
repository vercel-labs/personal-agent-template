import type { ConnectorDef } from "#shared/types/connector";
import { connectGithubScopesForPreset } from "@github-tools/sdk/connect";
import { GITHUB_CONNECTOR, GITHUB_PRESET } from "#shared/connect";
import { fetchLinearIssuesViaMcp } from "~~/server/utils/linear-mcp";

export const connectors: ConnectorDef[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Repositories, issues, pull requests, and CI workflows.",
    connector: GITHUB_CONNECTOR,
    connectionName: "github",
    icon: "i-simple-icons-github",
    scopes: connectGithubScopesForPreset(GITHUB_PRESET),
    test: {
      label: "List reachable repositories",
      run: async (token) => {
        // A page of five reads as "these are the only repositories you have".
        // Ask for a full page so the count reflects what the grant can actually
        // reach — a repository missing from it needs adding to the GitHub App's
        // repository selection, which is a GitHub-side grant, not a scope.
        const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=full_name", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "personal-agent-template",
          },
        });

        if (!res.ok) {
          throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }

        const repos = await res.json() as Array<{ full_name: string }>;
        if (repos.length === 0) {
          throw new Error("The connection works, but its GitHub App installation can reach no repositories. Add them to the installation's repository access.");
        }

        const shown = repos.slice(0, 10).map(repo => repo.full_name);
        return repos.length > shown.length
          ? [...shown, `…and ${repos.length - shown.length} more reachable`]
          : shown;
      },
    },
  },
  {
    id: "linear",
    name: "Linear",
    description: "Issues, projects, cycles, and comments in your Linear workspace.",
    connector: "mcp.linear.app/linear",
    connectionName: "linear",
    icon: "i-simple-icons-linear",
    scopes: [],
    test: {
      label: "List my issues",
      run: token => fetchLinearIssuesViaMcp(token),
    },
  },
];

export function getConnector(id: string): ConnectorDef {
  const connector = connectors.find((entry) => entry.id === id);

  if (!connector) {
    throw createError({
      statusCode: 404,
      statusMessage: "Connector not found",
    });
  }

  return connector;
}
