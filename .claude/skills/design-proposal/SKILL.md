---
name: design-proposal
description: Produce a complete new visual direction for an app — theme, palette, typography, component treatment — and deliver it as an interactive HTML preview plus a folder of PNG screenshots ready to share in a meeting. Trigger whenever the user says "propose a new design", "try another theme", "new design direction", "redesign", "do a different look", "design mockups", "propose a visual identity", or asks for a design variation. Also use proactively when the user seems unsatisfied with the current aesthetic or wants to explore alternatives before committing. Always grounds recommendations in the `ui-ux-pro-max` skill and produces deliverables sized for tablet (834×1194) and browser (1440×900), since PedagogIA ships on both.
---

# Design Proposal

A design proposal is a **decision-ready artifact**: a concrete visual direction the user can show in a meeting, feel in a browser, and either approve or redirect. It is not a vibe doc, not a Figma link, not a list of adjectives. At the end of this skill you will have:

1. `design-ceb/<THEME>.html` — a single self-contained preview (Tailwind CDN + Google Fonts).
2. `design-ceb/<theme>-screens/` — auto-generated PNGs of each screen + an overview + a side-by-side strip.

Both targets (tablet and browser) should be visible in the preview unless the user narrows scope. Keep the app's current product goals in mind — read `CLAUDE.md` and skim open issues (`gh issue list`) so the mockup reflects what's actually being built, not a generic redesign.

## When to trigger

Strong signals: "propose a new design", "new theme", "redesign", "try a different direction", "design proposal", "mockup a new look", "can you show me another option", "I don't like the current aesthetic".

Soft signals: the user references design docs (`design-ceb/`), mentions a prior proposition without being happy with it, asks about palette/typography/identity choices, or wants something to share in a stakeholder meeting.

Don't trigger for: micro-tweaks to existing components, single-color/spacing changes, real production UI work (use the `ui-ux-pro-max` skill alone for those).

## Workflow — five steps

### Step 1 — Interview (don't skip this)

Before building anything, ask **2–4 focused questions** using the `AskUserQuestion` tool. Never guess at theme or audience. The goal is to avoid throwing away a 700-line HTML file because the user wanted "warm" and you made "cool".

Template questions, in priority order:

1. **Theme direction** — offer 3–4 concrete metaphors with 1-line previews. Good metaphors are evocative nouns that justify the whole design (e.g. "Atelier / Inventor's workshop", "Cartographer", "Modernist schoolbook", "Botanical garden"). Bad ones are adjectives ("modern", "clean"). Include short ASCII mock previews when options compete on feel.
2. **Audience strategy** — if the app serves a wide range (e.g. kids 6–12, both learners and parents), ask whether one unified design or tiered variants. Default: unified.
3. **Form factor** — "browser only", "tablet only", or "both" (default). PedagogIA ships on both, so both is the sensible default.
4. **Delivery format** — interactive HTML + screenshots (default), or just a design-system document. Screenshots are for meetings, HTML is for clicking through, tokens doc is for implementation reference.

Include previous attempts in the context: if there's an existing `design-ceb/*.html`, mention what was tried so the new proposal is genuinely different. Users rarely want "v2 but slightly different" — they want a contrasting alternative.

### Step 2 — Ground in `ui-ux-pro-max`

