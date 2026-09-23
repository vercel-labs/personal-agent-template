<script setup lang="ts">
const colorMode = useColorMode();

const themeColor = computed(() => (colorMode.value === "dark" ? "#08090B" : "#F4F6F8"));

useHead({
  meta: [
    { key: "theme-color", name: "theme-color", content: themeColor },
  ],
});

useSiteSeo();
</script>

<template>
  <UApp :toaster="{ position: 'top-right' }" :tooltip="{ delayDuration: 200 }">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
