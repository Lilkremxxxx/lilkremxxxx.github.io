---
name: Nguyen Nhat Bang, AI Engineer
description: Frosted glass lenses held over a live latent point field; near-black ink, signal blue, cyber-lime activations.
colors:
  cyber-lime: "#bdff00"
  cyber-lime-hover: "#cbff3d"
  lime-ink: "#142000"
  lime-soft: "rgba(189, 255, 0, 0.14)"
  signal-blue: "#3992ff"
  blue-soft: "#a8c8ff"
  blue-wash: "rgba(57, 146, 255, 0.14)"
  ink: "#0b0d10"
  text: "#eef1f5"
  text-2: "#c3cad5"
  text-3: "#8f98a6"
  danger: "#ff8a7a"
  danger-wash: "rgba(255, 110, 90, 0.12)"
  caution-amber: "#ffd27a"
  glass: "rgba(255, 255, 255, 0.035)"
  glass-strong: "rgba(14, 18, 24, 0.78)"
  glass-line: "rgba(255, 255, 255, 0.09)"
  glass-line-strong: "rgba(255, 255, 255, 0.16)"
typography:
  display:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.4rem + 6.4vw, 6.6rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.35rem + 2.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 1.4rem + 1.8vw, 2.8rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  subhead:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 1.05rem + 1.3vw, 2.1rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  reading:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.075rem)"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.3
    fontFeature: "tnum"
rounded:
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 4vw, 40px)"
  section-block: "clamp(52px, 7vw, 104px)"
  content-max: "1200px"
  panel: "clamp(1.4rem, 3vw, 2.25rem)"
  card-admin: "1.25rem"
components:
  button-primary:
    backgroundColor: "{colors.cyber-lime}"
    textColor: "{colors.lime-ink}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 1.15rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.cyber-lime-hover}"
    textColor: "{colors.lime-ink}"
  button-glass:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 1.15rem"
    height: "44px"
  button-glass-hover:
    backgroundColor: "rgba(255, 255, 255, 0.11)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
  button-danger:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
  button-danger-hover:
    backgroundColor: "{colors.danger-wash}"
  button-hero:
    padding: "0.65rem 1.4rem"
    height: "52px"
  button-sm:
    padding: "0.45rem 0.85rem"
    height: "36px"
  chip:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.7rem"
  badge-live:
    backgroundColor: "{colors.lime-soft}"
    textColor: "{colors.cyber-lime}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.7rem"
  status-draft:
    backgroundColor: "rgba(255, 210, 122, 0.12)"
    textColor: "{colors.caution-amber}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.55rem"
  input:
    backgroundColor: "rgba(6, 8, 11, 0.55)"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 0.8rem"
    height: "42px"
  lens:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  lens-strong:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
  nav-lens:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.5rem 0.5rem 0.9rem"
  project-card:
    backgroundColor: "{colors.glass}"
    rounded: "{rounded.xl}"
    padding: "clamp(1.4rem, 3.4vw, 2.75rem)"
---

# Design System: Nguyen Nhat Bang, AI Engineer

## Overview

**Creative North Star: "The Lens Over Latent Space"**

The site is a dark observation deck. Behind everything runs a WebGL field of a few thousand blue points with sparse lime activations, and it reorganizes itself as the visitor reads. Every raised surface is the same frosted lens material. Each lens blurs and tints the field behind it but never blocks it out completely, so the content always sits *in front of* something alive. That is the whole idea: the glass reads as optics, not as decoration.

Density is calm and editorial. Each home section is one big Geist headline, a short lead paragraph and one or two lenses. Layout is left-weighted, with the field drifting on the right half. Colour discipline is strict. Ink is the ground, blue is the ambient structure, and lime is a signal reserved for action, live state, focus and hover response. Motion is spent on arrivals (the intro, section reveals, view swaps, field morphs) and stays still while the visitor is reading. The admin workbench uses the same material with the motion taken out: lenses over a static two-field gradient, no WebGL.

