---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface brief: public portfolio (index.html)

Mode: Experience (home) / Read (blog post). Audience: recruiters skimming + tech leads reading deep. Action: download CV / contact. Proof: projects, paper-style posts, certificates. Constraints: no build step, pinned palette (dark, cyber lime #BDFF00, blue #3992ff / #a8c8ff), glassmorphism + GSAP motion + three.js background pinned by owner. Static fallback content when API fails.

## Direction contract
THESIS: The portfolio is a lens held over a live latent space. Glass panels are lenses, not decoration: what sits behind them is a WebGL point field that reorganizes as you read. Refuses the category default of a centered hero over equal cards on a flat dark page.
OWN-WORLD: Near-black ink ground (#0b0d10), one luminous field of blue points with sparse lime "activations". Panels are frosted lenses: 12px backdrop blur (6px on the hero lens so the field reads through), faint top highlight, 1px hairline, soft offset shadow. Geist display, Inter body, mono only for dates, code and tags. Lime is reserved for the primary action and live states.
STORY: In seconds the visitor reads name, role and a one-line claim, sees CV + contact, then scrolls through experience, projects, skills, education, posts; each section is backed by something openable.
FIRST VIEWPORT: Left-weighted name set large (clamp 3.5-7rem) with role and claim beneath, CV (lime) and contact actions, availability status; the field forms a slow manifold on the right half, seen through the nav lens.
FORM: pinned by owner (lens over latent field), seed:f3b90625b145369b (roll run for the record; owner-pinned direction kept). Signature interaction: the point field morphs between shapes per section (manifold -> clusters -> layered network -> grid -> calm plane) driven by scroll and route changes; dims to a quiet haze on reading routes.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
