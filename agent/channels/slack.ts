import { connectSlackCredentials } from "@vercel/connect/eve";
import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackInboundMessageContext,
  type SlackMessage,
} from "eve/channels/slack";
import { buildAppSessionAuth } from "../../shared/app-auth";
import {
  consumeSlackLinkCodeRemote,
  fetchSlackLinkForMember,
  parseSlackLinkCommand,
} from "../lib/slack-internal";

/**
 * `messageContext.users` below has eve look the sender up and write the name
 * to `message.author` before mention and DM hooks run. A followed thread reply
 * reaches `onMessage` before that lookup, so it can be unset there; the stored
 * link then supplies the name.
 */
function senderName(message: SlackMessage) {
  return message.author?.displayName?.trim() || message.author?.fullName?.trim() || undefined;
}

async function slackLinkProfile(ctx: SlackContext, userId: string) {
  const res = await ctx.slack.request("users.info", { user: userId });
  if (!res.ok || typeof res.user !== "object" || res.user === null) return null;

  const user = res.user as {
    name?: string;
    real_name?: string;
    profile?: { display_name?: string; real_name?: string; email?: string };
  };

  return {
    userName: user.name,
    displayName: user.profile?.display_name?.trim() || user.profile?.real_name?.trim() || user.real_name?.trim(),
    email: user.profile?.email,
  };
}

async function tryHandleSlackLinkCommand(
  ctx: SlackContext,
  message: SlackMessage,
) {
  const userId = message.author?.userId;
  const teamId = message.teamId;
  const text = message.markdown ?? message.text ?? "";

  if (!userId || !teamId) {
    return false;
  }

  const code = parseSlackLinkCommand(text);
  if (!code) {
    return false;
  }

  // Linking is the one moment the handle and email are stored, and eve's
  // sender lookup provides neither, so ask Slack directly.
  const profile = await slackLinkProfile(ctx, userId);
  const result = await consumeSlackLinkCodeRemote({
    code,
    slackTeamId: teamId,
    slackUserId: userId,
    slackUserName: profile?.userName ?? message.author?.userName,
    slackDisplayName: senderName(message) ?? profile?.displayName,
    slackEmail: profile?.email,
  });

  if (result.ok) {
    await ctx.thread.post(
      "Your Slack account is now linked to V. Mentions and DMs will use your profile and integrations.",
    );
    return true;
  }

  const reason = result.reason === "expired"
    ? "That link code has expired. Generate a new one in V → Integrations."
    : "That link code is invalid. Generate a fresh code in V → Integrations.";

  await ctx.thread.post(reason);
  return true;
}

async function resolveSlackInboundAuth(
  slackAuth: NonNullable<ReturnType<typeof defaultSlackAuth>>,
  member: {
    teamId?: string | null;
    userId: string;
    userName?: string;
    displayName?: string;
    email?: string;
  },
) {
  if (!member.teamId) {
    return slackAuth;
  }

  const link = await fetchSlackLinkForMember(member.teamId, member.userId);
  if (!link) {
    return slackAuth;
  }

  return buildAppSessionAuth(link.appUserId, {
    email: member.email ?? link.slackEmail,
    name: member.displayName ?? link.slackDisplayName,
    slack_team_id: member.teamId,
    slack_user_id: member.userId,
    slack_user_name: member.userName ?? link.slackUserName,
    linked: "true",
  });
}

async function buildSlackTurn(ctx: SlackInboundMessageContext, message: SlackMessage) {
  // Another app's message carries a service identity, which the GitHub
  // extension would serve with the project's own installation rather than a
  // person's grant. Only people talk to this agent.
  if (message.author?.isBot) {
    return null;
  }

  // eve runs an edited message through the same hook a new one would reach.
  // Skip the side effects for edits: an edited `link <code>` must not consume
  // the code a second time, and an edit that joins a running turn should not
  // reset the thread status.
  if (ctx.edit) {
    if (parseSlackLinkCommand(message.markdown ?? message.text ?? "")) {
      return null;
    }
  }
  else {
    if (await tryHandleSlackLinkCommand(ctx, message)) {
      return null;
    }

    await ctx.thread.startTyping("Thinking…");
  }

  const context: string[] = [];
  const userId = message.author?.userId;

  const slackAuth = defaultSlackAuth(message, ctx);
  if (!slackAuth || !userId) {
    return null;
  }

  const auth = await resolveSlackInboundAuth(slackAuth, {
    teamId: message.teamId,
    userId,
    userName: message.author?.userName,
    displayName: senderName(message),
  });

  const linked = auth.principalId !== slackAuth.principalId;
  if (!linked) {
    const linkUrl = process.env.BETTER_AUTH_URL
      ? `${process.env.BETTER_AUTH_URL.replace(/\/$/, "")}/settings/integrations`
      : "V → Integrations";
    context.push(
      `This Slack account is not linked to a V profile yet. Open ${linkUrl}, generate a link code, then message \`link <code>\` here.`,
    );
  }

  return {
    auth,
    context: context.length > 0 ? context : undefined,
  };
}

// Replace with your Vercel Connect Slack slug (e.g. "slack/your-agent").
export default slackChannel({
  credentials: connectSlackCredentials("slack/personal-agent-template"),

  // eve adds each sender's name to the model's view of a message, and loads
  // what was said in the thread since the agent's last reply. Names only:
  // `{ users: { email: true } }` would put every participant's email in the
  // model's context. Sender lookup needs the `users:read` scope; reinstall the
  // Slack app after adding it.
  messageContext: { users: true },
  threadContext: { since: "last-agent-reply" },

  async onAppMention(ctx, message) {
    return buildSlackTurn(ctx, message);
  },

  async onDirectMessage(ctx, message) {
    return buildSlackTurn(ctx, message);
  },

  // Mentions and DMs are handled above; this covers every other message, so a
  // thread the agent is already answering in keeps going without re-mentioning
  // it. Needs the `message.channels` trigger and the `channels:history` scope
  // on the connector — without them Slack never sends the event and this is
  // simply never called. See docs/CUSTOMIZATION.md for the full list.
  async onMessage(ctx, message) {
    if (!(await ctx.isSubscribed())) {
      return null;
    }

    return buildSlackTurn(ctx, message);
  },
});
