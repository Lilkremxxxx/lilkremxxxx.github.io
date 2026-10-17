import { mergeSections, localize } from './content.js';
import { API_BASE, apiFetch } from './api.js';
import {
  BLOCK_TYPES,
  blocksToHtml,
  blocksToMarkdown,
  escapeHtml as esc,
  escapeAttribute as attr,
  estimateReadingMinutes,
  isCodeVisibleInSection,
  normalizeBlockData,
  sanitizeBlocks
} from './blocks.js';

const SESSION_KEY = 'admin_session';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOCK_LABELS = { paragraph: 'Paragraph', heading: 'Heading', image: 'Image', code: 'Code', quote: 'Quote', link: 'Link', table: 'Table' };

// ---------------------------------------------------------------- Home-section form schemas

const ctaFields = [
  { key: 'label', label: 'Label', type: 'i18n' },
  { key: 'href', label: 'Link', type: 'url', hint: 'A page like /contact, a file like /Nguyen_Nhat_Bang_AI_Engineer.pdf, or a full URL.' }
];

const SECTIONS = {
  hero: {
    label: 'Hero', icon: 'home', sitePath: '/',
    fields: [
      { key: 'status', label: 'Availability line', type: 'i18n' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'i18n' },
      { key: 'claim', label: 'Intro sentence', type: 'i18n-area' },
      { key: 'primaryCta', label: 'Primary button', type: 'group', fields: ctaFields },
      { key: 'secondaryCta', label: 'Secondary button', type: 'group', fields: ctaFields }
    ]
  },
  about: {
    label: 'About & experience', icon: 'person', sitePath: '/about',
    fields: [
      { key: 'title', label: 'Section title', type: 'i18n' },
      { key: 'intro', label: 'Intro paragraph', type: 'i18n-area' },
      {
        key: 'experience', label: 'Experience', type: 'repeat', itemName: 'role',
        itemTitle: (item) => [localize(item.role, 'en'), item.org].filter(Boolean).join(' · '),
        blank: () => ({ role: { en: '', vn: '' }, org: '', period: '', place: '', description: { en: '', vn: '' } }),
        fields: [
          { key: 'role', label: 'Role', type: 'i18n' },
          { key: 'org', label: 'Company', type: 'text', half: true },
          { key: 'place', label: 'Place / type', type: 'text', half: true, hint: 'e.g. Remote, Part-time' },
          { key: 'period', label: 'Period', type: 'text', hint: 'e.g. Jul 2025 – Dec 2025' },
          { key: 'description', label: 'Description', type: 'i18n-area' }
        ]
      }
    ]
  },
  projects: {
    label: 'Projects', icon: 'work', sitePath: '/project',
    fields: [
      { key: 'title', label: 'Section title', type: 'i18n' },
      {
        key: 'items', label: 'Projects', type: 'repeat', itemName: 'project',
        itemTitle: (item) => item.name,
        blank: () => ({ name: '', url: '', badge: '', role: '', period: '', stack: [], bullets: [{ en: '', vn: '' }] }),
        fields: [
          { key: 'name', label: 'Name', type: 'text', half: true },
          { key: 'badge', label: 'Badge', type: 'text', half: true, hint: 'e.g. Current. Leave empty for none.' },
          { key: 'role', label: 'Your role', type: 'text', half: true },
          { key: 'period', label: 'Period', type: 'text', half: true },
          { key: 'url', label: 'Repository / link', type: 'url' },
          { key: 'stack', label: 'Stack', type: 'list', hint: 'Comma-separated, e.g. Python, FastAPI' },
          { key: 'bullets', label: 'Highlights', type: 'repeat', itemName: 'highlight', of: { type: 'i18n-area' }, blank: () => ({ en: '', vn: '' }), itemTitle: (item, index) => `Highlight ${index + 1}` }
        ]
      }
    ]
  },
  skills: {
    label: 'Skills', icon: 'psychology', sitePath: '/skill',
    fields: [
      { key: 'title', label: 'Section title', type: 'i18n' },
      {
        key: 'groups', label: 'Skill groups', type: 'repeat', itemName: 'group',
        itemTitle: (item) => item.name,
        blank: () => ({ name: '', items: [] }),
        fields: [
          { key: 'name', label: 'Group name', type: 'text' },
          { key: 'items', label: 'Skills', type: 'list', hint: 'Comma-separated' }
        ]
      }
    ]
  },
  education: {
    label: 'Education', icon: 'school', sitePath: '/education',
    fields: [
      { key: 'title', label: 'Section title', type: 'i18n' },
      {
        key: 'schools', label: 'Schools', type: 'repeat', itemName: 'school',
        itemTitle: (item) => item.name,
        blank: () => ({ name: '', location: '', degree: { en: '', vn: '' }, period: '' }),
        fields: [
          { key: 'name', label: 'School', type: 'text', half: true },
          { key: 'location', label: 'Location', type: 'text', half: true },
          { key: 'degree', label: 'Degree', type: 'i18n' },
          { key: 'period', label: 'Period', type: 'text' }
        ]
      },
      { key: 'certTitle', label: 'Certificates heading', type: 'i18n' },
      {
        key: 'certifications', label: 'Certificates', type: 'repeat', itemName: 'certificate',
        itemTitle: (item) => item.name,
        blank: () => ({ name: '', url: '' }),
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'url', label: 'Link', type: 'url' }
        ]
      }
    ]
  },
  contact: {
    label: 'Contact', icon: 'mail', sitePath: '/contact',
    fields: [
      { key: 'title', label: 'Section title', type: 'i18n' },
      { key: 'intro', label: 'Intro line', type: 'i18n-area' },
      { key: 'email', label: 'Email', type: 'text', half: true },
      { key: 'phone', label: 'Phone', type: 'text', half: true },
      { key: 'phoneLabel', label: 'Phone label', type: 'i18n' },
      { key: 'facebookLabel', label: 'Facebook name', type: 'text', half: true },
      { key: 'facebookUrl', label: 'Facebook URL', type: 'url', half: true },
      { key: 'closing', label: 'Closing line', type: 'i18n' }
    ]
  },
  social: {
    label: 'Links & CV', icon: 'share', sitePath: '/',
    fields: [
      { key: 'cvUrl', label: 'CV file', type: 'url', hint: 'Path of the PDF in the repo, e.g. /Nguyen_Nhat_Bang_AI_Engineer.pdf. Used by every Resume button.' },
      { key: 'github', label: 'GitHub', type: 'url' },
      { key: 'linkedin', label: 'LinkedIn', type: 'url' },
      { key: 'facebook', label: 'Facebook', type: 'url' }
    ]
  },
  blog: {
    label: 'Blog listing', icon: 'web', sitePath: '/blog', group: 'content',
    fields: [
      { key: 'featured', label: 'Pinned posts', type: 'posts', hint: 'Shown first on /blog and in “Latest writing”, in this order. Other posts follow, newest first.' },
      { key: 'hidden', label: 'Hidden from lists', type: 'posts', hint: 'Still published and reachable by link, but left out of /blog and the home page.' }
    ]
  }
};

const HOME_SECTIONS = Object.entries(SECTIONS).filter(([, section]) => section.group !== 'content');

// ---------------------------------------------------------------- State + utils

const app = {
  session: null,
  posts: null,
  tags: null,
  site: null,
  filter: { status: 'all', q: '' },
  view: null,
  editor: null,
  section: null,
  dirty: false,
  saving: false,
  pendingHash: null,
  currentHash: '',
  apiDown: false
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
let idCounter = 0;
const uid = (prefix = 'f') => `${prefix}-${++idCounter}`;

function toSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatDate(iso, withTime = false) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', withTime
    ? { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function getPath(obj, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let target = obj;
  keys.slice(0, -1).forEach((key, index) => {
    const nextIsIndex = /^\d+$/.test(keys[index + 1]);
    if (target[key] == null || typeof target[key] !== 'object') target[key] = nextIsIndex ? [] : {};
    target = target[key];
  });
  target[keys[keys.length - 1]] = value;
}

function toast(message, kind = 'ok') {
  const box = $('#toasts');
  const node = document.createElement('div');
  node.className = `toast lens${kind === 'error' ? ' toast--error' : ''}`;
  node.innerHTML = `<span class="icon" aria-hidden="true">${kind === 'error' ? 'warning' : 'check'}</span><span>${esc(message)}</span>`;
  box.append(node);
  setTimeout(() => node.remove(), kind === 'error' ? 6000 : 3200);
}

// ---------------------------------------------------------------- Session + API

function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session?.token && session.expiresAt > Date.now() + 60_000) return session;
  } catch (_error) {
    // Corrupt entry: treat as signed out.
  }
  return null;
}

