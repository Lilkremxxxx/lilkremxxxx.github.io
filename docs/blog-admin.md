# Blog & site admin

Admin UI: `https://lilkremxxxx.github.io/admin/` (file `admin/index.html`). It edits blog posts, tags and every home-page section through the API at `https://blog-api.verbaa.pp.ua`.

Never write real passwords, keys or connection strings in this repo — it is public.

## Server setup (mini PC)

`.env` (not committed) needs:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
PORT=8787
PGSSL=false
ADMIN_PASSWORD_HASH=...   # written by npm run admin:set-password
ADMIN_TOKEN_SECRET=...    # written by npm run admin:set-password if missing
# Optional:
# ADMIN_API_KEY=...       # x-admin-key header for scripts
# CORS_ORIGINS=https://lilkremxxxx.github.io,http://localhost:5500
# ADMIN_TOKEN_TTL_HOURS=12
```

1. `npm install`
2. Database (new DB): `npm run db:schema` then `npm run db:seed`.
   Existing DB: `npm run db:migrate:site-sections` (adds the `site_sections` table).
3. Set the admin password: `npm run admin:set-password` (prompts, min 10 characters).
4. Restart the API: `systemctl --user restart blog-backend`.

Changing the password revokes every issued login token.

## Using the admin

- Sign in with the password. The session lasts 12 hours (stored in this browser).
- **Posts**: search, filter by status, create, edit, delete (inline confirm). Content is a list of blocks
  (paragraph, heading, image, code, quote, link, table) with a live preview. `Ctrl/Cmd + S` saves.
  Code blocks only show on the site under Method/Implementation/Pipeline/Model/Data/Results-style headings — the editor warns when one will be hidden.
- **Tags**: rename (renaming onto an existing name merges the two) or delete.
- **Home page**: one form per section (Hero, About & experience, Projects, Skills, Education, Contact, Links & CV).
  Each text has English and optional Vietnamese. Saving makes it live immediately; "Reset to default" returns to the built-in text in `assets/js/content.js`.
- Images: add files to `assets/blog/` in the repo and push, then use `/assets/blog/<file>` as the URL.

## Local development

```bash
# API against a local/test database
set -a; . ./.env; set +a; npm run dev:api        # http://localhost:8787
# Static site that behaves like GitHub Pages (404.html fallback)
npm run dev:static                               # http://localhost:5500
```

Open `http://localhost:5500/?api=http://localhost:8787` (or `/admin/?api=...`). The `?api=` override only works on localhost.
