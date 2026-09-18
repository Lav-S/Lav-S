/* =====================================================================
   Lavneet Sidhu, Portfolio engine
   Live canvas background · lerped parallax · reveal & transition system
   ===================================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const lerp  = (a, b, t) => a + (b - a) * t;
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ==================================================================
   1. THEME
   ================================================================== */
const root = document.documentElement;
const savedTheme = (() => { try { return localStorage.getItem('ls-theme'); } catch (e) { return null; } })();
if (savedTheme) root.setAttribute('data-theme', savedTheme);
else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');

$('#themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('ls-theme', next); } catch (e) {}
  readPalette();
  if (bgLive) buildOrbs();   // orbs hold palette colours; re-seed for the new theme
});

/* palette sampled from CSS so the canvas follows the theme */
const PAL = { accent: '#5566f5', a2: '#12b8d8', a3: '#a855f7', dark: false };
function readPalette() {
  const cs = getComputedStyle(root);
  PAL.accent = cs.getPropertyValue('--accent').trim()   || PAL.accent;
  PAL.a2     = cs.getPropertyValue('--accent-2').trim() || PAL.a2;
  PAL.a3     = cs.getPropertyValue('--accent-3').trim() || PAL.a3;
  PAL.dark   = root.getAttribute('data-theme') === 'dark';
}
readPalette();

/* ==================================================================
   2. LIVE BACKGROUND: drifting orb field plus reactive particle mesh
   ================================================================== */
const pointer = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };

/* ---- 2a. orbs ----------------------------------------------------
   Rendered into a deliberately TINY backing canvas that CSS upscales to
   full-bleed. The upscale itself does most of the smoothing, so the CSS
   blur can stay small, and each orb is a pre-rendered sprite rather than
   a radial gradient rebuilt every frame. Redraw is throttled, because a large
   CSS-blurred layer is expensive to recomposite, so we do it ~20×/sec,
   not 60×/sec.
   ------------------------------------------------------------------ */
const orbCv = $('#bgOrbs');
const orbCtx = orbCv.getContext('2d');
const ORB_BASE = 300;                 // backing width in px
const SPRITE_R = 110;                 // sprite radius in px
let orbs = [], orbW = 0, orbH = 0;
const spriteCache = new Map();

function orbSprite(color) {
  const key = color + (PAL.dark ? '|d' : '|l');
  if (spriteCache.has(key)) return spriteCache.get(key);
  const cv = document.createElement('canvas');
  cv.width = cv.height = SPRITE_R * 2;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(SPRITE_R, SPRITE_R, 0, SPRITE_R, SPRITE_R, SPRITE_R);
  g.addColorStop(0,    hexA(color, PAL.dark ? 0.50 : 0.62));
  g.addColorStop(0.45, hexA(color, PAL.dark ? 0.20 : 0.26));
  g.addColorStop(1,    hexA(color, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, SPRITE_R * 2, SPRITE_R * 2);
  spriteCache.set(key, cv);
  return cv;
}

function buildOrbs() {
  const r = orbCv.getBoundingClientRect();
  const ratio = Math.max(r.height, 1) / Math.max(r.width, 1);
  orbW = ORB_BASE;
  orbH = Math.max(Math.round(ORB_BASE * ratio), 1);
  orbCv.width = orbW; orbCv.height = orbH;

  const cols = [PAL.accent, PAL.a2, PAL.a3, PAL.accent, PAL.a3];
  orbs = cols.map((c, i) => ({
    x: Math.random() * orbW,
    y: Math.random() * orbH,
    r: Math.min(orbW, orbH) * (0.30 + Math.random() * 0.22),
    vx: (Math.random() - 0.5) * 0.09,
    vy: (Math.random() - 0.5) * 0.09,
    c,
    ph: Math.random() * Math.PI * 2,
    sp: 0.0004 + Math.random() * 0.0006,
    depth: 0.02 + i * 0.012
  }));
}

function drawOrbs(t, sy) {
  orbCtx.clearRect(0, 0, orbW, orbH);
  orbCtx.globalCompositeOperation = PAL.dark ? 'lighter' : 'source-over';
  const px = (pointer.x / innerWidth - 0.5);
  const py = (pointer.y / innerHeight - 0.5);
  const sc = orbW / Math.max(innerWidth, 1);   // px -> backing units

  for (const o of orbs) {
    o.x += o.vx; o.y += o.vy;
    if (o.x < -o.r) o.x = orbW + o.r; if (o.x > orbW + o.r) o.x = -o.r;
    if (o.y < -o.r) o.y = orbH + o.r; if (o.y > orbH + o.r) o.y = -o.r;

    const rr = o.r * (1 + Math.sin(t * o.sp + o.ph) * 0.16);
    const cx = o.x + (px * 130 * o.depth * 8 - sy * o.depth * 0.9) * sc;
    const cy = o.y + (py * 130 * o.depth * 8 - sy * o.depth * 1.6) * sc;

    orbCtx.drawImage(orbSprite(o.c), cx - rr, cy - rr, rr * 2, rr * 2);
  }
  orbCtx.globalCompositeOperation = 'source-over';
}

function hexA(hex, a) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---- 2b. particle mesh ---- */
const netCv = $('#bgNet');
const netCtx = netCv.getContext('2d');
let pts = [], netW = 0, netH = 0;

function buildNet() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  netW = innerWidth; netH = innerHeight;
  netCv.width = netW * dpr; netCv.height = netH * dpr;
  netCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = clamp(Math.round((netW * netH) / 34000), 22, 54);
  pts = Array.from({ length: count }, () => ({
    x: Math.random() * netW,
    y: Math.random() * netH,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.24,
    r: 0.9 + Math.random() * 1.7,
    z: 0.3 + Math.random() * 0.9
  }));
}

