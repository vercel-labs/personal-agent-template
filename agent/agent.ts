import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-5",
  modelOptions: {
    providerOptions: {
      anthropic: {
        // Claude 5 thinks adaptively on its own but omits the reasoning text
        // by default, which would render as an empty "Thinking…" block.
        thinking: { type: "adaptive", display: "summarized" },
      },
    },
  },
});
