const SURFACES = {
  greenhouse: "greenhouse",
  paper: "paper-rule",
  grid: "paper-grid",
  water: "water",
  plain: "bg-chalk"
}

export default function AppShell({
  surface = "greenhouse",
  topBar = null,
  children,
  className = ""
}) {
  const surfaceClass = SURFACES[surface] ?? SURFACES.greenhouse
  return (
    <div className={`app-shell ${surfaceClass} ${className}`}>
      {topBar}
      <main className="app-shell-main">{children}</main>
    </div>
  )
}
