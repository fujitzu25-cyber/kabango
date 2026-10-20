import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: process.env.TEST_URL ?? "http://localhost:4173",
    ...devices["Desktop Chrome"],
    channel: process.platform === "win32" ? "msedge" : undefined,
    serviceWorkers: "allow",
  },
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1",
        port: 4173,
        reuseExistingServer: true,
      },
  projects: [{ name: "chromium" }],
});
