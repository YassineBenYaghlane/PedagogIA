const SIZES = {
  sm: { plant: 56, gap: "gap-2", label: "text-xs" },
  md: { plant: 88, gap: "gap-3", label: "text-sm" },
  lg: { plant: 128, gap: "gap-4", label: "text-base" },
}

export default function Loader({
  message = "Chargement…",
  size = "md",
  variant = "inline",
  className = "",
}) {
  const { plant, gap, label } = SIZES[size] ?? SIZES.md
  const height = Math.round(plant * (140 / 120))

  const content = (
    <div
      className={`jardin-loader flex flex-col items-center justify-center ${gap} ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        viewBox="0 0 120 140"
        width={plant}
        height={height}
        aria-hidden="true"
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="jardin-halo" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#C7E0B5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C7E0B5" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="60" cy="80" r="54" fill="url(#jardin-halo)" className="loader-halo" />

        <g className="loader-drops">
          <path d="M60 6 Q 63 13 60 18 Q 57 13 60 6 Z" fill="#4F8BAC" opacity="0.75" className="loader-drop loader-drop-1" />
          <path d="M44 14 Q 46.6 20 44 24 Q 41.4 20 44 14 Z" fill="#4F8BAC" opacity="0.6" className="loader-drop loader-drop-2" />
          <path d="M76 12 Q 78.6 18 76 22 Q 73.4 18 76 12 Z" fill="#4F8BAC" opacity="0.6" className="loader-drop loader-drop-3" />
        </g>

        <g className="loader-plant" style={{ transformOrigin: "60px 102px" }}>
          <path
            d="M60 102 Q 60 86 60 70"
            stroke="#3F6F4A"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <g className="loader-leaf loader-leaf-left" style={{ transformOrigin: "60px 82px" }}>
            <ellipse
              cx="44"
              cy="74"
              rx="14"
              ry="6.5"
              fill="#C7E0B5"
              stroke="#3F6F4A"
              strokeWidth="1.4"
              transform="rotate(-24 44 74)"
            />
            <path
              d="M58 76 Q 50 74 34 72"
              stroke="#3F6F4A"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
          <g className="loader-leaf loader-leaf-right" style={{ transformOrigin: "60px 82px" }}>
            <ellipse
              cx="76"
              cy="74"
              rx="14"
              ry="6.5"
              fill="#C7E0B5"
              stroke="#3F6F4A"
              strokeWidth="1.4"
              transform="rotate(24 76 74)"
            />
            <path
              d="M62 76 Q 70 74 86 72"
              stroke="#3F6F4A"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>
          <circle cx="60" cy="68" r="3.2" fill="#E8A6A1" stroke="#B7615C" strokeWidth="1.1" className="loader-bud" />
        </g>

        <g className="loader-pot">
          <path
            d="M40 104 L 43 130 Q 43 134 47 134 L 73 134 Q 77 134 77 130 L 80 104 Z"
            fill="#D8B48A"
            stroke="#8A6A4A"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M40 104 L 80 104" stroke="#8A6A4A" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="60" cy="104" rx="18" ry="3" fill="#5C4327" opacity="0.25" />
        </g>
      </svg>

      {message ? (
        <p className={`text-stem font-display italic ${label}`}>{message}</p>
      ) : null}

      <style>{`
        @keyframes jardin-sway {
          0%, 100% { transform: rotate(-2.4deg); }
          50%      { transform: rotate(2.4deg); }
        }
        @keyframes jardin-leaf-left {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(-5deg); }
        }
        @keyframes jardin-leaf-right {
          0%, 100% { transform: rotate(0deg); }
          50%      { transform: rotate(5deg); }
        }
        @keyframes jardin-bud {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.15); }
        }
        @keyframes jardin-drop {
          0%   { transform: translateY(-10px); opacity: 0; }
          15%  { opacity: 0.85; }
          70%  { opacity: 0.85; }
          90%  { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(50px); opacity: 0; }
        }
        @keyframes jardin-halo {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.06); }
        }
        .jardin-loader .loader-plant     { animation: jardin-sway 3.4s ease-in-out infinite; }
        .jardin-loader .loader-leaf-left { animation: jardin-leaf-left 2.8s ease-in-out infinite; }
        .jardin-loader .loader-leaf-right{ animation: jardin-leaf-right 2.8s ease-in-out infinite; }
        .jardin-loader .loader-bud       { animation: jardin-bud 2.4s ease-in-out infinite; transform-origin: 60px 68px; transform-box: fill-box; }
        .jardin-loader .loader-halo      { animation: jardin-halo 3.4s ease-in-out infinite; transform-origin: 60px 80px; transform-box: fill-box; }
        .jardin-loader .loader-drop-1    { animation: jardin-drop 2.2s ease-in 0s    infinite; }
        .jardin-loader .loader-drop-2    { animation: jardin-drop 2.2s ease-in 0.55s infinite; }
        .jardin-loader .loader-drop-3    { animation: jardin-drop 2.2s ease-in 1.1s  infinite; }
      `}</style>
    </div>
  )

  if (variant === "page") {
    return <div className="flex-1 flex items-center justify-center p-6">{content}</div>
  }
  return content
}
