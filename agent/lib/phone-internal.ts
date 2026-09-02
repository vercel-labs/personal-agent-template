import type { PhoneLinkRecord } from "../../shared/types/phone-link.js";
import { appOrigin, internalHeaders } from "./internal-api.js";

export async function fetchPhoneLink(phoneNumber: string): Promise<PhoneLinkRecord | undefined> {
  try {
    const response = await fetch(
      `${appOrigin()}/api/internal/phone/link?phoneNumber=${encodeURIComponent(phoneNumber)}`,
      { headers: internalHeaders() },
    );

    if (!response.ok) {
      return undefined;
    }

    const { link } = await response.json() as { link: PhoneLinkRecord | null };
    return link ?? undefined;
  }
  catch {
    return undefined;
  }
}
