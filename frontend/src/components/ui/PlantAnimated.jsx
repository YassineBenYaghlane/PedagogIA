// Animated JARDIN plants — debug-only experiments behind /debug/plants.
// Mirrors the aesthetic of Loader.jsx (halo pulse, stem sway, leaf
// wiggle, water drops). Production SkillNode keeps using Plant.jsx.

const VB = "0 0 120 140"
const STEM = "#3F6F4A"
const LEAF = "#C7E0B5"

function Pot() {
  return (
    <g>
      <path
        d="M40 118 L 43 136 Q 43 138 46 138 L 74 138 Q 77 138 77 136 L 80 118 Z"
        fill="#D8B48A"
        stroke="#8A6A4A"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <ellipse cx="60" cy="118" rx="20" ry="3.5" fill="#B88D5F" stroke="#8A6A4A" strokeWidth="1.4" />
      <ellipse cx="60" cy="118" rx="17" ry="2.3" fill="#4C3621" />
    </g>
  )
}

function Halo({ tint = "sage" }) {
  const id = `jp-halo-${tint}`
  const color = tint === "honey" ? "#F6DE9F" : tint === "rose" ? "#F0BEBA" : "#BEDDA8"
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="82" r="56" fill={`url(#${id})`} className={`jp-halo jp-halo-${tint}`} />
    </>
  )
}

export function AnimatedSeed({ pot = true, halo = true }) {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true" className="jp overflow-visible">
      {halo && <Halo tint="sage" />}
      <g className="jp-seed-breath" style={{ transformOrigin: "60px 106px", transformBox: "fill-box" }}>
        <ellipse cx="60" cy="106" rx="13" ry="16" fill="#C9A373" stroke="#5A3E1F" strokeWidth="1.8" />
        <path d="M53 102 Q 60 90 67 102" fill="none" stroke="#5A3E1F" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M53 102 Q 60 90 67 102" fill="none" stroke="#FBE9B6" strokeWidth="1.1" strokeLinecap="round" className="jp-seed-glow" />
        <path d="M60 92 Q 60 86 60 82" fill="none" stroke="#6FA274" strokeWidth="1.4" strokeLinecap="round" className="jp-seed-tip" />
      </g>
      <circle cx="40" cy="116" r="1.4" fill="#A88558" className="jp-dust jp-dust-1" />
      <circle cx="82" cy="116" r="1.2" fill="#A88558" className="jp-dust jp-dust-2" />
      <circle cx="56" cy="120" r="1.2" fill="#FBE9B6" className="jp-dust jp-dust-3" />
      {pot && <Pot />}
    </svg>
  )
}

export function AnimatedSprout({ pot = true, halo = true }) {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true" className="jp overflow-visible">
      {halo && <Halo tint="sage" />}
      <g className="jp-sprout-sway" style={{ transformOrigin: "60px 118px", transformBox: "fill-box" }}>
        <path d="M60 118 Q 60 96 60 80" fill="none" stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
        <g className="jp-sprout-left" style={{ transformOrigin: "60px 80px", transformBox: "fill-box" }}>
          <ellipse cx="46" cy="74" rx="11" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(-20 46 74)" />
          <path d="M58 78 Q 50 76 37 72" stroke={STEM} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />
        </g>
        <g className="jp-sprout-right" style={{ transformOrigin: "60px 80px", transformBox: "fill-box" }}>
          <ellipse cx="74" cy="74" rx="11" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(20 74 74)" />
          <path d="M62 78 Q 70 76 83 72" stroke={STEM} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.65" />
        </g>
        <ellipse cx="60" cy="76" rx="1.6" ry="2.2" fill="#4F8BAC" opacity="0.85" className="jp-dew" />
      </g>
      {pot && <Pot />}
    </svg>
  )
}

