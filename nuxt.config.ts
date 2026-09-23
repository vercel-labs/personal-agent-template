const privateNoStore = { "cache-control": "private, no-store" } as const;
const noStore = { "cache-control": "no-store" } as const;

export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxt/eslint", "@comark/nuxt", "eve/nuxt", "@nuxthub/core", "@vercel/analytics"],
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
    "/eve/v1/**": { headers: noStore },
  },
  vite: {
    optimizeDeps: {
      include: ["ai"],
    },
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
      title: "WebSandBox",
      titleTemplate: "%s",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      meta: [
        {
          name: "description",
          content:
            "WebSandBox — an AI-first browser workspace for building, previewing, and shipping web projects.",
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

  fonts: {
    families: [
      { name: "Geist", weights: ["100 900"], global: true },
      { name: "Geist Mono", weights: ["100 900"], global: true },
    ],
  },

  hub: {
    db: {
      dialect: "postgresql",
      driver: "postgres-js",
    },
  },
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "",
    },
  },
});
