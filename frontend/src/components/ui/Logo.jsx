const SIZES = {
  sm: { mark: 28, text: "text-lg" },
  md: { mark: 40, text: "text-2xl" },
  lg: { mark: 56, text: "text-4xl" },
}

export function LogoMark({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="#C7E0B5" />
      <path
        d="M22 6 C11 9 7 17 9 24 C9 24 15 26 20 22 C26 17 27 11 22 6 Z"
        fill="#6FA274"
        stroke="#3F6F4A"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 23.5 L22 7"
        stroke="#3F6F4A"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.55"
        fill="none"
      />
      <path
        d="M13.5 19 L18 14 M14 15 L17 12 M15 22 L19.5 17.5"
        stroke="#3F6F4A"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />
    </svg>
  )
}

export default function Logo({ size = "md", className = "", withWordmark = true }) {
  const dim = SIZES[size] ?? SIZES.md
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="CollegIA"
    >
      <LogoMark size={dim.mark} />
      {withWordmark && (
        <span className={`font-display ${dim.text} text-bark leading-none`}>
          Colleg<span className="italic text-sage-deep">IA</span>
        </span>
      )}
    </span>
  )
}
