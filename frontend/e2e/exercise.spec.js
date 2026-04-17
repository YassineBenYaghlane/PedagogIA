import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("training flow: register → home → exercise → wrong → feedback → stop", async ({ page }) => {
  const email = `e2e-ex-${Date.now()}@example.com`
  const password = "SuperStrong!23"

  await page.goto("/register")
  await page.getByTestId("register-name").fill("Alice")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill(password)
  await page.getByTestId("register-submit").click()
  await expect(page).toHaveURL(/\/children/)

  await page.getByTestId("child-name").fill("Léo")
  await page.getByTestId("child-grade").selectOption("P3")
  await page.getByTestId("child-add").click()
  await expect(page.getByTestId("children-list").locator("[data-testid^='child-']")).toHaveCount(1)

  await page.getByTestId("children-list").locator("[data-testid^='child-']").first().click()
  await expect(page).toHaveURL("/")
  await page.screenshot({ path: `${SHOTS}/06-home-hub.png`, fullPage: true })

  await expect(page.getByTestId("start-training")).toBeVisible()
  await page.getByTestId("start-training").click()
  await expect(page).toHaveURL(/\/exercise/)

  await expect(page.getByTestId("number-pad")).toBeVisible({ timeout: 10000 })
  await page.screenshot({ path: `${SHOTS}/07-exercise-loaded.png`, fullPage: true })

  for (const d of "99999") await page.getByTestId(`number-pad-key-${d}`).click()
  await page.getByTestId("number-pad-submit").click()

  await expect(page.getByText(/pas tout à fait/i).first()).toBeVisible({ timeout: 15000 })
  await page.screenshot({ path: `${SHOTS}/08-feedback.png`, fullPage: true })

  await page.getByRole("button", { name: /arrêter/i }).click()
  await expect(page).toHaveURL("/")
  await page.screenshot({ path: `${SHOTS}/09-home-after.png`, fullPage: true })
})
