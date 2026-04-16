import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@fontsource/fraunces/400.css"
import "@fontsource/fraunces/500.css"
import "@fontsource/fraunces/600.css"
import "@fontsource/fraunces/400-italic.css"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "@fontsource/jetbrains-mono/500.css"
import "./index.css"
import App from "./App.jsx"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
