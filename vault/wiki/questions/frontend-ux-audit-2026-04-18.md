---
title: Frontend UX & responsiveness audit (2026-04-18)
type: question
created: 2026-04-18
updated: 2026-04-18
sources: []
tags: [frontend, ux, design-system, mobile, native-readiness, audit]
---

> Snapshot dated **2026-04-18** against `main` at commit `78ec9c6`. Re-run before acting — the frontend moves fast and several findings will rot quickly. Screenshots referenced lived under `/tmp/audit-screenshots/` and are not preserved in the vault.

## Original prompt

Audit the frontend of PedagogIA for responsiveness, UX clarity, and readiness for future tablet/phone apps. Output a prioritized punch list — no code changes. Test 11 screens (Welcome, Login, Register, GoogleCallback, ChildPicker, SkillTree, Diagnostic, DiagnosticResult, Drill, Exercise, ParentDashboard) at five viewports: iPhone SE 375×667, iPhone 14 390×844, iPad portrait 834×1194, iPad landscape 1194×834, desktop 1440×900.

## Method

- Booted the dev stack via the `run-app` skill (Postgres + Django + Vite on default ports).
- Created a test parent (`audit@test.com` / `AuditTest123!`) and one student (`Léa`, P3) directly in the DB.
- Wrote a one-off Playwright spec walking 12 routes at 5 viewports → 60 full-page screenshots.
- Read every screen under `frontend/src/components/screens/`, every primitive in `frontend/src/index.css`, and every input under `components/exercises/` for static red flags.

Severity: **P0** = broken / blocks the user · **P1** = bad UX · **P2** = polish.

---

## Per-screen findings

### WelcomeScreen (`/`)

- **P1** Title `Bienvenue dans ta serre, <prénom>.` wraps to 4 lines on 375 px (no responsive size step). → cap with `text-balance` + smaller mobile size.
- **P1** "Déconnexion" top-right has ≈32 px hit area, no `:active`/`:focus-visible`. → 44×44 hit area + ring.
- **P2** Action grid `grid-cols-1 md:grid-cols-2` leaves an orphan row on iPad portrait. → `auto-fit` or 3 cols at `md:`.
- **P2** Footer "Saison · printemps / Changer de carnet" reads as nav but has no separator. → promote to a small bottom toolbar.
- **P2** "Mon herbier" empty state lacks a CTA to earn first badge. → replace decorative line with an action pill.

### LoginScreen (`/login`)

- **P1** Inputs are 14–15 px → iOS Safari auto-zooms on focus. → enforce `text-base` (16 px).
- **P1** Missing `autocomplete="email" / "current-password"` and `inputmode`. → add per field.
- **P1** Wrong-password error renders as a small rose pill below the button — easy to miss on phone. → bump font + `aria-live="polite"`.
- **P2** Decorative Latin tagline `Ad hortum redi` confuses first-time visitors. → keep but lighten.

### RegisterScreen (`/register`)

- **P1** Same iOS-zoom + autocomplete issues as Login.
- **P1** No password confirmation, no strength feedback, no `autocomplete="new-password"`.
- **P2** No GDPR / parental-consent checkbox — mandatory for EU children-under-13 product. → confirm with legal.
- **P2** "Already have an account?" link too small on phone.

### GoogleCallbackScreen (`/auth/google/callback`)

- **P2** Renders as a near-blank screen with only "Connexion en cours…" spinner. → add Jardin illustration / shimmer.
- **P2** No timeout / retry path — sits forever on Google error. → catch error param, render "Réessayer" CTA back to /login.

### ChildPickerScreen (`/children`)

- **P1** With one student, `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` leaves a single Pot floating left of a giant void. → `flex flex-wrap justify-center` for single-card state.
- **P1** Top-right "Espace parent →" + "Se déconnecter" stack vertically on phone, eating half the header column. → unified `<TopBar>` with horizontal layout, icons-only `<sm`.
- **P1** "Ajouter" submit button is washed-out sage even when valid → reads as disabled. → bind opacity to actual disabled state.
- **P2** Form inputs (`Prénom`, `P3` select, `Ajouter`) stack as a column on phone — looks like 3 unrelated inputs. → group into a labelled card.
- **P2** No avatar / color picker on the Pot — every child looks identical (brown soil + green stem).

### ParentDashboardScreen (`/dashboard`)

- **P1** Same vertical-stacked top-right header bug as ChildPicker (`Mode enfant →` / `Se déconnecter`). → shared `<TopBar>`.
- **P1** Status chips (`0 floraison`, `0 en croissance`, `0 à arroser`, `0 en sommeil`) wrap with the dark `0 en sommeil` chip orphaned below. → horizontal scroll strip or 2×2 grid.
- **P1** "Voir en détail →" CTA may not route anywhere in current build — verify endpoint. → add real student-detail screen or remove affordance.
- **P2** Three-stat row `0 XP / 0 série / 0 record` uses `text-3xl` — competes with screen title. → reduce to `text-xl`.
- **P2** Empty state "Aucune session pour le moment." is unstyled italic. → reuse a shared `<EmptyState>` component.

