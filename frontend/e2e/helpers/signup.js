// Walks the verification flow after the user clicks register-submit:
// pulls the key from the dev-only endpoint, hits /auth/verify/:key, then
// UI-logs in. Keeps the existing specs faithful to the user-facing journey
// without each one having to re-implement the dance.
export async function completeSignup(page, request, email, password) {
  await page.getByTestId("register-confirmation").waitFor()
  const res = await request.get(
    `/api/auth/dev/latest-verification-key/?email=${encodeURIComponent(email)}`
  )
  if (!res.ok()) {
    throw new Error(`failed to fetch verification key: HTTP ${res.status()}`)
  }
  const { key } = await res.json()
  await page.goto(`/auth/verify/${key}`)
  await page.getByTestId("verify-go-login").click()
  await page.getByTestId("login-email").fill(email)
  await page.getByTestId("login-password").fill(password)
  await page.getByTestId("login-submit").click()
}
