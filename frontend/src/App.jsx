import { useEffect } from "react"
import { Routes, Route, useNavigate, Navigate, useLocation, useParams } from "react-router"
import { useAuthStore } from "./stores/authStore"
import WelcomeScreen from "./components/screens/WelcomeScreen"
import LandingScreen from "./components/screens/LandingScreen"
import ExerciseScreen from "./components/screens/ExerciseScreen"
import SkillTreeScreen from "./components/screens/SkillTreeScreen"
import LoginScreen from "./components/screens/LoginScreen"
import RegisterScreen from "./components/screens/RegisterScreen"
import GoogleCallbackScreen from "./components/screens/GoogleCallbackScreen"
import ChildPickerScreen from "./components/screens/ChildPickerScreen"
import DiagnosticScreen from "./components/screens/DiagnosticScreen"
import DrillScreen from "./components/screens/DrillScreen"
import ExamScreen from "./components/screens/ExamScreen"
import ProfileScreen from "./components/screens/ProfileScreen"
import DebugInputsScreen from "./components/screens/DebugInputsScreen"
import DebugPlantsScreen from "./components/screens/DebugPlantsScreen"
import AtelierScreen from "./components/screens/AtelierScreen"
import AtelierSkillScreen from "./components/screens/AtelierSkillScreen"
import NotFoundScreen from "./components/screens/NotFoundScreen"
import HistoryScreen from "./components/screens/HistoryScreen"
import DiagnosticReviewScreen from "./components/screens/DiagnosticReviewScreen"
import SessionReviewScreen from "./components/screens/SessionReviewScreen"
import ParentDashboardScreen from "./components/screens/ParentDashboardScreen"
import ParametresScreen from "./components/screens/ParametresScreen"
import BadgeToast from "./components/badges/BadgeToast"
import Loader from "./components/ui/Loader"
import "./App.css"

function BootLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-chalk">
      <Loader message="Chargement…" size="lg" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()
  if (loading && !user) return <BootLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function RootRoute() {
  const { user, loading } = useAuthStore()
  if (loading && !user) return <BootLoader />
  return user ? <WelcomeScreen /> : <LandingScreen />
}

function AtelierSkillScreenKeyed() {
  const { skillId } = useParams()
  return <AtelierSkillScreen key={skillId} />
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
        <Route path="/dashboard" element={<RequireAuth><ParentDashboardScreen /></RequireAuth>} />
        <Route path="/parametres" element={<RequireAuth><ParametresScreen /></RequireAuth>} />
        <Route path="/" element={<RootRoute />} />
        <Route path="/exercise" element={<RequireAuth><ExerciseScreen /></RequireAuth>} />
        <Route path="/diagnostic" element={<RequireAuth><DiagnosticScreen /></RequireAuth>} />
        <Route path="/drill" element={<RequireAuth><DrillScreen /></RequireAuth>} />
        <Route path="/exam" element={<RequireAuth><ExamScreen /></RequireAuth>} />
        <Route path="/skill-tree" element={<RequireAuth><SkillTreeScreen /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><HistoryScreen /></RequireAuth>} />
        <Route path="/history/diagnostic/:sessionId" element={<RequireAuth><DiagnosticReviewScreen /></RequireAuth>} />
        <Route path="/history/session/:sessionId" element={<RequireAuth><SessionReviewScreen /></RequireAuth>} />
        {import.meta.env.VITE_ENVIRONMENT === "dev" && (
          <Route path="/debug/inputs" element={<RequireAuth><DebugInputsScreen /></RequireAuth>} />
        )}
        {import.meta.env.VITE_ENVIRONMENT === "dev" && (
          <Route path="/debug/plants" element={<RequireAuth><DebugPlantsScreen /></RequireAuth>} />
        )}
        {import.meta.env.VITE_ENVIRONMENT === "dev" && (
          <Route path="/atelier" element={<RequireAuth><AtelierScreen /></RequireAuth>} />
        )}
        {import.meta.env.VITE_ENVIRONMENT === "dev" && (
          <Route
            path="/atelier/skill/:skillId"
            element={<RequireAuth><AtelierSkillScreenKeyed /></RequireAuth>}
          />
        )}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </>
  )
}
