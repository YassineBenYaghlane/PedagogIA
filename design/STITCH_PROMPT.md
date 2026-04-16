# Stitch.ai Prompt — PedagogIA

Prompt to hand to Stitch.ai (Google) to generate the app's UI. Distills `DESIGN.md` (Curator Savant aesthetic) + issue #65 (Celestial / Savant Explorer identity), #66 (component library), #67 (constellation skill tree), #68 (IRT diagnostic), #21 (history + export), #18 (TTS), and the closed gamification issues #15/#17/#19 (XP / badges / streaks).

---

```
Design a French-language adaptive math learning web app for Belgian students aged 6–12 (FWB curriculum).
All UI copy is in French. The app is called PedagogIA.

## Creative direction — "Savant Explorer, Céleste"
Reject the toy aesthetic (no cartoon stickers, no candy colors, no comic sans).
Reject the institutional aesthetic (no clinical white, no 1px borders, no admin tables).
Instead: a sophisticated, editorial feeling — a curated night-sky planetarium.
The student feels like a young navigator charting constellations of knowledge.
Mood references: Linear's depth, Arc's craft, Duolingo's warmth, a planetarium dome.

## Palette (Celestial)
- Primary (Indigo nuit)     #1a1b3a   — backgrounds, deep surfaces
- Starlight (ivoire chaud)  #f4e8c1   — primary text / stars
- Aurora (bleu glacé)       #7dd3fc   — progress, links, live states
- Gold (solaire)            #d4a574   — XP, rewards, CTA accents
- Mint validation           #00694b   — correct answers only
- Ember error               #b45309   — errors, used sparingly, never red-bright

Surfaces are stacked like translucent paper: surface → container-low → container-high.
No solid 1px borders anywhere — separate content by tonal shift, not by strokes.
Floating elements use 80% opacity + 12px backdrop-blur (glassmorphism).
CTAs use a subtle linear gradient (primary → primary-container) and cast a soft colored shadow (blur 24px, tint from on-surface, ~6% opacity). Never drop-shadow black.
A slow-drifting starfield is the canonical background — never a flat color for main screens.

## Typography
- Display / headings: Plus Jakarta Sans, geometric, very large, editorial contrast.
- Body: Be Vietnam Pro, open and friendly, very readable for 8-year-olds.
- Hierarchy is built by size contrast (display-lg vs body-md), not by boldness alone.
- Generous whitespace; the design must "breathe."
- Rounded corners: xl (1.5rem) everywhere. No sharp corners.

## Mascot
A small star-sprite named "Lumi" appears at key moments (welcome, correct answer, rank-up, empty states). Lumi is a soft, glowing 4-pointed star with expressive eyes — warm, calm, never goofy. Provide 3–4 expressions: idle, happy, thinking, celebrating.

## Screens to design (mobile-first, then desktop)

1. **Welcome / Login / Register**
   Starfield background, Lumi floating center, large editorial headline in French
   ("Explore l'univers des maths"), email + Google OAuth buttons, glassmorphic card.

2. **Child Picker (sélection du profil)**
   Up to 4 student profiles as glass orbs with avatar, name, grade (P1–P6), rank badge.
   Asymmetric layout — orbs slightly offset, not a rigid grid.

3. **Home / Dashboard**
   Top: student name, current rank (Apprenti → Explorateur → Cartographe → Navigateur → Maître Explorateur), XP progress ring in gold, streak flame with consecutive-day count, daily goal progress bar.
   Three entry cards: "Diagnostic", "Entraînement ciblé (drill)", "Pratique libre".
   Bottom: recent sessions preview + "Voir l'historique" link.
   Lumi idle animation in a corner.

4. **Skill Tree — Constellation View**
   THE signature screen. The FWB skill tree (P1–P6, Champ 3 Arithmétique) rendered as a constellation map on the starfield.
   - Each skill = a star node with a progress ring (% mastery).
   - Mastered stars glow aurora-blue and draw luminous edges to their prerequisites, forming constellations.
   - In-progress stars pulse softly.
   - Locked stars are dim, desaturated, no glow.
   - Viewport centers on the student's current skills on mount.
   - Floating mini-map (hidden on mobile), search field that collapses on mobile, "Vue d'ensemble" button for fitView.
   - Touch-tuned pan/zoom.

5. **Exercise Screen**
   Minimal, focused. Glass card center-stage with the question in large editorial type.
   Input area adapts to type: MCQ (2–4 option cards), symbol picker (<, =, >), decomposition rows (_ dizaines + _ unités), numeric pad, drag-to-order, point-on-number-line.
   Progressive hint panel that slides up — never reveals the answer, only guides.
   Optional TTS button (speaker icon) next to the question for early readers.
   On correct: mint confirmation, Lumi celebrates, XP delta floats up.
   On wrong: warm ember, Lumi "thinking" face, AI-generated root-cause investigation question loads next.

6. **Diagnostic Flow**
   Intro screen explains the diagnostic (IRT-adaptive, up to 25 questions, reaches P1 floor to P6 ceiling). Progress indicator is abstract (constellation filling in), not a numeric bar — student shouldn't feel judged by a counter.
   Result page: per-skill buckets, per-year mastery % with confidence intervals, and one large verdict card: "Niveau FWB estimé : P4" in display type, plus a short narrative summary.

7. **Session History**
   Timeline of past sessions grouped by day. Each session = glass card with date, mode (diagnostic/drill/libre), duration, score, top 3 skills touched. Tap to expand attempt-by-attempt detail. Header has "Exporter" button → modal offering PDF summary or raw JSON.

8. **Profile**
   Rank badge large and central, XP bar, streak, total exercises, mastery heatmap over the constellation. Badges section: ~20 achievements as "Orbes de Savoir" — glass spheres in tertiary-mint with subtle labels. Locked ones are dim outlines. No childish stickers. Settings link for TTS toggle, daily goal config.

## Component library (all used consistently across screens)
- `Button` — primary (gradient + gold shadow), secondary (glass), ghost, icon. Hover = translateY(-2px) spring.
- `Card` — glass variant (backdrop-blur) and solid variant (stacked tonal surface).
- `Input` — surface-container-low, on focus brightens + ghost-border in aurora; never aggressive.
- `Modal` — glassmorphic, centered, starfield visible behind at 80% opacity.
- `Heading` — display / headline / title scales.
- `Badge` — rank, XP, streak, skill level.
- `Orbe` — the signature primitive: glass sphere for progress, lessons, badges.

## Motion
- Framer-motion-style spring physics — rebound, not linear easing.
- Page transitions: slight fade + 8px upward slide.
- Micro-interactions on every tap: buttons press down, orbs pulse, stars twinkle.
- Starfield parallax on scroll.
- Never snappy-harsh or heavy — always soft and organic.

## Do / Don't
DO: generous whitespace, tonal separation, gradient CTAs, ghost borders, tinted shadows, display-size headlines, asymmetric grids, constellation metaphors, French copy.
DON'T: 1px solid borders, black drop-shadows, bold-as-hierarchy, sharp corners, rigid grids, emoji as UI, childish mascots, toy colors, dashboards that look like Excel.

## Deliverables
High-fidelity mobile + desktop mockups for the 8 screens above, plus a components sheet showing Button / Card / Input / Modal / Badge / Orbe variants and the Lumi mascot expression set.
```
