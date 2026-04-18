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
  FileText,
  Flag,
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
  Settings,
  Sparkles,
  Sprout,
  Star,
  Target,
  Trash2,
  Trophy,
  User,
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
  description: FileText,
  download: Download,
  droplets: Droplets,
  flag: Flag,
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
  settings: Settings,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  target: Target,
  trash: Trash2,
  trophy: Trophy,
  user: User,
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
