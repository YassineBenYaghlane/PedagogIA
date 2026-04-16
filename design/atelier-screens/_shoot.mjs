import { chromium } from "/Users/yassinebenyaghlane/PedagogIA/frontend/node_modules/@playwright/test/index.mjs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const htmlPath = resolve(__dirname, "..", "ATELIER.html")
const outDir = __dirname

const frames = [
  { id: "s-accueil",     name: "01-accueil" },
  { id: "s-carnets",     name: "02-carnets" },
  { id: "s-carte",       name: "03-carte" },
  { id: "s-fiche",       name: "04-fiche" },
  { id: "s-marges",      name: "05-marges" },
  { id: "s-carnet-bord", name: "06-carnet-de-bord" },
  { id: "s-rang",        name: "07-rang-acquis" },
]

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()
await page.goto("file://" + htmlPath, { waitUntil: "networkidle" })
await page.waitForTimeout(600)

for (const f of frames) {
  const phone = page.locator(`#${f.id} .phone`).first()
  await phone.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await phone.screenshot({ path: resolve(outDir, `${f.name}.png`), omitBackground: false })
  console.log("✓", f.name)
}

// overview — all 7 phones in a grid
await page.setViewportSize({ width: 1600, height: 3800 })
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(outDir, "00-overview.png"), fullPage: true })
console.log("✓ 00-overview")

// wide strip — phones side-by-side in rendering order
await page.setViewportSize({ width: 2800, height: 900 })
await page.evaluate(() => {
  const main = document.querySelector("main")
  main.style.gridTemplateColumns = "repeat(7, max-content)"
  main.style.gap = "32px"
  main.style.maxWidth = "none"
  main.style.paddingLeft = "40px"
  main.style.paddingRight = "40px"
})
await page.waitForTimeout(400)
await page.locator("main").screenshot({ path: resolve(outDir, "08-strip.png") })
console.log("✓ 08-strip")

await browser.close()
console.log("\nDone →", outDir)