function drawNet() {
  netCtx.clearRect(0, 0, netW, netH);
  const LINK = 128;
  const baseA = PAL.dark ? 0.5 : 0.36;

  for (const p of pts) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = netW; if (p.x > netW) p.x = 0;
    if (p.y < 0) p.y = netH; if (p.y > netH) p.y = 0;

    // gentle pointer attraction
    const dx = pointer.x - p.x, dy = pointer.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 36000 && d2 > 1) {
      const f = (1 - d2 / 36000) * 0.035;
      p.vx += dx * f * 0.01; p.vy += dy * f * 0.01;
    }
    p.vx = clamp(p.vx, -0.7, 0.7); p.vy = clamp(p.vy, -0.7, 0.7);
    p.vx *= 0.995; p.vy *= 0.995;
    if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.06;
    if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.06;
  }

  /* Links are bucketed by opacity so the whole mesh draws in a handful of
     stroke() calls instead of one per line. */
  const LINK2 = LINK * LINK, PLINK = 190, PLINK2 = PLINK * PLINK;
  const BUCKETS = 4;
  const paths = Array.from({ length: BUCKETS }, () => new Path2D());
  const pPath = new Path2D();

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < LINK2) {
        const k = clamp(Math.floor((1 - Math.sqrt(d2) / LINK) * BUCKETS), 0, BUCKETS - 1);
        paths[k].moveTo(a.x, a.y); paths[k].lineTo(b.x, b.y);
      }
    }
    const pdx = a.x - pointer.x, pdy = a.y - pointer.y;
    if (pdx * pdx + pdy * pdy < PLINK2) { pPath.moveTo(a.x, a.y); pPath.lineTo(pointer.x, pointer.y); }
  }

  netCtx.lineWidth = 1;
  for (let k = 0; k < BUCKETS; k++) {
    netCtx.strokeStyle = hexA(PAL.accent, ((k + 0.5) / BUCKETS) * baseA * 0.42);
    netCtx.stroke(paths[k]);
  }
  netCtx.strokeStyle = hexA(PAL.a2, baseA * 0.34);
  netCtx.stroke(pPath);

  /* Dots: one fill for the whole field. */
  const dots = new Path2D();
  for (const a of pts) { dots.moveTo(a.x + a.r, a.y); dots.arc(a.x, a.y, a.r, 0, Math.PI * 2); }
  netCtx.fillStyle = hexA(PAL.accent, baseA * 0.75);
  netCtx.fill(dots);
}

/* ---- 2c. deferred start ----
   The canvases are the only genuinely expensive thing on the page, so they are
   not touched until the static content has painted. `bgLive` gates both the
   sizing and the per-frame drawing. */
let bgLive = false;
const bgStage = $('.bg-stage');

function sizeCanvases() { buildOrbs(); buildNet(); }

function startBackground() {
  if (bgLive || RM) return;
  bgLive = true;
  sizeCanvases();
  drawOrbs(performance.now(), scrollY);
  drawNet();
  bgStage.classList.add('live');
}

