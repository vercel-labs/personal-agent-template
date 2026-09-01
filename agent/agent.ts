import { defineAgent } from "eve";

export default defineAgent({
  // Claude 5 models think adaptively on their own, at effort `high` by default.
  model: "anthropic/claude-sonnet-5",
});
