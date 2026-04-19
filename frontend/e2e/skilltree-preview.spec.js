import { test, expect } from "@playwright/test"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { execSync } from "node:child_process"

const SHOTS = "e2e/screenshots"
mkdirSync(SHOTS, { recursive: true })

test("skill tree page renders for a logged-in student", async ({ page }) => {
  const email = `tree-${Date.now()}@example.com`

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
  await expect(page.getByTestId("children-list").locator("[data-testid^='child-']"))
    .toHaveCount(1)
  await page.getByTestId("children-list").locator("button").first().click()
  await expect(page).toHaveURL(/\/$|\/welcome/)

  // Seed mastery if a local docker stack is reachable — harmless if it isn't.
  try {
    const studentId = await page.evaluate(async () => {
      const res = await fetch("/api/auth/user/", { credentials: "include" })
      const data = await res.json()
      return data.children?.[0]?.id
    })
    if (studentId) {
      const script = [
        "import os, sys, django",
        "sys.path.insert(0, '/app')",
        "os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pedagogia.settings.dev')",
        "django.setup()",
        "from apps.students.models import Student, StudentSkillState",
        "from apps.skills.models import Skill",
        "from django.utils import timezone",
        `s = Student.objects.get(id='${studentId}')`,
        "from datetime import timedelta",
        "seeds = {",
        "  # (skill_xp, total_attempts, stale_days)",
        "  'add_avec_retenue_1000': (16.5, 4, 0),",
        "  'soustr_avec_emprunt_1000': (9.0, 2, 0),",
        "  'mult_tables_5': (12.0, 3, 45),  # needs_review: xp<20 + stale>30d",
        "  'mult_tables_2': (30.0, 6, 0),",
        "}",
        "for sid, (xp, att, stale) in seeds.items():",
        "    sk = Skill.objects.filter(id=sid).first()",
        "    if not sk: continue",
        "    row, _ = StudentSkillState.objects.get_or_create(student=s, skill=sk)",
        "    row.skill_xp = xp; row.total_attempts = att",
        "    row.last_practiced_at = timezone.now() - timedelta(days=stale)",
        "    row.save()"
      ].join("\n")
      const repoRoot = process.cwd().replace(/\/frontend$/, "")
      const tmp = `${repoRoot}/.skilltree-seed.py`
      writeFileSync(tmp, script)
      try {
        execSync(
          "docker compose cp .skilltree-seed.py backend:/tmp/seed.py && docker compose exec -T backend uv run python /tmp/seed.py",
          { cwd: repoRoot, shell: "/bin/bash", stdio: "pipe" }
        )
      } finally {
        rmSync(tmp, { force: true })
      }
    }
  } catch {
    // no docker / no backend container — skip seeding silently
  }

  await page.goto("/skill-tree")
  await expect(page.getByRole("heading", { name: /carte des espèces/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /vue d'ensemble/i })).toBeVisible()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${SHOTS}/skilltree-desktop.png`, fullPage: false })

  // Hover an "en cours" skill to see its same-year prereqs light up.
  const inProgress = page.locator(".specimen-croissance").first()
  if (await inProgress.count()) {
    await inProgress.scrollIntoViewIfNeeded()
    await inProgress.hover()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${SHOTS}/skilltree-hover-prereqs.png`, fullPage: false })
  }
})
