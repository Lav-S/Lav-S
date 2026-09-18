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
