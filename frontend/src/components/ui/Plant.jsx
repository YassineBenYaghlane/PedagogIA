const PLANT_COMMON = { viewBox: "0 0 72 92" }

function Seed({ size }) {
  const h = size * 1.25
  return (
    <svg {...PLANT_COMMON} width={size} height={h} aria-hidden="true">
      <ellipse cx="36" cy="60" rx="7" ry="9" fill="#c9a373" stroke="#5a3e1f" strokeWidth="1.2" />
      <path d="M30 58 Q 36 52 42 58" fill="none" stroke="#5a3e1f" strokeWidth=".9" strokeLinecap="round" />
      <path d="M12 66 Q 36 62 60 66" fill="none" stroke="#6b4a2f" strokeWidth="1.3" strokeLinecap="round" opacity=".4" />
    </svg>
  )
}

function Sprout({ size }) {
  const h = size * 1.25
  return (
    <svg {...PLANT_COMMON} width={size} height={h} aria-hidden="true">
      <path d="M36 72 Q 36 60 36 52" fill="none" stroke="#3f6f4a" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="28" cy="52" rx="9" ry="5" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" transform="rotate(-18 28 52)" />
      <ellipse cx="44" cy="52" rx="9" ry="5" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" transform="rotate(18 44 52)" />
    </svg>
  )
}

function Bud({ size }) {
  const h = size * 1.25
  return (
    <svg {...PLANT_COMMON} width={size} height={h} aria-hidden="true">
      <path d="M36 80 Q 34 60 36 42 Q 38 30 36 20" fill="none" stroke="#3f6f4a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M36 54 Q 22 50 18 58 Q 22 62 36 60" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" />
      <path d="M36 44 Q 50 40 54 48 Q 50 52 36 50" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" />
      <path d="M36 22 Q 28 22 28 16 Q 28 8 36 6 Q 44 8 44 16 Q 44 22 36 22 Z" fill="#f5d3d0" stroke="#5a3e1f" strokeWidth="1.3" />
      <path d="M36 22 L 36 6" stroke="#cf7a74" strokeWidth=".9" fill="none" />
    </svg>
  )
}

function Flower({ size }) {
  const h = size * 1.25
  const petals = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg {...PLANT_COMMON} width={size} height={h} aria-hidden="true">
      <path d="M36 80 Q 34 60 36 42 Q 38 30 36 20" fill="none" stroke="#3f6f4a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M36 58 Q 20 52 16 62 Q 20 68 36 64" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" />
      <path d="M36 46 Q 52 40 56 50 Q 52 56 36 52" fill="#c7e0b5" stroke="#3f6f4a" strokeWidth="1.2" />
      {petals.map((r) => (
        <ellipse
          key={r}
          cx="36"
          cy="8"
          rx="4.5"
          ry="8"
          fill="#f5d3d0"
          stroke="#5a3e1f"
          strokeWidth="1.2"
          transform={`rotate(${r} 36 20)`}
        />
      ))}
      <circle cx="36" cy="20" r="4.5" fill="#e8c66a" stroke="#5a3e1f" strokeWidth="1.2" />
    </svg>
  )
}

function Wilted({ size }) {
  const h = size * 1.25
  return (
    <svg {...PLANT_COMMON} width={size} height={h} aria-hidden="true">
      <path d="M36 80 Q 30 60 32 44 Q 34 34 28 28" fill="none" stroke="#8a9a8a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M32 56 Q 18 60 14 68 Q 20 72 33 62" fill="#d8dec7" stroke="#8a9a8a" strokeWidth="1.2" />
      <path d="M33 46 Q 48 50 50 58 Q 46 60 33 52" fill="#d8dec7" stroke="#8a9a8a" strokeWidth="1.2" />
      <g transform="translate(-2 -2) rotate(-18 28 28)">
        <ellipse cx="30" cy="18" rx="4" ry="7" fill="#e6cfc7" stroke="#7d5a54" strokeWidth="1.1" />
        <ellipse cx="30" cy="18" rx="4" ry="7" fill="#e6cfc7" stroke="#7d5a54" strokeWidth="1.1" transform="rotate(55 30 28)" />
        <ellipse cx="30" cy="18" rx="4" ry="7" fill="#e0c3ba" stroke="#7d5a54" strokeWidth="1.1" transform="rotate(180 30 28)" opacity=".75" />
        <ellipse cx="30" cy="18" rx="4" ry="7" fill="#e6cfc7" stroke="#7d5a54" strokeWidth="1.1" transform="rotate(300 30 28)" />
        <circle cx="30" cy="28" r="4" fill="#c9a860" stroke="#7d5a54" strokeWidth="1.1" />
      </g>
    </svg>
  )
}

export default function Plant({ status, mastery = 0, size = 56 }) {
  if (status === "locked" || status === "unlocked") return <Seed size={size} />
  if (status === "wilted") return <Wilted size={size} />
  if (status === "done") return <Flower size={size} />
  if (mastery < 0.35) return <Sprout size={size} />
  return <Bud size={size} />
}
