import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("full auth + child flow", async ({ page, request }) => {
  await page.goto("/login")
  await expect(page).toHaveURL(/\/login/)
  await page.screenshot({ path: `${SHOTS}/01-login.png`, fullPage: true })

  await page.getByRole("link", { name: /créer un compte/i }).click()
  await expect(page).toHaveURL(/\/register/)
  await page.screenshot({ path: `${SHOTS}/02-register.png`, fullPage: true })

  const email = `e2e-${Date.now()}@example.com`
  await page.getByTestId("register-name").fill("Alice")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill("SuperStrong!23")
  await page.getByTestId("register-password-confirm").fill("SuperStrong!23")
  await page.getByTestId("register-submit").click()

  await expect(page.getByTestId("register-confirmation")).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/03-register-confirmation.png`, fullPage: true })

  // Pull the verification key from the dev-only endpoint and POST it like the
  // user would after clicking the email link.
  const keyRes = await request.get(
    `/api/auth/dev/latest-verification-key/?email=${encodeURIComponent(email)}`
  )
  expect(keyRes.ok(), `failed to fetch verification key: ${keyRes.status()}`).toBeTruthy()
  const { key } = await keyRes.json()

  await page.goto(`/auth/verify/${key}`)
  await expect(page.getByTestId("verify-success")).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/04-verify-success.png`, fullPage: true })

  await page.getByTestId("verify-go-login").click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByTestId("login-email").fill(email)
  await page.getByTestId("login-password").fill("SuperStrong!23")
  await page.getByTestId("login-submit").click()

  await expect(page).toHaveURL(/\/children/)
  await expect(page.getByTestId("add-child-form")).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/05-children-empty.png`, fullPage: true })

  await page.getByTestId("child-name").fill("Léo")
  await page.getByTestId("child-grade").selectOption("P3")
  await page.getByTestId("child-add").click()

  await expect(page.getByTestId("children-list").locator("[data-testid^='child-']")).toHaveCount(1)
  await page.screenshot({ path: `${SHOTS}/06-children-one.png`, fullPage: true })

  await page.getByTestId("logout").click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByTestId("login-email").fill(email)
  await page.getByTestId("login-password").fill("SuperStrong!23")
  await page.getByTestId("login-submit").click()
  await expect(page).toHaveURL(/\/children/)
  await expect(page.getByTestId("add-child-form")).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/07-after-relogin.png`, fullPage: true })
})
