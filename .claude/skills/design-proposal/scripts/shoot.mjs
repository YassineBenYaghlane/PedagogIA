#!/usr/bin/env node
// Usage: node shoot.mjs <html-file> <output-dir> [--selector <css>]
//
// Auto-discovers every element matching `.preview-frame` in the HTML and
// screenshots each one using its `data-name` attribute as the filename.
// Also captures a full-page overview and a side-by-side strip.
//
// Imports Playwright from the project's frontend/node_modules by default,
// which is the standard install location in PedagogIA.

import { fileURLToPath } from "node:url"
import { dirname, resolve, basename } from "node:path"
import { existsSync } from "node:fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error("usage: node shoot.mjs <html-file> <output-dir> [--selector <css>]")
  process.exit(1)
}
const htmlArg = args[0]
const outDirArg = args[1]
let selector = ".preview-frame"
const selIdx = args.indexOf("--selector")
if (selIdx !== -1 && args[selIdx + 1]) selector = args[selIdx + 1]

const htmlPath = resolve(process.cwd(), htmlArg)
const outDir = resolve(process.cwd(), outDirArg)
if (!existsSync(htmlPath)) {
  console.error(`❌ HTML file not found: ${htmlPath}`)
  process.exit(1)
}

// Try common Playwright install locations.
const playwrightCandidates = [
  resolve(process.cwd(), "frontend/node_modules/@playwright/test/index.mjs"),
  resolve(process.cwd(), "node_modules/@playwright/test/index.mjs"),
  "/Users/" + process.env.USER + "/PedagogIA/frontend/node_modules/@playwright/test/index.mjs",
]
const playwrightPath = playwrightCandidates.find(existsSync)
if (!playwrightPath) {
  console.error("❌ Playwright not found. Install it: cd frontend && npm install")
  console.error("   Tried:\n   - " + playwrightCandidates.join("\n   - "))
  process.exit(1)
}
const { chromium } = await import(playwrightPath)

console.log(`→ Loading ${basename(htmlPath)}`)
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()
await page.goto("file://" + htmlPath, { waitUntil: "networkidle" })
await page.waitForTimeout(700)

// Discover frames via DOM.
const frames = await page.$$eval(selector, (els) =>
  els.map((el, i) => ({
    name: el.dataset.name || el.id || `frame-${String(i + 1).padStart(2, "0")}`,
    id: el.id || null,
  }))
)

if (frames.length === 0) {
  console.error(`❌ No elements match "${selector}". Did you add class="preview-frame" to your frame wrappers?`)
  await browser.close()
  process.exit(1)
}

console.log(`→ Found ${frames.length} frame(s): ${frames.map((f) => f.name).join(", ")}`)

// Reset any CSS transforms on device elements so screenshots capture 1:1 size,
// and hide sticky/fixed chrome (nav bars, banners) that would otherwise bleed
// into element screenshots.
await page.addStyleTag({
  content: `
    .tablet, .browser, .phone { transform: none !important; margin: 0 !important; }
    nav, header, [class*="sticky"], [class*="fixed"] { position: static !important; }
  `,
})

const deviceSelector = ".tablet, .browser, .phone"

for (let i = 0; i < frames.length; i++) {
  const f = frames[i]
  const wrapper = page.locator(selector).nth(i)
  await wrapper.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  // Prefer the inner device frame if present, else screenshot the wrapper.
  const device = wrapper.locator(deviceSelector).first()
  const target = (await device.count()) > 0 ? device : wrapper
  await target.screenshot({ path: resolve(outDir, `${f.name}.png`) })
  console.log(`  ✓ ${f.name}.png`)
}

// Full-page overview.
await page.setViewportSize({ width: 1600, height: 4200 })
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(outDir, "00-overview.png"), fullPage: true })
console.log(`  ✓ 00-overview.png`)

// Side-by-side strip: stretch the grid to a single row.
await page.setViewportSize({ width: Math.max(400 * frames.length, 2200), height: 1400 })
await page.evaluate((n) => {
  const main = document.querySelector("main")
  if (!main) return
  main.style.gridTemplateColumns = `repeat(${n}, max-content)`
  main.style.gap = "40px"
  main.style.maxWidth = "none"
  main.style.paddingLeft = "40px"
  main.style.paddingRight = "40px"
}, frames.length)
await page.waitForTimeout(500)
const main = page.locator("main")
if ((await main.count()) > 0) {
  await main.screenshot({ path: resolve(outDir, "99-strip.png") })
  console.log(`  ✓ 99-strip.png`)
}

await browser.close()
console.log(`\n✔ Done → ${outDir}`)