function saveSession(session) {
  app.session = session;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (_error) {
    // Session lasts for this page only.
  }
}

function clearSession() {
  app.session = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_error) {
    // Nothing stored.
  }
}

async function api(path, options = {}) {
  try {
    const result = await apiFetch(path, { ...options, token: app.session?.token });
    if (app.apiDown) {
      app.apiDown = false;
      $('#api-banner')?.remove();
    }
    return result;
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      app.dirty = false;
      renderLogin('Your session expired. Sign in again.');
    }
    if (error.status === 0) app.apiDown = true;
    throw error;
  }
}

// ---------------------------------------------------------------- Login

function renderLogin(notice = '') {
  app.view = 'login';
  document.title = 'Sign in — Admin';
  $('#app').innerHTML = `
    <main class="login">
      <section class="login__card lens">
        <img src="/mascot_transparent.png" alt="" width="48" height="48">
        <h1>Site admin</h1>
        <p>Posts, tags and home-page content.</p>
        <form id="login-form" novalidate>
          ${notice ? `<div class="banner">${esc(notice)}</div>` : ''}
          <div class="field-group">
            <label class="field-label" for="password">Password</label>
            <div class="input-with-action">
              <input class="input" id="password" name="password" type="password" autocomplete="current-password" required autofocus>
              <button type="button" id="toggle-password" aria-label="Show password"><span class="icon" aria-hidden="true">visibility</span></button>
            </div>
          </div>
          <div class="form-error" id="login-error" hidden></div>
          <button class="btn btn--primary" type="submit" id="login-submit">Sign in</button>
        </form>
      </section>
    </main>`;

  $('#toggle-password').addEventListener('click', (event) => {
    const input = $('#password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    event.currentTarget.querySelector('.icon').textContent = show ? 'visibility_off' : 'visibility';
  });

  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = $('#password').value;
    const error = $('#login-error');
    const submit = $('#login-submit');
    if (!password) {
      error.textContent = 'Enter your password.';
      error.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" aria-hidden="true"></span>Signing in…';
    error.hidden = true;
    try {
      const result = await apiFetch('/api/admin/login', { method: 'POST', body: { password } });
      saveSession({ token: result.token, expiresAt: result.expiresAt });
      renderShell();
      route();
    } catch (failure) {
      error.textContent = failure.status === 0 ? 'Cannot reach the API. Check that the blog backend is running.' : failure.message;
      error.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Sign in';
      $('#password').select();
    }
  });
}

// ---------------------------------------------------------------- Shell + routing

function routesList() {
  return [
    ['#/posts', 'Posts'],
    ['#/site/blog', 'Blog listing'],
    ['#/tags', 'Tags'],
    ['#/media', 'Media'],
    ...HOME_SECTIONS.map(([key, section]) => [`#/site/${key}`, `Home · ${section.label}`])
  ];
}

function renderShell() {
  $('#app').innerHTML = `
    <div class="shell">
      <aside class="sidebar lens" aria-label="Admin navigation">
        <div class="sidebar__brand">
          <img src="/mascot_transparent.png" alt="" width="28" height="28">
          <div>Site admin<small>lilkremxxxx.github.io</small></div>
        </div>
        <nav class="side-group" aria-label="Content">
          <h2>Content</h2>
          <a class="side-link" href="#/posts" data-route="posts"><span class="icon" aria-hidden="true">article</span>Posts<span class="count" id="post-count"></span></a>
          <a class="side-link" href="#/site/blog" data-route="site/blog"><span class="icon" aria-hidden="true">web</span>Blog listing</a>
          <a class="side-link" href="#/tags" data-route="tags"><span class="icon" aria-hidden="true">sell</span>Tags</a>
          <a class="side-link" href="#/media" data-route="media"><span class="icon" aria-hidden="true">image</span>Media</a>
        </nav>
        <nav class="side-group" aria-label="Home page">
          <h2>Home page</h2>
          ${HOME_SECTIONS.map(([key, section]) => `<a class="side-link" href="#/site/${key}" data-route="site/${key}"><span class="icon" aria-hidden="true">${section.icon}</span>${esc(section.label)}</a>`).join('')}
        </nav>
        <div class="sidebar__footer">
          <a class="side-link" href="/" target="_blank" rel="noopener"><span class="icon" aria-hidden="true">north_east</span>View site</a>
          <button class="side-link btn--ghost" type="button" data-action="logout" style="border:0;background:none;width:100%;text-align:left"><span class="icon" aria-hidden="true">logout</span>Sign out</button>
        </div>
      </aside>
      <input type="file" id="file-picker" accept="image/png,image/jpeg,image/webp,image/gif" hidden multiple>
      <div class="main">
        <header class="topbar" id="topbar"></header>
        <div class="content" id="content"></div>
      </div>
    </div>`;
  if (app.apiDown) showApiBanner();
}

