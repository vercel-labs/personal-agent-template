import { connectPhotonCredentials } from "@vercel/connect/eve";
import { defaultPhotonAuth, photonIMessageChannel } from "eve/channels/photon";
import { buildAppSessionAuth } from "../../shared/app-auth.js";
import { fetchPhoneLink } from "../lib/phone-internal.js";

/** iMessage handles are phone numbers or Apple IDs; only the former can match a profile. */
function asPhoneNumber(handle: string) {
  const normalized = handle.trim().startsWith("+")
    ? handle.trim()
    : `+${handle.replace(/\D/g, "")}`;

  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : undefined;
}

// Replace with your Vercel Connect Photon slug, created by
// `eve add channel/photon-imessage`.
export default photonIMessageChannel({
  credentials: connectPhotonCredentials("photon/personal-agent-template"),

  async onMessage(_ctx, message) {
    if (message.author.isBot) {
      return null;
    }

    const phoneNumber = asPhoneNumber(message.author.userId);
    const link = phoneNumber ? await fetchPhoneLink(phoneNumber) : undefined;

    if (!link) {
      // Without a profile the caller has no Connect grant, so every integration
      // tool would fail. Answer as a stranger and say how to be recognised.
      return {
        auth: defaultPhotonAuth(message),
        context: [
          "This number is not on any V profile, so you have no access to the caller's memory or integrations.",
          "If they ask for anything that needs those, tell them to add this number under Settings → Profile.",
        ],
      };
    }

    return {
      auth: buildAppSessionAuth(link.appUserId, {
        name: message.author.fullName,
        phone_number: link.phoneNumber,
      }),
    };
  },
});
