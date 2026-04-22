import { test, expect } from "@playwright/test"

test("CEB inputs: binary_equality and mcq_multi render in debug inputs screen", async ({ page }) => {
  const email = `e2e-ceb-${Date.now()}@example.com`
  const password = "SuperStrong!23"

  await page.goto("/register")
  await page.getByTestId("register-name").fill("CEB")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill(password)
  await page.getByTestId("register-password-confirm").fill(password)
  await page.getByTestId("register-submit").click()
  await expect(page).toHaveURL(/\/children/)

  await page.getByTestId("child-name").fill("Élève")
  await page.getByTestId("child-grade").selectOption("P6")
  await page.getByTestId("child-add").click()
  await page.getByTestId("children-list").locator("[data-testid^='child-']").first().click()
  await expect(page).toHaveURL("/")

  await page.goto("/debug/inputs")

  await expect(page.getByTestId("binary-equality-input")).toBeVisible({ timeout: 15000 })
  const eqButton = page.getByTestId("binary-equality-input").locator("button[data-value='=']")
  const neqButton = page.getByTestId("binary-equality-input").locator("button[data-value='≠']")
  await expect(eqButton).toBeVisible()
  await expect(neqButton).toBeVisible()

  await expect(page.getByTestId("mcq-multi-input")).toBeVisible()
  const mcqButtons = page.getByTestId("mcq-multi-input").locator("button[data-value]")
  await expect(mcqButtons.first()).toBeVisible()
  const submitBtn = page.getByTestId("mcq-multi-submit")
  await expect(submitBtn).toBeDisabled()

  await mcqButtons.nth(0).click()
  await expect(submitBtn).toBeEnabled()
  await mcqButtons.nth(0).click()
  await expect(submitBtn).toBeDisabled()
})
