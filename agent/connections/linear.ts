import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

const CONNECTOR = "mcp.linear.app/linear";

export default defineMcpClientConnection({
  url: "https://mcp.linear.app/mcp",
  description: "Linear workspace: issues, projects, cycles, and comments.",
  auth: connect({
    connector: CONNECTOR,
    validate: true,
  }),
});
