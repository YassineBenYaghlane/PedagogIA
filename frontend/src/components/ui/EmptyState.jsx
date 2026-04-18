import Icon from "./Icon"
import Button from "./Button"

export default function EmptyState({
  icon,
  title,
  body,
  cta,
  compact = false,
  className = "",
  "data-testid": testId,
}) {
  const spacing = compact ? "py-3 px-2" : "py-8 px-4"
  return (
    <div
      data-testid={testId}
      className={`flex flex-col items-center text-center ${spacing} text-stem ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-mist/70 border border-sage/15 flex items-center justify-center text-sage-deep mb-3">
          <Icon name={icon} size={22} />
        </div>
      )}
      {title && (
        <div className="font-display text-base text-bark mb-1">{title}</div>
      )}
      {body && <p className="text-sm leading-relaxed max-w-xs">{body}</p>}
      {cta && (
        <Button
          variant={cta.variant || "primary"}
          size="sm"
          onClick={cta.onClick}
          data-testid={cta["data-testid"]}
          className="mt-4"
        >
          {cta.icon && <Icon name={cta.icon} />}
          {cta.label}
        </Button>
      )}
    </div>
  )
}
