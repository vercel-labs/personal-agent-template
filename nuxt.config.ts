const privateNoStore = { "cache-control": "private, no-store" } as const;
const noStore = { "cache-control": "no-store" } as const;

export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@comark/nuxt", "eve/nuxt", "@nuxthub/core", "@vercel/analytics"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  compatibilityDate: "latest",
  experimental: {
    payloadExtraction: true,
    viewTransition: true,
  },
  routeRules: {
    "/login": { prerender: true },
    "/": { ssr: true, headers: privateNoStore },
    "/chat/**": { ssr: true, headers: privateNoStore },
    "/settings/**": { ssr: true, headers: privateNoStore },
    "/api/auth/**": { headers: noStore },
    "/api/internal/**": { headers: noStore },
    "/api/profile": { headers: privateNoStore },
    "/api/profile/**": { headers: privateNoStore },
    "/api/threads": { headers: privateNoStore },
    "/api/threads/**": { headers: privateNoStore },
    "/api/memory": { headers: privateNoStore },
    "/api/memory/**": { headers: privateNoStore },
    "/api/connectors": { headers: privateNoStore },
    "/api/slack/**": { headers: privateNoStore },
    "/api/integrations/**": { headers: privateNoStore },
    "/_eve_internal/**": { headers: noStore },
  },
  nitro: {
    compressPublicAssets: true,
    prerender: {
      routes: ["/login"],
      crawlLinks: false,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "Personal Agent Template",
      titleTemplate: "%s",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      meta: [
        {
          name: "description",
          content:
            "A durable personal AI assistant template built with Eve, Nuxt 4, and Better Auth.",
        },
        { name: "theme-color", content: "#1b1718" },
        { name: "color-scheme", content: "light dark" },
        { name: "robots", content: "index, follow" },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico" },
      ],
    },
  },
  hub: {
    db: "sqlite",
  },
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
  },
});
