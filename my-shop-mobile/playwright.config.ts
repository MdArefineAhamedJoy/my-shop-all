import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
    baseURL: "http://localhost:8085",
    viewport: { width: 390, height: 844 },
    browserName: "chromium",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec expo start --web --port 8085 --max-workers 2",
    url: "http://localhost:8085",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { CI: "1" },
  },
});
