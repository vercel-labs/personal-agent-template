<script setup lang="ts">
defineProps<{
  label: string;
  description?: string;
  hint?: string;
}>();
</script>

<template>
  <div class="px-4 py-4 sm:px-5 sm:py-5">
    <div
      v-if="$slots.default"
      class="grid gap-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start"
    >
      <div class="space-y-1">
        <p class="text-sm font-medium text-highlighted">
          {{ label }}
        </p>
        <p
          v-if="description"
          class="text-xs leading-relaxed text-muted"
        >
          {{ description }}
        </p>
      </div>

      <div class="min-w-0 space-y-1">
        <slot />
        <p
          v-if="hint"
          class="text-xs text-dimmed"
        >
          {{ hint }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="flex items-center justify-between gap-4"
    >
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium text-highlighted">
          {{ label }}
        </p>
        <p
          v-if="description"
          class="text-xs leading-relaxed text-muted"
        >
          {{ description }}
        </p>
      </div>

      <slot name="control" />
    </div>
  </div>
</template>
