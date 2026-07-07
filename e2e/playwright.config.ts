import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // run sequentially to avoid shared DB state issues
  retries: 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  use: {
    baseURL: "http://localhost:3000",
    testIdAttribute: "data-test",
    screenshot: "on", // capture screenshot on every step (configured per test)
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
