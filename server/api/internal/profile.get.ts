import { z } from "zod";
import { getProfileWithUser } from "~~/server/utils/profile";
import { requireInternalRequest } from "~~/server/utils/internal-api";

const querySchema = z.object({
  userId: z.string().trim().min(1),
});

export default defineEventHandler(async (event) => {
  requireInternalRequest(event);

  const { userId } = await getValidatedQuery(event, querySchema.parse);
  const profile = await getProfileWithUser(userId);

  return { profile: profile ?? null };
});