function showApiBanner() {
  if ($('#api-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'api-banner';
  banner.className = 'banner banner--danger';
  banner.innerHTML = '<span>Cannot reach the API. Changes cannot be saved until it is back.</span><button class="btn btn--sm" type="button" data-action="reload"><span class="icon" aria-hidden="true">refresh</span>Retry</button>';
  $('#content')?.before(banner);
}

function setTopbar({ title, sub = '', actions = '', mobile = true }) {
  const current = location.hash || '#/posts';
  $('#topbar').innerHTML = `
    ${mobile ? `<div class="mobile-nav">
      <label class="sr-only" for="mobile-route">Go to</label>
      <select class="select" id="mobile-route">${routesList().map(([hash, label]) => `<option value="${hash}" ${current.startsWith(hash) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>
      <button class="icon-btn" type="button" data-action="logout" aria-label="Sign out"><span class="icon" aria-hidden="true">logout</span></button>
    </div>` : ''}
    <div>
      <h1>${esc(title)}</h1>
      ${sub ? `<p class="topbar__sub">${sub}</p>` : ''}
    </div>
    <div class="topbar__actions">${actions}</div>`;
  $('#mobile-route')?.addEventListener('change', (event) => {
    location.hash = event.target.value;
  });
}

function markActiveNav(key) {
  $$('.side-link[data-route]').forEach((link) => {
    if (link.dataset.route === key) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function setDirty(value) {
  app.dirty = value;
  const stateNode = $('#save-state');
  if (stateNode && value) {
    stateNode.dataset.state = 'dirty';
    stateNode.textContent = 'Unsaved changes';
  }
}

function route() {
  if (!app.session) {
    renderLogin();
    return;
  }
  const hash = location.hash || '#/posts';
  app.currentHash = hash;
  app.editor = null;
  app.section = null;
  setDirty(false);
  const parts = hash.replace(/^#\/?/, '').split('/');

  if (parts[0] === 'posts' && parts[1] === 'new') return showPostEditor(null);
  if (parts[0] === 'posts' && parts[1] === 'edit' && parts[2]) return showPostEditor(decodeURIComponent(parts.slice(2).join('/')));
  if (parts[0] === 'tags') return showTags();
  if (parts[0] === 'media') return showMedia();
  if (parts[0] === 'site' && SECTIONS[parts[1]]) return showSection(parts[1]);
  return showPosts();
}

function guardNavigation() {
  if (location.hash === app.currentHash) return;
  if (app.dirty) {
    app.pendingHash = location.hash;
    history.replaceState(null, '', app.currentHash);
    showLeaveBanner();
    return;
  }
  route();
}

function showLeaveBanner() {
  if ($('#leave-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'leave-banner';
  banner.className = 'banner';
  banner.innerHTML = `
    <span>You have unsaved changes on this page.</span>
    <span class="topbar__actions">
      <button class="btn btn--sm" type="button" data-action="stay">Keep editing</button>
      <button class="btn btn--sm btn--danger" type="button" data-action="discard">Discard changes</button>
    </span>`;
  $('#content').before(banner);
  banner.scrollIntoView({ block: 'nearest' });
}

// ---------------------------------------------------------------- Posts list

async function loadPosts(force = false) {
  if (!app.posts || force) {
    const data = await api('/api/blog/posts?status=all&limit=100');
    app.posts = data.items || [];
  }
  const count = $('#post-count');
  if (count) count.textContent = String(app.posts.length);
  return app.posts;
}

async function showPosts() {
  app.view = 'posts';
  document.title = 'Posts — Admin';
  markActiveNav('posts');
  setTopbar({ title: 'Posts', sub: 'Everything on /blog, including drafts.', actions: '<a class="btn btn--primary" href="#/posts/new"><span class="icon" aria-hidden="true">add</span>New post</a>' });
  $('#content').innerHTML = '<div class="table lens"><div class="empty"><span class="spinner" aria-hidden="true" style="display:inline-block"></span></div></div>';
  try {
    await loadPosts(true);
  } catch (error) {
    if (error.status === 401) return;
    $('#content').innerHTML = `<div class="table lens"><div class="empty"><strong>Posts could not be loaded</strong>${esc(error.message)}<div style="margin-top:1rem"><button class="btn btn--sm" type="button" data-action="reload"><span class="icon" aria-hidden="true">refresh</span>Retry</button></div></div></div>`;
    if (error.status === 0) showApiBanner();
    return;
  }
  renderPostList();
}

function renderPostList() {
  const counts = { all: app.posts.length, published: 0, draft: 0, archived: 0 };
  app.posts.forEach((post) => {
    counts[post.status] = (counts[post.status] || 0) + 1;
  });
  const query = app.filter.q.trim().toLowerCase();
  const items = app.posts.filter((post) => (app.filter.status === 'all' || post.status === app.filter.status)
    && (!query || post.title.toLowerCase().includes(query) || post.slug.includes(query)));

  $('#content').innerHTML = `
    <div class="toolbar">
      <label class="sr-only" for="post-search">Search posts</label>
      <input class="input" id="post-search" type="search" placeholder="Search title or slug" value="${attr(app.filter.q)}">
      <div class="segmented" role="radiogroup" aria-label="Filter by status">
        ${['all', 'published', 'draft', 'archived'].map((status) => `
          <label><input type="radio" name="post-filter" value="${status}" ${app.filter.status === status ? 'checked' : ''}><span>${status[0].toUpperCase()}${status.slice(1)} · ${counts[status] || 0}</span></label>`).join('')}
      </div>
    </div>
    <div class="table lens" id="post-table">
      ${items.length ? items.map(postRowHtml).join('') : `<div class="empty"><strong>${app.posts.length ? 'No posts match' : 'No posts yet'}</strong>${app.posts.length ? 'Try another search or status.' : 'Create the first one with New post.'}</div>`}
    </div>`;
}

function postRowHtml(post) {
  const edit = `#/posts/edit/${encodeURIComponent(post.slug)}`;
  return `
    <div class="row" data-slug="${attr(post.slug)}">
      <div class="row__main">
        <a class="row__title" href="${attr(edit)}">${esc(post.title)}</a>
        <div class="row__meta">
          <span class="status status--${attr(post.status)}">${esc(post.status)}</span>
          <span class="meta">/${esc(post.slug)}</span>
          <span class="meta">${post.status === 'published' ? `Published ${esc(formatDate(post.publishedAt))}` : `Edited ${esc(formatDate(post.updatedAt))}`}</span>
          ${(post.tags || []).slice(0, 4).map((tag) => `<span class="chip">${esc(tag)}</span>`).join('')}
        </div>
      </div>
      <div class="row__actions">
        ${post.status === 'published' ? `<a class="icon-btn" href="/blog/${attr(encodeURIComponent(post.slug))}" target="_blank" rel="noopener" aria-label="Open on site"><span class="icon" aria-hidden="true">north_east</span></a>` : ''}
        <a class="icon-btn" href="${attr(edit)}" aria-label="Edit"><span class="icon" aria-hidden="true">edit</span></a>
        <button class="icon-btn icon-btn--danger" type="button" data-action="ask-delete-post" aria-label="Delete"><span class="icon" aria-hidden="true">delete</span></button>
      </div>
    </div>`;
}

function askInline(container, label, confirmAction, confirmLabel = 'Delete') {
  const original = container.innerHTML;
  container.innerHTML = `
    <span class="confirm-inline">${esc(label)}
      <button class="btn btn--sm btn--danger" type="button" data-action="${confirmAction}">${esc(confirmLabel)}</button>
      <button class="btn btn--sm btn--ghost" type="button" data-action="cancel-inline">Cancel</button>
    </span>`;
  container.dataset.original = original;
  container.querySelector(`[data-action="${confirmAction}"]`).focus();
}

function cancelInline(button) {
  const container = button.closest('[data-original]');
  if (!container) return;
  container.innerHTML = container.dataset.original;
  delete container.dataset.original;
}

async function deletePost(slug) {
  await api(`/api/blog/posts/${encodeURIComponent(slug)}`, { method: 'DELETE' });
  app.posts = (app.posts || []).filter((post) => post.slug !== slug);
  app.tags = null;
  toast('Post deleted');
}

// ---------------------------------------------------------------- Post editor

function emptyPost() {
  return { slug: '', title: '', excerpt: '', coverImageUrl: '', tags: [], status: 'draft', publishedAt: null, readingTimeMinutes: 1 };
}

function newBlock(type) {
  return { id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, type, data: normalizeBlockData(type) };
}

function editorSnapshot() {
  const editor = app.editor;
  return JSON.stringify({ post: editor.post, blocks: editor.blocks });
}

async function showPostEditor(slug) {
  app.view = 'post';
  markActiveNav('posts');
  const isNew = !slug;
  document.title = `${isNew ? 'New post' : 'Edit post'} — Admin`;
  setTopbar({ title: isNew ? 'New post' : 'Loading…' });
  $('#content').innerHTML = '<div class="card lens"><span class="spinner" aria-hidden="true"></span></div>';

  let post = emptyPost();
  if (!isNew) {
    try {
      const data = await api(`/api/blog/posts/${encodeURIComponent(slug)}`);
      post = data.item;
    } catch (error) {
      if (error.status === 401) return;
      setTopbar({ title: 'Post not available' });
      $('#content').innerHTML = `<div class="table lens"><div class="empty"><strong>${error.status === 404 ? 'This post does not exist' : 'The post could not be loaded'}</strong>${esc(error.message)}<div style="margin-top:1rem"><a class="btn btn--sm" href="#/posts">Back to posts</a></div></div></div>`;
      return;
    }
  }
  loadTags().catch(() => {});

  const blocks = sanitizeBlocks(post.contentBlocks);
  app.editor = {
    isNew,
    originalSlug: post.slug,
    slugTouched: !isNew,
    post: {
      slug: post.slug || '',
      title: post.title || '',
      excerpt: post.excerpt || '',
      coverImageUrl: post.coverImageUrl || '',
      tags: post.tags || [],
      status: post.status || 'draft',
      publishedAt: post.publishedAt || null,
      readingTimeMinutes: post.readingTimeMinutes || 1
    },
    blocks: blocks.length ? blocks : [newBlock('paragraph')],
    tab: 'edit'
  };
  app.editor.snapshot = editorSnapshot();
  renderPostEditor();
}

function postTopbar() {
  const editor = app.editor;
  const live = !editor.isNew && editor.post.status === 'published';
  setTopbar({
    title: editor.isNew ? 'New post' : editor.post.title || 'Untitled post',
    sub: editor.isNew ? 'Saved as a draft until you choose Published.' : `/blog/${esc(editor.originalSlug)}`,
    actions: `
      <span class="save-state" id="save-state" data-state="idle">${editor.isNew ? 'Not saved yet' : 'All changes saved'}</span>
      <div class="segmented view-tabs" role="tablist" aria-label="Editor view">
        <label><input type="radio" name="editor-tab" value="edit" ${editor.tab === 'edit' ? 'checked' : ''}><span>Edit</span></label>
        <label><input type="radio" name="editor-tab" value="preview" ${editor.tab === 'preview' ? 'checked' : ''}><span>Preview</span></label>
      </div>
      ${live ? `<a class="btn btn--sm" href="/blog/${attr(encodeURIComponent(editor.originalSlug))}" target="_blank" rel="noopener"><span class="icon" aria-hidden="true">north_east</span>View</a>` : ''}
      <button class="btn btn--primary" type="button" data-action="save" id="save-button">Save</button>`
  });
}

function renderPostEditor() {
  const editor = app.editor;
  const post = editor.post;
  postTopbar();
  $('#content').innerHTML = `
    <div class="editor" data-tab="${editor.tab}">
      <form class="editor__form" id="post-form" novalidate>
        <section class="card lens">
          <div class="field-group">
            <label class="field-label" for="f-title">Title</label>
            <input class="input" id="f-title" data-field="title" value="${attr(post.title)}" required>
          </div>
          <div class="field-group">
            <label class="field-label" for="f-slug">Slug</label>
            <input class="input" id="f-slug" data-field="slug" value="${attr(post.slug)}" ${editor.isNew ? '' : 'readonly'} spellcheck="false">
            <span class="field-hint">${editor.isNew ? 'Lowercase letters, numbers and hyphens. Filled from the title until you edit it.' : 'The address cannot change after the post is created.'}</span>
          </div>
          <div class="field-group">
            <label class="field-label" for="f-excerpt">Excerpt</label>
            <textarea class="textarea" id="f-excerpt" data-field="excerpt" rows="3">${esc(post.excerpt)}</textarea>
            <span class="field-hint">Shown in post lists and under the title.</span>
          </div>
          <div class="field-group">
            <label class="field-label" for="f-cover">Cover image URL</label>
            <div class="input-row">
              <input class="input" id="f-cover" data-field="coverImageUrl" value="${attr(post.coverImageUrl)}" placeholder="/assets/blog/…png">
              <button class="btn btn--sm" type="button" data-action="upload" data-upload-target="cover"><span class="icon" aria-hidden="true">upload</span>Upload</button>
            </div>
          </div>
          <div class="field-group">
            <label class="field-label" for="f-tags">Tags</label>
            <input class="input" id="f-tags" data-field="tags" value="${attr(post.tags.join(', '))}" placeholder="Medical AI, Computer Vision">
            <div class="tag-suggest" id="tag-suggest"></div>
          </div>
        </section>

        <section class="card lens">
          <h2>Publishing</h2>
          <div class="segmented" role="radiogroup" aria-label="Status">
            ${['draft', 'published', 'archived'].map((status) => `<label><input type="radio" name="status" value="${status}" ${post.status === status ? 'checked' : ''}><span>${status[0].toUpperCase()}${status.slice(1)}</span></label>`).join('')}
          </div>
          <div class="grid-2">
            <div class="field-group">
              <label class="field-label" for="f-date">Publish date</label>
              <input class="input" id="f-date" type="datetime-local" data-field="publishedAt" value="${attr(toLocalInput(post.publishedAt))}">
              <span class="field-hint">Empty + Published = now.</span>
            </div>
            <div class="field-group">
              <label class="field-label" for="f-reading">Reading time (min)</label>
              <div class="input-with-action">
                <input class="input" id="f-reading" type="number" min="1" data-field="readingTimeMinutes" value="${attr(String(post.readingTimeMinutes))}">
                <button type="button" data-action="estimate" aria-label="Estimate from content" title="Estimate from content"><span class="icon" aria-hidden="true">refresh</span></button>
              </div>
            </div>
          </div>
        </section>

        <section class="card lens">
          <h2>Content</h2>
          <div class="blocks" id="blocks"></div>
          <div class="add-bar"><span>Add</span>${BLOCK_TYPES.map((type) => `<button class="btn btn--sm" type="button" data-action="add-block" data-type="${type}">${BLOCK_LABELS[type]}</button>`).join('')}</div>
        </section>

        ${editor.isNew ? '' : `
        <section class="card lens danger-zone" id="danger-zone">
          <span class="field-hint">Deleting removes the post and its tag links. This cannot be undone.</span>
          <span><button class="btn btn--sm btn--danger" type="button" data-action="ask-delete-current"><span class="icon" aria-hidden="true">delete</span>Delete post</button></span>
        </section>`}
      </form>
      <aside class="preview lens lens--strong" aria-label="Preview">
        <div class="preview__label"><span>Preview</span><span id="preview-meta"></span></div>
        <div id="preview-body"></div>
      </aside>
    </div>`;
  renderBlocks();
  renderTagSuggestions();
  renderPreview();
}

function blockFieldsHtml(block, index, sectionLabel) {
  const data = block.data;
  const id = (name) => `b${index}-${name}`;
  if (block.type === 'heading') {
    return `
      <div class="grid-2" style="grid-template-columns:110px 1fr">
        <div class="field-group"><label class="field-label" for="${id('level')}">Level</label>
          <select class="select" id="${id('level')}" data-bf="level">${[2, 3, 4].map((level) => `<option value="${level}" ${data.level === level ? 'selected' : ''}>H${level}</option>`).join('')}</select></div>
        <div class="field-group"><label class="field-label" for="${id('text')}">Text</label><input class="input" id="${id('text')}" data-bf="text" value="${attr(data.text)}"></div>
      </div>
      <span class="field-hint">Level 2 headings appear in the table of contents.</span>`;
  }
  if (block.type === 'image') {
    return `
      <div class="field-group"><label class="field-label" for="${id('url')}">Image URL</label>
        <div class="input-row">
          <input class="input" id="${id('url')}" data-bf="url" value="${attr(data.url)}" placeholder="/assets/blog/figure.png">
          <button class="btn btn--sm" type="button" data-action="upload" data-upload-target="block"><span class="icon" aria-hidden="true">upload</span>Upload</button>
        </div>
      </div>
      ${data.url ? `<img class="block__thumb" src="${attr(data.url)}" alt="">` : ''}
      <div class="grid-2">
        <div class="field-group"><label class="field-label" for="${id('alt')}">Alt text</label><input class="input" id="${id('alt')}" data-bf="alt" value="${attr(data.alt)}"></div>
        <div class="field-group"><label class="field-label" for="${id('caption')}">Caption</label><input class="input" id="${id('caption')}" data-bf="caption" value="${attr(data.caption)}"></div>
      </div>`;
  }
  if (block.type === 'code') {
    const hidden = !isCodeVisibleInSection(sectionLabel, data.language);
    return `
      <div class="field-group"><label class="field-label" for="${id('language')}">Language</label><input class="input" id="${id('language')}" data-bf="language" value="${attr(data.language)}" placeholder="python, cpp, bash"></div>
      <div class="field-group"><label class="field-label" for="${id('code')}">Code</label><textarea class="textarea textarea--code" id="${id('code')}" data-bf="code" spellcheck="false">${esc(data.code)}</textarea></div>
      <p class="block__warn" ${hidden ? '' : 'hidden'}><span class="icon" aria-hidden="true">warning</span>Hidden on the site: code only shows for python/cpp/bash under a Method, Implementation, Pipeline, Model, Data, Results… heading.</p>`;
  }
  if (block.type === 'quote') {
    return `
      <div class="field-group"><label class="field-label" for="${id('text')}">Quote</label><textarea class="textarea" id="${id('text')}" data-bf="text">${esc(data.text)}</textarea></div>
      <div class="field-group"><label class="field-label" for="${id('cite')}">Source</label><input class="input" id="${id('cite')}" data-bf="cite" value="${attr(data.cite)}"></div>`;
  }
  if (block.type === 'link') {
    return `
      <div class="grid-2">
        <div class="field-group"><label class="field-label" for="${id('label')}">Label</label><input class="input" id="${id('label')}" data-bf="label" value="${attr(data.label)}"></div>
        <div class="field-group"><label class="field-label" for="${id('url')}">URL</label><input class="input" id="${id('url')}" data-bf="url" value="${attr(data.url)}"></div>
      </div>`;
  }
  if (block.type === 'table') {
    return `
      <div class="field-group"><label class="field-label" for="${id('title')}">Caption</label><input class="input" id="${id('title')}" data-bf="title" value="${attr(data.title)}" placeholder="Table I. …"></div>
      <div class="field-group"><label class="field-label" for="${id('headers')}">Columns</label><input class="input" id="${id('headers')}" data-bf="headers" value="${attr(data.headers.join(' | '))}" placeholder="Class | Precision | Recall"><span class="field-hint">Separate columns with |</span></div>
      <div class="field-group"><label class="field-label" for="${id('rows')}">Rows</label><textarea class="textarea textarea--code" id="${id('rows')}" data-bf="rows" spellcheck="false" placeholder="Benign | 0.97 | 0.92">${esc(data.rows.map((row) => row.join(' | ')).join('\n'))}</textarea><span class="field-hint">One row per line, cells separated by |</span></div>`;
  }
  return `<div class="field-group"><label class="sr-only" for="${id('text')}">Paragraph</label><textarea class="textarea" id="${id('text')}" data-bf="text" rows="4" placeholder="Write a paragraph…">${esc(data.text)}</textarea></div>`;
}

function renderBlocks() {
  const editor = app.editor;
  let sectionLabel = '';
  $('#blocks').innerHTML = editor.blocks.map((block, index) => {
    if (block.type === 'heading') sectionLabel = block.data.text;
    return `
      <div class="block" data-index="${index}">
        <div class="block__head">
          <label class="sr-only" for="b${index}-type">Block type</label>
          <select class="select" id="b${index}-type" data-action="block-type">${BLOCK_TYPES.map((type) => `<option value="${type}" ${block.type === type ? 'selected' : ''}>${BLOCK_LABELS[type]}</option>`).join('')}</select>
          <span class="spacer"></span>
          <button class="icon-btn" type="button" data-action="block-up" aria-label="Move up" ${index === 0 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_upward</span></button>
          <button class="icon-btn" type="button" data-action="block-down" aria-label="Move down" ${index === editor.blocks.length - 1 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_downward</span></button>
          <button class="icon-btn" type="button" data-action="block-duplicate" aria-label="Duplicate"><span class="icon" aria-hidden="true">content_copy</span></button>
          <details class="insert">
            <summary class="icon-btn" aria-label="Insert block below"><span class="icon" aria-hidden="true">add</span></summary>
            <div class="insert__menu lens lens--strong">${BLOCK_TYPES.map((type) => `<button type="button" data-action="insert-block" data-type="${type}">${BLOCK_LABELS[type]}</button>`).join('')}</div>
          </details>
          <button class="icon-btn icon-btn--danger" type="button" data-action="block-remove" aria-label="Remove block"><span class="icon" aria-hidden="true">delete</span></button>
        </div>
        <div class="block__body">${blockFieldsHtml(block, index, sectionLabel)}</div>
      </div>`;
  }).join('');
}

function renderTagSuggestions() {
  const box = $('#tag-suggest');
  if (!box || !app.editor) return;
  const current = new Set(app.editor.post.tags.map((tag) => tag.toLowerCase()));
  const suggestions = (app.tags || []).filter((tag) => !current.has(tag.name.toLowerCase())).slice(0, 12);
  box.innerHTML = suggestions.map((tag) => `<button class="chip" type="button" data-action="add-tag" data-tag="${attr(tag.name)}">+ ${esc(tag.name)}</button>`).join('');
}

let previewFrame = 0;
function renderPreview() {
  cancelAnimationFrame(previewFrame);
  previewFrame = requestAnimationFrame(() => {
    const editor = app.editor;
    if (!editor || !$('#preview-body')) return;
    const post = editor.post;
    $('#preview-meta').textContent = `${post.status} · ${post.readingTimeMinutes} min read`;
    $('#preview-body').innerHTML = `
      <h1>${esc(post.title || 'Untitled post')}</h1>
      ${post.excerpt ? `<p class="reader__excerpt">${esc(post.excerpt)}</p>` : ''}
      <div class="article-body">${blocksToHtml(editor.blocks, { emptyText: 'Add content blocks to see them here.' })}</div>`;
  });
}

function updateCodeHints() {
  let sectionLabel = '';
  app.editor.blocks.forEach((block, index) => {
    if (block.type === 'heading') sectionLabel = block.data.text;
    if (block.type !== 'code') return;
    const warn = $(`.block[data-index="${index}"] .block__warn`);
    if (warn) warn.hidden = isCodeVisibleInSection(sectionLabel, block.data.language);
  });
}

function editorChanged({ blocks = false } = {}) {
  if (blocks) renderBlocks();
  else updateCodeHints();
  renderPreview();
  setDirty(editorSnapshot() !== app.editor.snapshot);
  if (!app.dirty) {
    const stateNode = $('#save-state');
    if (stateNode) {
      stateNode.dataset.state = 'idle';
      stateNode.textContent = app.editor.isNew ? 'Not saved yet' : 'All changes saved';
    }
  }
}

function onEditorInput(event) {
  const editor = app.editor;
  const target = event.target;
  const field = target.dataset.field;
  if (field) {
    if (field === 'tags') {
      editor.post.tags = target.value.split(',').map((tag) => tag.trim()).filter(Boolean);
      renderTagSuggestions();
    } else if (field === 'readingTimeMinutes') {
      editor.post.readingTimeMinutes = Math.max(1, Math.round(Number(target.value) || 1));
    } else if (field === 'publishedAt') {
      editor.post.publishedAt = target.value ? new Date(target.value).toISOString() : null;
    } else if (field === 'slug') {
      editor.slugTouched = true;
      editor.post.slug = target.value.trim();
    } else {
      editor.post[field] = target.value;
      if (field === 'title' && editor.isNew && !editor.slugTouched) {
        editor.post.slug = toSlug(target.value);
        $('#f-slug').value = editor.post.slug;
      }
    }
    editorChanged();
    return;
  }

  const blockField = target.dataset.bf;
  const blockEl = target.closest('.block');
  if (blockField && blockEl) {
    const block = editor.blocks[Number(blockEl.dataset.index)];
    if (blockField === 'headers') block.data.headers = target.value.split('|').map((cell) => cell.trim());
    else if (blockField === 'rows') block.data.rows = target.value.split('\n').filter((line) => line.trim()).map((line) => line.split('|').map((cell) => cell.trim()));
    else if (blockField === 'level') block.data.level = Number(target.value);
    else block.data[blockField] = target.value;
    editorChanged();
  }
}

async function savePost() {
  const editor = app.editor;
  if (!editor || app.saving) return;
  const post = editor.post;
  const stateNode = $('#save-state');
  const fail = (message) => {
    if (stateNode) {
      stateNode.dataset.state = 'error';
      stateNode.textContent = message;
    }
    toast(message, 'error');
  };
  if (!post.title.trim()) return fail('Add a title before saving.');
  if (editor.isNew && !SLUG_PATTERN.test(post.slug)) return fail('Slug must use lowercase letters, numbers and single hyphens.');

  const blocks = sanitizeBlocks(editor.blocks);
  const payload = {
    slug: post.slug,
    title: post.title.trim(),
    excerpt: post.excerpt.trim(),
    coverImageUrl: post.coverImageUrl.trim() || null,
    contentBlocks: blocks,
    contentMarkdown: blocksToMarkdown(blocks),
    contentHtml: blocksToHtml(blocks),
    status: post.status,
    readingTimeMinutes: post.readingTimeMinutes,
    publishedAt: post.publishedAt,
    seoTitle: post.title.trim(),
    seoDescription: post.excerpt.trim(),
    tags: post.tags
  };

  app.saving = true;
  const button = $('#save-button');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Saving';
  }
  if (stateNode) {
    stateNode.dataset.state = 'saving';
    stateNode.textContent = 'Saving…';
  }
  try {
    const result = editor.isNew
      ? await api('/api/blog/posts', { method: 'POST', body: payload })
      : await api(`/api/blog/posts/${encodeURIComponent(editor.originalSlug)}`, { method: 'PUT', body: payload });
    const saved = result.item;
    app.posts = null;
    app.tags = null;
    editor.post.publishedAt = saved.publishedAt;
    editor.snapshot = editorSnapshot();
    setDirty(false);
    toast(editor.isNew ? 'Post created' : 'Post saved');
    if (editor.isNew) {
      app.currentHash = `#/posts/edit/${encodeURIComponent(saved.slug)}`;
      history.replaceState(null, '', app.currentHash);
      editor.isNew = false;
      editor.originalSlug = saved.slug;
      renderPostEditor();
    } else {
      postTopbar();
    }
    const node = $('#save-state');
    if (node) {
      node.dataset.state = 'saved';
      node.textContent = `Saved ${new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
    }
  } catch (error) {
    if (error.status !== 401) fail(error.message);
  } finally {
    app.saving = false;
    const finalButton = $('#save-button');
    if (finalButton) {
      finalButton.disabled = false;
      finalButton.textContent = 'Save';
    }
  }
}

// ---------------------------------------------------------------- Tags

async function loadTags(force = false) {
  if (!app.tags || force) {
    const data = await api('/api/blog/tags?scope=all');
    app.tags = data.items || [];
    renderTagSuggestions();
  }
  return app.tags;
}

async function showTags() {
  app.view = 'tags';
  document.title = 'Tags — Admin';
  markActiveNav('tags');
  setTopbar({ title: 'Tags', sub: 'Rename a tag onto an existing name to merge the two.' });
  $('#content').innerHTML = '<div class="table lens"><div class="empty"><span class="spinner" aria-hidden="true" style="display:inline-block"></span></div></div>';
  try {
    await loadTags(true);
  } catch (error) {
    if (error.status === 401) return;
    $('#content').innerHTML = `<div class="table lens"><div class="empty"><strong>Tags could not be loaded</strong>${esc(error.message)}</div></div>`;
    return;
  }
  renderTags();
}

function renderTags() {
  $('#content').innerHTML = `
    <div class="table lens">
      ${app.tags.length ? app.tags.map((tag) => `
        <form class="row tag-row" data-tag="${attr(tag.slug)}">
          <div class="row__main">
            <label class="sr-only" for="tag-${attr(tag.slug)}">Tag name</label>
            <input class="input" id="tag-${attr(tag.slug)}" name="name" value="${attr(tag.name)}" data-original="${attr(tag.name)}">
            <div class="row__meta"><span class="meta">${esc(tag.slug)}</span><span class="meta">${tag.postCount} ${tag.postCount === 1 ? 'post' : 'posts'}</span></div>
          </div>
          <button class="btn btn--sm" type="submit" disabled>Rename</button>
          <span class="row__actions"><button class="icon-btn icon-btn--danger" type="button" data-action="ask-delete-tag" aria-label="Delete tag ${attr(tag.name)}"><span class="icon" aria-hidden="true">delete</span></button></span>
        </form>`).join('') : '<div class="empty"><strong>No tags yet</strong>Tags are created when you add them to a post.</div>'}
    </div>`;
}

// ---------------------------------------------------------------- Media

const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const mediaUrl = (path) => `${API_BASE}${path}`;
let uploadTarget = null;

function formatSize(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function uploadFile(file) {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error(`${file.name}: only PNG, JPG, WebP or GIF`);
  if (file.size > 6 * 1024 * 1024) throw new Error(`${file.name}: larger than 6 MB`);
  let response;
  try {
    response = await fetch(`${API_BASE}/api/admin/uploads?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${app.session?.token}`, 'Content-Type': file.type },
      body: file
    });
  } catch (_error) {
    throw new Error('Cannot reach the server');
  }
  const payload = await response.json().catch(() => null);
  if (response.status === 401) {
    clearSession();
    app.dirty = false;
    renderLogin('Your session expired. Sign in again.');
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  if (!response.ok) throw new Error(payload?.error || `Upload failed (HTTP ${response.status})`);
  return payload.item;
}

// target: { kind: 'cover' } | { kind: 'block', index } | { kind: 'media' }
function pickFiles(target) {
  uploadTarget = target;
  const picker = $('#file-picker');
  picker.multiple = target.kind === 'media';
  picker.value = '';
  picker.click();
}

async function handlePickedFiles(picker) {
  const files = Array.from(picker.files || []);
  const target = uploadTarget;
  uploadTarget = null;
  if (!files.length || !target) return;
  toast(files.length > 1 ? `Uploading ${files.length} images…` : `Uploading ${files[0].name}…`);
  for (const file of files) {
    try {
      const item = await uploadFile(file);
      const url = mediaUrl(item.path);
      if (target.kind === 'cover' && app.editor) {
        app.editor.post.coverImageUrl = url;
        $('#f-cover').value = url;
        editorChanged();
      } else if (target.kind === 'block' && app.editor?.blocks[target.index]) {
        const block = app.editor.blocks[target.index];
        block.data.url = url;
        if (!block.data.alt) block.data.alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        editorChanged({ blocks: true });
      }
      toast(`Uploaded ${file.name}`);
    } catch (error) {
      if (error.status !== 401) toast(error.message, 'error');
    }
  }
  if (target.kind === 'media' && app.view === 'media') showMedia();
}

async function showMedia() {
  app.view = 'media';
  document.title = 'Media — Admin';
  markActiveNav('media');
  setTopbar({
    title: 'Media',
    sub: 'Images stored on the blog server. Use them in posts, covers or home sections.',
    actions: '<button class="btn btn--primary" type="button" data-action="media-upload"><span class="icon" aria-hidden="true">upload</span>Upload images</button>'
  });
  $('#content').innerHTML = '<div class="table lens"><div class="empty"><span class="spinner" aria-hidden="true" style="display:inline-block"></span></div></div>';
  let items;
  try {
    items = (await api('/api/admin/uploads')).items || [];
  } catch (error) {
    if (error.status === 401) return;
    $('#content').innerHTML = `<div class="table lens"><div class="empty"><strong>Media could not be loaded</strong>${esc(error.message)}</div></div>`;
    return;
  }
  $('#content').innerHTML = items.length ? `
    <div class="media-grid">
      ${items.map((item) => `
        <figure class="media-card lens" data-media="${attr(item.name)}">
          <img src="${attr(mediaUrl(item.path))}" alt="" loading="lazy">
          <figcaption>
            <span class="media-card__name">${esc(item.name)}</span>
            <span class="meta">${esc(formatSize(item.size))} · ${esc(formatDate(item.createdAt))}</span>
            <span class="row__actions">
              <button class="btn btn--sm" type="button" data-action="copy-media" data-url="${attr(mediaUrl(item.path))}"><span class="icon" aria-hidden="true">content_copy</span>Copy URL</button>
              <button class="icon-btn icon-btn--danger" type="button" data-action="ask-delete-media" aria-label="Delete ${attr(item.name)}"><span class="icon" aria-hidden="true">delete</span></button>
            </span>
          </figcaption>
        </figure>`).join('')}
    </div>` : '<div class="table lens"><div class="empty"><strong>No images yet</strong>Upload images here or straight from an image block in a post.</div></div>';
}

// ---------------------------------------------------------------- Home sections

async function loadSite(force = false) {
  if (!app.site || force) {
    const data = await api('/api/site');
    app.site = data.sections || {};
  }
  return app.site;
}

async function showSection(key) {
  const meta = SECTIONS[key];
  app.view = 'section';
  document.title = `${meta.label} — Admin`;
  markActiveNav(`site/${key}`);
  setTopbar({ title: meta.label });
  $('#content').innerHTML = '<div class="card lens"><span class="spinner" aria-hidden="true"></span></div>';
  try {
    await loadSite(true);
    if (key === 'blog') await loadPosts(true);
  } catch (error) {
    if (error.status === 401) return;
    $('#content').innerHTML = `<div class="table lens"><div class="empty"><strong>Content could not be loaded</strong>${esc(error.message)}</div></div>`;
    return;
  }
  const stored = app.site[key];
  app.section = { key, data: clone(mergeSections(app.site)[key]), stored: Boolean(stored), updatedAt: stored?.updatedAt };
  app.section.snapshot = JSON.stringify(app.section.data);
  renderSection();
}

function sectionTopbar() {
  const { key, stored, updatedAt } = app.section;
  const meta = SECTIONS[key];
  setTopbar({
    title: meta.label,
    sub: stored ? `Custom content · saved ${esc(formatDate(updatedAt, true))}` : 'Showing the built-in default content',
    actions: `
      <span class="save-state" id="save-state" data-state="idle">${app.dirty ? 'Unsaved changes' : ''}</span>
      <a class="btn btn--sm" href="${attr(meta.sitePath)}" target="_blank" rel="noopener"><span class="icon" aria-hidden="true">north_east</span>View</a>
      <button class="btn btn--primary" type="button" data-action="save" id="save-button">Save</button>`
  });
}

function fieldHtml(field, value, path) {
  const id = uid();
  const hint = field.hint ? `<span class="field-hint">${esc(field.hint)}</span>` : '';
  const label = field.label ? `<label class="field-label" for="${id}">${esc(field.label)}</label>` : '';

  if (field.type === 'text' || field.type === 'url') {
    return `<div class="field-group">${label}<input class="input" id="${id}" data-path="${attr(path)}" value="${attr(value ?? '')}" ${field.type === 'url' ? 'spellcheck="false" inputmode="url"' : ''}>${hint}</div>`;
  }
  if (field.type === 'list') {
    return `<div class="field-group">${label}<input class="input" id="${id}" data-path="${attr(path)}" data-kind="list" value="${attr((value || []).join(', '))}">${hint}</div>`;
  }
  if (field.type === 'i18n' || field.type === 'i18n-area') {
    const text = value && typeof value === 'object' ? value : { en: value || '', vn: '' };
    const area = field.type === 'i18n-area';
    const control = (lang, controlId, placeholder) => area
      ? `<textarea class="textarea" id="${controlId}" data-path="${attr(`${path}.${lang}`)}" rows="3" placeholder="${attr(placeholder)}">${esc(text[lang] || '')}</textarea>`
      : `<input class="input" id="${controlId}" data-path="${attr(`${path}.${lang}`)}" value="${attr(text[lang] || '')}" placeholder="${attr(placeholder)}">`;
    const vnId = uid();
    return `
      <div class="field-group">
        ${field.label ? `<span class="field-label" id="${id}-label">${esc(field.label)}</span>` : ''}
        <div class="i18n-pair">
          <div><label class="sr-only" for="${id}">${esc(field.label || 'Text')} in English</label>${control('en', id, 'English')}<span class="lang-tag">EN</span></div>
          <div><label class="sr-only" for="${vnId}">${esc(field.label || 'Text')} in Vietnamese</label>${control('vn', vnId, 'Tiếng Việt (optional)')}<span class="lang-tag">VN</span></div>
        </div>
        ${hint}
      </div>`;
  }
  if (field.type === 'group') {
    return `
      <div class="field-group">
        <span class="fieldset-title">${esc(field.label)}</span>
        ${fieldsHtml(field.fields, value || {}, path)}
      </div>`;
  }
  if (field.type === 'posts') {
    const chosen = Array.isArray(value) ? value : [];
    const titles = new Map((app.posts || []).map((post) => [post.slug, post]));
    const available = (app.posts || []).filter((post) => !chosen.includes(post.slug));
    return `
      <div class="field-group">
        <span class="fieldset-title">${esc(field.label)}</span>
        <div class="pick-list">
          ${chosen.length ? chosen.map((slug, index) => {
            const post = titles.get(slug);
            return `
              <div class="pick-row">
                <span class="pick-row__index meta">${index + 1}</span>
                <span class="pick-row__title">${esc(post?.title || slug)}${post ? '' : ' <span class="status">missing</span>'}</span>
                <span class="meta">/${esc(slug)}</span>
                <button class="icon-btn" type="button" data-pick="up" data-path="${attr(path)}" data-index="${index}" aria-label="Move up" ${index === 0 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_upward</span></button>
                <button class="icon-btn" type="button" data-pick="down" data-path="${attr(path)}" data-index="${index}" aria-label="Move down" ${index === chosen.length - 1 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_downward</span></button>
                <button class="icon-btn icon-btn--danger" type="button" data-pick="remove" data-path="${attr(path)}" data-index="${index}" aria-label="Remove"><span class="icon" aria-hidden="true">close</span></button>
              </div>`;
          }).join('') : '<p class="field-hint">None yet.</p>'}
          ${available.length ? `
            <label class="sr-only" for="${id}">Add a post to ${esc(field.label)}</label>
            <select class="select" id="${id}" data-pick-add data-path="${attr(path)}">
              <option value="">Add a post…</option>
              ${available.map((post) => `<option value="${attr(post.slug)}">${esc(post.title)} (${esc(post.status)})</option>`).join('')}
            </select>` : ''}
        </div>
        ${hint}
      </div>`;
  }
  if (field.type === 'repeat') {
    const items = Array.isArray(value) ? value : [];
    return `
      <div class="field-group">
        <span class="fieldset-title">${esc(field.label)}</span>
        <div class="repeat">
          ${items.map((item, index) => `
            <div class="repeat__item">
              <div class="repeat__head">
                <span class="repeat__title">${esc((field.itemTitle && field.itemTitle(item, index)) || `${field.itemName} ${index + 1}`)}</span>
                <button class="icon-btn" type="button" data-repeat="up" data-path="${attr(path)}" data-index="${index}" aria-label="Move up" ${index === 0 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_upward</span></button>
                <button class="icon-btn" type="button" data-repeat="down" data-path="${attr(path)}" data-index="${index}" aria-label="Move down" ${index === items.length - 1 ? 'disabled' : ''}><span class="icon" aria-hidden="true">arrow_downward</span></button>
                <button class="icon-btn icon-btn--danger" type="button" data-repeat="remove" data-path="${attr(path)}" data-index="${index}" aria-label="Remove ${attr(field.itemName)}"><span class="icon" aria-hidden="true">delete</span></button>
              </div>
              <div class="repeat__body">
                ${field.of ? fieldHtml({ ...field.of, label: '' }, item, `${path}.${index}`) : fieldsHtml(field.fields, item, `${path}.${index}`)}
              </div>
            </div>`).join('')}
          <div><button class="btn btn--sm" type="button" data-repeat="add" data-path="${attr(path)}"><span class="icon" aria-hidden="true">add</span>Add ${esc(field.itemName)}</button></div>
        </div>
      </div>`;
  }
  return `<div class="field-group">${label}<textarea class="textarea" id="${id}" data-path="${attr(path)}">${esc(value ?? '')}</textarea>${hint}</div>`;
}

function fieldsHtml(fields, data, basePath = '') {
  let html = '';
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    const path = basePath ? `${basePath}.${field.key}` : field.key;
    const next = fields[i + 1];
    if (field.half && next?.half) {
      const nextPath = basePath ? `${basePath}.${next.key}` : next.key;
      html += `<div class="grid-2">${fieldHtml(field, data?.[field.key], path)}${fieldHtml(next, data?.[next.key], nextPath)}</div>`;
      i += 1;
    } else {
      html += fieldHtml(field, data?.[field.key], path);
    }
  }
  return html;
}

function findRepeatField(fields, path) {
  const keys = path.split('.').filter((key) => !/^\d+$/.test(key));
  let list = fields;
  let found = null;
  for (const key of keys) {
    found = list?.find((field) => field.key === key);
    list = found?.fields;
  }
  return found;
}

function renderSection() {
  sectionTopbar();
  const { key, stored } = app.section;
  $('#content').innerHTML = `
    <form class="editor__form" id="section-form" novalidate style="max-width:880px">
      <section class="card lens">${fieldsHtml(SECTIONS[key].fields, app.section.data)}</section>
      ${stored ? `
      <section class="card lens danger-zone">
        <span class="field-hint">Reset removes your saved version; the site goes back to the built-in default text.</span>
        <span><button class="btn btn--sm btn--danger" type="button" data-action="ask-reset-section">Reset to default</button></span>
      </section>` : ''}
    </form>`;
}

function sectionChanged({ rerender = false } = {}) {
  if (rerender) {
    const y = window.scrollY;
    renderSection();
    window.scrollTo(0, y);
  }
  setDirty(JSON.stringify(app.section.data) !== app.section.snapshot);
  const stateNode = $('#save-state');
  if (stateNode && !app.dirty) {
    stateNode.dataset.state = 'idle';
    stateNode.textContent = '';
  }
}

function onSectionInput(event) {
  const target = event.target;
  const path = target.dataset.path;
  if (!path || !app.section || target.matches('[data-pick-add]')) return;
  const value = target.dataset.kind === 'list'
    ? target.value.split(',').map((item) => item.trim()).filter(Boolean)
    : target.value;
  const parentPath = path.split('.').slice(0, -1).join('.');
  const parent = parentPath ? getPath(app.section.data, parentPath) : null;
  // Older saves may hold a plain string where the form now edits { en, vn }.
  if (parentPath && typeof parent === 'string' && /\.(en|vn)$/.test(path)) setPath(app.section.data, parentPath, { en: parent, vn: '' });
  setPath(app.section.data, path, value);
  sectionChanged();
}

function onRepeatAction(button) {
  const path = button.dataset.path;
  const action = button.dataset.repeat;
  const field = findRepeatField(SECTIONS[app.section.key].fields, path);
  const list = getPath(app.section.data, path) || [];
  const index = Number(button.dataset.index);
  if (action === 'add') list.push(field?.blank ? field.blank() : {});
  if (action === 'remove') list.splice(index, 1);
  if (action === 'up' && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
  if (action === 'down' && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
  setPath(app.section.data, path, list);
  sectionChanged({ rerender: true });
}

async function saveSection() {
  const section = app.section;
  if (!section || app.saving) return;
  app.saving = true;
  const button = $('#save-button');
  if (button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Saving';
  }
  try {
    const result = await api(`/api/site/${section.key}`, { method: 'PUT', body: { data: section.data } });
    app.site = null;
    section.stored = true;
    section.updatedAt = result.section.updatedAt;
    section.snapshot = JSON.stringify(section.data);
    setDirty(false);
    renderSection();
    toast(`${SECTIONS[section.key].label} saved — live on the site now`);
  } catch (error) {
    if (error.status !== 401) toast(error.message, 'error');
    const finalButton = $('#save-button');
    if (finalButton) {
      finalButton.disabled = false;
      finalButton.textContent = 'Save';
    }
  } finally {
    app.saving = false;
  }
}

// ---------------------------------------------------------------- Events

function bindEvents() {
  window.addEventListener('hashchange', guardNavigation);
  window.addEventListener('beforeunload', (event) => {
    if (app.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && (app.view === 'post' || app.view === 'section')) {
      event.preventDefault();
      if (app.view === 'post') savePost();
      else saveSection();
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'post-search') {
      app.filter.q = event.target.value;
      const caret = event.target.selectionStart;
      renderPostList();
      const search = $('#post-search');
      search.focus();
      search.setSelectionRange(caret, caret);
      return;
    }
    if (app.view === 'post' && event.target.closest('#post-form')) onEditorInput(event);
    if (app.view === 'section' && event.target.closest('#section-form')) onSectionInput(event);
    const tagForm = event.target.closest('.tag-row');
    if (tagForm) {
      const input = tagForm.elements.name;
      tagForm.querySelector('[type="submit"]').disabled = !input.value.trim() || input.value.trim() === input.dataset.original;
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('[data-pick-add]') && app.section && target.value) {
      const list = [...(getPath(app.section.data, target.dataset.path) || []), target.value];
      setPath(app.section.data, target.dataset.path, list);
      sectionChanged({ rerender: true });
      return;
    }
    if (target.id === 'file-picker') {
      handlePickedFiles(target);
      return;
    }
    if (target.name === 'post-filter') {
      app.filter.status = target.value;
      renderPostList();
      return;
    }
    if (target.name === 'editor-tab' && app.editor) {
      app.editor.tab = target.value;
      $('.editor')?.setAttribute('data-tab', target.value);
      return;
    }
    if (app.view !== 'post' || !app.editor) return;
    if (target.name === 'status') {
      app.editor.post.status = target.value;
      editorChanged();
      return;
    }
    if (target.dataset.action === 'block-type') {
      const index = Number(target.closest('.block').dataset.index);
      const current = app.editor.blocks[index];
      const text = current.data.text || current.data.code || current.data.caption || '';
      const next = newBlock(target.value);
      next.id = current.id;
      if ('text' in next.data) next.data.text = text;
      if ('code' in next.data) next.data.code = text;
      app.editor.blocks[index] = next;
      editorChanged({ blocks: true });
      return;
    }
    if (target.dataset.bf) onEditorInput(event);
  });

  document.addEventListener('submit', async (event) => {
    const tagForm = event.target.closest('.tag-row');
    if (!tagForm) return;
    event.preventDefault();
    const name = tagForm.elements.name.value.trim();
    const button = tagForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const result = await api(`/api/blog/tags/${encodeURIComponent(tagForm.dataset.tag)}`, { method: 'PATCH', body: { name } });
      toast(result.item.merged ? `Merged into “${result.item.name}”` : `Renamed to “${result.item.name}”`);
      app.posts = null;
      await loadTags(true);
      renderTags();
    } catch (error) {
      if (error.status !== 401) toast(error.message, 'error');
      button.disabled = false;
    }
  });

  document.addEventListener('click', async (event) => {
    const pickButton = event.target.closest('[data-pick]');
    if (pickButton && app.section) {
      const list = [...(getPath(app.section.data, pickButton.dataset.path) || [])];
      const index = Number(pickButton.dataset.index);
      if (pickButton.dataset.pick === 'remove') list.splice(index, 1);
      if (pickButton.dataset.pick === 'up' && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
      if (pickButton.dataset.pick === 'down' && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
      setPath(app.section.data, pickButton.dataset.path, list);
      sectionChanged({ rerender: true });
      return;
    }

    const repeatButton = event.target.closest('[data-repeat]');
    if (repeatButton && app.section) {
      onRepeatAction(repeatButton);
      return;
    }

    const button = event.target.closest('[data-action]');
    if (!button || button.tagName === 'SELECT') return;
    const action = button.dataset.action;
    const editor = app.editor;
    const blockEl = button.closest('.block');
    const index = blockEl ? Number(blockEl.dataset.index) : -1;

    switch (action) {
      case 'logout':
        if (app.dirty) {
          app.pendingHash = '#logout';
          showLeaveBanner();
          return;
        }
        clearSession();
        renderLogin('Signed out.');
        break;
      case 'reload':
        location.reload();
        break;
      case 'stay':
        $('#leave-banner')?.remove();
        app.pendingHash = null;
        break;
      case 'discard': {
        const target = app.pendingHash;
        $('#leave-banner')?.remove();
        app.dirty = false;
        app.pendingHash = null;
        if (target === '#logout') {
          clearSession();
          renderLogin('Signed out.');
        } else if (target) {
          location.hash = target;
        } else {
          route();
        }
        break;
      }
      case 'save':
        if (app.view === 'post') savePost();
        if (app.view === 'section') saveSection();
        break;
      case 'upload':
        pickFiles(button.dataset.uploadTarget === 'cover' ? { kind: 'cover' } : { kind: 'block', index });
        break;
      case 'media-upload':
        pickFiles({ kind: 'media' });
        break;
      case 'copy-media':
        navigator.clipboard?.writeText(button.dataset.url).then(() => toast('URL copied')).catch(() => toast(button.dataset.url));
        break;
      case 'ask-delete-media':
        askInline(button.closest('.row__actions'), 'Delete image?', 'confirm-delete-media');
        break;
      case 'confirm-delete-media': {
        const name = button.closest('[data-media]').dataset.media;
        try {
          await api(`/api/admin/uploads/${encodeURIComponent(name)}`, { method: 'DELETE' });
          button.closest('[data-media]').remove();
          toast('Image deleted. Posts that used it will show a broken image.');
        } catch (error) {
          if (error.status !== 401) toast(error.message, 'error');
        }
        break;
      }
      case 'estimate':
        editor.post.readingTimeMinutes = estimateReadingMinutes(editor.blocks);
        $('#f-reading').value = String(editor.post.readingTimeMinutes);
        editorChanged();
        break;
      case 'add-tag':
        editor.post.tags = [...editor.post.tags, button.dataset.tag];
        $('#f-tags').value = editor.post.tags.join(', ');
        renderTagSuggestions();
        editorChanged();
        break;
      case 'add-block':
        editor.blocks.push(newBlock(button.dataset.type));
        editorChanged({ blocks: true });
        $(`.block[data-index="${editor.blocks.length - 1}"] .block__body :is(input, textarea, select)`)?.focus();
        break;
      case 'insert-block':
        editor.blocks.splice(index + 1, 0, newBlock(button.dataset.type));
        editorChanged({ blocks: true });
        $(`.block[data-index="${index + 1}"] .block__body :is(input, textarea, select)`)?.focus();
        break;
      case 'block-up':
      case 'block-down': {
        const to = action === 'block-up' ? index - 1 : index + 1;
        if (to < 0 || to >= editor.blocks.length) return;
        [editor.blocks[index], editor.blocks[to]] = [editor.blocks[to], editor.blocks[index]];
        editorChanged({ blocks: true });
        $(`.block[data-index="${to}"] [data-action="${action}"]`)?.focus();
        break;
      }
      case 'block-duplicate': {
        const copy = clone(editor.blocks[index]);
        copy.id = newBlock(copy.type).id;
        editor.blocks.splice(index + 1, 0, copy);
        editorChanged({ blocks: true });
        break;
      }
      case 'block-remove':
        editor.blocks.splice(index, 1);
        if (!editor.blocks.length) editor.blocks.push(newBlock('paragraph'));
        editorChanged({ blocks: true });
        break;
      case 'ask-delete-post':
        askInline(button.closest('.row__actions'), 'Delete this post?', 'confirm-delete-post');
        break;
      case 'confirm-delete-post': {
        const slug = button.closest('.row').dataset.slug;
        try {
          await deletePost(slug);
          renderPostList();
          $('#post-count').textContent = String(app.posts.length);
        } catch (error) {
          if (error.status !== 401) toast(error.message, 'error');
        }
        break;
      }
      case 'ask-delete-current':
        askInline(button.parentElement, 'Delete permanently?', 'confirm-delete-current');
        break;
      case 'confirm-delete-current':
        try {
          await deletePost(editor.originalSlug);
          app.dirty = false;
          location.hash = '#/posts';
        } catch (error) {
          if (error.status !== 401) toast(error.message, 'error');
        }
        break;
      case 'ask-delete-tag':
        askInline(button.closest('.row__actions'), 'Delete tag?', 'confirm-delete-tag');
        break;
      case 'confirm-delete-tag': {
        const slug = button.closest('.tag-row').dataset.tag;
        try {
          await api(`/api/blog/tags/${encodeURIComponent(slug)}`, { method: 'DELETE' });
          app.posts = null;
          await loadTags(true);
          renderTags();
          toast('Tag deleted');
        } catch (error) {
          if (error.status !== 401) toast(error.message, 'error');
        }
        break;
      }
      case 'ask-reset-section':
        askInline(button.parentElement, 'Reset to default?', 'confirm-reset-section', 'Reset');
        break;
      case 'confirm-reset-section':
        try {
          await api(`/api/site/${app.section.key}`, { method: 'DELETE' });
          app.dirty = false;
          toast('Back to the default content');
          showSection(app.section.key);
        } catch (error) {
          if (error.status !== 401) toast(error.message, 'error');
        }
        break;
      case 'cancel-inline':
        cancelInline(button);
        break;
      default:
        break;
    }

    if (action === 'insert-block') button.closest('details')?.removeAttribute('open');
  });
}

// ---------------------------------------------------------------- Boot

async function boot() {
  bindEvents();
  app.session = loadSession();
  if (!app.session) {
    renderLogin();
    return;
  }
  renderShell();
  try {
    await api('/api/admin/session');
  } catch (error) {
    if (error.status === 401) return;
    if (error.status === 0) showApiBanner();
  }
  if (app.session) route();
}

boot();