The build carries one shared stylesheet (`tokens.css`) for the material, buttons, chips and meta text. The public site (`site.css`), the blog reader blocks (`article.css`, shared with the admin preview) and the admin workbench (`admin.css`) are layered on top of it.

**Key Characteristics:**
- One glass material (`.lens`) on every surface, in two opacities: standard and strong (reading).
- A three-layer backdrop: CSS gradient fallback, then the WebGL point field, then a legibility veil.
- The three.js point field morphs between seven deterministic shapes, one per section or route.
- Near-black ink ground, signal blue for structure, cyber lime only as a signal.
- Geist for headings, Inter for reading, JetBrains Mono only for data (dates, tags, code, counts).
- Pill-shaped actions and chips, with large nested radii on lenses (32 / 24 / 16 / 10px).
- GSAP expo-out arrivals. Everything is off under `prefers-reduced-motion`, and content is never hidden if scripts fail.

## Colors

The palette is near-black ink with one cool structural hue and one hot signal hue. Everything else is a white-alpha hairline or a text tint.

### Primary
- **Cyber Lime** (`cyber-lime`): the signal colour. It fills the primary action (Download CV / Resume, Save), marks live and saved states (status dot, `Current` badge, `published` status, the "All changes saved" text, the active admin sidebar icon), and draws the focus ring, text selection, input caret, reading-progress bar, skip link and the first timeline node. It is also the hover response on links that point somewhere (post titles, contact values, certificate arrows, article links). Its hover tint is **Lit Lime** (`cyber-lime-hover`).
- **Lime Ink** (`lime-ink`): text and icons on a lime fill. Never use it anywhere else.
- **Lime Soft** (`lime-soft`): the tinted wash behind lime text in live badges and published status pills.

### Secondary
- **Signal Blue** (`signal-blue`): the ambient structural hue. It is the colour of the point field, the radial glows in the backdrop, the timeline node rings and the lower half of the timeline rail gradient.
- **Soft Blue** (`blue-soft`): blue at reading strength. Used for the hero role line ("AI Engineer"), project bullet ticks, code-block language labels and `flag` syntax tokens, and contact icon glyphs.
- **Blue Wash** (`blue-wash`): the circular wells behind contact icons.

### Tertiary
- **Caution Amber** (`caution-amber`): admin only. Used for the unsaved ("dirty") save state, the `draft` status pill, warning banners, and string tokens in code blocks. It is the one non-brand hue, and it means "not yet".
- **Danger Salmon** (`danger`) with **Danger Wash** (`danger-wash`): destructive buttons, inline delete confirmations, form errors, error toasts and failed save states.

### Neutral
- **Ink** (`ink`): the page ground everywhere, plus `theme-color`. It is also the colour of the legibility veil and of the hollow centres of timeline nodes.
- **Paper White** (`text`): headings, active nav, and values.
- **Mist** (`text-2`): body copy, leads, descriptions and resting nav links.
- **Slate** (`text-3`): metadata, labels, captions, footer, inactive dock items and placeholder-adjacent hints.
- **Glass** (`glass`) and **Reading Glass** (`glass-strong`): the two lens fills (see Elevation & Depth).
- **Hairline** (`glass-line`) and **Strong Hairline** (`glass-line-strong`): every border and divider. `glass-line` is used for lens edges, row separators and section rules. `glass-line-strong` is used for button and input strokes.

### Named Rules
**The Activation Rule.** Lime means "act here" or "this is live". It may fill only the primary action, and it never colours body text or decorates a surface at rest. In the field it is limited to about 11% of points. On a screen it is one filled button per action group.

**The Blue Is The Field Rule.** Blue carries structure and atmosphere (field, glows, rails, role line, icon wells). It never fills a button.

**The Hairline Rule.** Borders are white at 9% or 16% alpha, 1px. No coloured borders, except the danger stroke and the lime focus border on inputs.

## Typography

**Display Font:** Geist (with Inter, system-ui)
**Body Font:** Inter (with system-ui, -apple-system, Segoe UI)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo)

