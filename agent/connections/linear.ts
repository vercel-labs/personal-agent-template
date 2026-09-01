import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

const CONNECTOR = "mcp.linear.app/linear";

export default defineMcpClientConnection({
  url: "https://mcp.linear.app/mcp",
  description: "Linear workspace: issues, projects, cycles, and comments.",
  // Connect maps app principals to `{ type: "app" }` and user principals to
  // `{ type: "user", id, issuer }` by default, which is what `appSession()`
  // already issues. Nothing to override.
  auth: connect({
    connector: CONNECTOR,
    validate: true,
  }),
});
