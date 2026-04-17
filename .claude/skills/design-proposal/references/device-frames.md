# Device frames

Two frame types, one skill: **tablet** (portrait) and **browser** (landscape desktop window). Phone frames are out of scope — PedagogIA ships on tablet and browser.

Both frame wrappers must carry `class="preview-frame"` and `data-name="NN-slug"` so `shoot.mjs` can discover and screenshot them.

## Tablet — iPad 11"

Natural viewport: **834 × 1194** (points). Use this at 1:1 inside the preview; the bezel adds ~20px of matte black around.

```html
<section id="s-accueil" class="preview-frame" data-name="01-accueil">
  <div class="tablet">
    <div class="tablet-screen">
      <!-- app content here, sized 834 x 1194 minus safe area -->
    </div>
  </div>
</section>
```

```css
.tablet {
  width: 834px;
  height: 1194px;
  border-radius: 40px;
  background: #1a1a1a;
  padding: 18px;
  box-shadow:
    0 60px 120px -60px rgba(0, 0, 0, 0.4),
    0 2px 0 0 rgba(255, 255, 255, 0.05) inset;
  position: relative;
}
.tablet-screen {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}
/* Front-facing camera dot */
.tablet::before {
  content: "";
  position: absolute;
  top: 8px; left: 50%;
  transform: translateX(-50%);
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #000;
  box-shadow: 0 0 0 2px #1a1a1a;
}
```

For meeting presentations, 834×1194 is large. Scale down the whole frame if needed:

```css
.tablet { transform: scale(0.6); transform-origin: top left; }
```

## Browser — 1440 × 900 desktop window

```html
<section id="s-dashboard" class="preview-frame" data-name="02-dashboard">
  <div class="browser">
    <div class="browser-chrome">
      <span class="dot red"></span>
      <span class="dot amber"></span>
      <span class="dot green"></span>
      <div class="url">pedagogia.be / dashboard</div>
    </div>
    <div class="browser-screen">
      <!-- app content at 1440 x 860 -->
    </div>
  </div>
</section>
```

```css
.browser {
  width: 1440px;
  height: 900px;
  border-radius: 14px;
  background: #d8d8d8;
  overflow: hidden;
  box-shadow:
    0 40px 80px -40px rgba(0, 0, 0, 0.35),
    0 1px 0 0 rgba(255, 255, 255, 0.6) inset;
}
.browser-chrome {
  height: 40px;
  background: linear-gradient(to bottom, #ececec, #d8d8d8);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.browser-chrome .dot {
  width: 12px; height: 12px; border-radius: 50%;
}
.browser-chrome .red    { background: #ff5f57; }
.browser-chrome .amber  { background: #febc2e; }
.browser-chrome .green  { background: #28c840; }
.browser-chrome .url {
  flex: 1;
  margin: 0 12px;
  background: #ffffff;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font: 500 12px/1 ui-sans-serif, system-ui;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.browser-screen {
  width: 100%;
  height: calc(100% - 40px);
  background: #fff;
  overflow: hidden;
  position: relative;
}
```

Scale to fit the layout grid:

```css
.browser { transform: scale(0.45); transform-origin: top left; }
```

## Choosing which frames to show

Default: **one tablet frame + one browser frame per screen** (so 7 screens × 2 = 14 frames). That is a lot — acceptable for a full proposal.

If the user picks a single target in the interview, use only that frame. If time is tight, use tablet for screens where mobile/touch matters most (exercice, feedback) and browser for screens that are dashboard-dense (bulletin, programme).

## Grid layout for the preview page

```css
main {
  display: grid;
  grid-template-columns: 1fr;               /* mobile fallback */
  gap: 48px;
  padding: 40px;
}
@media (min-width: 1024px) {
  main { grid-template-columns: repeat(2, max-content); }
}
@media (min-width: 1920px) {
  main { grid-template-columns: repeat(3, max-content); }
}
```

The `shoot.mjs` strip generator expands `main` to a single row at screenshot time, so keep the grid simple — no nested flex inside the frame's parent.
