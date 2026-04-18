export default function TopBar({ leading = null, title = null, trailing = null, className = "" }) {
  return (
    <header className={`top-bar ${className}`}>
      <div className="top-bar-inner">
        <div className="top-bar-leading">{leading}</div>
        {title && <div className="top-bar-title">{title}</div>}
        <div className="top-bar-trailing">{trailing}</div>
      </div>
    </header>
  )
}