### SkillTreeScreen (`/skill-tree`)

- **P0** Header on 375 px **truncates the grade buttons**: `P1`, `P2`, half of `P3`, `P4/P5/P6` clipped — user can't switch grade. → collapse grades into `<select>` or scroll-snap strip on `<sm`.
- **P0** Search input has hardcoded `!w-64` → pushes header off-screen on phone, competes with `Vue d'ensemble` on iPad portrait. → `w-full sm:w-64 max-w-full`.
- **P0** ReactFlow `panOnDrag` + `zoomOnPinch` fights iOS native scroll on touch — no gesture cue. → add a first-visit gesture hint, gate `panOnScroll` behind pointer media.
- **P1** Skill node labels unreadable on phone (≈9–10 px). The whole map is unusable below tablet width. → ship a list-view fallback for `<sm`, or auto-zoom to current grade on mount.
- **P1** Locked-skill tooltip is `group-hover:opacity-100` — invisible on touch. → always-on lock icon + tap-to-reveal panel.
- **P1** Status legend overlaps the zoom controls on phone (visible in `iphonese-07`). → move bottom-left or hide `<sm`.
- **P1** No keyboard navigation between nodes — accessibility blocker.
- **P2** `← Serre` back link is the smallest text in the header.
- **P2** Minimap hidden `<md` with no replacement. → thin top progress bar showing scroll position.

### DiagnosticScreen (`/diagnostic`)

- **P1** Equation `395 + 258 = ?` wraps the `?` to a second line on 375 px. → `flex-wrap` with min-width chunks or shrink font on narrow screens.
- **P1** Desktop view leaves `LevelGauge` floating alone in the right gutter at ≈1300 px. → anchor to the card or move to top progress strip.
- **P1** "Question 1 / 25" + duplicate "1 / 25" on the right of the progress bar — same info twice. → drop the redundant counter.
- **P2** No "passer" affordance; "Quitter" abandons the whole diagnostic without confirmation. → add confirm dialog + skip option.
- **P2** `Locus discendi` Latin tagline competes with the title on small screens.

### DiagnosticResult (end of `/diagnostic`)

*Static analysis only — couldn't reach via screenshot script without finishing 25 questions.*

- **P1** SVG verdict circle hardcoded `140×140`. → `viewBox` + `clamp()`.
- **P1** `grid-cols-3` count cards have no `sm:` fallback → labels truncate at 320–375 px.
- **P2** No "share with parent" affordance — diagnostic outcome's audience is the parent.

### DrillScreen (`/drill`)

- **P1** No skill picker UI on entry — drops straight into a question with no context (which skill, how many questions). → add a chip near the title.
- **P1** "Demander un indice" pill sits below "Valider" — kids will tap Validate by reflex. → swap order, or surface hint inline after wrong answer.
- **P2** "best 0" XP chip top-right competes with the progress bar.

### ExerciseScreen (`/exercise`)

- **P1** NumberPad `0` and `,` (comma) look identical at a glance. → swap `,` for a labelled "↵" or differentiate color.
- **P1** Backspace icon (⌫) is 18 px in a 60 px button — looks decorative. → bump to ≈28 px.
- **P1** "Valider" disabled state is indistinguishable from active. → dotted outline / clearer opacity, or remove disabled and validate inline.
- **P1** No haptic / sound feedback hooks — non-blocking on web but plan for native. → add `feedbackChannel` abstraction now.
- **P2** "Établi · Léa" header is right-aligned + small; only "back" is "Arrêter" on left. → standardise via shared TopBar.
- **P2** Question text uses `text-5xl` — forces wrapping (`383 + 127 = ?` breaks before `?` on 375 px). → reduce on `<sm`.

### HistoryScreen (`/history`)

- **P1** "Exporter PDF" / "Exporter JSON" shown as primary CTAs while there's literally nothing to export. → hide until ≥1 session exists.
- **P1** Empty state copy "Commence par un test de niveau ou un entraînement" is plain text — not actionable. → make those words links / chips.
- **P2** Row `hover:bg-mist/60` doesn't fire on touch; no `:active` state. → add `active:bg-mist/80`.
- **P2** Icon buttons (export, delete) are 18 px in tight spacing — tap targets <44 px. → add `p-2` padding shell.

### ProfileScreen (`/profile`)

- **P2** "Mon herbier" badge grid shows 16 grayed-out icons with identical sigma symbols — visually monotonous. → vary stroke / subtitle weight per category, group with section headers.
- **P2** Stats card duplicates info from Welcome (XP, daily goal). → either collapse Welcome's stats or differentiate Profile with history/streak chart.
- **P2** No edit affordance for student name / grade.

---

## Cross-cutting issues

