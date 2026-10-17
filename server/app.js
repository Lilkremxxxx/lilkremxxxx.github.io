import cors from 'cors';
import express from 'express';
import { Pool } from 'pg';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const adminApiKey = process.env.ADMIN_API_KEY || '';
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
const adminTokenSecret = process.env.ADMIN_TOKEN_SECRET || '';
const tokenTtlMs = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 12) * 60 * 60 * 1000;
const corsOrigins = (process.env.CORS_ORIGINS || 'https://lilkremxxxx.github.io,http://localhost:5500,http://127.0.0.1:5500')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const POST_STATUSES = ['draft', 'published', 'archived'];
const SITE_SECTION_KEYS = ['hero', 'about', 'education', 'skills', 'projects', 'contact', 'social', 'blog'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SECTION_BYTES = 200 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const UPLOAD_MAX_BYTES = 6 * 1024 * 1024;
const UPLOAD_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}\.(png|jpg|webp|gif)$/;
const CV_DIR = join(UPLOAD_DIR, 'cv');
const CV_MAX_BYTES = 10 * 1024 * 1024;
// <yyyymmdd>-<6 hex>--<download name>.pdf ; the part after "--" becomes the downloaded file name.
const CV_NAME_PATTERN = /^\d{8}-[0-9a-f]{6}--[A-Za-z0-9_-]{1,80}\.pdf$/;
const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const toTagSlug = (tagName) =>
  tagName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeTags = (tags) =>
  (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean);

const normalizeBlocks = (blocks) =>
  (Array.isArray(blocks) ? blocks : [])
    .map((block, index) => {
      if (!block || typeof block !== 'object') return null;
      const type = String(block.type || '').trim();
      if (!type) return null;

      const data = block.data && typeof block.data === 'object' && !Array.isArray(block.data)
        ? block.data
        : {};

      return {
        id: String(block.id || `block-${index + 1}`),
        type,
        data
      };
    })
    .filter(Boolean);

const parseJsonColumn = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length) return JSON.parse(value);
  return [];
};

const normalizePost = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  coverImageUrl: row.cover_image_url,
  contentMarkdown: row.content_markdown,
  contentHtml: row.content_html,
  contentBlocks: parseJsonColumn(row.content_blocks),
  status: row.status,
  language: row.language,
  readingTimeMinutes: row.reading_time_minutes,
  publishedAt: row.published_at,
  updatedAt: row.updated_at,
  seoTitle: row.seo_title,
  seoDescription: row.seo_description,
  tags: parseJsonColumn(row.tags)
});

// ---------- Admin auth ----------

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};

// ADMIN_PASSWORD_HASH format: scrypt:<salt hex>:<hash hex> (written by scripts/set-admin-password.mjs)
function verifyPassword(password) {
  const [scheme, saltHex, hashHex] = adminPasswordHash.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// The signing key includes the password hash, so changing the password revokes every issued token.
const tokenSigningKey = () => `${adminTokenSecret}:${adminPasswordHash}`;

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', tokenSigningKey()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature || !adminTokenSecret || !adminPasswordHash) return null;
  const expected = createHmac('sha256', tokenSigningKey()).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch (_error) {
    return null;
  }
}

const passwordLoginEnabled = () => Boolean(adminPasswordHash && adminTokenSecret);
const adminAuthConfigured = () => passwordLoginEnabled() || Boolean(adminApiKey);

function isAdmin(req) {
  const authHeader = req.header('authorization') || '';
  if (authHeader.startsWith('Bearer ') && verifyToken(authHeader.slice(7))) return true;
  const key = req.header('x-admin-key');
  return Boolean(adminApiKey && key && safeEqual(key, adminApiKey));
}

const requireAdmin = (req, res, next) => {
  if (!adminAuthConfigured()) {
    return res.status(503).json({ error: 'Admin auth is not configured on the server' });
  }
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

const clientIp = (req) =>
  req.header('cf-connecting-ip') || String(req.header('x-forwarded-for') || '').split(',')[0].trim() || req.ip;

function loginBlockedFor(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) return 0;
  return entry.failures >= LOGIN_MAX_FAILURES ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { failures: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.failures += 1;
  }
}

// ---------- Validation ----------

