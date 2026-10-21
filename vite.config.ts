import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icon.svg",
        "icon-192.png",
        "icon-512.png",
        "data/*.json",
        "images/*.webp",
      ],
      manifest: {
        name: "KabGo — Eat & Explore Kabankalan",
        short_name: "KabGo",
        description:
          "Food, tourist spots and local adventures in Kabankalan City.",
        theme_color: "#f45b2b",
        background_color: "#faf8f4",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          { name: "Eat & drink", url: "/food" },
          { name: "Tourist spots", url: "/attractions" },
          { name: "Ask KabGo", url: "/ask" },
          { name: "Saved places", url: "/saved" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webp,json,woff2}"],
        globIgnores: ["**/ondevice-ai*"],
        maximumFileSizeToCacheInBytes: 4000000,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "kabango-data" },
          },
          {
            urlPattern: /https:\/\/tile\.openstreetmap\.org\//,
            handler: "CacheFirst",
            options: {
              cacheName: "kabango-viewed-tiles",
              expiration: { maxEntries: 150, maxAgeSeconds: 604800 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "image" &&
              url.origin === self.location.origin,
            handler: "CacheFirst",
            options: {
              cacheName: "kabango-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("web-llm") || id.includes("tvmjs"))
            return "ondevice-ai";
          if (id.includes("leaflet")) return "maps";
        },
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts", "worker/**/*.test.ts"],
    environment: "node",
  },
});
