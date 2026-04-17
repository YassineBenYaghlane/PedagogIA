import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Clock,
  Download,
  CheckCircle2,
  Circle,
  Delete,
  Droplets,
  Flame,
  Flower2,
  GitBranch,
  Home,
  Leaf,
  Lightbulb,
  LineChart,
  Loader2,
  LogOut,
  Play,
  Sparkles,
  Sprout,
  Star,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react"

const ICONS = {
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  account_tree: GitBranch,
  backspace: Delete,
  bolt: Zap,
  book: BookOpen,
  cancel: XCircle,
  check: Check,
  check_circle: CheckCircle2,
  circle: Circle,
  download: Download,
  droplets: Droplets,
  flame: Flame,
  history: Clock,
  flower: Flower2,
  home: Home,
  insights: LineChart,
  leaf: Leaf,
  lightbulb: Lightbulb,
  logout: LogOut,
  play_arrow: Play,
  progress_activity: Loader2,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  target: Target,
  trophy: Trophy,
  award: Award,
}

export default function Icon({ name, fill, className = "", size = 18 }) {
  const Cmp = ICONS[name] ?? Circle
  return (
    <Cmp
      aria-hidden="true"
      className={className}
      size={size}
      strokeWidth={fill ? 2.2 : 1.75}
      fill={fill ? "currentColor" : "none"}
    />
  )
}
