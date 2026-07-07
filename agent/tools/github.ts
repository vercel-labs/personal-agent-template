import { buildEveToolMap } from "@github-tools/sdk/eve";
import { defineDynamic } from "eve/tools";
import { githubAuth } from "../lib/github-auth.ts";

export default defineDynamic({
  events: {
    "session.started": async (_event, ctx) => {
      const token = process.env.GITHUB_TOKEN
        ?? (await ctx.getToken(githubAuth, { authKey: "github" })).token;

      return buildEveToolMap({
        preset: "maintainer",
        token,
        requireApproval: {
          mergePullRequest: true,
          createOrUpdateFile: true,
          closeIssue: true,
          createIssue: "once",
          addPullRequestComment: false,
        },
      });
    },
  },
});
