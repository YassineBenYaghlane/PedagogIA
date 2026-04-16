const VARIANTS = {
  specimen: "specimen",
  tag: "tag",
  paper: "bg-paper rounded-xl border border-bark/5",
}

export default function Card({ variant = "specimen", className = "", children, ...rest }) {
  const base = VARIANTS[variant] ?? VARIANTS.specimen
  return (
    <div className={`${base} ${className}`} {...rest}>
      {children}
    </div>
  )
}