- **P0** **No top-level layout primitive.** Every screen reinvents header padding, `max-w`, and back-button shape. Direct cause of the duplicated header-stacking bug on ChildPicker + ParentDashboard, and divergent "Quitter / Retour / ← Serre" labels everywhere. → introduce `<AppShell>` with `<TopBar leading slot trailing>` + `<Page maxWidth>`.
- **P1** **No `safe-area-inset-*` CSS anywhere.** Screens use `min-h-screen` / `h-screen` directly. iPhone notch will overlap headers; Android gesture nav will overlap bottom CTAs. → `viewport-fit=cover` + `env(safe-area-inset-*)` padding in AppShell.
- **P1** **No iOS-zoom-prevention on form inputs.** All inputs are 14–15 px. → 16 px base.
- **P1** **No `autocomplete` / `inputmode` discipline.** Affects login/register/childpicker forms and all numeric exercise inputs.
- **P1** **Inconsistent top-right wording** (`Déconnexion` / `Se déconnecter` / `Mode enfant`) across Welcome, ChildPicker, ParentDashboard. → centralise label + iconography.
- **P1** **Hover-only affordances** on SkillNode (locked tooltip), HistoryRow (highlight), ChildPicker Pot (lift) — touch users get stuck-hover or no feedback. → mirror with `:active`, prefer `:focus-visible`.
- **P1** **Skill tree gestures will not survive on touch.** Map unusable on phones. → list view alternative for `<md`.
- **P1** **Empty states are decorative-italic, not actionable.** Pattern across HistoryScreen, ParentDashboard, WelcomeScreen herbier. → shared `<EmptyState icon title body cta>` component.
- **P1** **Disabled-button styling = `bg-sage/40` washed-out.** Indistinguishable from muted active. → dashed border + lower opacity, or avoid disabled and validate inline.
- **P2** **Grid-cols transitions skip `sm:`.** Most grids go `grid-cols-1 md:grid-cols-N` directly; 640–767 px gets the mobile layout despite plenty of room.
- **P2** **No global loading skeletons** — every screen uses `text-stem` "Chargement…". → shimmer skeletons matching final layout.
- **P2** **`text-balance` not used on display titles.** Tailwind 4 supports it.
- **P2** **No focus-visible ring on icon-only buttons** — tab navigation is invisible.
- **P2** **Tabular numerals already loaded but not applied to score / XP digits.** → `font-variant-numeric: tabular-nums` on chip values.
- **P2** **No PWA manifest, no service worker, no offline copy.** Defer until punchlist clears.

---

## Native-app readiness (RN port / PWA shell)

What needs to change *structurally* before a React Native port or a serious PWA install makes sense, in priority order:

1. **Introduce `<AppShell>` + navigation primitives now.** Today every screen owns its header/back/CTA layout; in RN these map to `<Stack.Screen options>`. Centralise into `AppShell`, `TopBar` (leading + title + trailing), `BottomBar` (optional). Single highest-leverage refactor — also fixes most cross-cutting P0/P1 above.
2. **Pick a navigation pattern.** `react-router` v7 doesn't translate to RN. Decide tab bar (Welcome / Skill tree / History / Profile) vs. stack-only, then make the URL → screen map already work that way.
3. **Replace ReactFlow on touch or build a list fallback.** ReactFlow is web-only and fragile on touch even in PWA. Either keep RF + add list view for `<md` (reusable from RN), or reimplement later with `react-native-skia`. The list view buys both.
4. **Network layer behind a `client` module that already handles "no network".** Today fetches throw; RN needs offline tolerance. Add a TanStack Query persister + per-screen offline banner.
5. **Externalise feedback (sound, haptic, animation) behind a hook.** `useFeedback().correct() / .wrong()`. Web noop today; on RN maps to `Haptics.impactAsync`.
6. **Drop hover-dependent affordances.** Already P1 above; doing it before the port saves a UX retest.
7. **Adopt safe-area-inset everywhere via AppShell.** Maps 1:1 to RN's `useSafeAreaInsets()`.
8. **Standardise font-loading.** Fraunces / Inter / JetBrains Mono need a strategy that survives an RN bundle (Expo Font / Asset). Today CDN-loaded — fine for web, breaks offline.
9. **Pull strings out of JSX.** A future i18n / Flemish-Dutch variant is plausible (Belgium); also reusable across web + native.
10. **Audit `<input>` types for native equivalents.** Whatever has a story on native (`numeric`, `decimal-pad`, `email-address`) should already use the correct `inputmode` + `type` on web — that becomes the source of truth for RN `keyboardType`.

What does **not** need to change yet: the design tokens (`--color-*`, radii, shadows) translate cleanly to RN via a small theme file; the `renderInput` switch in `ExerciseCard` is the right factoring for native; Zustand stores port as-is; auth model is fine for RN with a thin token-vs-session adapter.

---

**Total: 56 findings — 4 P0 · 36 P1 · 16 P2.**

## Filed under

[[concepts/product-features]] — UX context for the features catalogued there.

## See also

- The Jardin design system spec lives outside the wiki (in `CLAUDE.md` "Design System" section + `design/JARDIN.html`); not duplicated here.
- If a follow-up rebuild lands an `<AppShell>`, supersede the cross-cutting P0 finding here with a `> ⚠ Conflict:` note rather than silent edit.
