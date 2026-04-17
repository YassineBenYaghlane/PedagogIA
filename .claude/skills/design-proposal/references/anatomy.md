# Preview anatomy

Every design proposal HTML must include these four sections, in order. This is what makes the artifact decision-ready rather than a loose sketch.

## 1. Header

One paragraph. Name the theme, state the metaphor, chip the metadata.

Required:
- Theme name + optional italic tagline in the signature font
- A chip with a version tag (e.g. `Atelier · v1`)
- A sentence of rationale — the one thing this direction commits to
- Two or three metadata chips: target audience, stack, accessibility claim

The header sets the reviewer's expectation. If a stakeholder can't summarize the proposal from the header alone, rewrite the header.

## 2. Sticky nav

A sticky bar with one pill per frame + one for the tokens section. The bar uses `backdrop-blur` and the theme's surface color at ~85% opacity. Links jump via `href="#s-<slug>"` and the frames set the matching `id`.

Must remain usable on narrow viewports (overflow-x-auto).

## 3. Grid of frames

The main course. `<main>` is a CSS grid that holds every frame. Each frame is a `<section>` with:
- `id="s-<slug>"` — target for sticky nav
- Below it: a device frame div (tablet or browser), and underneath, a 1-line caption: `<span class="frame-num">①</span> <strong>Accueil</strong> — <span class="muted">couverture du cahier</span>`

Standard screens to include (adapt names to the theme):
1. Accueil (entry, pre-auth or welcome)
2. Choix du profil/cahier/carnet (child picker)
3. Carte/Programme (skill tree / curriculum)
4. Exercice (active exercise — the heart of the app)
5. Correction / Feedback (wrong-answer flow with AI investigation)
6. Bulletin / Dashboard (progress, XP, streak, badges)
7. Célébration / Rang acquis (XP-up or rank-up moment)

Optional extras when relevant: diagnostic result, history / session log, parent view, settings.

## 4. Tokens section (don't skip this)

An implementation handoff inside the preview. Three columns, each a card:

### Palette
Swatches in a 2-column list. Each row: colored square + name + hex + short role ("primaire", "validation", "fond", "accent XP"). At minimum: primary, surface, text, accent, success, error.

### Typography
Live specimens of each font:
- Display/serif: show a 28–32px italic sample
- UI/sans: show a 16–18px bold sample
- Body: a paragraph at the actual reading size
- Numeric/mono: a mono sample for numbers-heavy moments
Below each: the Google Fonts import line or a short tech note.

### Principes
5–7 rules, numbered or bulleted. Each starts with a strong verb or noun, then a sentence. Examples:
- "Le laiton = mérite." — we reserve ochre for stamps, XP, rewards
- "Papier avant UI." — surfaces carry a grain, not a flat fill
- "L'erreur s'annote." — no harsh red; margin notes in the teacher's voice

These principles become the rubric for future design choices.

## Bonus — Anti-patterns card

After the three token columns, add a dashed-border card titled **À éviter** listing 4–6 things this direction explicitly refuses. This is where you bake in the product brief's constraints:

- No mascot
- No emoji in UI chrome
- No rainbow gradients
- No sharp red for errors (we chose a softer rust/tomato)
- No more than 3 accent colors in one component
- No Lorem Ipsum — every example uses real content

Stakeholders catch drift fastest against a written "no" list.

## Content conventions

- **Language:** French everywhere in UI (PedagogIA's target is FWB).
- **Concrete content:** real names (Noé, Aya, Margaux), real math (`347 + 185`, tables de 4), real streaks ("5 jours"), real session durations ("12 min").
- **Icons:** inline SVG only. Heroicons/Lucide tracing style (1.6–2px stroke, `stroke-linecap="round"`). No emoji characters in UI.
- **Motion:** 150–300ms for hover/press. Respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0ms !important; transition-duration: 0ms !important; }
  }
  ```
- **A11y:** verify 4.5:1 body-text contrast on the chosen background before declaring AA. State the contrast in the header chip.

## Framework and dependencies

- Tailwind via CDN (`https://cdn.tailwindcss.com`), with `tailwind.config` inlined in a `<script>` to extend colors/fonts.
- Google Fonts via `<link>` in `<head>`.
- No JS frameworks, no build step, no bundler. Everything self-contained in the HTML file.

The preview opens by double-clicking the file. If opening it requires a server, a step, or an install, it's not a design preview — it's a coding task.
