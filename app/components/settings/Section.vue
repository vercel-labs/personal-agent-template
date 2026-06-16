<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-default/70 bg-elevated/20">
    <div
      v-if="title || description || $slots.actions"
      class="flex items-start justify-between gap-3 border-b border-default/60 px-4 py-3 sm:px-5"
    >
      <div class="min-w-0">
        <h2
          v-if="title"
          class="text-sm font-medium text-highlighted"
        >
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="mt-0.5 text-xs text-muted"
        >
          {{ description }}
        </p>
      </div>

      <slot name="actions" />
    </div>

    <div class="divide-y divide-default/60">
      <slot />
    </div>
  </section>
</template>
