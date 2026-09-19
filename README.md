# Lavneet Sidhu, Portfolio

A glassmorphic single-page portfolio with a live animated background, parallax
depth layers and a full transition system. No build step, no framework, no
runtime dependencies.

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
css/style.css         design tokens, glass primitives, layout, animation
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
- **The tilt release is transitioned, the tracking is not.** While the pointer
  is on a card the transform is written every frame with no transition so it
  tracks 1:1; `pointerleave` applies a transition for the return only, eases to
  an explicit rest transform, then hands the property back. Cards that carry
  the tilt transition `box-shadow` only, so simply clearing the transform
  reverted it in a single frame and the card snapped flat.
- **Reduced motion is gentle, not off.** Opacity and colour transitions still
  run so state changes remain legible; everything that moves is dropped.

## How it works

**Glass.** One material in three weights, all built from tokens so every
frosted surface agrees: `.glass` for panels, `.glass-inset` for wells (chips,
tracks, badges), and a heavier tier for the nav and dialogs. Four things have to
happen together or a frosted panel just reads as a grey rectangle, so each is a
token: the blur, a `saturate()` alongside it (thick glass deepens colour rather
than washing it out), a bright specular line along the lit edges, and a cast
shadow. The specular edge is a *gradient* border painted as a masked ring, not a
flat one, which is most of what separates convincing glass from a translucent
box.

Two rules matter when editing:

- **No glass on glass.** A frosted pane inside another one blurs an
  already-blurred surface: muddy, and a second compositor pass to get there.
  Nested panels keep the tint and hairline and drop the blur.
- **Dark glass tints downward.** A white tint over a lit background raises
  panel luminance exactly where text has least contrast to spare. Measured, a
  white tint put `--muted` at 3.1:1 and `--accent` at 3.9:1; tinting down holds
  everything above 4.5:1 wherever a panel lands.

Blur is the most expensive thing on the page, so `.perf-lite` (set from JS on
low-tier devices, and by the frame governor when it has to shed work) swaps the
material for opaque surfaces. It does that by overriding the tokens on the root
rather than per selector, so it reaches every panel including new ones.

**Live background.** Glass needs something worth refracting. A static
mesh-gradient layer (`.bg-mesh`, four soft pools, one paint, no per-frame cost)
sits under two stacked canvases:

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

**Themes.** Light and dark glass palettes. Follows the OS by default and
remembers an explicit choice in `localStorage`.

**Reduced motion.** `prefers-reduced-motion: reduce` disables the canvas
animation, the parallax lerp and every reveal, leaving all content visible.

## Demo player

Project demos hosted on Google Drive play in a dialog on the page itself, via
Drive's `/preview` endpoint. The anchor still carries the real Drive URL, so a
middle-click, a modified click, or a visitor with JavaScript disabled opens it
in a new tab as an ordinary link. The iframe `src` is only set when the dialog
opens and is cleared on close, so nothing preloads and playback stops when the
dialog is dismissed.

A demo on any other host falls back to a plain outbound link. A project with no
demo renders no button at all.

## Deploying

Plain static files, no build step. Every path is relative, so the site works
from a subdirectory such as a GitHub Pages project site.

**GitHub Pages:** push to `main`, then Settings > Pages > Source: "Deploy from
a branch", Branch: `main` / `(root)`. The repository must be public unless the
account has Pages for private repositories. A `.nojekyll` file is included so
Pages serves the files as-is instead of running them through Jekyll.

**Anywhere else:** serve the repo root from any static host, or drop the folder
on Netlify, Vercel or Cloudflare Pages.

Once the final URL is known, add absolute `og:url` and `og:image` tags in
`index.html` so link previews render a card.