let rsz;
addEventListener('resize', () => {
  if (!bgLive) return;
  clearTimeout(rsz);
  rsz = setTimeout(sizeCanvases, 180);
});

/* ==================================================================
   3. POINTER + CUSTOM CURSOR
   ================================================================== */
const cDot = $('#cursorDot'), cRing = $('#cursorRing'), cLabel = $('#cursorLabel');
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };

addEventListener('pointermove', e => {
  pointer.tx = e.clientX; pointer.ty = e.clientY;
  cur.x = e.clientX; cur.y = e.clientY;
}, { passive: true });

if (FINE) {
  const growSel = 'a, button, .tilt, .proj, .skc-items span, .p-link, .stat';
  document.addEventListener('pointerover', e => {
    const t = e.target.closest(growSel);
    if (!t) return;
    const label = t.dataset.cursor || (t.classList.contains('proj') ? 'view' : '');
    cLabel.textContent = label;
    cRing.classList.add('grow');
    document.body.classList.add('cur-grow');
  });
  document.addEventListener('pointerout', e => {
    if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(growSel)) return;
    cRing.classList.remove('grow');
    document.body.classList.remove('cur-grow');
  });
}

/* magnetic elements */
const magnets = [];
function bindMagnets() {
  if (!FINE || RM) return;
  magnets.length = 0;
  $$('.magnetic').forEach(el => {
    const m = { el, x: 0, y: 0, tx: 0, ty: 0 };
    magnets.push(m);
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2)) * 0.32;
      m.ty = (e.clientY - (r.top + r.height / 2)) * 0.42;
    });
    el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
  });
}

/* ==================================================================
   4. TEXT SPLITTING
   ================================================================== */
function split(el) {
  if (el.dataset.done) return;
  const txt = el.textContent;
  el.textContent = '';
  [...txt].forEach((ch, i) => {
    const s = document.createElement('span');
    if (ch === ' ') { s.className = 'sp'; s.innerHTML = '&nbsp;'; }
    else { s.className = 'ch'; s.textContent = ch; s.style.transitionDelay = (i * 0.035) + 's'; }
    el.appendChild(s);
  });
  el.dataset.done = '1';
}
$$('[data-split]').forEach(split);

/* ==================================================================
   5. PROJECTS
   ================================================================== */
/* Line icons, drawn rather than typed, so the page carries no emoji. */
const ICONS = {
  rover:   '<path d="M3 17h18M6 17v-3m12 3v-3M4 14h16l-1.5-5H5.5L4 14Z"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="16.5" cy="19" r="1.6"/><path d="M12 9V5m0 0 3-1.5M12 5 9 3.5"/>',
  radar:   '<path d="M12 12 4.6 7.7A8.5 8.5 0 1 0 12 3.5"/><circle cx="12" cy="12" r="2"/><path d="M12 12l6.4-3.7"/><circle cx="18.4" cy="8.3" r="1.4"/>',
  flame:   '<path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.6-3 1.4-4.2C9.4 9.6 10 11 11 11c1.4 0 1-3.4 1-8Z"/><path d="M12 21v-3"/>',
  wave:    '<path d="M3 12h2.5l2-6 3 14 3-11 2 3H21"/>',
  map:     '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13M15 6.5v13"/>',
  grid:    '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/>',
  sliders: '<path d="M5 3v7m0 4v7M12 3v11m0 4v3M19 3v3m0 4v11"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="16" r="2"/><circle cx="19" cy="8" r="2"/>',
  trophy:  '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11"/><path d="M12 14v3m-3.5 3h7l-.7-3h-5.6l-.7 3Z"/>',
  medal:   '<circle cx="12" cy="15" r="5"/><path d="M12 13.2l.9 1.7 1.9.3-1.4 1.3.3 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 1.9-.3.9-1.7Z"/><path d="M8.5 10 6 3.5h12L15.5 10"/>',
  cap:     '<path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5M21 8.5v6"/>',
  bolt:    '<path d="M13.5 3 5 13.5h6L10.5 21 19 10.5h-6L13.5 3Z"/>',
  scroll:  '<path d="M6 4h10a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4Z"/><path d="M6 4a2 2 0 0 0-2 2v2h2M9.5 8.5h5M9.5 12h5M9.5 15.5h3"/>',
  repo:    '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5v-14Z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3"/><path d="M9 7h6"/>',
  play:    '<circle cx="12" cy="12" r="9"/><path d="M10 8.5 16 12l-6 3.5v-7Z"/>',
  mail:    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  phone:   '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z"/>',
  link:    '<path d="M10.5 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/>'
};

