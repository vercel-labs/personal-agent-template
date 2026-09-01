import githubExtension from "@github-tools/eve-extension";
import { GITHUB_CONNECTOR } from "../../shared/connect.js";

// The mount namespace comes from this filename, so tools reach the model as
// `github__listPullRequests`, `github__createIssue`, and so on. Connect scopes
// are derived from `preset`, and tokens are minted per tool call, so a caller
// who has not connected GitHub gets an authorization prompt on first use.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: "maintainer",
});
