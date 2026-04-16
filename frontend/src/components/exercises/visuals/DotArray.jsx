export default function DotArray({ count = 0, groupSize = 5 }) {
  const safe = Math.max(0, Math.min(20, count))
  const dots = Array.from({ length: safe }, (_, i) => i)
  return (
    <div
      className="mt-4 flex flex-wrap justify-center gap-1 px-4"
      data-testid="dot-array"
    >
      {dots.map((i) => (
        <span
          key={i}
          className={`inline-block w-5 h-5 rounded-full ${i % groupSize === groupSize - 1 ? "bg-sage mr-2" : "bg-sage/60"}`}
        />
      ))}
    </div>
  )
}
