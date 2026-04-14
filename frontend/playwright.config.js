import { defineConfig, devices } from "@playwright/test"

const jsonOutput = process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || "test-results.json"
const parallel = process.env.E2E_PARALLEL === "1"

// In parallel mode each browser project talks to its own docker stack
// (ports 5174 / 5175 / 5176). Otherwise all three share the dev stack on 5173.
const urlFor = (stackId) =>
  parallel ? `http://localhost:${5173 + stackId}` : "http://localhost:5173"

const config = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: jsonOutput }]
  ],
  use: {
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], baseURL: urlFor(1) } },
    { name: "firefox",  use: { ...devices["Desktop Firefox"], baseURL: urlFor(2) } },
    { name: "webkit",   use: { ...devices["Desktop Safari"],  baseURL: urlFor(3) } }
  ]
}

if (!parallel) {
  config.webServer = {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
}

export default defineConfig(config)
