const { defineConfig, devices } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 10000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/results.json" }],
    ["html", { outputFolder: "artifacts/html", open: "never" }]
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  outputDir: "test-results",
  webServer: [
    {
      command: "npm --prefix ../client run preview -- --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173/",
      reuseExistingServer: !process.env.CI,
      timeout: 90000
    },
    {
      // Local Lab UI only: no provider credentials or live state-changing tests.
      command: "node ../testpilot-lab/server.js",
      url: "http://127.0.0.1:4188/healthz",
      env: { PORT: "4188", AI_PROVIDER: "gemini", GEMINI_API_KEY: "", LAB_ACCESS_CODE: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  ]
});
