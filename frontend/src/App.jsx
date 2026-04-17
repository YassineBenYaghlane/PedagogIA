import { useEffect } from "react"
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router"
import { useAuthStore } from "./stores/authStore"
import WelcomeScreen from "./components/screens/WelcomeScreen"
import ExerciseScreen from "./components/screens/ExerciseScreen"
import SkillTreeScreen from "./components/screens/SkillTreeScreen"
import LoginScreen from "./components/screens/LoginScreen"
import RegisterScreen from "./components/screens/RegisterScreen"
import GoogleCallbackScreen from "./components/screens/GoogleCallbackScreen"
import ChildPickerScreen from "./components/screens/ChildPickerScreen"
import DiagnosticScreen from "./components/screens/DiagnosticScreen"
import DrillScreen from "./components/screens/DrillScreen"
import ProfileScreen from "./components/screens/ProfileScreen"
import DebugInputsScreen from "./components/screens/DebugInputsScreen"
import HistoryScreen from "./components/screens/HistoryScreen"
import DiagnosticReviewScreen from "./components/screens/DiagnosticReviewScreen"
import BadgeToast from "./components/badges/BadgeToast"
import "./App.css"

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()
  if (loading) return <div className="p-8 text-center">Chargement…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default function App() {
  const navigate = useNavigate()
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
    const onUnauth = () => navigate("/login")
    window.addEventListener("auth:unauthorized", onUnauth)
    return () => window.removeEventListener("auth:unauthorized", onUnauth)
  }, [bootstrap, navigate])

  return (
    <>
      <BadgeToast />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackScreen />} />
        <Route path="/children" element={<RequireAuth><ChildPickerScreen /></RequireAuth>} />
        <Route path="/" element={<RequireAuth><WelcomeScreen /></RequireAuth>} />
        <Route path="/exercise" element={<RequireAuth><ExerciseScreen /></RequireAuth>} />
        <Route path="/diagnostic" element={<RequireAuth><DiagnosticScreen /></RequireAuth>} />
        <Route path="/drill" element={<RequireAuth><DrillScreen /></RequireAuth>} />
        <Route path="/skill-tree" element={<RequireAuth><SkillTreeScreen /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><HistoryScreen /></RequireAuth>} />
        <Route path="/history/diagnostic/:sessionId" element={<RequireAuth><DiagnosticReviewScreen /></RequireAuth>} />
        <Route path="/debug/inputs" element={<RequireAuth><DebugInputsScreen /></RequireAuth>} />
      </Routes>
    </>
  )
}
