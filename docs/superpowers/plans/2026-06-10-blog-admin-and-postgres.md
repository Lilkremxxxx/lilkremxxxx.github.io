# Blog Admin and Postgres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-repo admin UI for managing blog posts and wire it to the existing Postgres-backed blog API contract.

**Architecture:** Keep the current GitHub Pages portfolio static, but add a lightweight admin surface inside the same `index.html` SPA that can create, edit, publish, and delete blog posts through the existing REST API. The admin UI will use a shared form model for `blog_posts`, support tag assignment through the API, and stay separate from the public blog listing/detail views so the public site remains simple.

**Tech Stack:** HTML, vanilla JavaScript, Express, PostgreSQL, `pg`, `cors`, `dotenv`

---

### Task 1: Add admin route and admin shell to the SPA

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

No automated test harness exists for this static file, so verify the missing route manually by checking that `/admin/blog` is not handled before the change.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "view-admin-blog|/admin/blog" index.html
```

Expected: no matches for the admin route or admin view.

- [ ] **Step 3: Write minimal implementation**

Add a new `view-admin-blog` section with:

```html
<div id="view-admin-blog" class="page-view hidden transition-opacity duration-300 opacity-0 w-full max-w-6xl mx-auto">
  <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
    <section class="rounded-3xl border border-glass-border bg-surface-container/40 p-5 md:p-6">
      <h2 class="text-2xl font-headline-lg text-white">Blog Admin</h2>
      <form id="blog-admin-form" class="mt-5 space-y-4">
        <input name="slug" placeholder="slug" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        <input name="title" placeholder="title" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        <textarea name="excerpt" placeholder="excerpt" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white min-h-24"></textarea>
        <input name="coverImageUrl" placeholder="cover image URL" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        <textarea name="contentMarkdown" placeholder="markdown content" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white min-h-40"></textarea>
        <textarea name="contentHtml" placeholder="HTML content" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white min-h-32"></textarea>
        <input name="tags" placeholder="tags comma separated" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        <div class="grid grid-cols-2 gap-3">
          <select name="status" class="rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white">
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
          <input name="readingTimeMinutes" type="number" min="1" value="2" class="rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        </div>
        <input name="publishedAt" type="datetime-local" class="w-full rounded-lg bg-black/20 border border-glass-border px-3 py-2 text-white" />
        <button type="submit" class="w-full rounded-lg bg-primary text-on-primary px-4 py-3 font-medium">Save Post</button>
      </form>
    </section>
    <section class="space-y-4">
      <div id="blog-admin-status" class="text-sm text-on-surface-variant"></div>
      <div id="blog-admin-list" class="grid gap-4"></div>
    </section>
  </div>
</div>
```

Add a public nav link to `/admin/blog`, and update `handleRoute()` to map that path to `view-admin-blog`.

- [ ] **Step 4: Run the manual check**

Run:

```bash
rg -n "view-admin-blog|/admin/blog|blog-admin-form" index.html
```

Expected: matches for the new route, form, and admin list container.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add blog admin shell"
```

### Task 2: Add admin CRUD helpers and tag syncing in client-side JavaScript

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**

Manually check that the admin form currently has no submit handler or API helper wiring.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "blog-admin-form|blog-admin-list|x-admin-key|/api/blog/posts" index.html
```

Expected: only the public read endpoints should exist before this task.

- [ ] **Step 3: Write minimal implementation**

Add these helpers near the blog loader code:

```javascript
function getAdminKey() {
  return localStorage.getItem('blog_admin_key') || '';
}

