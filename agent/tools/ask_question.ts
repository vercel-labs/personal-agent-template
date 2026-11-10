// Lets the model pause a turn to ask the user one question, optionally with
// options. The web chat renders it as an input card (AgentInputRequest.vue);
// Slack and iMessage render it natively. No longer a default tool since eve 0.65.
import { askQuestion } from "eve/tools/ask_question";

export default askQuestion;
