const BASE =
  "w-full rounded-lg border border-bark/15 bg-paper px-3 py-2.5 text-bark placeholder:text-twig " +
  "focus:outline-none focus:border-sky-deep focus:ring-2 focus:ring-sky/30 transition-colors"

export default function Input({ as = "input", className = "", children, ...rest }) {
  if (as === "select") {
    return (
      <select className={`${BASE} pr-8 cursor-pointer ${className}`} {...rest}>
        {children}
      </select>
    )
  }
  if (as === "textarea") {
    return <textarea className={`${BASE} ${className}`} {...rest} />
  }
  return <input className={`${BASE} ${className}`} {...rest} />
}
