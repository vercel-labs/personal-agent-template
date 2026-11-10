import githubExtension from "@github-tools/eve-extension";
import { GITHUB_CONNECTOR, GITHUB_PRESET } from "../../shared/connect.js";

// The mount namespace comes from this filename, so tools reach the model as
// `github__listPullRequests`, `github__createIssue`, and so on.
export default githubExtension({
  connector: GITHUB_CONNECTOR,
  preset: GITHUB_PRESET,
  // Each person reaches GitHub through their own Connect grant, so the agent
  // can do what that user can do and nothing more. Someone who has not
  // connected GitHub gets a sign-in prompt in the conversation instead of a
  // failed tool call. Only a turn no user drives (a schedule, a service
  // caller) falls back to the project's GitHub App installation.
  //
  // The grant is looked up by the caller's principal id and issuer, which for
  // signed-in and linked users is the pair `appSession()` and Settings use
  // (`CONNECT_USER_ISSUER`), so connecting in either place serves both.
  actAs: "caller",
});
