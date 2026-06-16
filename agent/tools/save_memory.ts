import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { saveMemoryRemote } from "../lib/memory-internal.js";

const categories = [
  "work_context",
  "personal_context",
  "active_focus",
  "instructions_preferences",
  "project_history",
] as const;

const updateSchema = z.object({
  category: z.enum(categories).describe("Memory category to update"),
    content: z.string().min(1).describe("Full replacement prose for this category (not a partial delta)"),
});

export default defineTool({
  description:
    "Propose saving memory updates. Requires one user approval for the whole batch. When several categories change, include every update in a single call — never parallel save_memory calls.",
  inputSchema: z.object({
    reason: z.string().min(1).describe("Brief explanation of why these updates are worth remembering"),
    updates: z.array(updateSchema).min(1).max(5).describe("Category updates to save together"),
  }),
  needsApproval: always(),
  async execute({ updates }, ctx) {
    const userId = ctx.session.auth.current?.principalId;
    if (!userId) {
      throw new Error("Cannot save memory without an authenticated user");
    }

    const results = [];
    for (const update of updates) {
      const result = await saveMemoryRemote({
        userId,
        category: update.category,
        content: update.content,
      });
      results.push({
        category: update.category,
        saved: result.saved,
      });
    }

    return { results };
  },
});