Run the design-system search to get a canonical palette, typography, and anti-pattern list for the chosen theme:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<theme keywords> <product type> <audience>" --design-system -p "<theme name>"
```

**Take the output as a starting point, not gospel.** The engine is tuned for generic SaaS; for PedagogIA (French-language, Belgian school kids, FWB curriculum) you will usually need to swap one accent color or pick a different font to match the metaphor. The tool helps you avoid blindly picking a clashing palette — it's not a replacement for taste.

What to extract:
- Palette hex codes (primary / accent / background / text — verify AA contrast 4.5:1)
- Font pairing (load from Google Fonts CDN)
- Effects (shadow style, corner radius, hover behavior)
- Anti-patterns (print the "AVOID" section in your final tokens section so reviewers see the constraint)

Supplement with targeted searches if needed:
- `--domain typography "<mood>"` for alternate fonts
- `--domain color "<product-type>"` for palette variations
- `--domain ux "animation accessibility"` for motion defaults

### Step 3 — Build the preview

Create `design-ceb/<THEME>.html`. One self-contained file: Tailwind CDN + Google Fonts CDN + inline `<style>` + inline HTML. No build step. No external JS.

**Required anatomy** (see `references/anatomy.md` for details):
- Header with theme name, short rationale chip, metadata chips (audience, stack, accessibility)
- Sticky nav to jump between screens
- Grid of **device frames** (tablet and/or browser — see `references/device-frames.md` for exact dimensions and chrome). Each frame is a `<section>` with an `id` starting `s-` for nav targeting.
- **7 screens minimum** covering the golden path of the app. For PedagogIA: Accueil, Choix du cahier/carnet, Carte/Programme (skill tree), Exercice, Correction/Feedback, Bulletin/Dashboard, Célébration. Adapt names to the theme.
- **Tokens section at the bottom**: palette swatches with hex codes, typography specimens, 5–7 principles, and an "À éviter / Anti-patterns" box.

**Frame rules** (see `references/device-frames.md` for CSS):
- Tablet frame: 834×1194 iPad-shape, dark bezel, rounded corners.
- Browser frame: 1440×900 window shape with address bar chrome (three dots, URL pill).
- Never mix mobile phone frames into this skill's output — PedagogIA targets tablet and web. Phone mockups belong to a different context.
- Frames must have `class="preview-frame"` and `data-name="XX-slug"` (e.g. `data-name="01-accueil"`) so the screenshot script can find them.

**Content rules**:
- All UI text in French (PedagogIA is French-language). Technical terms may be English in code comments only.
- Use real content, not Lorem. Include concrete numbers (XP, streaks, exercise content), realistic names (Noé, Aya, Margaux), actual math operations (e.g. `347 + 185`).
- No emojis as icons — use SVG (inline, Heroicons/Lucide style).
- No "Lumi" mascot or any cutesy character — PedagogIA's design brief rejects toy aesthetics.
- Respect `prefers-reduced-motion` in any CSS animations you add.

See `references/anatomy.md` for the full template and `references/device-frames.md` for the frame CSS.

### Step 4 — Screenshot

Run the bundled Playwright script:

```bash
mkdir -p design-ceb/<theme>-screens
node .claude/skills/design-proposal/scripts/shoot.mjs design-ceb/<THEME>.html design-ceb/<theme>-screens
```

The script auto-discovers every `.preview-frame` element, screenshots each one individually, then takes a full-page overview and a side-by-side strip. Output files:
- `01-*.png` through `NN-*.png` — one per frame (filename from `data-name`)
- `00-overview.png` — full page, useful as a deck cover
- `08-strip.png` (or similar) — all frames in a single row, great as a one-slide comparison

Requires Playwright to be installed somewhere reachable. In PedagogIA, `frontend/node_modules/@playwright/test` is the canonical path and the script imports from there by default. If Playwright isn't present, the script prints a clear error — tell the user to run `cd frontend && npm install` rather than silently failing.

### Step 5 — Present

Open both artifacts for the user:

```bash
open design-ceb/<THEME>.html
open design-ceb/<theme>-screens
```

Then summarize in 4–6 lines:
- Theme name + one-line identity
- Palette (3 hex codes max)
- Typography choice
- What's different from any prior proposal
- One honest nit, if you spotted one during screenshotting (e.g. "the keypad clips 'Corriger' in the tablet frame — say the word and I'll fix")

End by offering the next move: iterate on this theme, try another theme, or commit and extract design tokens.

## What "good" looks like

- **Opinionated.** Each proposal commits to a metaphor. "Atelier" has brass stamps and parchment; "La Classe" has red pen and Seyès lines. Don't hedge with neutrals.
- **Self-contained.** Open the HTML, it works. No build, no missing fonts, no 404s.
- **Contrasts prior attempts.** If the previous proposal was warm serif + beige, your next one should probably be cool sans + white. Don't converge on "everyone's favorite".
- **Actionable tokens.** A teammate should be able to read the tokens section and port the design into React components without asking you for hex codes.
- **One honest nit.** Design is iterative. Flagging one clipping, one tight fit, one font rendering quirk signals you actually looked at the output.

## What to avoid

- **Starting to code before the interview.** The cheapest minute in this workflow is asking 3 questions.
- **Copying the `ui-ux-pro-max` output verbatim.** It's a starting point. The engine doesn't know PedagogIA's audience.
- **Mobile phone frames.** Wrong form factor — the app is browser + tablet.
- **Mascots, emojis in UI, rainbow gradients.** The product brief rejects these.
- **Lorem Ipsum.** Mockups with placeholder text look unfinished in a meeting.
- **More than 3 concurrent accent colors in any single component.** Disciplined palette beats maximalist every time.
- **Claiming the design is "accessible" without verifying contrast.** If you say AA, check a representative color pair (e.g. body text on background) with a contrast calculator.

## File conventions

```
design-ceb/
├── <THEME>.html                (caps, single theme name: ATELIER.html, CLASSE.html)
├── <theme>-screens/            (lowercase, with -screens suffix)
│   ├── 00-overview.png
│   ├── 01-<slug>.png
│   ├── ...
│   ├── 07-<slug>.png
│   ├── 08-strip.png
│   └── _shoot.mjs              (optional — copy of the run script for reproducibility)
```

Keep each proposal isolated. Don't overwrite a prior proposal unless the user explicitly says so — side-by-side comparison is often the point.

## References

- `references/anatomy.md` — required sections of the preview HTML, with copy-paste CSS for frames, nav, tokens grid.
- `references/device-frames.md` — exact dimensions, bezel / chrome CSS for tablet and browser frames.
- `scripts/shoot.mjs` — the Playwright screenshot script (auto-discovers frames via `data-name`).
- `assets/skeleton.html` — minimal HTML boilerplate with both frame types wired up. Start from this, don't start from scratch.

Existing proposals in the repo (study for anatomy, not style):
- `design-ceb/ATELIER.html` + `atelier-screens/` — warm, serif, parchment + teal + brass.
- `design-ceb/CLASSE.html` + `classe-screens/` — modernist schoolbook, navy + tomato + mustard, Seyès paper.
