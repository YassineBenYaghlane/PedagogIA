import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { completeSignup } from "./helpers/signup"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("stylet canvas: draw a brouillon, attach it, send → image is in the multipart request", async ({ page, request }) => {
  const email = `e2e-stylet-${Date.now()}@example.com`
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
  await page.getByTestId("child-grade").selectOption("P3")
  await page.getByTestId("child-add").click()
  await page.getByTestId("children-list").locator("[data-testid^='child-']").first().click()
  await expect(page).toHaveURL("/")

  await page.getByTestId("start-training").click()
  await expect(page).toHaveURL(/\/exercise/)
  await expect(page.getByTestId("ask-help-btn")).toBeVisible({ timeout: 10000 })

  await page.getByTestId("ask-help-btn").click()
  await expect(page.getByTestId("chat-stylet-button")).toBeVisible({ timeout: 10000 })

  await page.getByTestId("chat-stylet-button").click()
  const canvas = page.getByTestId("stylet-canvas")
  await expect(canvas).toBeVisible()

  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box.x + 40, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 120, { steps: 12 })
  await page.mouse.move(box.x + 200, box.y + 80, { steps: 12 })
  await page.mouse.up()
  await page.mouse.move(box.x + 60, box.y + 160)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y + 180, { steps: 6 })
  await page.mouse.up()

  await page.screenshot({ path: `${SHOTS}/stylet-canvas-drawn.png`, fullPage: true })

  await page.getByTestId("stylet-commit").click()
  await expect(page.getByTestId("chat-stylet-modal")).toBeHidden()
  await expect(page.getByTestId("chat-scratch-preview")).toBeVisible()

  await page.route(/\/api\/conversations\/.+\/messages\/send\/$/, async (route) => {
    const ndjson =
      JSON.stringify({ type: "chunk", text: "ok" }) +
      "\n" +
      JSON.stringify({
        type: "done",
        message_id: "00000000-0000-0000-0000-000000000000",
        model: "stub",
        speech: "",
      }) +
      "\n"
    await route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: ndjson,
    })
  })

  const reqPromise = page.waitForRequest(/\/api\/conversations\/.+\/messages\/send\/$/)
  await page.getByTestId("chat-input").fill("regarde mon brouillon")
  await page.getByTestId("chat-send").click()

  const req = await reqPromise
  const buf = req.postDataBuffer()
  expect(buf).not.toBeNull()
  const head = buf.toString("utf8", 0, Math.min(buf.length, 4096))
  expect(head).toContain('name="scratch_image"')
  expect(head).toContain('filename="brouillon-stylet.png"')
  expect(head).toContain("Content-Type: image/png")
})
