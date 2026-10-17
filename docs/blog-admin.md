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
- **Media**: upload images from the Media page or straight from an image block / cover field. Files live on the mini PC in `uploads/` (outside git, included in the daily backup).
- **Resume / CV**: upload a new PDF from any device; it becomes the active CV immediately (nav Resume, hero Download CV, contact). Older versions stay listed so you can switch back, or return to the PDF stored in the repo.
- **Blog listing**: choose pinned posts (in order) and posts hidden from the lists.

## Backups

`systemd/blog-backup.timer` runs `scripts/backup.sh` every day at 03:30 (and on the next boot if the machine was off):
a `pg_dump` of the blog database plus a tarball of `uploads/` (images and CV versions) in `~/backups/nhatbang-web/`, kept for 14 days.

```bash
cp systemd/blog-backup.* ~/.config/systemd/user/ && systemctl --user daemon-reload && systemctl --user enable --now blog-backup.timer
bash scripts/backup.sh                                   # run one now
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" ~/backups/nhatbang-web/db-<stamp>.dump
tar -xzf ~/backups/nhatbang-web/uploads-<stamp>.tar.gz -C .   # restores ./uploads
```

Backups live on the same disk as the data; copy `~/backups/nhatbang-web/` elsewhere for protection against disk failure.

## Local development

```bash
# API against a local/test database
set -a; . ./.env; set +a; npm run dev:api        # http://localhost:8787
# Static site that behaves like GitHub Pages (404.html fallback)
npm run dev:static                               # http://localhost:5500
```

Open `http://localhost:5500/?api=http://localhost:8787` (or `/admin/?api=...`). The `?api=` override only works on localhost.
