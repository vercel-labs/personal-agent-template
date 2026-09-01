import githubExtension from "@github-tools/eve-extension";
import { GITHUB_CONNECTOR } from "../../shared/connect.js";

// Mount namespace comes from this filename, so tools reach the model as
// `github__listPullRequests`, `github__createIssue`, and so on.
//
// The extension mints the Connect token lazily inside each tool call and
// derives the required scopes from `preset`, so unauthorized users still see
// the tools and get an authorization prompt on first use — the previous
// dynamic tool minted a token at session start and silently registered
// nothing when the user had not connected GitHub yet.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: "maintainer",
});