**Character:** Geist is set heavy and tightly tracked, so headlines read like engraved specimen labels. Inter handles long technical reading at generous leading. Mono appears only where the content *is* data.

### Hierarchy
- **Display** (`display` token): the hero name, set in masked lines. Related one-off display sizes use the same weight and tracking: the contact title is clamp(2.6rem, 1.5rem + 4.6vw, 5.6rem) with line-height 1 and max-width 14ch, and the blog index title is clamp(2.6rem, 1.6rem + 4vw, 5rem).
- **Headline** (`headline` token): every home section title. The reader post title uses clamp(2rem, 1.45rem + 2.4vw, 3.4rem) at -0.04em, max 22ch.
- **Title** (`title` token): project names inside project lenses.
- **Subhead** (`subhead` token): the hero role line, in Soft Blue.
- **Title Small** (`title-sm` token): timeline roles, school names, panel and card headings. They run at 1.05 to 1.25rem, weight 600 to 650. Admin card headings are 1rem.
- **Body** (`body` token): default copy. Leads are clamp(1.02rem, 0.98rem + 0.2vw, 1.15rem) in Mist, capped at 52 to 62ch. The admin runs the body at 15px.
- **Reading** (`reading` token): blog article blocks in Mist, with each block capped at 72ch. In-article headings are h2 at clamp(1.45rem, 1.2rem + 1vw, 1.9rem), h3 at 1.3rem and h4 at 1.1rem.
- **Label** (`label` token): dates, periods and reading time (`.meta`, Slate, tabular numerals). Chips use mono at 0.75rem (0.82rem in skill rows). Code is 0.85rem with a 1.7 line-height. The language toggle and the admin sidebar counts are also mono.

### Named Rules
**The Three Voices Rule.** Geist speaks in headings, Inter carries reading, and JetBrains Mono appears only for data: dates, tags, code, counts, language codes. Never set prose or headings in mono.

**The Tighten With Size Rule.** Letter-spacing gets more negative as size grows: -0.01em on the brand, -0.025em by default on h1 to h4, -0.035em on section titles and -0.045em on display. Body text is never tracked. Headings use `text-wrap: balance`, paragraphs use `pretty`.

## Layout

There is one centred column, `min(100% - 2 × gutter, 1200px)`, shared by the nav lens, every section and the footer. The gutter is fluid (`spacing.gutter`). Sections breathe with `spacing.section-block` vertical padding. The hero fills `100svh` (92svh on mobile) with clamp(120px, 16vh, 180px) of top padding to clear the floating nav.

The composition is deliberately asymmetric and left-weighted:
- **Hero:** 1.5fr / 0.62fr. The name, role, claim and actions sit on the left, with a small status lens on the right where the field shows through.
- **About:** 0.9fr / 1.25fr. A sticky head (top 120px) sits beside a timeline lens.
- **Projects:** a vertical stack of full-width lenses, each split 0.85fr / 1.4fr with a full-width stack-chip footer.
- **Skills:** one lens of rows, with the label column at 160 to 260px and chips flowing beside it.
- **Education, Contact:** two equal columns.
- **Blog list:** rows of date (130px) / title + excerpt / tags.
- **Reader:** the article lens beside a 280px sticky TOC (top 110px).
- **Admin:** a 252px sticky glass sidebar beside the main column. A sticky topbar blurs over content. The editor form and live preview split 1:1, with the preview sticky at top 86px.

Breakpoints, from widest:
- **1280px:** the admin preview becomes an Edit/Preview tab toggle.
- **1100px:** the reader TOC becomes a `<details>` block.
- **960px:** the nav links hide.
- **900px:** all two-column grids stack.
- **860px:** the admin sidebar becomes a select.
- **760px:** the mobile glass dock appears, the veil turns vertical, the field recentres with fewer points, and the body gets 88px of bottom padding.

Touch targets are 44px minimum for buttons, 40px for nav links and 48 to 52px for list rows, dock items and hero actions.

## Elevation & Depth

