import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"

const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]

export default function ChildPickerScreen() {
  const { user, children, addChild, selectChild, logout } = useAuthStore()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("P3")
  const [busy, setBusy] = useState(false)

  const onAdd = async (e) => {
    e.preventDefault()
    if (!name) return
    setBusy(true)
    try {
      await addChild(name, grade)
      setName("")
    } finally {
      setBusy(false)
    }
  }

  const onSelect = (id) => {
    selectChild(id)
    navigate("/")
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bonjour {user?.display_name || user?.email}</h1>
            <p className="text-sm text-slate-600">Choisis un profil pour commencer</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-600 hover:text-slate-900" data-testid="logout">
            Se déconnecter
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2" data-testid="children-list">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="bg-white rounded-2xl p-5 shadow-lg text-left hover:scale-[1.02] transition-transform"
              data-testid={`child-${c.id}`}
            >
              <div className="text-lg font-semibold text-slate-900">{c.display_name}</div>
              <div className="text-sm text-slate-600">Niveau {c.grade}</div>
            </button>
          ))}
          {children.length === 0 && (
            <p className="text-slate-600 italic sm:col-span-2">Aucun profil pour le moment.</p>
          )}
        </section>

        <form onSubmit={onAdd} className="bg-white rounded-2xl p-6 shadow-lg space-y-3" data-testid="add-child-form">
          <h2 className="font-semibold text-slate-900">Ajouter un profil</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
              data-testid="child-name"
            />
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
              data-testid="child-grade"
            >
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              type="submit"
              disabled={busy || !name}
              className="rounded-lg bg-blue-600 text-white font-semibold px-4 py-2 disabled:opacity-50"
              data-testid="child-add"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
