import { z } from "zod";

export const threadIdParamsSchema = z.object({
  id: z.string().trim().uuid("Thread id must be a UUID"),
});

export const createThreadBodySchema = z.object({
  id: z.string().trim().uuid().optional(),
  title: z.string().trim().min(1).max(200).optional(),
});

export const patchThreadBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  sessionId: z.string().trim().min(1).optional(),
});