Depth here is optical, not stacked. Things are not lifted on shadows. They are placed *in front of* the moving field and frosted.

The page ground is three fixed full-viewport layers:
1. **Backdrop** (z -3): radial blue and lime glows over ink. This is the static fallback when WebGL is unavailable, and the entire background in the admin.
2. **Field** (z -2): the WebGL canvas. It fades in over 1.4s once the scene is ready.
3. **Veil** (z -1): an ink gradient that darkens the left 48 to 72% on desktop, where text sits, and the bottom 30%. On mobile it becomes a top-to-bottom gradient. On blog and post routes it adds a 45% ink wash.

Every surface above that is a **lens** — liquid glass, built to show the field rather than hide it. It has:
- a white sheen gradient (6% fading to 0 by 38%) over a near-clear 3.5% white fill
- `backdrop-filter: blur(7px) saturate(185%) brightness(0.78)`: the field keeps its colour but is dimmed enough for text
- a light-catching 1px **rim**: a gradient ring (`--glass-rim`, masked `::before`) from 42% white through clear to a faint blue and lime edge, whose angle (`--sheen-angle`, 125° → 195°) follows the scroll position
- inner highlights (`inset 0 1px 0 16% white`, a faint bottom lip and a 28px inner glow) plus a deep ambient drop
- a 1px 2px 35% black text shadow on everything inside, and `isolation: isolate`

Lenses tagged `data-specular` show a 420px radial highlight on hover that follows the pointer.

### Shadow Vocabulary
- **Lens** (`inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 1px rgba(255,255,255,0.04), inset 0 0 28px rgba(255,255,255,0.025), 0 24px 60px -30px rgba(0,0,0,0.85)`): every lens. Glass edges are lit from inside, depth comes from one deep ambient drop.
- **Primary button** (`0 1px 0 rgba(255,255,255,0.35) inset, 0 10px 24px -12px rgba(0,0,0,0.7)`; on hover `0.4` inset and `0 14px 28px -12px rgba(0,0,0,0.75)`): the lime pill's glassy top edge.
- **Input focus** (`0 0 0 3px rgba(189,255,0,0.15)`): a lime halo with a lime border.
- **Live pulse** (`0 0 0 0 → 10px rgba(189,255,0,0)` keyframe, 2.4s, 3 iterations): the hero availability dot. It pulses three times, then rests.

### Glass variants (blur and opacity as built)
- **Standard lens:** 3.5% white fill, 7px blur. Panels, project cards, the timeline, skills, the TOC, admin cards, the sidebar and toasts.
- **Nav and dock:** 28% / 40% ink fill with 14px blur — they float over scrolling content, so they stay denser.
- **Reading lens** (`.lens--strong`): 60% ink fill, 16px blur. The blog article, the admin preview and the insert menu.
- **Hero lens:** standard fill with only 5px blur, so the forming manifold reads through it as bokeh.
- **Buttons:** a 14px blur over a 6% white fill. Ghost buttons drop the blur.
- **Admin topbar:** an ink gradient (92% to 75%) with 16px blur and a bottom hairline.

### Named Rules
**The One Material Rule.** Every raised surface uses `.lens`. Variants change only fill opacity and blur radius, never the material: no solid cards, no second panel style.

**The Lens Must See Something Rule.** A lens always sits over the field or the backdrop gradient. Glass over flat ink is pointless, which is why the admin keeps its static two-field gradient.

**The Veil Before Glass Rule.** Legibility comes from the veil and the lens fill, not from dimming the field. Increase lens opacity (`glass-strong`) for reading. Do not drop the field.

## Shapes

Corners are soft and nested. The outermost lens has the largest radius, and each element inside it steps down:
- **xl (`rounded.xl`):** project lenses and the reader article.
- **lg (`rounded.lg`):** default lenses (panels, timeline, skills, admin cards and preview).
- **md (`rounded.md`):** inner blocks such as code, figures, quotes, tables, post rows, admin rows, blocks and toasts. The mobile dock uses 22px, with 16px items.
- **sm (`rounded.sm`):** inputs, TOC links, side links, icon buttons and text links.
- **pill (`rounded.pill`):** every button, chip, badge, status pill, segmented control, inline confirmation and the top nav lens itself.

