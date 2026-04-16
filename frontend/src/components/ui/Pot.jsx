const PLANT = {
  sommeil: (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M32 48V34" strokeDasharray="2 3" />
      <circle cx="32" cy="30" r="3" fill="currentColor" opacity="0.3" />
    </g>
  ),
  arroser: (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M32 48V24" />
      <path d="M32 34c-4 0-6-3-6-6 4 0 6 3 6 6z" />
      <path d="M32 28c3 0 5-2 5-5-3 0-5 2-5 5z" />
    </g>
  ),
  croissance: (
    <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M32 48V18" />
      <path d="M32 30c-5 0-8-3-8-7 5 0 8 3 8 7z" fill="currentColor" fillOpacity="0.15" />
      <path d="M32 24c5 0 8-3 8-7-5 0-8 3-8 7z" fill="currentColor" fillOpacity="0.15" />
    </g>
  ),
  floraison: (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M32 48V22" />
      <circle cx="32" cy="16" r="5" fill="#E8C66A" stroke="#8A6A1F" />
      <circle cx="25" cy="14" r="4" fill="#E8A6A1" stroke="#8A6A1F" />
      <circle cx="39" cy="14" r="4" fill="#E8A6A1" stroke="#8A6A1F" />
      <circle cx="28" cy="20" r="4" fill="#E8A6A1" stroke="#8A6A1F" />
      <circle cx="36" cy="20" r="4" fill="#E8A6A1" stroke="#8A6A1F" />
      <circle cx="32" cy="17" r="3" fill="#fff3c9" />
    </g>
  ),
}

export default function Pot({ state = "croissance", className = "", width = 168, children }) {
  const color = state === "sommeil" ? "#A1AEA3" : state === "arroser" ? "#4F8BAC" : "#3F6F4A"
  return (
    <div className={`pot ${className}`} style={{ width }}>
      <div className="relative h-28 flex items-center justify-center" style={{ color }}>
        <svg viewBox="0 0 64 56" className="w-20 h-20">
          {PLANT[state] ?? PLANT.croissance}
        </svg>
      </div>
      <div className="pot-soil" />
      {children ? <div className="px-4 py-3">{children}</div> : null}
    </div>
  )
}
