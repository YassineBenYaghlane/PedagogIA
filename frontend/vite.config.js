import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(() => {
  const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8000"
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          cookieDomainRewrite: "localhost"
        }
      }
    }
  }
})
