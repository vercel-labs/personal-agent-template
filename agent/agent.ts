import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-5",
  experimental: {
    workflow: {
      // The web app stores only a session id per thread and reloads the
      // transcript from eve. Since eve 0.80, signed-in (private) sessions
      // delete their run data when the session ends, which would leave old
      // threads unreadable. Keep it for the World's default period instead.
      // Set to `0` to always delete on session end.
      retention: "default",
    },
  },
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
