import { test, expect } from "@playwright/test"

const VIEWPORTS = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 900 },
]

async function signUpAndPickChild(page) {
  const email = `tree-mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  await page.goto("/register")
  await page.getByTestId("register-name").fill("Camille")
  await page.getByTestId("register-email").fill(email)
  await page.getByTestId("register-password").fill("SuperStrong!23")
  await page.getByTestId("register-password-confirm").fill("SuperStrong!23")
  await page.getByTestId("register-submit").click()
  await expect(page).toHaveURL(/\/children/)

  await page.getByTestId("child-name").fill("Noé")
  await page.getByTestId("child-grade").selectOption("P3")
  await page.getByTestId("child-add").click()
  await expect(
    page.getByTestId("children-list").locator("[data-testid^='child-']")
  ).toHaveCount(1)
  await page.getByTestId("children-list").locator("button").first().click()
  await expect(page).toHaveURL(/\/$|\/welcome/)
}

for (const vp of VIEWPORTS) {
  test(`skill tree has no horizontal overflow and header fits at ${vp.name} (${vp.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await signUpAndPickChild(page)

    await page.goto("/skill-tree")
    await expect(page.getByRole("heading", { name: /carte des espèces/i })).toBeVisible()
    await page.waitForTimeout(500)

    const scroll = await page.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scroll.docWidth).toBeLessThanOrEqual(scroll.clientWidth + 1)

    if (vp.width < 640) {
      await expect(page.getByLabel(/filtrer par année/i)).toBeVisible()
    } else {
      await expect(page.getByRole("button", { name: /vue d'ensemble/i })).toBeVisible()
      await expect(page.getByRole("button", { name: /^P3$/ })).toBeVisible()
      await expect(page.getByRole("button", { name: /^P6$/ })).toBeVisible()
    }
  })
}

test("mobile list-view fallback renders skills grouped by grade", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await signUpAndPickChild(page)
  await page.goto("/skill-tree")
  await expect(page.getByRole("heading", { name: /carte des espèces/i })).toBeVisible()

  await expect(page.getByRole("heading", { name: /^P1$/ })).toBeVisible()
  const skillButtons = page.locator("button[data-skill-id]")
  await expect(skillButtons.first()).toBeVisible()
  expect(await skillButtons.count()).toBeGreaterThan(5)

  await skillButtons.first().click()
  await expect(page.getByTestId("skill-detail-panel")).toBeVisible()
})

test("desktop keyboard navigation: arrow keys move focus, Enter opens detail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signUpAndPickChild(page)
  await page.goto("/skill-tree")
  await expect(page.getByRole("heading", { name: /carte des espèces/i })).toBeVisible()
  await page.waitForTimeout(800)

  const flow = page.getByRole("application", { name: /carte interactive/i })
  await flow.click()
  await flow.focus()

  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")

  await expect(page.getByTestId("skill-detail-panel")).toBeVisible()
})