export function AnimatedBud({ pot = true, halo = true, drops = true }) {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true" className="jp overflow-visible">
      {halo && <Halo tint="sage" />}
      {drops && (
        <g className="jp-drops">
          <path d="M60 6 Q 63 13 60 18 Q 57 13 60 6 Z" fill="#4F8BAC" opacity="0.75" className="jp-drop jp-drop-1" />
          <path d="M42 10 Q 45 17 42 22 Q 39 17 42 10 Z" fill="#4F8BAC" opacity="0.6" className="jp-drop jp-drop-2" />
          <path d="M78 14 Q 81 21 78 26 Q 75 21 78 14 Z" fill="#4F8BAC" opacity="0.6" className="jp-drop jp-drop-3" />
        </g>
      )}
      <g className="jp-bud-sway" style={{ transformOrigin: "60px 118px", transformBox: "fill-box" }}>
        <path d="M60 118 Q 58 96 60 72 Q 62 58 60 44" fill="none" stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
        <g className="jp-leaf-left" style={{ transformOrigin: "60px 82px", transformBox: "fill-box" }}>
          <ellipse cx="44" cy="76" rx="13" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(-24 44 76)" />
          <path d="M58 78 Q 50 76 33 72" stroke={STEM} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
        <g className="jp-leaf-right" style={{ transformOrigin: "60px 82px", transformBox: "fill-box" }}>
          <ellipse cx="76" cy="76" rx="13" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(24 76 76)" />
          <path d="M62 78 Q 70 76 87 72" stroke={STEM} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
        <g className="jp-bud-pulse" style={{ transformOrigin: "60px 36px", transformBox: "fill-box" }}>
          <path d="M60 46 Q 52 46 52 38 Q 52 28 60 24 Q 68 28 68 38 Q 68 46 60 46 Z" fill="#F5D3D0" stroke="#5A3E1F" strokeWidth="1.3" />
          <path d="M60 46 L 60 24" stroke="#CF7A74" strokeWidth="0.9" fill="none" />
        </g>
      </g>
      {pot && <Pot />}
    </svg>
  )
}

export function AnimatedFlower({ pot = true, halo = true, pollen = true }) {
  const BACK = 14
  const FRONT = 10
  const back = Array.from({ length: BACK }, (_, i) => (360 / BACK) * i)
  const front = Array.from({ length: FRONT }, (_, i) => (360 / FRONT) * i + 18)
  const stamens = [0, 60, 120, 180, 240, 300]
  const pollenDots = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true" className="jp overflow-visible">
      {halo && <Halo tint="honey" />}
      {pollen && (
        <g className="jp-pollen">
          {pollenDots.map((i) => (
            <circle
              key={i}
              cx={34 + i * 7.2}
              cy="42"
              r={i % 2 === 0 ? 1.8 : 1.3}
              fill={i % 3 === 0 ? "#F5D3D0" : "#E8C66A"}
              opacity="0.85"
              className={`jp-pollen-dot jp-pollen-${i % 5}`}
            />
          ))}
        </g>
      )}
      <g className="jp-flower-sway" style={{ transformOrigin: "60px 118px", transformBox: "fill-box" }}>
        <path d="M60 118 Q 58 96 60 72 Q 62 56 60 40" fill="none" stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M60 90 Q 70 86 80 78" fill="none" stroke={STEM} strokeWidth="1.4" strokeLinecap="round" />
        <g className="jp-mini-bud-right" style={{ transformOrigin: "80px 78px", transformBox: "fill-box" }}>
          <circle cx="80" cy="76" r="3.6" fill="#F5D3D0" stroke="#CF7A74" strokeWidth="1" />
          <circle cx="80" cy="76" r="1.3" fill="#E8C66A" />
        </g>
        <path d="M60 100 Q 50 98 42 94" fill="none" stroke={STEM} strokeWidth="1.3" strokeLinecap="round" />
        <g className="jp-mini-bud-left" style={{ transformOrigin: "42px 93px", transformBox: "fill-box" }}>
          <circle cx="42" cy="93" r="2.8" fill="#F5D3D0" stroke="#CF7A74" strokeWidth="1" />
          <circle cx="42" cy="93" r="1" fill="#E8C66A" />
        </g>
        <g className="jp-leaf-left" style={{ transformOrigin: "60px 82px", transformBox: "fill-box" }}>
          <ellipse cx="44" cy="76" rx="13" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(-24 44 76)" />
        </g>
        <g className="jp-leaf-right" style={{ transformOrigin: "60px 82px", transformBox: "fill-box" }}>
          <ellipse cx="76" cy="76" rx="13" ry="6" fill={LEAF} stroke={STEM} strokeWidth="1.3" transform="rotate(24 76 76)" />
        </g>
        <path d="M54 44 Q 52 40 55 36 Q 58 38 57 44 Z" fill="#A9CD8E" stroke={STEM} strokeWidth="0.9" />
        <path d="M66 44 Q 68 40 65 36 Q 62 38 63 44 Z" fill="#A9CD8E" stroke={STEM} strokeWidth="0.9" />
        <g className="jp-bloom" style={{ transformOrigin: "60px 38px", transformBox: "fill-box" }}>
          {back.map((r, i) => (
            <g key={`b${i}`} transform={`rotate(${r} 60 38)`}>
              <ellipse
                cx="60"
                cy="24"
                rx="4.5"
                ry="13"
                fill="#F5D3D0"
                stroke="#CF7A74"
                strokeWidth="1.1"
                className={`jp-petal jp-petal-${i % 8}`}
                style={{ transformOrigin: "50% 100%", transformBox: "fill-box" }}
              />
            </g>
          ))}
          {front.map((r, i) => (
            <g key={`f${i}`} transform={`rotate(${r} 60 38)`}>
              <ellipse
                cx="60"
                cy="28"
                rx="3.5"
                ry="9"
                fill="#FBE5E2"
                stroke="#CF7A74"
                strokeWidth="0.9"
                className={`jp-petal jp-petal-front jp-petal-${(i + 3) % 8}`}
                style={{ transformOrigin: "50% 100%", transformBox: "fill-box" }}
              />
            </g>
          ))}
          <circle cx="60" cy="38" r="6.5" fill="#F4D98A" stroke="#C99845" strokeWidth="1.2" />
          {stamens.map((a, i) => (
            <circle
              key={i}
              cx="60"
              cy="32.5"
              r="1.4"
              fill="#B7842F"
              transform={`rotate(${a} 60 38)`}
              className={`jp-stamen jp-stamen-${i}`}
            />
          ))}
          <circle cx="60" cy="38" r="2.6" fill="#8E5F1E" />
        </g>
      </g>
      {pollen && (
        <ellipse cx="92" cy="52" rx="3" ry="5" fill="#FBE5E2" opacity="0.75" className="jp-drift-petal" />
      )}
      {pot && <Pot />}
    </svg>
  )
}