function setAdminStatus(message, isError = false) {
  const status = document.getElementById('blog-admin-status');
  if (!status) return;
  status.textContent = message;
  status.className = isError ? 'text-sm text-error' : 'text-sm text-on-surface-variant';
}

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const adminKey = getAdminKey();
  if (adminKey) headers['x-admin-key'] = adminKey;
  const response = await fetch(`${BLOG_API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}
```

Add a `loadAdminPosts()` function that fetches `GET /api/blog/posts?status=published` and `?status=draft` and renders a clickable list with edit/delete actions.

Add a `fillAdminForm(post)` function that populates the form for editing.

Add form submit handling that:
1. builds payload fields from the form,
2. creates a post when there is no selected slug,
3. updates a post when a selected slug exists,
4. syncs tags by POSTing/PUTting through the same admin API contract,
5. reloads the list after success.

Use this payload shape:

```javascript
{
  slug,
  title,
  excerpt,
  coverImageUrl,
  contentMarkdown,
  contentHtml,
  status,
  readingTimeMinutes: Number(readingTimeMinutes),
  publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
  seoTitle: title,
  seoDescription: excerpt,
  tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}
```

- [ ] **Step 4: Run the manual check**

Run:

```bash
node --check server/index.js
rg -n "getAdminKey|setAdminStatus|apiRequest|loadAdminPosts|fillAdminForm" index.html
```

Expected: syntax check passes and all helper names are present.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: wire blog admin CRUD helpers"
```

### Task 3: Extend the backend API for tag syncing and admin edit flows

**Files:**
- Modify: `server/index.js`
- Modify: `db/schema.sql`

- [ ] **Step 1: Write the failing test**

Manually check the API contract for tag management does not exist yet.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "blog_post_tags|tags|/api/blog/posts/:slug" server/index.js db/schema.sql
```

Expected: the current implementation has no create/update tag sync endpoint.

- [ ] **Step 3: Write minimal implementation**

Add a `syncPostTags(client, postId, tagNames)` helper in `server/index.js`:

```javascript
async function syncPostTags(client, postId, tagNames) {
  await client.query('DELETE FROM blog_post_tags WHERE post_id = $1', [postId]);
  for (const tagName of tagNames) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const tagRow = await client.query(
      `
        INSERT INTO blog_tags (slug, name)
        VALUES ($1, $2)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `,
      [slug, tagName]
    );
    await client.query(
      'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, tagRow.rows[0].id]
    );
  }
}
```

Update `POST /api/blog/posts` and `PUT /api/blog/posts/:slug` to accept `tags` from the JSON body and call `syncPostTags()` inside a transaction.

Extend `GET /api/blog/posts` and `GET /api/blog/posts/:slug` to return `tags` exactly as a string array.

Keep `db/schema.sql` as the source of truth for the three blog tables and the `updated_at` trigger.

- [ ] **Step 4: Run the manual check**

Run:

```bash
node --check server/index.js
psql "$DATABASE_URL" -f db/schema.sql
```

Expected: syntax passes, and schema applies cleanly to the target Postgres instance.

- [ ] **Step 5: Commit**

```bash
git add server/index.js db/schema.sql
git commit -m "feat: sync blog tags in postgres"
```

### Task 4: Add admin auth bootstrap and local operator docs

**Files:**
- Modify: `.env.example`
- Create: `docs/blog-admin.md`

- [ ] **Step 1: Write the failing test**

Manually check that there is no documented way to set the admin key or API base yet.

- [ ] **Step 2: Run the manual check**

Run:

```bash
rg -n "ADMIN_API_KEY|BLOG_API_BASE|blog admin" .env.example docs
```

Expected: no admin usage guide yet.

- [ ] **Step 3: Write minimal implementation**

Add this to `.env.example`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
PORT=8787
ADMIN_API_KEY=change-me
BLOG_PUBLIC_API_BASE=https://your-api-domain.example
```

Create `docs/blog-admin.md` with:

```md
# Blog Admin

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `ADMIN_API_KEY` to a strong secret.
3. Run `npm install`.
4. Run `npm run db:schema`.
5. Run `npm run db:seed`.
6. Start the API with `npm run dev:api`.

## Admin usage

- Open `/admin/blog`.
- Paste the same `ADMIN_API_KEY` value into the browser prompt or local storage bootstrap.
- Create or update posts from the form.
```

- [ ] **Step 4: Run the manual check**

Run:

```bash
sed -n '1,120p' .env.example
sed -n '1,200p' docs/blog-admin.md
```

Expected: both files contain exact setup instructions and no placeholders.

- [ ] **Step 5: Commit**

```bash
git add .env.example docs/blog-admin.md
git commit -m "docs: add blog admin setup guide"
```

### Task 5: Verify public blog and admin flows end to end

**Files:**
- Modify: `index.html`
- Modify: `server/index.js`

- [ ] **Step 1: Write the failing test**

Manually verify the API cannot serve a blog post until the DB is seeded and that the admin form cannot save without a selected API base.

- [ ] **Step 2: Run the manual check**

Run:

```bash
npm install
npm run db:schema
npm run db:seed
npm run dev:api
```

Then verify:

```bash
curl -s http://localhost:8787/api/health
curl -s http://localhost:8787/api/blog/posts
curl -s http://localhost:8787/api/blog/posts/blog-ai-portfolio
```

Expected:
- `/api/health` returns `{ "ok": true }`
- `/api/blog/posts` returns seeded items
- `/api/blog/posts/blog-ai-portfolio` returns the seeded article

- [ ] **Step 3: Write minimal implementation**

Fix any broken route handling, CORS, payload parsing, or missing DOM references discovered during manual verification.

- [ ] **Step 4: Run the manual check**

Open the portfolio locally and verify:

```text
/blog
/blog/blog-ai-portfolio
/admin/blog
```

Expected:
- Public blog list renders
- Public article page renders
- Admin form loads and can create/update a post against the API

- [ ] **Step 5: Commit**

```bash
git add index.html server/index.js db/schema.sql db/seed.sql docs/blog-admin.md .env.example package.json
git commit -m "feat: complete blog admin end to end"
```
