<script setup lang="ts">
import type { EveToolPart } from "eve/vue";
import type { WeatherOutput } from "~~/shared/tools/weather";

const props = defineProps<{
  part: EveToolPart;
}>();

const isLoading = computed(
  () => ["streaming", "requested", "running"].includes(props.part.state),
);
const weather = computed(() => props.part.output as WeatherOutput | undefined);

const color = computed(() => {
  return (
    ({
      completed:
        "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white dark:from-sky-500 dark:via-blue-600 dark:to-indigo-700",
      failed: "bg-muted text-error",
    } as Record<string, string>)[props.part.state] || "bg-muted text-muted"
  );
});

const message = computed(() => {
  return (
    ({
      failed: "Can't get weather data, please try again later",
    } as Record<string, string>)[props.part.state] || "Loading weather data..."
  );
});
</script>

<template>
  <div
    class="my-5 w-full max-w-md shrink-0 rounded-xl px-5 py-4"
    :class="color"
  >
    <template v-if="weather">
      <div class="mb-3 flex items-start justify-between">
        <div class="flex items-baseline">
          <span class="text-4xl font-bold">{{ weather.temperature }}°</span>
          <span class="text-base text-white/80">C</span>
        </div>
        <div class="text-right">
          <div class="mb-1 text-base font-medium">
            {{ weather.location }}
          </div>
          <div class="text-xs text-white/70">
            H:{{ weather.temperatureHigh }}° L:{{ weather.temperatureLow }}°
          </div>
        </div>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            :name="`i-lucide-${weather.condition.icon}`"
            class="size-6 text-white"
          />
          <div class="text-sm font-medium">
            {{ weather.condition.text }}
          </div>
        </div>

        <div class="flex gap-3 text-xs">
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-droplets"
              class="size-3 text-blue-200"
            />
            <span>{{ weather.humidity }}%</span>
          </div>
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-wind"
              class="size-3 text-blue-200"
            />
            <span>{{ weather.windSpeed }} km/h</span>
          </div>
        </div>
      </div>

      <div
        v-if="weather.dailyForecast.length > 0"
        class="flex items-center justify-between"
      >
        <div
          v-for="(forecast, index) in weather.dailyForecast"
          :key="index"
          class="flex flex-col items-center gap-1.5"
        >
          <div class="text-xs font-medium text-white/70">
            {{ forecast.day }}
          </div>

          <UIcon
            :name="`i-lucide-${forecast.condition.icon}`"
            class="size-5 text-white"
          />
          <div class="text-xs font-medium">
            <div>
              {{ forecast.high }}°
            </div>
            <div class="text-white/60">
              {{ forecast.low }}°
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex items-center justify-center py-3"
      >
        <div class="text-xs">
          No forecast available
        </div>
      </div>
    </template>

    <div
      v-else-if="isLoading"
      class="flex h-44 items-center justify-center"
    >
      <div class="text-center">
        <UIcon
          name="i-lucide-loader-circle"
          class="mx-auto mb-2 size-8 animate-spin"
        />
        <div class="text-sm">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>
