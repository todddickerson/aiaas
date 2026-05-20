import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

const RUN_VISUAL = !!process.env.CI || process.env.PLAYWRIGHT_VISUAL === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: RUN_VISUAL ? [] : ["**/visual.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  expect: {
    toHaveScreenshot: {
      // Default Playwright threshold is too strict for sub-pixel rendering
      // differences across machines; 0.2 gives us drift-detection without
      // false alarms.
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: "pnpm exec next start --port " + PORT,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Keep the mock runtime snappy in CI so the runs spec doesn't wait
      // 5 seconds per happy-path. Production still uses the 5s default.
      MOCK_RUNTIME_DELAY_MS: process.env.MOCK_RUNTIME_DELAY_MS ?? "200",
    },
  },
});
