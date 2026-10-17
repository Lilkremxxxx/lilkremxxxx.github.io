# Blog Editor and Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the blog into a responsive editorial experience with a lighter public header, a dedicated admin editor endpoint, and three real posts seeded from the existing project materials.

**Architecture:** Keep the public site as a single-file SPA, but split responsibilities internally: header/navigation, public blog reader, and admin editor each get their own rendering and state helpers inside `index.html`. The admin workflow becomes a block-based editor that stores structured content so the public renderer can safely show text, code, images, links, and callouts without fragile HTML editing. Content for the three initial posts is created in the database through the existing API, while the frontend only consumes the public read endpoints.

**Tech Stack:** HTML, vanilla JavaScript, Tailwind CSS CDN, Express, PostgreSQL, `pg`, `cloudflared`, `systemd`

---

### Task 1: Tighten the header and responsive navigation

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

Manually inspect the existing header and confirm the public nav still includes the admin item and the brand text can collide on smaller widths.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "admin|Nguyen Nhat Bang|w-\\[calc\\(100%-2rem\\)\\]|max-w-5xl" index.html
```

Expected: matches for the current admin nav item and fixed-width header shell.

- [ ] **Step 3: Write minimal implementation**

Update the header markup and styles to use:

```html
<nav class="bg-surface/70 dark:bg-surface/70 backdrop-blur-md md:backdrop-blur-xl border border-glass-border fixed top-4 left-1/2 -translate-x-1/2 z-50 mx-auto flex w-[min(100%-1rem,72rem)] max-w-[72rem] flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 md:px-5 md:py-3 transition-all duration-300 ease-in-out">
```

Change the brand text to keep spacing readable on narrow widths:

```html
<a href="/" class="nav-link flex items-center gap-2 font-headline-md text-sm md:text-lg font-bold tracking-tight text-on-surface transition-colors hover:text-cyber-lime">
  <span class="material-symbols-outlined hidden text-cyber-lime sm:inline-block">terminal</span>
  <span class="hidden sm:inline-block">Nguyen Nhat Bang</span>
  <span class="sm:hidden text-cyber-lime">N.N.Bang</span>
</a>
```

Remove the public `Admin` item from both desktop and mobile nav. Keep `/admin/blog` accessible only by direct route.

Adjust the mobile nav to reduce crowding:
```html
<div class="md:hidden fixed bottom-3 left-1/2 z-50 w-[min(100%-1rem,28rem)] -translate-x-1/2 rounded-2xl border border-glass-border bg-surface/80 px-2 py-2 backdrop-blur-md">
```

- [ ] **Step 4: Run the manual check**

Run:

```bash
rg -n "/admin/blog|Nguyen Nhat Bang|N.N.Bang|mobile bottom nav" index.html
```

Expected: the admin link is gone from navigation, and the brand text uses responsive sizing.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: tighten header and responsive nav"
```

### Task 2: Convert admin into a block editor with a private endpoint

**Files:**
- Modify: `index.html`
- Modify: `server/app.js`
- Modify: `db/schema.sql`
- Modify: `db/seed.sql`

- [ ] **Step 1: Write the failing test**

Manually check that the current admin form only supports plain fields and cannot insert structured blocks.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "blog-admin-form|contentHtml|contentMarkdown|tags" index.html server/app.js db/schema.sql
```

Expected: only the old plain-content fields are present.

- [ ] **Step 3: Write minimal implementation**

Add a structured content schema in PostgreSQL:

```sql
CREATE TABLE blog_post_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('heading', 'paragraph', 'image', 'code', 'quote', 'link', 'divider', 'callout')),
  block_order INTEGER NOT NULL,
  text_value TEXT,
  html_value TEXT,
  json_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Expand the API to accept and return `blocks`:
```javascript
{
  slug,
  title,
  excerpt,
  coverImageUrl,
  contentMarkdown,
  contentHtml,
  blocks: [{ blockType, textValue, htmlValue, jsonValue }],
  tags
}
```

