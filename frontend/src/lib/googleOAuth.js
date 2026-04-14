const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

export function startGoogleLogin() {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_OAUTH_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account"
  })
  window.location.assign(`${AUTH_URL}?${params.toString()}`)
}
