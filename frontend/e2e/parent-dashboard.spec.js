import { test, expect } from "@playwright/test"
import { mkdirSync } from "node:fs"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("parent can open /dashboard and see their children", async ({ page }) => {
  const email = `e2e-dash-${Date.now()}@example.com`

  await page.goto("/register")
  await page.getByTestId("register-name").fill("Marie")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill("SuperStrong!23")
  await page.getByTestId("register-password-confirm").fill("SuperStrong!23")
  await page.getByTestId("register-submit").click()
  await expect(page).toHaveURL(/\/children/)

  await page.getByTestId("child-name").fill("Léo")
  await page.getByTestId("child-grade").selectOption("P2")
  await page.getByTestId("child-add").click()
  await expect(
    page.getByTestId("children-list").locator("[data-testid^='child-']")
  ).toHaveCount(1)

  await page.getByTestId("go-parent-dashboard").click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole("heading", { name: /espace parent/i })).toBeVisible()

  const list = page.getByTestId("parent-students-list")
  await expect(list.locator("[data-testid^='parent-student-']")).toHaveCount(1)
  await expect(list.getByText("Léo")).toBeVisible()
  await expect(list.getByText(/niveau p2/i)).toBeVisible()

  await page.screenshot({ path: `${SHOTS}/parent-dashboard.png`, fullPage: true })

  await page.getByTestId("go-child-mode").click()
  await expect(page).toHaveURL(/\/children/)
})