const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* A slot that is absent, empty, or still "#" renders nothing. The live site
   never shows a control that does not go anywhere. */
function linkMarkup(url, label, iconName) {
  if (!url || String(url).trim() === '' || url === '#') return '';
  return `<a class="p-link" href="${url}" target="_blank" rel="noopener" data-cursor="open">${icon(iconName)}<span>${label}</span></a>`;
}

const grid = $('#projGrid');
grid.innerHTML = PROJECTS.map((p, i) => {
  const links = linkMarkup(p.repo, 'Code', 'repo') + linkMarkup(p.demo, 'Demo', 'play');
  return `
  <article class="proj neu-raised reveal tilt" data-reveal="pop" data-tags="${p.tags.join(' ')}" style="transition-delay:${(i % 3) * 0.08}s">
    <div class="p-head">
      <span class="p-icon neu-pressed">${icon(p.icon)}</span>
      <div class="p-meta">
        <span class="p-year neu-pressed">${p.year}</span>
        ${p.flag ? `<span class="p-flag">${p.flag}</span>` : ''}
      </div>
    </div>
    <h3>${p.title}</h3>
    <p class="p-desc">${p.desc}</p>
    ${p.metrics ? `<div class="p-metrics neu-pressed">
      ${p.metrics.map(m => `<div><b>${m.v}</b><i>${m.k}</i></div>`).join('')}
      <span class="p-metrics-note">Deterministic fusion benchmark, drone target at nominal sensor noise</span>
    </div>` : ''}
    <div class="p-stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
    ${links || p.note ? `<div class="p-links">
      ${links}
      ${p.note ? `<span class="p-note">${p.note}</span>` : ''}
    </div>` : ''}
  </article>`;
}).join('');

/* filters */
const filterBar = $('#projFilters');
filterBar.innerHTML = PROJECT_FILTERS
  .map((f, i) => `<button class="pf-btn${i === 0 ? ' on' : ''}" data-filter="${f.key}">${f.label}</button>`)
  .join('');

filterBar.addEventListener('click', e => {
  const btn = e.target.closest('.pf-btn');
  if (!btn) return;
  $$('.pf-btn', filterBar).forEach(b => b.classList.toggle('on', b === btn));
  const key = btn.dataset.filter;
  $$('.proj', grid).forEach((card, i) => {
    const show = key === 'all' || card.dataset.tags.split(' ').includes(key);
    card.style.transitionDelay = show ? (i % 3) * 0.05 + 's' : '0s';
    card.classList.toggle('hidden-f', !show);
  });
});

/* ==================================================================
   6. SKILLS
   ================================================================== */
$('#skillBars').innerHTML = SKILL_BARS.map((s, i) => `
  <div class="sb reveal" data-reveal="up" style="transition-delay:${i * 0.07}s">
    <div class="sb-top"><span class="sb-name">${s.name}</span><span class="sb-val">${s.value}%</span></div>
    <div class="sb-track"><div class="sb-fill" data-fill="${s.value}"></div></div>
  </div>
`).join('');

$('#skillCats').innerHTML = SKILL_CATS.map((c, i) => `
  <div class="skc neu-raised reveal tilt" data-reveal="up" style="transition-delay:${i * 0.07}s">
    <h3>${c.title}</h3>
    <div class="skc-items">${c.items.map(x => `<span>${x}</span>`).join('')}</div>
  </div>
`).join('');

/* ==================================================================
   7. REVEAL / COUNTERS / BARS (IntersectionObserver)
   ================================================================== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('in');
    if (el.classList.contains('tl-item')) el.classList.add('in');
    if (el.hasAttribute('data-split')) el.classList.add('in');
    io.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

function observeAll() {
  $$('.reveal, [data-split], .tl-item').forEach(el => io.observe(el));
}

/* counters */
const countIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const suf = el.dataset.suffix || '';
    const dur = 1700;
    const t0 = performance.now();
    (function step(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
    countIO.unobserve(el);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => countIO.observe(el));

/* skill bars */
const barIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.style.width = en.target.dataset.fill + '%';
    barIO.unobserve(en.target);
  });
}, { threshold: 0.4 });
$$('.sb-fill').forEach(el => barIO.observe(el));

/* ==================================================================
   8. 3D TILT (shadow follows cursor)
   ================================================================== */
