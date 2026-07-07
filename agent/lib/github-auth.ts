import { connect } from "@vercel/connect/eve";

export const GITHUB_CONNECTOR = "github/personal-agent";

const USER_ISSUER = "app";

export const githubAuth = connect({
  connector: GITHUB_CONNECTOR,
  validate: true,
  principalToSubject: (principal) => ({
    type: "user",
    id: principal.id,
    issuer: principal.issuer ?? principal.authenticator ?? USER_ISSUER,
  }),
});
