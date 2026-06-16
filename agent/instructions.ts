import { defineDynamic, defineInstructions } from "eve/instructions";
import type { DynamicResolveContext } from "eve/instructions";
import { BASE_INSTRUCTIONS } from "./lib/base-instructions.js";
import { buildUserContextPrompt, fetchUserContext } from "./lib/memory-internal.js";

export default defineDynamic({
  events: {
    "session.started": async (_event, ctx: DynamicResolveContext) => {
      const userId = ctx.session.auth.current?.principalId;
      if (!userId || userId.startsWith("eve:")) {
        return defineInstructions({ markdown: BASE_INSTRUCTIONS });
      }

      const context = await fetchUserContext(userId);
      if (!context) {
        return defineInstructions({ markdown: BASE_INSTRUCTIONS });
      }

      const userBlock = buildUserContextPrompt(context);
      return defineInstructions({
        markdown: `${BASE_INSTRUCTIONS}\n\n---\n\n${userBlock}`,
      });
    },
  },
});
