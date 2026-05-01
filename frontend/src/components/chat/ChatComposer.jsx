import { useState } from "react"
import Icon from "../ui/Icon"

export default function ChatComposer({ onSend, disabled = false, placeholder }) {
  const [value, setValue] = useState("")
  const submit = (e) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-sage/15 bg-bone p-3">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder || "Pose ta question…"}
        disabled={disabled}
        data-testid="chat-input"
        className="flex-1 resize-none rounded-xl border border-sage/20 bg-chalk px-3 py-2 text-sm text-bark placeholder:text-stem/60 focus:outline-none focus:border-sage-deep/50 transition-colors duration-200 max-h-40"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        data-testid="chat-send"
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-sage-deep text-bone disabled:bg-sage/30 disabled:text-stem cursor-pointer transition-colors duration-200 hover:bg-sage-deep/90"
        aria-label="Envoyer"
      >
        <Icon name="send" size={18} />
      </button>
    </form>
  )
}
