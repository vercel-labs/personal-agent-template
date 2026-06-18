import type { SendFn } from "eve/channels";
import { defineChannel, POST } from "eve/channels";
import type { SendblueMessagePayload } from "chat-adapter-sendblue";
import { agent } from "../../shared/agent.js";
import { buildAppSessionAuth } from "../../shared/slack-auth.js";
import { fetchPhoneLinkForNumber } from "../lib/phone-internal.js";
import {
  contactNumberFromPayload,
  getSendblueAdapter,
  isInboundSendblueMessage,
  isSendblueConfigured,
  isSendblueServiceAllowed,
  profileSettingsUrl,
  resolveSendblueLineNumber,
  threadIdFromPayload,
  verifySendblueWebhook,
} from "../lib/sendblue.js";

const WEBHOOK_ROUTE = "/eve/v1/sendblue/webhook";

interface SendblueChannelState {
  threadId: string | null;
  contactNumber: string | null;
  fromNumber: string | null;
  groupId: string | null;
  isGroup: boolean;
  pendingToolCallMessage: string | null;
}

function chatUrl() {
  const origin = process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "");
  return origin ? `${origin}/chat` : "the web chat";
}

function firstNonEmptyLine(text: string) {
  for (const line of text.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

async function postToThread(threadId: string, message: string) {
  try {
    const sendblue = getSendblueAdapter();
    await sendblue.postMessage(threadId, { markdown: message });
  } catch (error) {
    console.error("[sendblue] outbound delivery failed", error);
  }
}

function threadIdForState(
  sendblue: ReturnType<typeof getSendblueAdapter>,
  state: Pick<SendblueChannelState, "threadId" | "fromNumber" | "contactNumber">,
) {
  if (state.fromNumber && state.contactNumber) {
    return sendblue.encodeThreadId({
      fromNumber: state.fromNumber,
      contactNumber: state.contactNumber,
    });
  }

  return state.threadId;
}

async function dispatchInbound(
  payload: SendblueMessagePayload,
  send: SendFn<SendblueChannelState>,
) {
  const sendblue = getSendblueAdapter();
  const threadId = threadIdFromPayload(payload, sendblue);
  const contactNumber = contactNumberFromPayload(payload);
  const text = payload.content?.trim() ?? "";

  if (!text) {
    return;
  }

  const link = await fetchPhoneLinkForNumber(contactNumber);
  if (!link) {
    await postToThread(
      threadId,
      [
        `Your phone number is not linked to ${agent.name} yet.`,
        "",
        `Add it in ${profileSettingsUrl()} using E.164 format (for example +33612345678), then message again.`,
      ].join("\n"),
    );
    return;
  }

  const auth = buildAppSessionAuth(link.appUserId, {
    channel: "sendblue",
    phone_number: contactNumber,
  });

  const fromNumber = resolveSendblueLineNumber(payload);

  try {
    await send(
      { message: text },
      {
        auth,
        continuationToken: threadId,
        state: {
          threadId,
          contactNumber,
          fromNumber,
          groupId: payload.group_id?.length ? payload.group_id : null,
          isGroup: Boolean(payload.group_id?.length),
          pendingToolCallMessage: null,
        } satisfies SendblueChannelState,
      },
    );
  } catch (error) {
    console.error("[sendblue] agent send failed", error);
  }
}

export default defineChannel<SendblueChannelState>({
  kindHint: "sendblue",

  state: {
    threadId: null,
    contactNumber: null,
    fromNumber: null,
    groupId: null,
    isGroup: false,
    pendingToolCallMessage: null,
  },

  metadata(state) {
    return {
      contactNumber: state.contactNumber,
      fromNumber: state.fromNumber,
      isGroup: state.isGroup,
      threadId: state.threadId,
    };
  },

  context(state) {
    return {
      sendblue: getSendblueAdapter(),
      state,
    };
  },

  routes: [
    POST(WEBHOOK_ROUTE, async (request, { send, waitUntil }) => {
      if (!isSendblueConfigured()) {
        return new Response("Sendblue is not configured", { status: 503 });
      }

      if (!verifySendblueWebhook(request)) {
        return new Response("Unauthorized", { status: 401 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response("Bad Request", { status: 400 });
      }

      if (body && typeof body === "object" && "is_typing" in body) {
        return new Response("OK", { status: 200 });
      }

      if (!isInboundSendblueMessage(body)) {
        return new Response("OK", { status: 200 });
      }

      const payload = body;

      if (!isSendblueServiceAllowed(payload.service)) {
        return new Response("OK", { status: 200 });
      }

      if (payload.is_outbound || payload.status !== "RECEIVED") {
        return new Response("OK", { status: 200 });
      }

      if (payload.group_id?.length) {
        const sendblue = getSendblueAdapter();
        const threadId = threadIdFromPayload(payload, sendblue);
        waitUntil(
          postToThread(
            threadId,
            `Group chats are not supported yet. Message ${agent.name} in a direct conversation instead.`,
          ),
        );
        return new Response("OK", { status: 200 });
      }

      waitUntil(dispatchInbound(payload, send));
      return new Response("OK", { status: 200 });
    }),
  ],

  events: {
    async "turn.started"(_event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId || channel.state.isGroup) {
        return;
      }

      await channel.sendblue.startTyping(threadId).catch(() => undefined);
    },

    async "actions.requested"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId || channel.state.isGroup) {
        return;
      }

      const pending = channel.state.pendingToolCallMessage;
      channel.state.pendingToolCallMessage = null;

      if (pending) {
        await channel.sendblue.startTyping(threadId).catch(() => undefined);
        return;
      }

      await channel.sendblue.startTyping(threadId).catch(() => undefined);
      void event;
    },

    async "message.completed"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId) {
        return;
      }

      if (event.finishReason === "tool-calls") {
        channel.state.pendingToolCallMessage = event.message
          ? firstNonEmptyLine(event.message) ?? null
          : null;
        return;
      }

      channel.state.pendingToolCallMessage = null;

      if (!event.message) {
        return;
      }

      await postToThread(threadId, event.message);
    },

    async "input.requested"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId || event.requests.length === 0) {
        return;
      }

      const prompts = event.requests.map((request) => request.prompt).join("\n\n");
      await postToThread(
        threadId,
        [
          prompts,
          "",
          `Open ${chatUrl()} in your browser to approve or deny this action.`,
        ].join("\n"),
      );
    },

    async "authorization.required"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId) {
        return;
      }

      const url = event.authorization?.url;
      const userCode = event.authorization?.userCode;
      const lines = url
        ? [
            `Sign in to ${event.name} to continue: ${url}`,
            ...(userCode ? [`Code: ${userCode}`] : []),
          ]
        : [
            `Authorization is required for ${event.name}.`,
            `Open ${chatUrl()} or ${profileSettingsUrl()} to continue.`,
          ];

      await postToThread(threadId, lines.join("\n"));
    },

    async "turn.failed"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId) {
        return;
      }

      await postToThread(
        threadId,
        [
          "I hit an error while handling your request.",
          "",
          "Please try again, rephrase, or open the web chat if it keeps failing.",
        ].join("\n"),
      );

      void event;
    },

    async "session.failed"(event, channel) {
      const threadId = threadIdForState(channel.sendblue, channel.state);
      if (!threadId) {
        return;
      }

      await postToThread(
        threadId,
        [
          "This session could not recover from an error.",
          "",
          "Send a new message to start again.",
        ].join("\n"),
      );

      void event;
    },
  },
});