export function AnimatedWilted({ pot = true, halo = true }) {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true" className="jp overflow-visible">
      {halo && <Halo tint="rose" />}
      <path d="M60 10 Q 63 18 60 24 Q 57 18 60 10 Z" fill="#4F8BAC" opacity="0.75" className="jp-revive-drop" />
      <g className="jp-wilt-droop" style={{ transformOrigin: "60px 118px", transformBox: "fill-box" }}>
        <path d="M60 118 Q 56 96 58 76 Q 62 58 72 46" fill="none" stroke="#8A9A8A" strokeWidth="2.2" strokeLinecap="round" />
        <g className="jp-wilt-leaf-left" style={{ transformOrigin: "60px 84px", transformBox: "fill-box" }}>
          <ellipse cx="44" cy="86" rx="12" ry="6" fill="#D8DEC7" stroke="#8A9A8A" strokeWidth="1.3" transform="rotate(-34 44 86)" />
        </g>
        <g className="jp-wilt-leaf-right" style={{ transformOrigin: "60px 80px", transformBox: "fill-box" }}>
          <ellipse cx="74" cy="82" rx="12" ry="6" fill="#D8DEC7" stroke="#8A9A8A" strokeWidth="1.3" transform="rotate(14 74 82)" />
        </g>
        <g transform="translate(12 -4)" className="jp-wilt-head">
          <ellipse cx="70" cy="44" rx="4.5" ry="8" fill="#E6CFC7" stroke="#7D5A54" strokeWidth="1.1" />
          <ellipse cx="70" cy="44" rx="4.5" ry="8" fill="#E6CFC7" stroke="#7D5A54" strokeWidth="1.1" transform="rotate(55 70 44)" />
          <ellipse cx="70" cy="44" rx="4.5" ry="8" fill="#E0C3BA" stroke="#7D5A54" strokeWidth="1.1" transform="rotate(180 70 44)" opacity="0.75" />
          <ellipse cx="70" cy="44" rx="4.5" ry="8" fill="#E6CFC7" stroke="#7D5A54" strokeWidth="1.1" transform="rotate(300 70 44)" />
          <circle cx="70" cy="44" r="3.2" fill="#C9A860" stroke="#7D5A54" strokeWidth="1.1" />
        </g>
      </g>
      <ellipse cx="86" cy="66" rx="4" ry="6" fill="#E6CFC7" opacity="0.8" className="jp-falling-petal" />
      {pot && <Pot />}
    </svg>
  )
}

export default function AnimatedPlant({ status, mastery = 0, ...rest }) {
  if (status === "locked" || status === "unlocked") return <AnimatedSeed {...rest} />
  if (status === "wilted") return <AnimatedWilted {...rest} />
  if (status === "done") return <AnimatedFlower {...rest} />
  if (mastery < 0.35) return <AnimatedSprout {...rest} />
  return <AnimatedBud {...rest} />
}

