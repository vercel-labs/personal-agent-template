<script setup lang="ts">
import type { ThreadRecord } from "#shared/types/thread";
import { useChatNavigation, refreshThreadList } from "~/composables/chat/navigation";
import { useAuthorizationChallenges } from "~/composables/chat/useAuthorizationChallenges";
import { useStreamLog } from "~/composables/chat/stream-log";
import { useChatSession } from "~/composables/chat/useChatSession";

const route = useRoute();
const chatId = computed(() => route.params.id as string);
const requestFetch = useRequestFetch();

const { data, error, pending: resumePending } = await useAsyncData(
  () => `thread-${chatId.value}`,
  () => requestFetch<{ thread: ThreadRecord }>(`/api/threads/${chatId.value}`),
  { watch: [chatId] },
);

if (error.value || !data.value?.thread) await navigateTo("/");

const thread = computed(() => data.value!.thread);
const { status, error: chatError, isBusy, send, respond, cancel, retry } = useChatSession(thread.value);
const { consumePendingOnMount } = useChatNavigation(chatId);
const { resetTurnEventCounts } = useStreamLog();
const { pendingChallenges, failedChallenges, tryResumeConnectedChallenges } = useAuthorizationChallenges();

const input = ref("");
const activeTab = ref<"preview" | "code">("preview");
const liveCode = ref(`<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#09090b;color:#fafafa}
main{min-height:100vh;display:grid;place-items:center;padding:32px}
.card{width:min(720px,100%);padding:48px;border:1px solid #27272a;border-radius:24px;background:linear-gradient(145deg,#18181b,#09090b);box-shadow:0 30px 80px #0008}
.eyebrow{color:#a1a1aa;font-size:13px;margin-bottom:12px}h1{font-size:clamp(34px,6vw,64px);line-height:1;margin:0 0 16px;letter-spacing:-.05em}p{color:#a1a1aa;line-height:1.7}
button{border:0;border-radius:999px;padding:12px 18px;background:#fafafa;color:#09090b;font-weight:650}
</style>
</head>
<body><main><section class="card"><div class="eyebrow">LIVE WEBSANDBOX PREVIEW</div><h1>Build at the speed of thought.</h1><p>Edit the code. The preview updates instantly.</p><button>Start building</button></section></main></body>
</html>`);

const previewUrl = ref("");
function refreshPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(new Blob([liveCode.value], { type: "text/html" }));
}
watch(liveCode, refreshPreview);
watch(status, value => { if (value === "submitted") resetTurnEventCounts(); });

onMounted(() => {
  refreshPreview();
  void refreshThreadList();
  void tryResumeConnectedChallenges({ skipIfBusy: isBusy.value });
  const onFocus = () => void tryResumeConnectedChallenges({ skipIfBusy: isBusy.value });
  window.addEventListener("focus", onFocus);
  onUnmounted(() => {
    window.removeEventListener("focus", onFocus);
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  });
  consumePendingOnMount(send);
});

function handleSubmit(e: Event) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || isBusy.value) return;
  input.value = "";
  void send(text);
}
function handleInputResponses(responses: Parameters<typeof respond>[0]) { void respond(responses); }
</script>

<template>
  <UDashboardPanel id="chat" class="relative min-h-0" :ui="{ body: 'p-0 sm:p-0 overscroll-none' }">
    <template #header>
      <AppNavbar>
        <template #title>
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm font-medium text-highlighted">{{ thread.title }}</span>
            <span class="hidden rounded-full border border-default bg-muted px-2 py-0.5 text-[10px] text-muted sm:inline-flex">Live</span>
          </div>
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div v-if="resumePending" class="flex flex-1 items-center justify-center text-sm text-dimmed">Loading workspace…</div>
      <div v-else class="flex min-h-0 flex-1 flex-col">
        <div class="websandbox-ide min-h-0 flex-1">
          <section class="ide-panel">
            <div class="ide-toolbar">
              <div class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-500" /><span class="text-xs font-medium">Code</span><span class="text-[11px] text-muted">index.html</span></div>
              <span class="text-[10px] uppercase tracking-wider text-muted">Auto preview</span>
            </div>
            <textarea v-model="liveCode" spellcheck="false" class="ide-code" aria-label="Live code editor" />
          </section>

          <section class="ide-panel">
            <div class="ide-toolbar">
              <div class="flex items-center gap-1 rounded-lg border border-default bg-muted p-0.5">
                <button class="ide-tab" :class="{ 'ide-tab-active': activeTab === 'preview' }" @click="activeTab = 'preview'"><UIcon name="i-lucide-monitor" />Preview</button>
                <button class="ide-tab" :class="{ 'ide-tab-active': activeTab === 'code' }" @click="activeTab = 'code'"><UIcon name="i-lucide-code-2" />Code</button>
              </div>
              <div class="flex items-center gap-1 text-[11px] text-muted"><UIcon name="i-lucide-refresh-cw" class="h-3.5 w-3.5" />Updates automatically</div>
            </div>
            <div v-if="activeTab === 'preview'" class="min-h-0 flex-1 bg-white"><iframe :key="previewUrl" :src="previewUrl" title="WebSandBox live preview" class="h-full w-full border-0" /></div>
            <div v-else class="min-h-0 flex-1 overflow-auto bg-[#09090b] p-5"><pre class="whitespace-pre-wrap font-mono text-xs leading-6 text-zinc-300">{{ liveCode }}</pre></div>
          </section>
        </div>

        <div v-if="pendingChallenges.length || failedChallenges.length" class="border-t border-default px-4 py-2">
          <AgentAuthorizationRequest v-for="challenge in pendingChallenges" :key="`pending-${challenge.name}`" :challenge="challenge" />
          <AgentAuthorizationRequest v-for="challenge in failedChallenges" :key="`failed-${challenge.name}`" :challenge="challenge" />
        </div>

        <div class="border-t border-default bg-default/95 p-3 backdrop-blur sm:p-4">
          <UChatPrompt v-model="input" :error="chatError" variant="subtle" class="[view-transition-name:chat-prompt]" :ui="{ base: 'rounded-xl border border-default bg-elevated/80 shadow-sm' }" @submit="handleSubmit">
            <template #footer><ChatStreamInspector :status="status" /><UChatPromptSubmit class="ms-auto shrink-0" :status="status" color="neutral" size="sm" @stop="cancel()" @reload="retry()" /></template>
          </UChatPrompt>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
