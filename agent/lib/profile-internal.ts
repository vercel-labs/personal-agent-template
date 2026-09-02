import type { UserProfileWithUser } from "../../shared/types/profile.js";
import { appOrigin, internalHeaders } from "./internal-api.js";

export async function fetchUserProfile(userId: string): Promise<UserProfileWithUser | undefined> {
  try {
    const response = await fetch(
      `${appOrigin()}/api/internal/profile?userId=${encodeURIComponent(userId)}`,
      { headers: internalHeaders() },
    );

    if (!response.ok) {
      return undefined;
    }

    const { profile } = await response.json() as { profile: UserProfileWithUser | null };
    return profile ?? undefined;
  }
  catch {
    return undefined;
  }
}