Replace the current admin form with a block editor:
```html
<button data-block="paragraph">Paragraph</button>
<button data-block="image">Image</button>
<button data-block="code">Code</button>
<button data-block="quote">Quote</button>
<button data-block="link">Link</button>
<button data-block="divider">Divider</button>
<button data-block="callout">Callout</button>
```

The editor must support:
- adding a block
- editing block text/value
- removing a block
- reordering blocks up/down
- inserting image URL, code sample, and URL blocks directly

Keep `/admin/blog` private and remove its icon/entry from the public nav. The admin endpoint remains reachable only by direct path.

- [ ] **Step 4: Run the manual check**

Run:

```bash
node --check server/app.js
rg -n "blog_post_blocks|block_type|data-block|blocks" index.html server/app.js db/schema.sql
```

Expected: syntax passes and the new block editor and schema identifiers are present.

- [ ] **Step 5: Commit**

```bash
git add index.html server/app.js db/schema.sql
git commit -m "feat: add blog block editor"
```

### Task 3: Seed and render the three posts

**Files:**
- Modify: `db/seed.sql`
- Modify: `index.html`
- Modify: `server/app.js`

- [ ] **Step 1: Write the failing test**

Manually verify that the database seed currently contains only the existing two posts and no `Welcome to my blog` entry.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "Welcome to my blog|blog-ai-portfolio|deep-dive-neural-architectures" db/seed.sql
```

Expected: the welcome post is missing or incomplete before this task.

- [ ] **Step 3: Write minimal implementation**

Seed three posts in this order:
1. `Welcome to my blog`
2. `Healthcare-Stroke-prediction`
3. `Lung_cancer`

For each project post, create:
- title
- excerpt
- published timestamp
- tags
- block content referencing images, code snippets, and outputs

Use the available project materials:
- `Project/Healthcare-Stroke-prediction/README.md`
- `Project/Healthcare-Stroke-prediction/Code/*.py`
- `Project/Healthcare-Stroke-prediction/artifacts/*.png|*.csv|*.json`
- `Project/Healthcare-Stroke-prediction/Documents/*.pdf|*.docx`
- `Project/Lung_cancer/README.md`
- `Project/Lung_cancer/Model_Interface/*.py|*.png|*.json|*.npy`
- `Project/Lung_cancer/Paper_Docs/paper_figures/*.png|*.json`
- `Project/Lung_cancer/Paper_Docs/*.pdf|*.docx`

Keep the public renderer simple:
```javascript
function renderBlocks(blocks) {
  return blocks.map(renderSingleBlock).join('');
}
```

- [ ] **Step 4: Run the manual check**

Run:

```bash
rg -n "Welcome to my blog|Healthcare-Stroke-prediction|Lung_cancer" db/seed.sql
```

Expected: all three posts are present in the seed file.

- [ ] **Step 5: Commit**

```bash
git add db/seed.sql index.html server/app.js
git commit -m "feat: seed three blog posts"
```

### Task 4: Validate responsive layouts and cleanup runtime artifacts

**Files:**
- Modify: `index.html`
- Modify: `.gitignore`
- Modify: `scripts/install_user_services.sh`
- Modify: `docs/blog-admin.md`

- [ ] **Step 1: Write the failing test**

Manually inspect the mobile/tablet sections and confirm the current blog/admin layout still has dense rows and oversized fixed containers.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "max-w-6xl|max-w-4xl|grid-cols-|admin/blog|BLOG_PUBLIC_API_BASE" index.html docs/blog-admin.md scripts/install_user_services.sh
```

Expected: the layout still needs responsive tuning before this task.

- [ ] **Step 3: Write minimal implementation**

Refine the public and admin layout with:
- single-column stack on mobile
- two-column split only on wide desktop
- better vertical rhythm for blog cards
- smaller hero typography at tablet widths
- no overlapping nav/actions

Remove leftover runtime blog artifacts from the repo ignore set and keep only the required source files tracked.

- [ ] **Step 4: Run the manual check**

Run:

```bash
git status --short
```

Expected: only intentional source changes remain, with sensitive runtime files ignored.

- [ ] **Step 5: Commit**

```bash
git add index.html .gitignore scripts/install_user_services.sh docs/blog-admin.md
git commit -m "feat: refine responsive blog layout"
```
