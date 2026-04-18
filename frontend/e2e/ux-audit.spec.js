import { test, expect } from "@playwright/test"

test("login inputs are ≥16px at 375px so iOS never auto-zooms on focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/login")

  for (const tid of ["login-email", "login-password"]) {
    const fontSize = await page
      .getByTestId(tid)
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(fontSize).toBeGreaterThanOrEqual(16)
  }
})

test("register inputs are ≥16px at 375px and have autocomplete + inputmode", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/register")

  const fields = [
    { tid: "register-email", autoComplete: "email", inputMode: "email" },
    { tid: "register-password", autoComplete: "new-password" },
    { tid: "register-password-confirm", autoComplete: "new-password" },
  ]
  for (const f of fields) {
    const input = page.getByTestId(f.tid)
    const fontSize = await input.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    )
    expect(fontSize).toBeGreaterThanOrEqual(16)
    await expect(input).toHaveAttribute("autocomplete", f.autoComplete)
    if (f.inputMode) await expect(input).toHaveAttribute("inputmode", f.inputMode)
  }
})

test("register: confirm-password mismatch disables submit and shows a message", async ({ page }) => {
  await page.goto("/register")

  await page.getByTestId("register-email").fill(`mismatch-${Date.now()}@example.com`)
  await page.getByTestId("register-password").fill("SuperStrong!23")
  await page.getByTestId("register-password-confirm").fill("SuperStrong!ZZ")

  await expect(page.getByTestId("register-password-mismatch")).toBeVisible()
  await expect(page.getByTestId("register-submit")).toBeDisabled()

  await page.getByTestId("register-password-confirm").fill("SuperStrong!23")
  await expect(page.getByTestId("register-password-mismatch")).toHaveCount(0)
  await expect(page.getByTestId("register-submit")).toBeEnabled()
})

test("login error is announced with aria-live=polite", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/login")

  await page.getByTestId("login-email").fill(`nobody-${Date.now()}@example.com`)
  await page.getByTestId("login-password").fill("WrongPassword!1")
  await page.getByTestId("login-submit").click()

  const err = page.getByTestId("login-error")
  await expect(err).toBeVisible({ timeout: 10000 })
  await expect(err).toHaveAttribute("aria-live", "polite")
})
