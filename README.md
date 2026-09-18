# Lavneet Sidhu, Portfolio

A neumorphic (Soft UI) single-page portfolio with a live animated background,
parallax depth layers and a full transition system. No build step, no framework,
no runtime dependencies.

## Run it locally

```bash
node serve.js          # http://localhost:5173
node serve.js 8080     # or pick your own port
```

Any static server works: `npx serve .`, `python -m http.server`, VS Code Live
Server. Opening `index.html` directly over `file://` also mostly works, but the
résumé link behaves better over HTTP.

## Adding project links

This is the only file you need to touch: **`js/data.js`**.

Each project may define two link slots:

```js
{
  title: "FireRoute, Wildfire Routing Platform",
  ...
  repo : "#",   // TODO: repository link
  demo : "#"    // TODO: demo video link
}
```

A slot left as `"#"`, empty, or omitted renders **no button at all**, so the
live site never shows a control that goes nowhere. Paste a real URL in and the
button appears. Nothing else to change.

Project Heimdall omits both slots on purpose and shows a `note:` status line
instead, plus a `metrics:` strip of benchmark figures on its card.

`js/data.js` also holds the skill bars, skill categories, the filter chips and
the rotating hero taglines.

## Structure

```
index.html            all page content
css/style.css         design tokens, neumorphic primitives, layout, animation
js/data.js            projects, skills, roles  (EDIT THIS)
js/main.js            background renderer, parallax, reveals, interactions
assets/               résumé PDF
assets/img/           headshot and photography
serve.js              local static server
```

## Content notes

- **No emoji anywhere.** Every glyph that used to be an emoji or a pictographic
  character (project icons, award medals, the theme toggle, arrows, the
  certification ticks) is now inline SVG or a drawn CSS shape. The icon set
  lives in the `ICONS` map at the top of section 5 in `js/main.js`; a project
  picks one by name via `icon: "radar"`.
- **No em dashes.** Copy uses commas, colons and periods instead.
- Images carry `width`/`height` attributes to reserve layout space, so every
  rule that sizes one also sets `height:auto`. Without that the attribute wins
  as a presentational hint and `aspect-ratio` is ignored.

## Motion system

Revamped against Emil Kowalski's design-engineering skill
([emilkowalski/skills](https://github.com/emilkowalski/skills)). The rules that
shaped it, and where they live:

- **Interface motion stays under 300ms.** Durations are tokens in `:root`:
  `--t-press` 140ms, `--t-hover` 200ms, `--t-pop` 240ms, `--t-panel` 300ms.
  The only longer values are things seen once per visit (`--t-reveal` 460ms,
  `--t-hero` 700ms) or deliberately decorative (`--t-photo` 700ms photo zoom,
  `--t-bar` 900ms skill meters) plus the ambient canvas fade-in.
- **Stronger curves than the CSS built-ins.** `--ease-out` for entering and
  exiting, `--ease-in-out` for things moving across the screen (the nav pill,
  the nav shrink), `--ease-drawer` for the mobile menu. No `ease-in` anywhere:
  it delays the moment the user is watching most closely.
- **No bounce.** The old spring-ish curve was removed from every functional
  control. A portfolio for engineering work should read crisp, not playful.
- **Press feedback on everything pressable.** `scale(.97)` at 140ms, so the
  interface confirms it heard the tap.
- **Hover motion is gated** behind `@media (hover:hover) and (pointer:fine)`
  (section 26). Touch devices fire `:hover` on tap, which otherwise leaves
  elements stuck mid-transform after a finger lifts.
- **Only transform, opacity and clip-path animate.** The skill meters used to
  animate `width`, which forces layout every frame; they now use
  `clip-path: inset()`, which composites and leaves the gradient undistorted.
- **The mobile menu is origin-aware**, scaling from the burger that opens it
  rather than its own centre, and closes faster than it opens.
- **Reduced motion is gentle, not off.** Opacity and colour transitions still
  run so state changes remain legible; everything that moves is dropped.

## How it works

**Neumorphism.** Everything is one surface colour (`--surface`) lit from the
top-left. `--d-raise` pushes an element out with a dark/light shadow pair,
`--d-press` pushes it in with the same pair inset. Hover states generally
transition raised to pressed. The whole palette, both themes, lives in the
`:root` blocks at the top of `style.css`.

**Live background.** Two stacked canvases:

- `#bgOrbs`, five drifting colour orbs. Drawn into a deliberately tiny ~300px
  backing store that CSS upscales to full-bleed. The upscale does most of the
  smoothing, so the CSS blur stays small. Orbs are pre-rendered sprites
  (`drawImage`), not gradients rebuilt every frame, and the layer is repainted
  about 20 times a second because a large blurred layer is expensive to
  recomposite.
- `#bgNet`, a pointer-reactive particle mesh. Links are bucketed by opacity so
  the field draws in about 5 `stroke()` calls rather than one per line, at 30fps.

Both idle while the tab is hidden.

**Parallax.** Native scroll, but every parallax layer moves on a *lerped* copy
of `scrollY`, which gives the floaty inertia without hijacking the scrollbar, so
`position: sticky`, IntersectionObserver, anchors and mobile all still behave.
Elements opt in with `data-depth="0.05"`.

**Boot order.** There is no preloader, and nothing gates the content. It runs in
two phases:

1. *Immediately*, at parse time: text splitting, project and skill rendering,
   the reveal observers, tilt, magnets, scroll-spy and the hero entrance. The
   page is readable and interactive in about 200ms and waits on nothing, not
   fonts, not images, not the `load` event.
2. *After the first painted frame* (`requestIdleCallback` then two `rAF`s): the
   canvas background initializes and fades in behind content that is already on
   screen. If the page opens in a background tab, rAF is starved, so phase 2 is
   deferred until the tab is actually viewed.

The hidden states for reveals live under `html.js`, which an inline script in
`<head>` sets. If the script fails or is blocked, every section renders normally
instead of staying invisible.

**Transitions.** Per-letter heading reveals, `IntersectionObserver` scroll
reveals, 3D pointer tilt, magnetic buttons, a custom cursor with contextual
labels, scramble text on the hero role, counting stats, a drawing timeline rail,
and a sliding nav pill.

**Themes.** Light and dark neumorphic palettes. Follows the OS by default and
remembers an explicit choice in `localStorage`.

**Reduced motion.** `prefers-reduced-motion: reduce` disables the canvas
animation, the parallax lerp and every reveal, leaving all content visible.

## Deploying

Plain static files. Serve the repo root from any static host, or drop the folder
on Netlify, Vercel or Cloudflare Pages. Nothing to configure.
