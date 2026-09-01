import type { NuxtApp } from "#app";

/**
 * Reuse SSR or prior navigation payload instead of refetching on client-side route changes.
 */
export function getCachedPayloadData<T>(key: string, nuxtApp?: NuxtApp): T | undefined {
  const app = nuxtApp ?? useNuxtApp();
  return app.payload.data[key] ?? app.static.data[key];
}

export const payloadCacheOptions = {
  getCachedData: getCachedPayloadData,
} as const;

export function clearCachedPayloadData(key: string, nuxtApp?: NuxtApp) {
  const app = nuxtApp ?? useNuxtApp();
  // Remove the keys rather than blanking them, so stale entries are not
  // carried into the serialized SSR payload.
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete app.payload.data[key];
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete app.static.data[key];
}
