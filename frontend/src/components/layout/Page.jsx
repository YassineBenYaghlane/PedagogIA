const MAX_WIDTHS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
  "3xl": "max-w-5xl",
  full: "max-w-none"
}

export default function Page({ maxWidth = "xl", className = "", children }) {
  const widthClass = MAX_WIDTHS[maxWidth] ?? MAX_WIDTHS.xl
  return (
    <div className={`mx-auto px-5 py-8 sm:px-6 sm:py-10 md:py-14 w-full ${widthClass} ${className}`}>
      {children}
    </div>
  )
}
