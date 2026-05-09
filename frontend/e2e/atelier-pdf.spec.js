import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { completeSignup } from "./helpers/signup"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("atelier pdf: navigate, draw on a page, request correction → flattened PNG hits the API", async ({ page, request }) => {
  const email = `e2e-pdf-${Date.now()}@example.com`
  const password = "SuperStrong!23"

  await page.goto("/register")
  await page.getByTestId("register-name").fill("Alice")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill(password)
  await page.getByTestId("register-password-confirm").fill(password)
  await page.getByTestId("register-submit").click()
  await completeSignup(page, request, email, password)
  await expect(page).toHaveURL(/\/children/)

  await page.getByTestId("child-name").fill("Léo")
  await page.getByTestId("child-grade").selectOption("P6")
  await page.getByTestId("child-add").click()
  await page.getByTestId("children-list").locator("[data-testid^='child-']").first().click()
  await expect(page).toHaveURL("/")

  await page.getByTestId("start-pdf").click()
  await expect(page).toHaveURL("/pdf")

  await page.getByTestId("pdf-library-ceb-2024").click()

  await expect(page.getByTestId("pdf-page-label")).toHaveText(/Page 1 \/ \d+/, { timeout: 30000 })
  const pdfCanvas = page.getByTestId("pdf-page-canvas")
  await expect(pdfCanvas).toBeVisible()
  const overlay = page.getByTestId("pdf-stylet-overlay")
  await expect(overlay).toBeVisible({ timeout: 15000 })

  // Skip past the cover page so the screenshot captures actual exam content
  await page.getByTestId("pdf-next").click()
  await page.getByTestId("pdf-next").click()
  await page.getByTestId("pdf-next").click()
  await expect(page.getByTestId("pdf-page-label")).toHaveText(/Page 4 \//, { timeout: 15000 })
  await expect(page.getByTestId("pdf-stylet-overlay")).toBeVisible({ timeout: 15000 })

  const styletCanvas = overlay.getByTestId("stylet-canvas")
  const box = await styletCanvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box.x + 50, box.y + 50)
  await page.mouse.down()
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 12 })
  await page.mouse.up()
  await page.mouse.move(box.x + 80, box.y + 180)
  await page.mouse.down()
  await page.mouse.move(box.x + 220, box.y + 220, { steps: 8 })
  await page.mouse.up()

  await page.screenshot({ path: `${SHOTS}/atelier-pdf-drawn.png`, fullPage: true })

  await page.route("**/api/pdf/correct-page/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        feedback: "1) Bien ! 2) Vérifie ta retenue.",
        model: "stub"
      })
    })
  })

  const reqPromise = page.waitForRequest("**/api/pdf/correct-page/")
  await page.getByTestId("pdf-correct").click()

  const req = await reqPromise
  const buf = req.postDataBuffer()
  expect(buf).not.toBeNull()
  const body = buf.toString("binary")
  expect(body).toContain('name="page_image"')
  expect(body).toContain("Content-Type: image/png")
  expect(body).toContain('name="doc_title"')
  expect(body).toContain("CEB 2024")
  expect(body).toContain('name="page_number"')

  // On lg viewports the chat auto-opens with the correction as the first
  // assistant bubble; on smaller viewports the standalone feedback panel shows
  // the same text. Either surface is acceptable.
  await expect(
    page.getByTestId("pdf-feedback").or(page.getByTestId("pdf-chat-pane"))
  ).toContainText("retenue", { timeout: 10000 })
})
