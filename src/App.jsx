import { Routes, Route, useNavigate } from "react-router"
import { useSessionStore } from "./stores/sessionStore"
import WelcomeScreen from "./components/screens/WelcomeScreen"
import QuestionScreen from "./components/screens/QuestionScreen"
import DiagnosticScreen from "./components/screens/DiagnosticScreen"
import "./App.css"

export default function App() {
  const navigate = useNavigate()
  const store = useSessionStore()

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
      <Route path="/" element={<WelcomeScreen onStart={handleStart} />} />
      <Route path="/quiz" element={
        store.questions[store.currentIndex] ? (
          <QuestionScreen
            key={store.currentIndex}
            question={store.questions[store.currentIndex]}
            index={store.currentIndex}
            total={20}
            onAnswer={handleAnswer}
          />
        ) : null
      } />
      <Route path="/diagnostic" element={
        store.analysis ? (
          <DiagnosticScreen analysis={store.analysis} onRestart={handleRestart} />
        ) : null
      } />
    </Routes>
  )
}