function readPostInput(body, { requireSlug }) {
  const input = body || {};
  const slug = String(input.slug || '').trim();
  const title = String(input.title || '').trim();
  const status = String(input.status || 'draft');
  const readingTimeMinutes = Math.max(1, Math.round(Number(input.readingTimeMinutes) || 1));

  if (requireSlug && !SLUG_PATTERN.test(slug)) {
    throw new HttpError(400, 'Slug must use lowercase letters, numbers and single hyphens');
  }
  if (!title) throw new HttpError(400, 'Title is required');
  if (!POST_STATUSES.includes(status)) throw new HttpError(400, 'Unknown status');

  let publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) throw new HttpError(400, 'Invalid publish date');
  if (!publishedAt && status === 'published') publishedAt = new Date();

  return {
    slug,
    title,
    excerpt: String(input.excerpt || ''),
    coverImageUrl: input.coverImageUrl ? String(input.coverImageUrl) : null,
    contentMarkdown: String(input.contentMarkdown || ''),
    contentHtml: String(input.contentHtml || ''),
    contentBlocks: JSON.stringify(normalizeBlocks(input.contentBlocks)),
    status,
    language: String(input.language || 'en'),
    readingTimeMinutes,
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    seoTitle: input.seoTitle ? String(input.seoTitle) : null,
    seoDescription: input.seoDescription ? String(input.seoDescription) : null,
    tags: normalizeTags(input.tags)
  };
}

// ---------- Uploads ----------

// Trust the bytes, not the Content-Type header.
function sniffImage(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 0, 4) === 'GIF8') return 'gif';
  return null;
}

function uploadBaseName(original) {
  const base = String(original || 'image')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'image';
}

// ---------- Data helpers ----------

async function syncPostTags(client, postId, tagNames) {
  await client.query('DELETE FROM blog_post_tags WHERE post_id = $1', [postId]);

  const uniqueTagNames = [...new Set(normalizeTags(tagNames))];

  for (const tagName of uniqueTagNames) {
    const slug = toTagSlug(tagName);
    if (!slug) continue;

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
      `
        INSERT INTO blog_post_tags (post_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [postId, tagRow.rows[0].id]
    );
  }
}

const POST_SELECT = `
  SELECT
    p.*,
    COALESCE(
      json_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
      '[]'
    ) AS tags
  FROM blog_posts p
  LEFT JOIN blog_post_tags pt ON pt.post_id = p.id
  LEFT JOIN blog_tags t ON t.id = pt.tag_id
`;

async function fetchPostBySlug(client, slug) {
  const { rows } = await client.query(`${POST_SELECT} WHERE p.slug = $1 GROUP BY p.id LIMIT 1`, [slug]);
  return rows[0] || null;
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_rollbackError) {
      // Ignore rollback failures so the original error can still be reported.
    }
    throw error;
  } finally {
    client.release();
  }
}

// ---------- Middleware ----------

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (curl, server-to-server) are allowed; browsers always send one.
    callback(null, !origin || corsOrigins.includes(origin));
  }
}));
app.use(express.json({ limit: '2mb' }));

// ---------- Health & auth ----------

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

app.post('/api/admin/login', (req, res) => {
  if (!passwordLoginEnabled()) {
    return res.status(503).json({ error: 'Password login is not configured. Run npm run admin:set-password on the server.' });
  }

  const ip = clientIp(req);
  const retryAfter = loginBlockedFor(ip);
  if (retryAfter) {
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} min.` });
  }

  if (!verifyPassword(req.body?.password || '')) {
    recordLoginFailure(ip);
    return res.status(401).json({ error: 'Wrong password' });
  }

  loginAttempts.delete(ip);
  const expiresAt = Date.now() + tokenTtlMs;
  res.json({ token: signToken({ sub: 'admin', exp: expiresAt }), expiresAt });
});

