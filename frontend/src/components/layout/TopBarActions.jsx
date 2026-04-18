import { Link } from "react-router"
import Icon from "../ui/Icon"

export function TopBarLink({ to, icon, children, "data-testid": testId }) {
  return (
    <Link to={to} data-testid={testId} className="top-bar-action">
      {icon && <Icon name={icon} size={16} />}
      <span className="top-bar-action-label">{children}</span>
    </Link>
  )
}

export function TopBarButton({ onClick, icon, children, "data-testid": testId }) {
  return (
    <button type="button" onClick={onClick} data-testid={testId} className="top-bar-action">
      {icon && <Icon name={icon} size={16} />}
      <span className="top-bar-action-label">{children}</span>
    </button>
  )
}

export function TopBarBack({ to, onClick, label = "Retour", "data-testid": testId }) {
  const content = (
    <>
      <Icon name="arrow_back" size={18} />
      <span className="top-bar-action-label">{label}</span>
    </>
  )
  if (to) {
    return (
      <Link to={to} data-testid={testId} className="top-bar-action top-bar-back">
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="top-bar-action top-bar-back"
    >
      {content}
    </button>
  )
}
