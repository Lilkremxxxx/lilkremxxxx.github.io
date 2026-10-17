# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Recruiters / HR** hiring an AI Engineer: skim the home page for a few minutes and decide whether to invite to interview.
- **Tech leads / engineers** evaluating real skill: read projects, the paper-style blog posts, and linked code in depth.
- **The owner (Nguyen Nhat Bang)** as the only admin: edits blog posts, tags and every home-page section from `/admin/`, usually from a desktop, sometimes from a phone.

## Product Purpose
Personal portfolio and technical blog of Nguyen Nhat Bang, AI Engineer (FPT University, Hanoi). Success = the visitor downloads the CV or makes contact. Projects and blog posts are the proof that earns that action.

## Positioning
A working AI engineer's site where the proof is first-hand: shipped products (Invera, Verba), paper-style write-ups with real figures from the owner's own ML experiments (stroke prediction, lung-cancer CT with C++ inference), and a self-hosted blog stack (Express + Postgres on the owner's mini PC behind a Cloudflare tunnel).

## Operating Context
- Public site served by GitHub Pages as a static SPA; blog content and section content come from the owner's API at `blog-api.verbaa.pp.ua`.
- When the API is down the public site must still show the core portfolio (static fallback content).
- Admin is used by one person; edits should be fast and safe (no accidental deletes, clear save state).

## Capabilities and Constraints
- No build step: plain HTML/CSS/JS (own CSS, no Tailwind), libraries via pinned CDN URLs (GSAP, three.js).
- Routes: `/`, `/about`, `/education`, `/project`, `/skill`, `/contact`, `/blog`, `/blog/:slug`, `/admin/`.
- Blog posts are structured content blocks (paragraph, heading, image, code, quote, link, table).
- Default language English with a VN toggle; admin stores EN and optional VN text per field.

## Brand Commitments
- Name: Nguyen Nhat Bang · title "AI Engineer" · mascot (`mascot.png`, `mascot_transparent.png`).
- Existing identity: dark surfaces with cyber-lime `#BDFF00` and blue accents (owner chose to keep this palette).

## Evidence on Hand
- CV PDF: `Nguyen_Nhat_Bang_AI_Engineer.pdf`; certificates (Coursera links, `nvidia_dl.pdf`, `2026_AI Course_Nguyen Nhat Bang.pdf`).
- Experience: 10 Group Vietnam, Insight Data, Alchera Vietnam. Education: FPT University (AI), Hanoi University (English).
- Projects: Invera, Verba (GitHub links in `index.html`). Blog figures in `assets/blog/`.
- No testimonials, client logos, metrics or awards exist — do not invent any.

## Product Principles
1. The CV and contact are always one click away.
2. Every claim is backed by something the visitor can open (repo, post, certificate).
3. Fast skim on the home page, depth in the blog.
4. Content is owned by the admin, not hard-coded — but the site never goes blank when the API fails.