export function PlantKeyframes() {
  return (
    <style>{`
@keyframes jp-seed-breath { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
@keyframes jp-seed-glow   { 0%,100% { opacity: 0.12 } 50% { opacity: 0.95 } }
@keyframes jp-seed-tip    { 0%,72%,100% { opacity: 0 } 82%,95% { opacity: 0.7 } }
@keyframes jp-dust        { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 0.9 } 90% { opacity: 0 } 100% { transform: translateY(-44px); opacity: 0 } }
@keyframes jp-sway        { 0%,100% { transform: rotate(-2.4deg) } 50% { transform: rotate(2.4deg) } }
@keyframes jp-sway-soft   { 0%,100% { transform: rotate(-1.5deg) } 50% { transform: rotate(1.5deg) } }
@keyframes jp-leaf-left   { 0%,100% { transform: rotate(0) } 50% { transform: rotate(-6deg) } }
@keyframes jp-leaf-right  { 0%,100% { transform: rotate(0) } 50% { transform: rotate(6deg) } }
@keyframes jp-halo-sage   { 0%,100% { opacity: 0.55; transform: scale(1) } 50% { opacity: 0.95; transform: scale(1.07) } }
@keyframes jp-halo-honey  { 0%,100% { opacity: 0.55; transform: scale(1) } 50% { opacity: 1; transform: scale(1.1) } }
@keyframes jp-halo-rose   { 0%,100% { opacity: 0.3; transform: scale(1) } 50% { opacity: 0.55; transform: scale(1.04) } }
@keyframes jp-drop        { 0% { transform: translateY(-10px); opacity: 0 } 15% { opacity: 0.9 } 70% { opacity: 0.9 } 90%,100% { transform: translateY(50px); opacity: 0 } }
@keyframes jp-bud-pulse   { 0%,100% { transform: scale(1) } 50% { transform: scale(1.14) } }
@keyframes jp-dew         { 0%,60% { transform: translateY(0); opacity: 0 } 72% { opacity: 0.9 } 100% { transform: translateY(14px); opacity: 0 } }
@keyframes jp-pollen      { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 0.9 } 100% { transform: translateY(-46px); opacity: 0 } }
@keyframes jp-petal       { 0%,100% { transform: scale(1) } 50% { transform: scale(1.09) } }
@keyframes jp-petal-front { 0%,100% { transform: scale(1) } 50% { transform: scale(0.92) } }
@keyframes jp-bloom       { 0%,100% { transform: scale(1) rotate(0deg) } 50% { transform: scale(1.025) rotate(0.6deg) } }
@keyframes jp-stamen      { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.2px) } }
@keyframes jp-mini-bud    { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
@keyframes jp-drift-petal { 0% { transform: translate(0,0) rotate(0); opacity: 0 } 10% { opacity: 0.8 } 100% { transform: translate(16px,52px) rotate(220deg); opacity: 0 } }
@keyframes jp-wilt-droop  { 0%,100% { transform: rotate(-1deg) } 50% { transform: rotate(3deg) translateY(1px) } }
@keyframes jp-wilt-leaf   { 0%,100% { transform: rotate(0) } 50% { transform: rotate(3deg) } }
@keyframes jp-wilt-head   { 0%,100% { transform: translate(12px,-4px) } 50% { transform: translate(12px,-2px) } }
@keyframes jp-revive-drop { 0% { transform: translateY(-4px); opacity: 0 } 10% { opacity: 0.9 } 70% { transform: translateY(30px); opacity: 0.4 } 80%,100% { transform: translateY(30px); opacity: 0 } }
@keyframes jp-falling-petal { 0% { transform: translate(0,0) rotate(0); opacity: 0 } 10% { opacity: 0.85 } 100% { transform: translate(6px,28px) rotate(160deg); opacity: 0 } }

.jp-halo                { transform-origin: 60px 82px; transform-box: fill-box }
.jp-halo-sage           { animation: jp-halo-sage 3.4s ease-in-out infinite }
.jp-halo-honey          { animation: jp-halo-honey 3s ease-in-out infinite }
.jp-halo-rose           { animation: jp-halo-rose 4.2s ease-in-out infinite }

.jp-seed-breath         { animation: jp-seed-breath 3.2s ease-in-out infinite }
.jp-seed-glow           { animation: jp-seed-glow 2.4s ease-in-out infinite }
.jp-seed-tip            { animation: jp-seed-tip 6s ease-in-out infinite }
.jp-dust-1              { animation: jp-dust 5s linear 0s infinite }
.jp-dust-2              { animation: jp-dust 5s linear 1.7s infinite }
.jp-dust-3              { animation: jp-dust 5s linear 3.3s infinite }

.jp-sprout-sway         { animation: jp-sway-soft 3s ease-in-out infinite }
.jp-sprout-left         { animation: jp-leaf-left 2.6s ease-in-out infinite }
.jp-sprout-right        { animation: jp-leaf-right 2.6s ease-in-out infinite }
.jp-dew                 { animation: jp-dew 4.2s ease-in-out infinite; transform-origin: 60px 76px; transform-box: fill-box }

.jp-bud-sway            { animation: jp-sway 3.4s ease-in-out infinite }
.jp-leaf-left           { animation: jp-leaf-left 2.8s ease-in-out infinite }
.jp-leaf-right          { animation: jp-leaf-right 2.8s ease-in-out infinite }
.jp-bud-pulse           { animation: jp-bud-pulse 2.2s ease-in-out infinite }
.jp-drop-1              { animation: jp-drop 2.3s ease-in 0s infinite }
.jp-drop-2              { animation: jp-drop 2.3s ease-in 0.55s infinite }
.jp-drop-3              { animation: jp-drop 2.3s ease-in 1.1s infinite }

.jp-flower-sway         { animation: jp-sway-soft 3.6s ease-in-out infinite }
.jp-bloom               { animation: jp-bloom 4.4s ease-in-out infinite }
.jp-petal-0             { animation: jp-petal 2.8s ease-in-out 0s infinite }
.jp-petal-1             { animation: jp-petal 3.1s ease-in-out 0.15s infinite }
.jp-petal-2             { animation: jp-petal 2.6s ease-in-out 0.3s infinite }
.jp-petal-3             { animation: jp-petal 3.3s ease-in-out 0.45s infinite }
.jp-petal-4             { animation: jp-petal 2.9s ease-in-out 0.6s infinite }
.jp-petal-5             { animation: jp-petal 2.7s ease-in-out 0.75s infinite }
.jp-petal-6             { animation: jp-petal 3.2s ease-in-out 0.9s infinite }
.jp-petal-7             { animation: jp-petal 2.8s ease-in-out 1.05s infinite }
.jp-petal-front         { animation-name: jp-petal-front }
.jp-stamen-0            { animation: jp-stamen 2.2s ease-in-out 0s infinite }
.jp-stamen-1            { animation: jp-stamen 2.2s ease-in-out 0.3s infinite }
.jp-stamen-2            { animation: jp-stamen 2.2s ease-in-out 0.6s infinite }
.jp-stamen-3            { animation: jp-stamen 2.2s ease-in-out 0.9s infinite }
.jp-stamen-4            { animation: jp-stamen 2.2s ease-in-out 1.2s infinite }
.jp-stamen-5            { animation: jp-stamen 2.2s ease-in-out 1.5s infinite }
.jp-mini-bud-left       { animation: jp-mini-bud 3.4s ease-in-out 0.5s infinite }
.jp-mini-bud-right      { animation: jp-mini-bud 3.4s ease-in-out 0s infinite }
.jp-drift-petal         { animation: jp-drift-petal 6.5s ease-in 1.2s infinite }
.jp-pollen-0            { animation: jp-pollen 4.6s ease-out 0s infinite }
.jp-pollen-1            { animation: jp-pollen 4.6s ease-out 0.55s infinite }
.jp-pollen-2            { animation: jp-pollen 4.6s ease-out 1.1s infinite }
.jp-pollen-3            { animation: jp-pollen 4.6s ease-out 1.65s infinite }
.jp-pollen-4            { animation: jp-pollen 4.6s ease-out 2.2s infinite }

.jp-wilt-droop          { animation: jp-wilt-droop 5.6s ease-in-out infinite }
.jp-wilt-leaf-left      { animation: jp-wilt-leaf 5.6s ease-in-out infinite }
.jp-wilt-leaf-right     { animation: jp-wilt-leaf 5.6s ease-in-out infinite reverse }
.jp-wilt-head           { animation: jp-wilt-head 5.6s ease-in-out infinite }
.jp-revive-drop         { animation: jp-revive-drop 4.2s ease-in-out infinite }
.jp-falling-petal       { animation: jp-falling-petal 4.6s ease-in 0.4s infinite }

.jp-paused *            { animation-play-state: paused !important }

@media (prefers-reduced-motion: reduce) { .jp *, .jp-paused * { animation: none !important } }
`}</style>
  )
}
