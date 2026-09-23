<script setup lang="ts">
import { startChat } from "~/composables/chat/navigation";

const input = ref("");

const examples = [
  "Build a landing page for a developer tool",
  "Create a dashboard with authentication",
  "Clone this UI and make it responsive",
];

const templates = [
  { title: "Next.js starter", meta: "Next.js · TypeScript", icon: "i-simple-icons-nextdotjs" },
  { title: "Nuxt workspace", meta: "Nuxt · Vue · TypeScript", icon: "i-simple-icons-nuxtdotjs" },
  { title: "React app", meta: "React · Vite · TypeScript", icon: "i-simple-icons-react" },
];

const projects = [
  { title: "WebSandbox Agent", meta: "Updated just now", icon: "i-lucide-box" },
  { title: "Velclaw Workspace", meta: "Updated yesterday", icon: "i-lucide-layout-dashboard" },
  { title: "AI Landing Page", meta: "Updated 3 days ago", icon: "i-lucide-sparkles" },
];

function createChat(prompt: string) {
  const text = prompt.trim();
  if (!text) return;
  input.value = "";
  void startChat(text);
}

function onSubmit() {
  createChat(input.value);
}

function useExample(example: string) {
  input.value = example;
}

function summarizeDay() {
  void startChat("Summarize my day using the daily-summary skill.");
}
</script>

<template>
  <UDashboardPanel id="home" class="min-h-0" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <AppNavbar>
        <template #title>
          <div class="flex items-center gap-2 text-sm font-medium">
            <AppLogo class="h-4 w-auto text-highlighted" />
            <span class="hidden sm:inline">WebSandBox</span>
          </div>
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div class="websandbox-home flex min-h-full flex-1 flex-col">
        <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 pb-16 pt-20 sm:px-8">
          <div class="mb-8 text-center">
            <div class="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-default bg-elevated shadow-sm">
              <AppLogo class="h-5 w-auto text-highlighted" />
            </div>
            <h1 class="text-balance text-4xl font-semibold tracking-[-0.04em] text-highlighted sm:text-5xl">
              What do you want to build?
            </h1>
            <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Describe an app, import a repository, or ask the agent to change your project.
            </p>
          </div>

          <UChatPrompt
            v-model="input"
            class="websandbox-prompt [view-transition-name:chat-prompt]"
            variant="subtle"
            :ui="{ base: 'min-h-32 rounded-2xl border border-default bg-default px-3 py-3 shadow-xl shadow-black/5 dark:shadow-black/20' }"
            @submit="onSubmit"
          >
            <template #footer>
              <div class="flex w-full items-center justify-between gap-2">
                <div class="flex items-center gap-1">
                  <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-paperclip" aria-label="Attach" />
                  <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-github" aria-label="Import from GitHub" />
                  <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-sliders-horizontal" aria-label="Settings" />
                </div>
                <UChatPromptSubmit class="shrink-0" color="primary" size="sm" />
              </div>
            </template>
          </UChatPrompt>

          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <UButton
              v-for="example in examples"
              :key="example"
              :label="example"
              color="neutral"
              variant="outline"
              size="sm"
              class="rounded-full bg-default/70"
              @click="useExample(example)"
            />
          </div>

          <div class="mt-14 grid gap-10 sm:grid-cols-2">
            <section>
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-medium text-highlighted">Recent projects</h2>
                <UButton label="View all" color="neutral" variant="link" size="xs" />
              </div>
              <div class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default">
                <button
                  v-for="project in projects"
                  :key="project.title"
                  class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
                  @click="createChat('Open the project ' + project.title)"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-highlighted">
                    <UIcon :name="project.icon" class="h-4 w-4" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-highlighted">{{ project.title }}</span>
                    <span class="block text-xs text-muted">{{ project.meta }}</span>
                  </span>
                  <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-muted" />
                </button>
              </div>
            </section>

            <section>
              <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-medium text-highlighted">Start from a template</h2>
                <UButton label="Browse" color="neutral" variant="link" size="xs" />
              </div>
              <div class="grid gap-2">
                <button
                  v-for="template in templates"
                  :key="template.title"
                  class="group flex items-center gap-3 rounded-xl border border-default bg-default px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accented hover:shadow-md"
                  @click="useExample('Create a ' + template.title + ' project')"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-highlighted">
                    <UIcon :name="template.icon" class="h-4 w-4" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-highlighted">{{ template.title }}</span>
                    <span class="block text-xs text-muted">{{ template.meta }}</span>
                  </span>
                  <UIcon name="i-lucide-arrow-up-right" class="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </section>
          </div>

          <div class="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
            <button class="hover:text-highlighted" @click="summarizeDay">Summarize my day</button>
            <span>•</span>
            <span>WebSandbox Agent</span>
            <span>•</span>
            <span>Runs in your workspace</span>
          </div>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
