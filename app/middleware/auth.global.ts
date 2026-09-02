export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === "/login") {
    return;
  }

  // Goes through Nitro in-process during SSR, so it needs no absolute origin and
  // is not stopped by deployment protection the way a self-addressed HTTP call is.
  const session = await useRequestFetch()("/api/auth/get-session")
    .catch(() => null);

  if (!session) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }
});
