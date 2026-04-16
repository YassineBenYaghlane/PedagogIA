const LEVELS = {
  1: "text-4xl md:text-5xl font-semibold leading-[1.05]",
  2: "text-3xl md:text-4xl font-semibold leading-[1.1]",
  3: "text-2xl font-semibold leading-tight",
  4: "text-xl font-semibold leading-tight",
}

export function Heading({ level = 1, className = "", children, as, ...rest }) {
  const Tag = as ?? `h${level}`
  const size = LEVELS[level] ?? LEVELS[1]
  return (
    <Tag className={`font-display text-bark ${size} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function LatinLabel({ className = "", children, ...rest }) {
  return (
    <span className={`latin text-xs tracking-wider ${className}`} {...rest}>
      {children}
    </span>
  )
}

export default Heading