Circles are reserved for status dots, timeline nodes (11px with a 2px ring) and contact icon wells (42px). Lines are 1px hairlines. The timeline rail is a 1px gradient that runs lime to blue to transparent. Project bullets are 7px × 1px Soft Blue dashes, not dots.

## Components

### Buttons
Pill-shaped and glassy. Pressing gives a quick physical shrink.
- **Shape:** a full pill (`rounded.pill`), 44px minimum height, Inter weight 600 at 0.95rem, with a 0.5rem gap for an 18px Material Symbols Rounded icon.
- **Primary** (`button-primary`): a lime fill with Lime Ink text and the primary-button shadow. Reserved for Download CV / Resume and admin Save.
- **Glass** (`button-glass`): a 6% white fill with a strong hairline and 14px blur. On hover it goes to 11% fill with a 26% white border. Used for secondary actions (Contact me, View on GitHub, All posts, View).
- **Ghost** (`button-ghost`): transparent with no border and no blur. Used for the language toggle and quiet actions.
- **Danger** (`button-danger`): salmon text with a 35% salmon stroke. On hover it shows the danger wash and a 60% stroke.
- **Sizes:** `button-sm` (36px, 0.85rem) in the nav and admin rows. `button-hero` (52px, 1rem) for the hero actions, which stretch to full width on mobile.
- **States:** colour and border transition in 140ms expo-out, `:active` scales to 0.97, and disabled buttons sit at 50% opacity with no transform. Focus uses the global 2px lime outline at a 3px offset.

### Chips
- **Style** (`chip`): a mono pill with a 4% white fill, a hairline border and Mist text. Skill chips are larger (0.82rem, Paper White text).
- **Live badge** (`badge-live`): a Lime Soft pill with lime text in Inter at 650 weight. Marks a current project.
- **Admin status pills:** a 6px `currentColor` dot before the label. They come in `published` (lime on Lime Soft), `draft` (`status-draft`, amber) and neutral (Mist on a 7% white fill).

### Cards / Containers (Lens)
- **Corner style:** lg by default, xl for projects and the reader.
- **Background:** Glass or Reading Glass over the sheen gradient (see Elevation & Depth).
- **Shadow strategy:** the lens shadow only. Specular pointer highlight on public panels.
- **Border:** a 1px Hairline.
- **Internal padding:** fluid, from `spacing.panel` (panels) to clamp(1.4rem, 4.2vw, 3.5rem) (reader). Admin cards use a fixed `spacing.card-admin` with a 1rem internal gap.
- **Inside a lens:** sections divide with 1px Hairline rules, never nested lenses.

### Inputs / Fields
- **Style** (`input`): a dark 55% ink well with a strong hairline and a 10px radius. Placeholders are `#6c7584`. Textareas are 96px minimum, resizable vertically, with a mono variant for code.
- **Hover:** the border rises to 24% white.
- **Focus:** a lime border plus a 3px lime halo. The caret is lime.
- **Read-only:** a 3% white fill with Slate text.
- **Error:** a `form-error` block with a danger-wash fill and salmon text.
- **Labels:** 0.82rem at weight 600 in Mist. Hints are 0.78rem in Slate. EN/VN fields sit side by side as an `i18n-pair` with mono language tags.
- **Segmented control:** a pill track (50% ink) whose checked segment gets a 10% white fill.

