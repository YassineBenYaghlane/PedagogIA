const SIZES = {
  sm: "text-xs px-3 py-2",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3.5",
}

const VARIANTS = {
  primary: "pill",
  ghost: "pill pill-ghost",
  bark: "pill pill-bark",
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}) {
  const base = VARIANTS[variant] ?? VARIANTS.primary
  const sizeClass = SIZES[size] ?? SIZES.md
  return (
    <button type={type} className={`${base} ${sizeClass} ${className}`} {...rest}>
      {children}
    </button>
  )
}
