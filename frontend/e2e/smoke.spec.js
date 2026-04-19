import { test, expect } from "@playwright/test"

test("unauthenticated user sees landing and can navigate to login", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL("/")
  await expect(page.getByRole("heading", { name: /cultiver les maths/i })).toBeVisible()
  await page.getByRole("button", { name: /J'ai déjà un compte/i }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible()
})