function bindTilt() {
  if (!FINE || RM) return;
  $$('.tilt').forEach(el => {
    if (el.dataset.tilt) return;
    el.dataset.tilt = '1';
    let raf = null;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      if (el.classList.contains('proj')) {
        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');
      }
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rx = (0.5 - py) * 9;
        const ry = (px - 0.5) * 9;
        el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.012)`;
      });
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* glow follow on contact card */
const cc = $('.contact-card');
if (cc) cc.addEventListener('pointermove', e => {
  const r = cc.getBoundingClientRect();
  cc.style.setProperty('--gx', (e.clientX - r.left) + 'px');
  cc.style.setProperty('--gy', (e.clientY - r.top) + 'px');
});

/* ==================================================================
   9. ROLE ROTATOR (scramble)
   ================================================================== */
const roleEl = $('#roleText');
const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
let roleIdx = 0;
function scrambleTo(text) {
  const from = roleEl.textContent;
  const len = Math.max(from.length, text.length);
  const queue = [];
  for (let i = 0; i < len; i++) {
    queue.push({
      from: from[i] || '',
      to: text[i] || '',
      start: Math.floor(Math.random() * 22),
      end: Math.floor(Math.random() * 22) + 22
    });
  }
  let frame = 0;
  return new Promise(res => {
    (function tick() {
      let out = '', done = 0;
      for (const q of queue) {
        if (frame >= q.end) { done++; out += q.to; }
        else if (frame >= q.start) {
          if (!q.ch || Math.random() < 0.3) q.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          out += `<i style="opacity:.45;font-style:normal">${q.ch}</i>`;
        } else out += q.from;
      }
      roleEl.innerHTML = out;
      if (done === queue.length) return res();
      frame++;
      requestAnimationFrame(tick);
    })();
  });
}
async function rotateRoles() {
  if (RM) { roleEl.textContent = ROLES[0]; return; }
  while (true) {
    await scrambleTo(ROLES[roleIdx % ROLES.length]);
    roleIdx++;
    await new Promise(r => setTimeout(r, 2600));
  }
}

/* ==================================================================
   10. NAV: scroll spy, pill, shrink, mobile
   ================================================================== */
const nav = $('#nav'), navLinks = $('#navLinks'), navPill = $('#navPill'), burger = $('#burger');
const navAs = $$('[data-nav]');
const sections = navAs.map(a => $(a.getAttribute('href'))).filter(Boolean);

function movePill(a) {
  if (!a || innerWidth <= 860) { navPill.classList.remove('on'); return; }
  navPill.style.width = a.offsetWidth + 'px';
  navPill.style.transform = `translateX(${a.offsetLeft}px)`;
  navPill.classList.add('on');
}

function spy() {
  const mid = scrollY + innerHeight * 0.34;
  let active = null;
  sections.forEach((s, i) => { if (s.offsetTop <= mid) active = navAs[i]; });
  navAs.forEach(a => a.classList.toggle('active', a === active));
  movePill(active);
}

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('on', open);
});
navLinks.addEventListener('click', e => {
  if (e.target.closest('a')) { navLinks.classList.remove('open'); burger.classList.remove('on'); }
});

$('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

/* ==================================================================
   11. SCROLL LOOP: lerped parallax, rails, progress
   ================================================================== */
const soBar = $('#soBar'), scrollOrb = $('#scrollOrb');
const SO_LEN = 2 * Math.PI * 24;
soBar.style.strokeDasharray = SO_LEN;

const depthEls = $$('[data-depth]');
const bgGrid = $('.bg-grid');
const tlFill = $('#tlFill'), timeline = $('#timeline');
const heroInner = $('.hero-inner');

let sy = 0, target = 0;
let lastOrb = 0, lastNet = 0;
const ORB_MS = 50;   // ~20fps, the CSS-blurred layer is costly to recomposite
const NET_MS = 33;   // ~30fps

function frame(t) {
  target = scrollY;
  sy = RM ? target : lerp(sy, target, 0.085);
  if (Math.abs(target - sy) < 0.05) sy = target;

  pointer.x = lerp(pointer.x, pointer.tx, 0.09);
  pointer.y = lerp(pointer.y, pointer.ty, 0.09);

  /* cursor */
  if (FINE) {
    cur.rx = lerp(cur.rx, cur.x, 0.16);
    cur.ry = lerp(cur.ry, cur.y, 0.16);
    cDot.style.transform  = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    cRing.style.transform = `translate3d(${cur.rx}px, ${cur.ry}px, 0)`;
  }

  /* magnets */
  for (const m of magnets) {
    m.x = lerp(m.x, m.tx, 0.18); m.y = lerp(m.y, m.ty, 0.18);
    m.el.style.translate = `${m.x}px ${m.y}px`;
  }

  /* parallax depth layers */
  const pxn = (pointer.x / innerWidth - 0.5);
  const pyn = (pointer.y / innerHeight - 0.5);
  for (const el of depthEls) {
    const d = parseFloat(el.dataset.depth);
    const tx = pxn * 120 * d * 4;
    const ty = pyn * 120 * d * 4 - sy * d * 2.4;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  }

  /* hero copy drifts + fades on scroll */
  if (sy < innerHeight * 1.2) {
    const p = clamp(sy / (innerHeight * 0.9), 0, 1);
    heroInner.style.transform = `translate3d(0, ${sy * 0.28}px, 0) scale(${1 - p * 0.09})`;
    heroInner.style.opacity = String(1 - p * 0.95);
  }

  /* background layers */
  bgGrid.style.transform = `translate3d(${pxn * -22}px, ${-sy * 0.06 + pyn * -22}px, 0)`;
  orbCv.style.transform = `translate3d(0, ${-sy * 0.05}px, 0)`;

  /* canvases: deferred until after first paint, throttled, idle when hidden */
  if (bgLive && !document.hidden) {
    if (t - lastOrb >= ORB_MS) { lastOrb = t; drawOrbs(t, sy); }
    if (t - lastNet >= NET_MS) { lastNet = t; drawNet(); }
  }

  /* scroll progress */
  const max = Math.max(document.body.scrollHeight - innerHeight, 1);
  const prog = clamp(sy / max, 0, 1);
  soBar.style.strokeDashoffset = String(SO_LEN * (1 - prog));
  scrollOrb.classList.toggle('on', sy > innerHeight * 0.55);

  /* nav shrink */
  nav.classList.toggle('shrunk', sy > 40);

  /* timeline rail fill */
  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const f = clamp((innerHeight * 0.62 - r.top) / r.height, 0, 1);
    tlFill.style.height = (f * 100) + '%';
  }

  requestAnimationFrame(frame);
}

let spyT;
addEventListener('scroll', () => {
  if (spyT) return;
  spyT = setTimeout(() => { spyT = null; spy(); }, 90);
}, { passive: true });
addEventListener('resize', () => { spy(); });

/* ==================================================================
   12. BOOT
   ------------------------------------------------------------------
   Two phases, deliberately ordered:

     1. NOW: everything that makes the page readable and usable. This runs
        synchronously at parse time (the script is at the end of <body>, so the
        DOM is ready). Nothing here waits on fonts, images or the load event.

     2. AFTER FIRST PAINT: the live canvas background, which is the only
        expensive work on the page. It fades in behind content that is already
        on screen.
   ================================================================== */

/* ---- phase 1: immediate ---- */
$('#year').textContent = new Date().getFullYear();

$('.hero-name').classList.add('in');       // hero animates in from frame one
observeAll();
bindTilt();
bindMagnets();
spy();
rotateRoles();

/* Above-the-fold pieces reveal on a short stagger rather than waiting for the
   IntersectionObserver callback, so the hero is complete almost immediately. */
$$('.hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 60 + i * 70));

requestAnimationFrame(frame);              // cursor + parallax loop (cheap)

/* ---- phase 2: after the first paint ---- */
function deferBackground() {
  // two rAFs guarantees the browser has committed a frame of real content
  requestAnimationFrame(() => requestAnimationFrame(startBackground));
}
if (RM) {
  /* reduced motion: no canvas animation at all */
} else if ('requestIdleCallback' in window) {
  requestIdleCallback(deferBackground, { timeout: 500 });
} else {
  setTimeout(deferBackground, 120);
}

/* smooth anchor scrolling that accounts for the floating nav */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#') return;
  const t = $(id);
  if (!t) return;
  e.preventDefault();
  const top = t.getBoundingClientRect().top + scrollY - (id === '#hero' ? 0 : 96);
  window.scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
});

/* Coming back to the tab: resync the pointer so the parallax doesn't lurch,
   and start the background if rAF was starved while we were hidden (a page
   opened in a background tab never gets a frame, so phase 2 can't have run). */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  pointer.x = pointer.tx; pointer.y = pointer.ty;
  if (!bgLive) deferBackground();
});

})();
