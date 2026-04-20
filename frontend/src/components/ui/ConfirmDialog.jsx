import { useEffect } from "react"
import Button from "./Button"
import Card from "./Card"
import { Heading } from "./Heading"

export default function ConfirmDialog({
  open,
  title = "Confirmer",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel?.()
      } else if (e.key === "Enter") {
        e.preventDefault()
        onConfirm?.()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-bark/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
      data-testid="confirm-dialog"
    >
      <Card
        className="p-6 sm:p-7 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading level={3} id="confirm-dialog-title">
          {title}
        </Heading>
        {message && <p className="text-sm text-stem mt-3">{message}</p>}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
            data-testid="confirm-dialog-cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            autoFocus
            className="flex-1"
            data-testid="confirm-dialog-confirm"
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
