import type { ConnectorState, ParsedTestResult } from "#shared/types/connector";

export function getFetchErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) {
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}

export function connectorStatusLabel(state: ConnectorState) {
  switch (state) {
    case "connected":
      return { label: "Connected", color: "success" as const };
    case "installation_required":
      return { label: "Install required", color: "warning" as const };
    case "setup_required":
      return { label: "Setup required", color: "warning" as const };
    case "error":
      return { label: "Error", color: "error" as const };
    default:
      return { label: "Not connected", color: "neutral" as const };
  }
}

export function isCliHintLine(line: string) {
  return line.startsWith("vercel ") || line.startsWith("Update ");
}

export function parseTestResult(line: string): ParsedTestResult {
  const withId = line.match(/^([A-Z]+-\d+)\s*[—-]\s*(.+)$/);
  if (withId?.[1] && withId[2]) {
    return { id: withId[1], title: withId[2] };
  }

  const withTag = line.match(/^(\[[^\]]+\])\s*(.+)$/);
  if (withTag?.[1] && withTag[2]) {
    return { tag: withTag[1].slice(1, -1), title: withTag[2] };
  }

  return { title: line };
}

export function testResultsHeading(connectorId: string) {
  if (connectorId === "linear") {
    return "Issues";
  }
  if (connectorId === "github") {
    return "Repositories";
  }
  return "Results";
}

const CONNECTION_ICONS: Record<string, string> = {
  linear: "i-simple-icons-linear",
  github: "i-simple-icons-github",
  slack: "i-simple-icons-slack",
};

/** eve's own rule for turning a connector UID into a sign-in name segment. */
function signInSegment(connectorUid: string) {
  return connectorUid.replace(/[^\w.:-]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Whether a sign-in belongs to a connector. A connection's sign-in is named
 * after the connection (`linear`). One a tool raises — the GitHub extension's
 * per-user tokens — is named `<tool scope>__<connector UID>` instead.
 */
export function signInMatchesConnector(
  signInName: string,
  connector: { connectionName: string; connectorUid: string },
) {
  if (signInName === connector.connectionName) return true;
  const segment = signInSegment(connector.connectorUid);
  return signInName === segment || signInName.endsWith(`__${segment}`);
}

/** The provider a sign-in is for: `linear`, or `github` from `…__github_my-agent`. */
export function signInProvider(signInName: string) {
  const segment = signInName.split("__").at(-1) ?? signInName;
  return segment.split(/[_/.:]/)[0] || segment;
}

export function connectionIcon(name: string) {
  return CONNECTION_ICONS[signInProvider(name).toLowerCase()] ?? "i-lucide-plug";
}
