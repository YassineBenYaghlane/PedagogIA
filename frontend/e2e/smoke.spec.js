import { test, expect } from "@playwright/test"

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible()
})
