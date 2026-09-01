import githubExtension from "@github-tools/eve-extension";
import { CONNECT_USER_ISSUER, GITHUB_CONNECTOR } from "../../shared/connect.js";

// The mount namespace comes from this filename, so tools reach the model as
// `github__listPullRequests`, `github__createIssue`, and so on.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: "maintainer",
  connect: {
    // Each caller reaches GitHub through their own Connect grant. Without this
    // the extension mints `{ type: "app" }` — the project's installation —
    // and every signed-in user would read repositories they never connected.
    // The issuer must match the one `appSession()` authenticates with, or the
    // grant Settings created is not the one the agent looks up.
    subject: ctx => ({
      type: "user",
      id: ctx.session.auth.current!.principalId,
      issuer: ctx.session.auth.current?.issuer ?? CONNECT_USER_ISSUER,
    }),
  },
});
