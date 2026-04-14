import { useEffect } from "react"
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router"
import { useSessionStore } from "./stores/sessionStore"
import { useAuthStore } from "./stores/authStore"
import WelcomeScreen from "./components/screens/WelcomeScreen"
import QuestionScreen from "./components/screens/QuestionScreen"
import DiagnosticScreen from "./components/screens/DiagnosticScreen"
import SkillTreeScreen from "./components/screens/SkillTreeScreen"
import LoginScreen from "./components/screens/LoginScreen"
import RegisterScreen from "./components/screens/RegisterScreen"
import ChildPickerScreen from "./components/screens/ChildPickerScreen"
import "./App.css"

function RequireAuth({ children }) {
  const { parent, loading } = useAuthStore()
  const location = useLocation()
  if (loading) return <div className="p-8 text-center">Chargement…</div>
  if (!parent) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default function App() {
  const navigate = useNavigate()
  const store = useSessionStore()
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
    const onUnauth = () => navigate("/login")
    window.addEventListener("auth:unauthorized", onUnauth)
    return () => window.removeEventListener("auth:unauthorized", onUnauth)
  }, [bootstrap, navigate])

  const handleStart = () => {
    store.startTest()
    navigate("/quiz")
  }

  const handleAnswer = (isCorrect) => {
    const { finished } = store.handleAnswer(isCorrect)
    if (finished) navigate("/diagnostic")
  }

  const handleRestart = () => {
    store.reset()
    navigate("/")
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/children" element={<RequireAuth><ChildPickerScreen /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><WelcomeScreen onStart={handleStart} /></RequireAuth>} />
      <Route path="/quiz" element={
        <RequireAuth>
          {store.questions[store.currentIndex] ? (
            <QuestionScreen
              key={store.currentIndex}
              question={store.questions[store.currentIndex]}
              index={store.currentIndex}
              total={20}
              onAnswer={handleAnswer}
            />
          ) : null}
        </RequireAuth>
      } />
      <Route path="/diagnostic" element={
        <RequireAuth>
          {store.analysis ? (
            <DiagnosticScreen analysis={store.analysis} onRestart={handleRestart} />
          ) : null}
        </RequireAuth>
      } />
      <Route path="/skill-tree" element={<RequireAuth><SkillTreeScreen /></RequireAuth>} />
    </Routes>
  )
}
