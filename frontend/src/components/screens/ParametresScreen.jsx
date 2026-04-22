import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useAuthStore } from "../../stores/authStore"
import { captureException, isClientError } from "../../lib/errors"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Icon from "../ui/Icon"
import Input from "../ui/Input"
import { Heading } from "../ui/Heading"

const GRADES = ["P1", "P2", "P3", "P4", "P5", "P6"]
const SAVE_DELAY = 650

function parseFieldError(err, key) {
  const data = err?.data
  if (!data) return "Une erreur est survenue."
  if (Array.isArray(data[key])) return data[key][0]
  if (typeof data === "string") return data
  return "Une erreur est survenue."
}

function StatusDot({ state }) {
  const map = {
    idle: "bg-transparent",
    saving: "bg-sky animate-pulse",
    saved: "bg-sage-deep",
    error: "bg-rose"
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-200 ${map[state]}`}
    />
  )
}

function AutosaveField({
  label,
  hint,
  value,
  type = "text",
  placeholder,
  onSave,
  validate,
  testid
}) {
  const [draft, setDraft] = useState(null)
  const [state, setState] = useState("idle")
  const [error, setError] = useState(null)
  const timer = useRef(null)
  const shown = draft ?? value ?? ""

  const commit = async (next) => {
    if (next === (value ?? "")) {
      setDraft(null)
      setState("idle")
      return
    }
    const vErr = validate?.(next)
    if (vErr) {
      setState("error")
      setError(vErr)
      return
    }
    setState("saving")
    setError(null)
    try {
      await onSave(next)
      setDraft(null)
      setState("saved")
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1400)
    } catch (err) {
      setState("error")
      setError(parseFieldError(err, label.toLowerCase()))
      if (!isClientError(err)) captureException(err, { where: "AutosaveField.commit", label })
    }
  }

  const onChange = (e) => {
    const next = e.target.value
    setDraft(next)
    setState("idle")
    setError(null)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(next), SAVE_DELAY)
  }

  const onBlur = () => {
    clearTimeout(timer.current)
    commit(shown)
  }

  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm">
        <span className="text-stem">{hint}</span>
        <StatusDot state={state} />
      </span>
      <Input
        type={type}
        value={shown}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        className="mt-1"
        data-testid={testid}
      />
      {error && <p className="text-xs text-rose mt-1.5">{error}</p>}
    </label>
  )
}

function PasswordDrawer() {
  const { changePassword } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [state, setState] = useState("idle")
  const [error, setError] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8) return setError("Minimum 8 caractères.")
    if (next !== confirm) return setError("Les deux mots de passe ne correspondent pas.")
    setState("saving")
    try {
      await changePassword({ oldPassword: cur, newPassword: next })
      setState("saved")
      setCur(""); setNext(""); setConfirm("")
      setTimeout(() => { setOpen(false); setState("idle") }, 900)
    } catch (err) {
      setState("error")
      const data = err?.data
      if (data?.old_password) setError("Mot de passe actuel incorrect.")
      else if (data?.new_password2) setError(data.new_password2[0])
      else if (data?.new_password1) setError(data.new_password1[0])
      else {
        setError("Impossible de modifier le mot de passe.")
        if (!isClientError(err)) captureException(err, { where: "ParametresScreen.password" })
      }
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="password-toggle"
        className="text-sm text-sage-deep hover:text-bark cursor-pointer inline-flex items-center gap-1.5 transition-colors"
      >
        <Icon name={open ? "arrow_back" : "leaf"} size={14} />
        {open ? "Replier" : "Changer mon mot de passe"}
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0 }}
      >
        <form onSubmit={onSubmit} className="mt-4 space-y-3" data-testid="password-form">
          <label className="block">
            <span className="text-stem text-sm">mot de passe actuel</span>
            <Input
              type="password"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
              required
              className="mt-1"
              data-testid="password-current"
            />
          </label>
          <label className="block">
            <span className="text-stem text-sm">nouveau mot de passe</span>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              className="mt-1"
              data-testid="password-new"
            />
          </label>
          <label className="block">
            <span className="text-stem text-sm">confirmer</span>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-1"
              data-testid="password-confirm"
            />
          </label>
          {error && (
            <p className="text-sm text-rose px-3 py-2 rounded-lg bg-rose-soft/60">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={state === "saving"}
              data-testid="password-submit"
            >
              {state === "saving" ? "Enregistrement…" : state === "saved" ? "✓ Enregistré" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChildRow({ child, index }) {
  const { updateChild, removeChild } = useAuthStore()
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)

  const save = async (patch) => updateChild(child.id, patch)

  const initial = (child.display_name || "?").trim().charAt(0).toUpperCase()

  const onDelete = async () => {
    setRemoving(true)
    try {
      await removeChild(child.id)
    } catch (err) {
      captureException(err, { where: "ChildRow.onDelete", childId: child.id })
      setRemoving(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="specimen p-4 md:p-5 transition-all duration-300"
      style={{
        animation: "pavillon-rise 400ms ease-out both",
        animationDelay: `${index * 80}ms`
      }}
      data-testid={`child-row-${child.id}`}
    >
      {!confirming && (
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full bg-sage-leaf/60 flex items-center justify-center font-display italic text-sage-deep text-xl shrink-0"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3">
            <AutosaveField
              label="Nom"
              hint="prénom"
              value={child.display_name}
              onSave={(v) => save({ display_name: v })}
              validate={(v) => (!v.trim() ? "Un prénom est requis." : null)}
              testid={`child-name-${child.id}`}
            />
            <label className="block">
              <span className="text-stem text-sm">niveau</span>
              <Input
                as="select"
                value={child.grade}
                onChange={(e) => save({ grade: e.target.value })}
                className="mt-1"
                data-testid={`child-grade-${child.id}`}
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Input>
            </label>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-mono text-xs text-stem tabular-nums">
              {child.xp ?? 0} xp
            </span>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Supprimer ${child.display_name}`}
              data-testid={`child-delete-${child.id}`}
              className="text-stem hover:text-rose cursor-pointer text-xs inline-flex items-center gap-1 transition-colors"
            >
              <Icon name="trash" size={12} />
              Supprimer
            </button>
          </div>
        </div>
      )}
      {confirming && (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 bg-rose-soft/50 -m-4 md:-m-5 p-4 md:p-5 rounded-xl"
          data-testid={`child-confirm-${child.id}`}
        >
          <div className="flex-1">
            <p className="font-display italic text-bark">
              Supprimer {child.display_name} ?
            </p>
            <p className="text-xs text-stem mt-0.5">
              Cette action est définitive — toute sa progression sera effacée.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={removing}
            >
              Annuler
            </Button>
            <button
              type="button"
              onClick={onDelete}
              disabled={removing}
              data-testid={`child-confirm-delete-${child.id}`}
              className="pill text-sm px-4 py-2 disabled:opacity-60"
              style={{ background: "var(--color-rose)", color: "#6b2a26" }}
            >
              {removing ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddChildGhost() {
  const { addChild } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("P3")
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await addChild(name.trim(), grade)
      setName("")
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="add-child-open"
        className="w-full rounded-2xl border border-dashed border-sage/40 py-5 text-sage-deep hover:bg-sage-leaf/20 hover:border-sage cursor-pointer transition-colors font-display italic"
      >
        + nouvelle jardinière
      </button>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="specimen p-4 md:p-5 flex flex-col sm:flex-row gap-3"
      data-testid="add-child-form"
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Prénom"
        className="flex-1"
        data-testid="add-child-name"
      />
      <Input
        as="select"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        className="sm:w-24"
        data-testid="add-child-grade"
      >
        {GRADES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </Input>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !name.trim()} data-testid="add-child-submit">
          {busy ? "…" : "Ajouter"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
          Annuler
        </Button>
      </div>
    </form>
  )
}

export default function ParametresScreen() {
  const navigate = useNavigate()
  const { user, children, updateUser } = useAuthStore()

  return (
    <div className="min-h-screen greenhouse">
      <style>{`@keyframes pavillon-rise {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        [style*="pavillon-rise"] { animation: none !important; }
      }`}</style>
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <header className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="text-stem hover:text-bark flex items-center gap-1.5 cursor-pointer text-sm"
            data-testid="parametres-back"
          >
            <Icon name="arrow_back" size={16} /> Retour
          </button>
        </header>

        <div className="mb-10">
          <Heading level={2}>Paramètres</Heading>
          <p className="text-stem mt-2 text-sm">
            Ton compte, tes jardinières — tout se règle ici.
          </p>
        </div>

        <section className="mb-12" data-testid="section-account">
          <Heading level={4} className="mb-4">Mon carnet</Heading>
          <Card variant="tag" className="p-6 space-y-5">
            <AutosaveField
              label="Nom"
              hint="prénom"
              value={user?.display_name || ""}
              onSave={(v) => updateUser({ display_name: v })}
              testid="account-display-name"
              placeholder="Ton prénom"
            />
            <AutosaveField
              label="Email"
              hint="courriel"
              type="email"
              value={user?.email || ""}
              onSave={(v) => updateUser({ email: v })}
              validate={(v) => (!/^\S+@\S+\.\S+$/.test(v) ? "Email invalide." : null)}
              testid="account-email"
            />
            <div className="pt-2 border-t border-sage/10">
              <PasswordDrawer />
            </div>
          </Card>
        </section>

        <section data-testid="section-children">
          <Heading level={4} className="mb-4">Mes jardinières</Heading>
          <div className="space-y-3">
            {children.map((c, i) => (
              <ChildRow key={c.id} child={c} index={i} />
            ))}
            <AddChildGhost />
          </div>
        </section>
      </div>
    </div>
  )
}
