import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Input from "../ui/Input"
import Pot from "../ui/Pot"
import { Heading, LatinLabel } from "../ui/Heading"

const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]

function potState(child) {
  const mastery = child.mastery_summary || {}
  if ((mastery.mastered ?? 0) > 0) return "floraison"
  if ((mastery.in_progress ?? 0) > 0) return "croissance"
  if ((mastery.needs_review ?? 0) > 0) return "arroser"
  return "sommeil"
}

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
    <div className="min-h-screen greenhouse">
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <header className="flex items-start justify-between gap-4 mb-10">
          <div>
            <LatinLabel>Horti nostri</LatinLabel>
            <Heading level={2} className="mt-1">
              Bonjour,<br />
              <em className="text-sage-deep not-italic font-display italic">
                {user?.display_name || user?.email}
              </em>
            </Heading>
            <p className="text-stem mt-3">Choisis le carnet de ton jardin.</p>
          </div>
          <button
            onClick={logout}
            data-testid="logout"
            className="text-stem hover:text-bark text-sm cursor-pointer"
          >
            Se déconnecter
          </button>
        </header>

        <section
          data-testid="children-list"
          className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 mb-10"
        >
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              data-testid={`child-${c.id}`}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <Pot
                state={potState(c)}
                className="transition-transform duration-200 group-hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="font-display text-lg text-bark leading-tight">
                    {c.display_name}
                  </div>
                  <LatinLabel className="block mt-0.5 text-[10px] normal-case tracking-wider">
                    Niveau {c.grade}
                  </LatinLabel>
                </div>
              </Pot>
            </button>
          ))}
          {children.length === 0 && (
            <p className="col-span-full latin text-center">
              Aucune plante pour le moment — sème ton premier carnet.
            </p>
          )}
        </section>

        <Card variant="tag" className="p-6 max-w-xl" data-testid="add-child-form">
          <form onSubmit={onAdd} className="space-y-4">
            <div>
              <LatinLabel>Semen novum</LatinLabel>
              <Heading level={4} className="mt-0.5">
                Ajouter un profil
              </Heading>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom"
                className="flex-1"
                data-testid="child-name"
              />
              <Input
                as="select"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="sm:w-28"
                data-testid="child-grade"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Input>
              <Button type="submit" disabled={busy || !name} data-testid="child-add">
                Ajouter
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