app.get('/api/admin/session', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

// ---------- Blog posts ----------

app.get('/api/blog/posts', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = String(req.query.status || 'published');

  if (status !== 'published' && !isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (status !== 'all' && !POST_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Unknown status' });
  }

  const where = status === 'all' ? '' : 'WHERE p.status = $3';
  const params = status === 'all' ? [limit, offset] : [limit, offset, status];
  const { rows } = await pool.query(
    `
      ${POST_SELECT}
      ${where}
      GROUP BY p.id
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    params
  );

  res.json({ items: rows.map(normalizePost), limit, offset });
});

app.get('/api/blog/posts/:slug', async (req, res) => {
  const row = await fetchPostBySlug(pool, req.params.slug);

  if (!row || (row.status !== 'published' && !isAdmin(req))) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({ item: normalizePost(row) });
});

app.post('/api/blog/posts', requireAdmin, async (req, res) => {
  const post = readPostInput(req.body, { requireSlug: true });

  const row = await withTransaction(async (client) => {
    const insertResult = await client.query(
      `
        INSERT INTO blog_posts (
          slug, title, excerpt, cover_image_url, content_markdown, content_html, content_blocks,
          status, language, reading_time_minutes, published_at, seo_title, seo_description
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id, slug
      `,
      [post.slug, post.title, post.excerpt, post.coverImageUrl, post.contentMarkdown, post.contentHtml, post.contentBlocks, post.status, post.language, post.readingTimeMinutes, post.publishedAt, post.seoTitle, post.seoDescription]
    );

    await syncPostTags(client, insertResult.rows[0].id, post.tags);
    return fetchPostBySlug(client, insertResult.rows[0].slug);
  });

  res.status(201).json({ item: normalizePost(row) });
});

app.put('/api/blog/posts/:slug', requireAdmin, async (req, res) => {
  const post = readPostInput(req.body, { requireSlug: false });

  const row = await withTransaction(async (client) => {
    const updateResult = await client.query(
      `
        UPDATE blog_posts
        SET title = $2,
            excerpt = $3,
            cover_image_url = $4,
            content_markdown = $5,
            content_html = $6,
            content_blocks = $7,
            status = $8,
            language = $9,
            reading_time_minutes = $10,
            published_at = $11,
            seo_title = $12,
            seo_description = $13
        WHERE slug = $1
        RETURNING id, slug
      `,
      [req.params.slug, post.title, post.excerpt, post.coverImageUrl, post.contentMarkdown, post.contentHtml, post.contentBlocks, post.status, post.language, post.readingTimeMinutes, post.publishedAt, post.seoTitle, post.seoDescription]
    );

    if (!updateResult.rows.length) throw new HttpError(404, 'Post not found');

    await syncPostTags(client, updateResult.rows[0].id, post.tags);
    return fetchPostBySlug(client, updateResult.rows[0].slug);
  });

  res.json({ item: normalizePost(row) });
});

app.delete('/api/blog/posts/:slug', requireAdmin, async (req, res) => {
  const result = await pool.query('DELETE FROM blog_posts WHERE slug = $1 RETURNING id', [req.params.slug]);
  if (!result.rowCount) return res.status(404).json({ error: 'Post not found' });
  res.status(204).end();
});

// ---------- Tags ----------

app.get('/api/blog/tags', async (req, res) => {
  const includeAll = req.query.scope === 'all';
  if (includeAll && !isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { rows } = await pool.query(
    `
      SELECT t.slug, t.name, COUNT(p.id)::int AS post_count
      FROM blog_tags t
      LEFT JOIN blog_post_tags pt ON pt.tag_id = t.id
      LEFT JOIN blog_posts p ON p.id = pt.post_id ${includeAll ? '' : "AND p.status = 'published'"}
      GROUP BY t.id
      ORDER BY t.name
    `
  );

  res.json({ items: rows.map((row) => ({ slug: row.slug, name: row.name, postCount: row.post_count })) });
});

app.patch('/api/blog/tags/:slug', requireAdmin, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const nextSlug = toTagSlug(name);
  if (!nextSlug) return res.status(400).json({ error: 'Tag name must contain letters or numbers' });

  const tag = await withTransaction(async (client) => {
    const current = await client.query('SELECT id FROM blog_tags WHERE slug = $1', [req.params.slug]);
    if (!current.rowCount) throw new HttpError(404, 'Tag not found');
    const currentId = current.rows[0].id;

    const target = await client.query('SELECT id FROM blog_tags WHERE slug = $1 AND id <> $2', [nextSlug, currentId]);
    if (target.rowCount) {
      // Renaming onto an existing tag merges the two.
      const targetId = target.rows[0].id;
      await client.query(
        `
          INSERT INTO blog_post_tags (post_id, tag_id)
          SELECT post_id, $2 FROM blog_post_tags WHERE tag_id = $1
          ON CONFLICT DO NOTHING
        `,
        [currentId, targetId]
      );
      await client.query('DELETE FROM blog_tags WHERE id = $1', [currentId]);
      const merged = await client.query('UPDATE blog_tags SET name = $2 WHERE id = $1 RETURNING slug, name', [targetId, name]);
      return { ...merged.rows[0], merged: true };
    }

    const renamed = await client.query('UPDATE blog_tags SET slug = $2, name = $3 WHERE id = $1 RETURNING slug, name', [currentId, nextSlug, name]);
    return { ...renamed.rows[0], merged: false };
  });

  res.json({ item: tag });
});

app.delete('/api/blog/tags/:slug', requireAdmin, async (req, res) => {
  const result = await pool.query('DELETE FROM blog_tags WHERE slug = $1 RETURNING id', [req.params.slug]);
  if (!result.rowCount) return res.status(404).json({ error: 'Tag not found' });
  res.status(204).end();
});

// ---------- Home page sections ----------

app.get('/api/site', async (_req, res) => {
  const { rows } = await pool.query('SELECT key, data, updated_at FROM site_sections');
  const sections = {};
  for (const row of rows) sections[row.key] = { data: row.data, updatedAt: row.updated_at };
  res.json({ sections });
});

app.put('/api/site/:key', requireAdmin, async (req, res) => {
  const { key } = req.params;
  const data = req.body?.data;
  if (!SITE_SECTION_KEYS.includes(key)) return res.status(404).json({ error: 'Unknown section' });
  if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'Section data must be an object' });
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_SECTION_BYTES) return res.status(413).json({ error: 'Section is too large' });

  const { rows } = await pool.query(
    `
      INSERT INTO site_sections (key, data)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      RETURNING key, data, updated_at
    `,
    [key, JSON.stringify(data)]
  );

  res.json({ section: { key: rows[0].key, data: rows[0].data, updatedAt: rows[0].updated_at } });
});

app.delete('/api/site/:key', requireAdmin, async (req, res) => {
  if (!SITE_SECTION_KEYS.includes(req.params.key)) return res.status(404).json({ error: 'Unknown section' });
  await pool.query('DELETE FROM site_sections WHERE key = $1', [req.params.key]);
  res.status(204).end();
});

// ---------- Media ----------

app.use('/uploads', express.static(UPLOAD_DIR, {
  index: false,
  dotfiles: 'ignore',
  maxAge: '30d',
  immutable: true,
  setHeaders(res, filePath) {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    const name = filePath.split('/').pop();
    // CV versions download under their clean name instead of opening a versioned file name.
    if (CV_NAME_PATTERN.test(name)) res.set('Content-Disposition', `attachment; filename="${name.split('--')[1]}"`);
  }
}));

// ---------- CV / resume ----------

app.post(
  '/api/admin/cv',
  requireAdmin,
  express.raw({ type: 'application/pdf', limit: CV_MAX_BYTES }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.toString('ascii', 0, 5) !== '%PDF-') {
      return res.status(415).json({ error: 'The file is not a PDF' });
    }
    const downloadName = String(req.query.name || 'CV')
      .replace(/\.pdf$/i, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'CV';
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const name = `${stamp}-${randomBytes(3).toString('hex')}--${downloadName}.pdf`;
    await mkdir(CV_DIR, { recursive: true });
    await writeFile(join(CV_DIR, name), req.body, { flag: 'wx' });
    res.status(201).json({ item: { name, path: `/uploads/cv/${name}`, size: req.body.length } });
  }
);

app.get('/api/admin/cv', requireAdmin, async (_req, res) => {
  let names = [];
  try {
    names = (await readdir(CV_DIR)).filter((name) => CV_NAME_PATTERN.test(name));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const items = await Promise.all(names.map(async (name) => {
    const info = await stat(join(CV_DIR, name));
    return { name, downloadName: name.split('--')[1], path: `/uploads/cv/${name}`, size: info.size, createdAt: info.mtime };
  }));
  items.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items });
});

app.delete('/api/admin/cv/:name', requireAdmin, async (req, res) => {
  const { name } = req.params;
  if (!CV_NAME_PATTERN.test(name)) return res.status(400).json({ error: 'Invalid file name' });
  try {
    await unlink(join(CV_DIR, name));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
    throw error;
  }
  res.status(204).end();
});

app.post(
  '/api/admin/uploads',
  requireAdmin,
  express.raw({ type: Object.keys(IMAGE_TYPES), limit: UPLOAD_MAX_BYTES }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
      return res.status(415).json({ error: 'Send a PNG, JPG, WebP or GIF file as the request body' });
    }
    const ext = sniffImage(req.body);
    if (!ext) return res.status(415).json({ error: 'The file is not a PNG, JPG, WebP or GIF image' });

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const name = `${stamp}-${uploadBaseName(req.query.name)}-${randomBytes(3).toString('hex')}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, name), req.body, { flag: 'wx' });
    res.status(201).json({ item: { name, path: `/uploads/${name}`, size: req.body.length } });
  }
);

app.get('/api/admin/uploads', requireAdmin, async (_req, res) => {
  let names = [];
  try {
    names = (await readdir(UPLOAD_DIR)).filter((name) => UPLOAD_NAME_PATTERN.test(name));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const items = await Promise.all(names.map(async (name) => {
    const info = await stat(join(UPLOAD_DIR, name));
    return { name, path: `/uploads/${name}`, size: info.size, createdAt: info.mtime };
  }));
  items.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items });
});

app.delete('/api/admin/uploads/:name', requireAdmin, async (req, res) => {
  const { name } = req.params;
  if (!UPLOAD_NAME_PATTERN.test(name)) return res.status(400).json({ error: 'Invalid file name' });
  try {
    await unlink(join(UPLOAD_DIR, name));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
    throw error;
  }
  res.status(204).end();
});

// ---------- Errors ----------

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'File or request is too large (images up to 6 MB, CV up to 10 MB)' });
  if (error?.code === '23505') return res.status(409).json({ error: 'A post with this slug already exists' });
  console.error(error);
  res.status(500).json({ error: 'Database operation failed' });
});

export default app;