### Navigation
- **Top nav lens:** a fixed, centred pill lens (`nav-lens`) the width of the content column, 14px from the top (respecting the safe area). It holds the mascot brand mark (30px) with the name in Geist at 650 weight, then text links, a ghost VN/EN toggle and a small lime Resume button.
- **Links:** Mist at 0.9rem, weight 500, 40px tall. Hover and active turn Paper White. A sliding **indicator pill** (9% white with an inset highlight) glides to the active link over 320ms expo-out. The active section is detected by an IntersectionObserver over the middle 5% band of the viewport.
- **Mobile (≤760px):** the brand text and links hide, and a fixed bottom **glass dock** appears: a 6-column grid of icon + 11px label items, 52px tall. The active item gets an 8% white fill and Paper White text.
- **Admin sidebar:** a full-height glass pane with square corners and only a right border. It holds grouped side links (40px, Mist), and the current page gets a 9% fill and a lime icon. Counts are in mono. Below 860px it becomes a select in the topbar.

### Post Rows and Timeline (signature lists)
- **Post row:** a date column, a title (Geist, clamp 1.15 to 1.45rem) and an excerpt, separated by hairlines. On hover the row gets a 4% white fill and the title turns lime.
- **Timeline:** a lens containing a 1px lime-to-blue rail. Each item has an 11px hollow node ringed in blue (the first one in lime), then role, organisation, a mono period and a description at 62ch.

### Reader Blocks (`article.css`)
Shared by the public reader and the admin preview.
- **Figures:** white-backed images with an md radius and an inset 1px outline, plus Slate captions.
- **Code:** a near-black 82% well with a top bar showing an uppercase mono language label in Soft Blue, a numbered gutter (`#4d5563`), and syntax colours: lime keys, amber strings, `#6f7887` comments, Soft Blue flags.
- **Quotes:** Geist at 1.15rem in a 3.5% white md box.
- **Tables:** in a scroll container, with a 4% white header row and tabular numerals.
- **Links:** Paper White, underlined in 50% lime, turning lime on hover.
- **Reading progress:** a 2px lime bar fixed at the top of the viewport, scaled on X.

### Admin feedback
- **Save state:** small text that reads Slate when idle, amber when dirty, lime when saved and salmon on error.
- **Destructive actions:** confirmed inline with a danger-wash pill (`confirm-inline`), never a native dialog.
- **Toasts:** lens toasts bottom-right, entering with an 8px rise and a 0.98 to 1 scale over 320ms. They carry a lime check, or a salmon icon for errors.
- **Loading:** a 16px ring spinner. Public loading uses a shimmering skeleton bar (1.4s).

### The Latent Field (signature, `scene.js`)
A three.js r170 `Points` cloud with a custom `ShaderMaterial` (additive, no depth write) on a transparent canvas, loaded during browser idle time. Motion personality: **Premium-precise** — expo-out arrivals, no overshoot, sine for ambient loops.
- **Points:** 8,000 desktop / 4,200 ≤760px / 2,600 low-power (≤2 cores or Save-Data); pixel ratio capped at 1.75 / 1.5 / 1. Each point is a bright core plus a soft halo (reads as bokeh through glass) in Signal Blue at 80% alpha; 12% are lime activations (1.8× size, sine twinkle). Shapes render at 1.25× scale on desktop. Distant points fade to 30%.
- **Shapes:** deterministic, cached. Hero `manifold`, About `clusters`, Projects `network`, Skills `lattice`, Education and Writing `spiral`, Contact `plane`, blog/post `haze`, plus `core` for the boot.
- **Primary — scroll-scrubbed morph:** on the home page the shape is tied to the scroll position. The last 40% of each section blends (smoothstep) into the next section's shape; the GPU lerps toward the scroll target (rate 7/s) so it never jitters. Each point is staggered by its seed and bulges outward mid-flight. The horizontal focus (x 2.3 hero, 1.9 about/contact, 0 for full-width sections) blends with the same progress.
- **Boot:** the field unfolds from a dense `core` into the manifold over 2.4s, in step with the hero intro.
- **Secondary — forward-pass wave:** a Gaussian signal front sweeps along x over 1.8s (sine in-out), lifting points and lighting them lime/white. It fires on every section change and every 5.2–7.2s at rest.
- **Secondary — pointer lens:** on fine pointers, points within ~0.45 screen units of the cursor are pushed outward and brighten; the effect fades 1.4s after the pointer stops. A click or tap on empty space sends a ring ripple (1.4s).
- **Route change:** the camera dives 1.6 units into the field and settles back (1.1s, sine) while the cloud tweens to `haze` (blog 0.55, post 0.4 intensity) or back to the current section's shape.
- **Ambient:** per-point drift, 0.05 rad/s spin, pointer-follow tilt.
- **Fallbacks:** paused while the tab is hidden; reduced motion snaps shapes per section with a single static frame (no wave, pointer, ripple or dive); no WebGL keeps the CSS backdrop.

