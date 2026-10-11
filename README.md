# Code Ignite

Event site for **Code Ignite**, a three-day beginner session (16-18 October 2026) for first-year girls at SNDT UMIT, run by the **ACM-W SNDT UMIT Student Chapter**.

Pitch in one line: you do not need to know it all, you need to start.

Stack in one line: HTML, CSS, vanilla JavaScript. No framework, no bundler, no `node_modules` folder quietly eating your disk.

**Live:** https://sndt-acm-w.github.io/code-ignite/

---

## Table of contents

1. [File map](#file-map)
2. [How the files link together](#how-the-files-link-together)
3. [The puzzle intro (the cool part)](#the-puzzle-intro-the-cool-part)
4. [The main site](#the-main-site)
5. [Feature checklist](#feature-checklist)
6. [Run it locally](#run-it-locally)
7. [Deploy](#deploy)
8. [Build notes and honest AI disclosure](#build-notes-and-honest-ai-disclosure)
9. [Known rough edges](#known-rough-edges)

---

## File map

```
code-ignite/
├── index.html          # page markup: intro overlay first, then the site
├── style.css           # design system + every section of the main site
├── script.js           # main site behaviour (nav, carousel, reveal, CTA)
├── intro-puzzle.css    # intro-only styles, fully scoped to #intro
├── intro-puzzle.js     # intro logic, wrapped in an IIFE
└── assets/
    └── logos/          # ACM-W logo used in the navbar
```

Rule of the repo: the intro is **bolted on**, not baked in. Delete `intro-puzzle.css`, `intro-puzzle.js`, the `#intro` block and the two tags that load them, and the site still works exactly as before.

---

## How the files link together

### Load order inside `index.html`

```
<head>
  1. style.css                 site design system (tokens, components)
  2. Google Fonts <link>       Bricolage Grotesque + Space Mono for the intro
  3. inline <script>           adds .intro-seen to <html> BEFORE first paint
  4. intro-puzzle.css          intro styles, loaded last so they win

<body>
  5. #intro overlay            fixed, z-index 9999, covers everything
  6. #replay dev button
  7. navbar, hero, sections... the real site, already in the DOM underneath

  8. script.js                 site behaviour
  9. intro-puzzle.js           intro behaviour (IIFE, cannot touch script.js globals)
```

Why it is ordered like this:

- **The inline head script is the anti-flicker trick.** If `localStorage` says the visitor already saw the intro, `<html>` gets the class `intro-seen` before the browser paints. CSS then does `.intro-seen #intro { display: none; }`, so returning visitors never see even one frame of the overlay.
- **The site is loaded underneath the overlay, not after it.** When the intro ends it just fades out. There is no page swap, no reload, no second render.
- **`script.js` runs first, intro runs last.** Both are independent. `intro-puzzle.js` is wrapped in `(() => { ... })()`, so its variables (`state`, `pieces`, `sleep`) can never collide with names in `script.js`.

### Two design systems, zero collisions

| | `style.css` | `intro-puzzle.css` |
|---|---|---|
| Variables | `--navy`, `--cyan`, `--off-white` on `:root` | `--i-navy`, `--i-cyan`, `--i-paper` scoped to `#intro, #replay` |
| Class naming | BEM (`hero__headline`, `journey__ticket`) | short utility names (`.p`, `.in`, `.tag`, `.ticket`) |
| Fonts | DM Serif Display, Manrope | Bricolage Grotesque, Space Mono |
| Scope | whole page | `#intro` subtree only |

The `--i-` prefix is the whole trick: the intro can use its own navy and cyan without overriding the site's tokens.

### Overlay vs navbar

The navbar is `position: sticky; z-index: 100`. The intro is `position: fixed; z-index: 9999`, so it sits above the navbar and everything else until it fades.

### JS and CSS talk through classes and variables

The intro has no inline animation code. JavaScript only changes **state classes** and **CSS custom properties**; CSS does all the actual motion.

```
JS adds class on #intro      CSS reacts
-----------------------      ---------------------------------------------
.assembling                  pitch text fades, glow appears, drift pauses
.collapse                    pieces shrink to a point and fade
.flash                       center glow scales up
.title                       CODE / IGNITE becomes visible and pops in
.expand                      title scales up, glow floods the screen
.out                         whole overlay fades to opacity 0
```

Per-piece values are passed as custom properties, so one CSS rule styles every piece:

| Variable | Set by JS on | Used for |
|---|---|---|
| `--fs` | each piece | font size (multiplied by `--k` on mobile) |
| `--t`, `--w` | piece / inner span | randomised drift duration and phase |
| `--r`, `--s` | each piece | rotation and scale (changes on assembly) |
| `--dx`, `--dy`, `--mr` | each piece | cursor push and tilt |
| `--cx`, `--cy` | `#intro` | cursor glow position |
| `--k` | CSS media query | mobile size scale (0.68) |

### One-way event out

When the intro finishes it fires `window.dispatchEvent(new CustomEvent("introDone"))`. Nothing listens yet. It is a hook for later (for example starting hero animations after the reveal).

---

## The puzzle intro (the cool part)

> **Idea source:** Pinterest. Scrolling through collage, scrapbook and ticket-style layouts produced the core thought: what if the website starts as loose pieces and you assemble it? The posters supplied the palette and mood. Pinterest supplied the "pieces on a table" feeling.

The metaphor is the message. The pieces are the tools students will learn (HTML, CSS, JS, GitHub, VS Code), plus the chapter's own labels (ACM-W, SNDT, UMIT). Nobody has the full picture alone. Together they spell `CODE IGNITE`.

### Sequence

```
idle  --click IGNITE / Enter-->  assembling  -->  done
 |                                  |               |
 | pieces drift, cursor glow        | stagger-fly   | localStorage flag
 | pieces react to mouse            | to center     | introDone event
 |                                  | collapse      | overlay removed
 |                                  | title pops
 |                                  | expand + fade
```

### Techniques used

**1. Data-driven pieces.** All 13 pieces live in one `PIECES` array:

```js
["[ HTML ]", "paper", 14, 16, -8, 1.7, 0, [24, 10]]
// text, style, desktop x%, y%, rotation, font rem, assembly order, mobile [x%, y%] or null
```

Changing the layout means editing a row, not hunting through DOM code. A `null` mobile position means "do not render on phones".

**2. Five visual piece styles, all pure CSS.**

| Class | Look | How |
|---|---|---|
| `.paper` | torn scrap | `clip-path: polygon(...)` with uneven edges |
| `.tag` | cyan label | asymmetric `border-radius: 6px 18px 6px 18px` |
| `.code` | code snippet | navy fill, cyan 1.5px border |
| `.ticket` | notched stub | two `radial-gradient` masks punch half-circles into the sides |
| `.sticker` | die-cut sticker | dashed border plus a cyan `box-shadow` ring |

**3. Two-layer motion so effects never fight.**
Each piece is a wrapper `.p` plus an inner `.in`. The wrapper handles position, rotation, scale and cursor push. The inner span handles the idle drift keyframes. Because they are separate elements, the drift animation never overwrites the assembly transform.

**4. Assembly math.** Pieces do not land on the same pixel. Piece `i` goes to an angle `i * 2.4` radians at a radius that cycles with `i % 4`, producing a loose spiral pile around the center. Stagger is 210 ms for the main pieces and 120 ms for the extras.

**5. Physical easing.** `cubic-bezier(0.34, 1.45, 0.5, 1)` overshoots slightly, so pieces land with a small bounce instead of sliding mechanically.

**6. Cursor interaction, kept cheap.** On `pointermove` the handler is throttled with `requestAnimationFrame` and a `pointerMoveQueued` flag. Each piece within 200px of the cursor gets pushed away up to 14px and tilted up to 2 degrees, scaled by proximity. Only runs on `(pointer: fine)` devices, and stops after the intro starts.

**7. Safe text rendering.** Pieces are built with `textContent`, not `innerHTML`, so labels like `< JS >` and `</>` cannot be parsed as real tags.

**8. Replay-safe.** `initializePuzzle()` removes old `.p` elements before building new ones.

### Accessibility and edge cases

- `prefers-reduced-motion`: skips the assembly entirely and shows `CODE IGNITE` briefly, then hands off. CSS also kills drift and star animations.
- Keyboard: `Enter` ignites, `Escape` skips. The IGNITE button receives focus on load.
- The overlay is a `role="dialog"` with an `aria-label`, and the decorative title block is `aria-hidden`.
- Page scroll is locked while the intro plays and released in `finishIntro()`.
- Phones (max-width 600px): 5 pieces instead of 13, font scale 0.68, tap-sized IGNITE button (52px+), cursor glow hidden on touch via `(pointer: coarse)`.

### Persistence and replay

| Action | Effect |
|---|---|
| Finish or skip once | `localStorage.acmwIntroSeen = "true"` |
| Visit again | intro skipped before first paint |
| Open `/?intro=replay` | flag cleared, intro plays |
| Click "Replay Intro (dev)" | same, via button |

Remove the replay button before launch.

---

## The main site

### `style.css`: the design system

- **Design tokens** in `:root`: palette (navy, cyan, ice blue, off-white), fonts, radii, shadows, and three named easings (`--transition-fast`, `--transition-smooth`, `--transition-spring`).
- **BEM naming** throughout (`navbar__link`, `learn__card-title`, `journey__ticket-tag`).
- **Fluid type** with `clamp()` for headlines, so text scales without a pile of breakpoints.
- **Outline lettering:** the `BELONG.` headline uses `-webkit-text-stroke` with transparent fill.
- **Hero code window:** a fake `index.html` editor card with traffic-light dots, syntax-coloured spans (`.code-tag`, `.code-value`, `.code-comment`) and a gentle `float-rotate` keyframe.
- **Journey tickets:** perforation lines made with `repeating-linear-gradient`, navy stub with vertical `writing-mode` numerals, circular punch-holes positioned at the top and bottom edges.
- **Carousel:** native `scroll-snap-type: x mandatory` with hidden scrollbars.
- **Reveal system:** `.reveal` plus `.reveal-delay-1..4`; elements start transparent and shifted down, then `.visible` animates them in.
- **Breakpoints:** 900px (tablet, hamburger appears, hero stacks) and 600px (phone tweaks).
- **Reduced motion block** that collapses all animation and transition durations.

### `script.js`: the behaviour layer

| # | Module | What it does |
|---|---|---|
| 1 | Registration CTA | Opens the Google Form in a new tab with `noopener noreferrer`; URL lives in one `GOOGLE_FORM_URL` constant |
| 2 | Hamburger menu | Toggles `.open`, syncs `aria-expanded` / `aria-hidden`, locks body scroll, closes on link click, outside click, or resize past 900px |
| 3 | Learn carousel | Arrow buttons, generated dots, mouse drag-to-scroll, snap-to-nearest on release, button disabling at both ends, rebuilds on resize |
| 4 | Scroll reveal | `IntersectionObserver` (threshold 0.12) adds `.visible` once, then unobserves; skips straight to visible under reduced motion |
| 5 | Nav highlight | A second observer marks the nav link for whichever section is at least 40% in view |
| 6 | Hero init | Placeholder; the hero animates through CSS only |
| 7 | Ticket stagger | Observer triggers a `ticket-slide` animation with a per-ticket delay |
| 8 | Smooth anchors | Intercepts `#` links and scrolls with the sticky navbar height subtracted, so headings do not hide under it |

### Content structure (`index.html`)

Navbar, Hero, What You'll Learn (6-card carousel), Event Journey (3 day-tickets), Community ("you don't need to know it all"), Contact, Final CTA, Footer.

| Day | Date | Covers |
|---|---|---|
| 01 | 16 Oct | VS Code, terminal, Git, GitHub |
| 02 | 17 Oct | HTML, advanced HTML, CSS, layouts |
| 03 | 18 Oct | JavaScript: variables, functions, DOM, events |

---

## Feature checklist

- [x] Interactive puzzle intro with staggered assembly
- [x] Cursor-reactive pieces and glow (desktop only)
- [x] One-time intro with `localStorage` memory, plus `?intro=replay`
- [x] No flash of intro for returning visitors
- [x] Fully responsive: 900px and 600px breakpoints, reduced piece count on phones
- [x] Reduced-motion support in intro, CSS, and JS
- [x] Scroll-snap carousel with arrows, dots, and drag
- [x] Scroll-triggered reveals via `IntersectionObserver`
- [x] Active-section nav highlighting
- [x] Accessible hamburger menu with ARIA state
- [x] Sticky-navbar-aware smooth scrolling
- [x] Google Form registration hook
- [x] Open Graph tags for link previews
- [ ] Hook `introDone` into hero animations
- [ ] Replace the dev replay button with nothing (delete it)

---

## Run it locally

No install. Pick one:

```bash
# just open it
start index.html            # Windows
open index.html             # macOS

# or serve it (closer to production behaviour)
python -m http.server 8000
# visit http://localhost:8000
```

Force the intro to play again: `http://localhost:8000/?intro=replay`

---

## Deploy

Hosted on GitHub Pages, straight from `main`.

1. Entry file must be named **`index.html`** at the repo root.
2. Repo **Settings > Pages**.
3. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait about a minute, then open the URL above.

All asset paths are relative (`assets/logos/...`), which matters because Pages serves the site from a `/repo-name/` subpath.

Changes after launch go through a branch and a pull request:

```bash
git checkout -b fix/short-description
git add .
git commit -m "Describe the change"
git push -u origin fix/short-description
```

---

## Build notes and honest AI disclosure

- The **intro concept** came from Pinterest inspiration plus the event posters. The written spec, the palette, the copy, and which of two draft concepts to keep (a terminal-typing intro lost to the puzzle) were our decisions.
- The **intro code was generated and refined with AI assistance (Claude by Anthropic)**, then integrated by hand, scoped (`--i-` variables, IIFE), tested, and edited.
- AI output was not accepted as-is. It was read, run, and corrected where it was wrong. It was wrong in places.
- Rule we would give anyone in the session: use AI as a fast teammate that is sometimes confidently incorrect. Read it, break it on purpose, and understand it before you ship it.

---

## Known rough edges

Listed here because pretending otherwise helps nobody.

- `introDone` is dispatched but unused, so hero entrance animations play while still hidden under the overlay.
- The `snap` flash fires shortly after a piece departs rather than when it lands. Move the timeout in `assemblePieces()` to about 800 ms to sync it.
- `.journey__date` is used in the markup but has no matching rule in `style.css`, so the date line is unstyled.
- Google Fonts load twice for different families (`@import` in `style.css`, `<link>` in the head). Works, but is an extra request.
- The "Replay Intro (dev)" button must be removed before the public link goes out.

---

## Credits

Organised by the **ACM-W SNDT UMIT Student Chapter**. Fonts via Google Fonts: DM Serif Display, Manrope, Bricolage Grotesque, Space Mono.