### Motion choreography (`site.js`, GSAP 3.13 + ScrollTrigger + SplitText)
- **Tokens:** `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) for CSS transitions, at 140ms (quick state changes), 320ms (indicator, specular, toasts) and 560ms (veil). GSAP uses `expo.out` for arrivals and `power2.in` for exits.
- **Hero intro:** a single timeline. The nav drops 24px and fades in over 0.9s. The name splits into masked lines and its words rise from 115% over 1.1s, staggered 0.06s. The remaining hero items rise 18px out of an 8px blur over 0.9s, staggered 0.07s. The intro waits up to 900ms for the site API and for the display font.
- **Section reveals:** one-shot ScrollTriggers at `top 82%`, built inside one `gsap.context` per section so a section can be rebuilt (posts arriving, language switch) without re-running `from()` on hidden elements:
  - heads rise 32px
  - the timeline rail draws (scaleY 0 to 1, 1.2s) while items slide in 14px from the left
  - project lenses rise 56px with an `inset(14% … round 32px)` clip-path wipe (1s, at `top 88%`)
  - skill rows rise, then chips pop in with `back.out(2)` (0.4s, 0.02s stagger)
  - education panels rise 36px
  - post rows rise 18px
  - contact items slide in 16px from the right
- **View swaps:** a GSAP crossfade (this is not the View Transitions API). The current view exits up 10px into a 4px blur in 0.18s. The next view enters from 16px below out of a 6px blur in 0.5s.
- **Safety:** motion only arms when `motion-ok` is set (the reduced-motion check passed) and scripts confirm with `motion-armed` within 2.5s. Otherwise the hidden hero state is removed. Reduced motion collapses all CSS transitions and animations to 1ms.

## Do's and Don'ts

### Do:
- **Do** build every new surface as a `.lens` over the field or backdrop gradient. Use `.lens--strong` when it holds long-form reading.
- **Do** keep lime to one filled primary action per group, plus live, saved and focus states (The Activation Rule).
- **Do** use Hairline borders (1px, 9% or 16% white) and divide content inside a lens with rules, not nested lenses.
- **Do** step radii down as you nest: 32px outer project/reader lens, 24px panel, 16px inner block, 10px control, pill for actions.
- **Do** set dates, tags, code and counts in JetBrains Mono with tabular numerals, and everything else in Geist/Inter.
- **Do** give each new home section a `data-shape` and its own reveal fitted to its content, using expo-out, a one-shot ScrollTrigger, and at most about 56px of travel.
- **Do** keep content visible without JavaScript or motion: gate hidden states behind `motion-ok` and honour `prefers-reduced-motion`.
- **Do** confirm destructive admin actions inline with the danger-wash pill.

### Don't:
- **Don't** introduce solid opaque cards, a second panel material or a light theme. The world is a single dark glass material.
- **Don't** fill buttons or large areas with Signal Blue. Blue is atmosphere and structure.
- **Don't** add a new accent hue. Amber and salmon are admin state colours only.
- **Don't** set lime as body text or as a resting decorative fill.
- **Don't** run the WebGL field in the admin. The workbench stays still on its static gradient.
- **Don't** use hard offset shadows or coloured glows. Depth comes from blur, hairlines and the lens ambient shadow.
- **Don't** put uppercase eyebrows or kickers above section titles. Headings stand alone.
- **Don't** use native `alert` or `confirm` dialogs in the admin.
- **Don't** loop decorative animation. The status dot pulses three times and the field drifts. Nothing else moves at rest.
