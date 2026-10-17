import { UI, localize, mergeSections } from './content.js';
import { apiFetch } from './api.js';
import { blocksToHtml, buildToc, escapeHtml as esc, escapeAttribute as attr, safeUrl } from './blocks.js';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const motion = Boolean(gsap) && root.classList.contains('motion-ok');
if (!motion) root.classList.remove('motion-ok');
root.classList.add('motion-armed');

const SITE_TIMEOUT_MS = 900;
const SECTION_ROUTES = { '/about': 'about', '/project': 'project', '/skill': 'skill', '/education': 'education', '/contact': 'contact' };
const SECTION_PATHS = Object.fromEntries(Object.entries(SECTION_ROUTES).map(([path, id]) => [id, path]));
const SITE_TITLE = 'Nguyen Nhat Bang — AI Engineer';

const state = {
  lang: readLang(),
  content: mergeSections(),
  posts: null,
  postsPromise: null,
  route: null,
  scene: null,
  activeSection: 'hero',
  revealCtx: {},
  heroPlayed: false,
  tocHeadings: []
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const t = (value) => localize(value, state.lang);
const ui = (key) => UI[state.lang]?.[key] ?? UI.en[key] ?? key;

function readLang() {
  try {
    return localStorage.getItem('preferred_lang') === 'vn' ? 'vn' : 'en';
  } catch (_error) {
    return 'en';
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(state.lang === 'vn' ? 'vi-VN' : 'en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

const isInternal = (href) => /^\/(?!\/)/.test(href || '') && !/\.[a-z0-9]{2,4}$/i.test(href);
const isFile = (href) => /\.(pdf|png|jpe?g|zip)$/i.test(href || '');
const brandIcon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"></use></svg>`;

// Internal routes go through the SPA router, files download (unless newTab), everything else opens a new tab.
function anchor(href, className, inner, { newTab = false } = {}) {
  const url = safeUrl(href);
  const classes = [className, isInternal(url) ? 'nav-link' : ''].filter(Boolean).join(' ');
  let extra = '';
  if (isFile(url) && !newTab) extra = ' download';
  else if (!isInternal(url) && !url.startsWith('#')) extra = ' target="_blank" rel="noopener noreferrer"';
  return `<a href="${attr(url)}"${classes ? ` class="${classes}"` : ''}${extra}>${inner}</a>`;
}

// ---------------------------------------------------------------- Home sections

function renderHero() {
  const hero = state.content.hero;
  const social = state.content.social;
  const current = (state.content.projects.items || []).find((project) => project.badge);
  const base = state.content.education.schools?.[0]?.location || '';
  $('#hero').innerHTML = `
    <div class="hero__grid">
      <div class="hero__inner">
        <h1 class="hero__name" data-hero>${esc(hero.name)}</h1>
        <p class="hero__role" data-hero>${esc(t(hero.role))}</p>
        <p class="hero__claim" data-hero>${esc(t(hero.claim))}</p>
        <div class="hero__actions" data-hero>
          ${anchor(hero.primaryCta?.href || social.cvUrl, 'btn btn--primary', `<span class="icon" aria-hidden="true">download</span>${esc(t(hero.primaryCta?.label))}`)}
          ${anchor(hero.secondaryCta?.href || '/contact', 'btn', `${esc(t(hero.secondaryCta?.label))}<span class="icon" aria-hidden="true">arrow_forward</span>`)}
        </div>
      </div>
      <aside class="hero__lens lens" data-hero data-specular>
        <p class="hero__status"><span class="status-dot" aria-hidden="true"></span>${esc(t(hero.status))}</p>
        <dl class="hero__facts">
          ${current ? `<div><dt>${esc(ui('now'))}</dt><dd>${esc(current.role)} · ${esc(current.name)}</dd></div>` : ''}
          ${base ? `<div><dt>${esc(ui('based'))}</dt><dd>${esc(base)}</dd></div>` : ''}
        </dl>
        <div class="hero__links">
          ${social.github ? anchor(social.github, 'text-link', `${brandIcon('github')}GitHub`) : ''}
          ${social.linkedin ? anchor(social.linkedin, 'text-link', `${brandIcon('linkedin')}LinkedIn`) : ''}
        </div>
      </aside>
    </div>`;
}

function renderAbout() {
  const about = state.content.about;
  $('#about').innerHTML = `
    <div class="about">
      <div class="about__head" data-reveal="head">
        <img src="/mascot_transparent.png" alt="" width="64" height="64" loading="lazy">
        <h2 class="section-title">${esc(t(about.title))}</h2>
        <p class="section-lead">${esc(t(about.intro))}</p>
      </div>
      <div class="lens" data-specular>
        <span class="timeline__rail" aria-hidden="true"></span>
        <ol class="timeline" aria-label="${attr(ui('experience'))}">
          ${(about.experience || []).map((item) => `
            <li class="timeline__item">
              <h3 class="timeline__role">${esc(t(item.role))}</h3>
              <p class="timeline__org">${esc(item.org)}${item.place ? ` · ${esc(item.place)}` : ''}</p>
              <span class="meta">${esc(item.period)}</span>
              <p class="timeline__desc">${esc(t(item.description))}</p>
            </li>`).join('')}
        </ol>
      </div>
    </div>`;
}

function renderProjects() {
  const projects = state.content.projects;
  $('#project').innerHTML = `
    <h2 class="section-title" data-reveal="head">${esc(t(projects.title))}</h2>
    <div class="projects">
      ${(projects.items || []).map((project) => `
        <article class="project lens" data-specular>
          <div>
            <h3 class="project__name">${esc(project.name)}${project.badge ? `<span class="badge-live">${esc(project.badge)}</span>` : ''}</h3>
            <p class="project__role">${esc(project.role)}</p>
            <span class="meta">${esc(project.period)}</span>
            ${project.url ? `<div class="project__repo">${anchor(project.url, 'btn btn--sm', `${brandIcon('github')}${esc(ui('view_repo'))}`)}</div>` : ''}
          </div>
          <ul class="project__bullets">
            ${(project.bullets || []).map((bullet) => `<li>${esc(t(bullet))}</li>`).join('')}
          </ul>
          <div class="project__stack">${(project.stack || []).map((item) => `<span class="chip">${esc(item)}</span>`).join('')}</div>
        </article>`).join('')}
    </div>`;
}

function renderSkills() {
  const skills = state.content.skills;
  $('#skill').innerHTML = `
    <h2 class="section-title" data-reveal="head">${esc(t(skills.title))}</h2>
    <div class="skills lens">
      ${(skills.groups || []).map((group) => `
        <div class="skill-row">
          <h3>${esc(group.name)}</h3>
          <ul>${(group.items || []).map((item) => `<li class="chip">${esc(item)}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>`;
}

function renderEducation() {
  const education = state.content.education;
  $('#education').innerHTML = `
    <h2 class="section-title" data-reveal="head">${esc(t(education.title))}</h2>
    <div class="education">
      <div class="panel lens" data-specular>
        ${(education.schools || []).map((school) => `
          <div class="school">
            <h3 class="school__name">${esc(school.name)}</h3>
            <p class="school__degree">${esc(t(school.degree))}</p>
            <span class="meta">${esc(school.period)}${school.location ? ` · ${esc(school.location)}` : ''}</span>
          </div>`).join('')}
      </div>
      <div class="panel lens" data-specular>
        <h3>${esc(t(education.certTitle))}</h3>
        <ul class="cert-list">
          ${(education.certifications || []).map((cert) => `
            <li>${anchor(cert.url, '', `<span>${esc(cert.name)}</span><span class="icon" aria-hidden="true">north_east</span>`, { newTab: true })}</li>`).join('')}
        </ul>
      </div>
    </div>`;
}

function renderContact() {
  const contact = state.content.contact;
  const social = state.content.social;
  $('#contact').innerHTML = `
    <h2 class="contact__title" data-reveal="head">${esc(t(contact.title))}</h2>
    <div class="contact__grid">
      <div>
        <p class="section-lead">${esc(t(contact.intro))}</p>
        <div class="hero__actions">
          ${anchor(social.cvUrl, 'btn btn--primary', `<span class="icon" aria-hidden="true">download</span>${esc(ui('resume'))}`)}
          ${contact.email ? `<a class="btn" href="mailto:${attr(contact.email)}"><span class="icon" aria-hidden="true">mail</span>${esc(ui('email'))}</a>` : ''}
        </div>
      </div>
      <ul class="contact-list lens">
        ${contact.email ? `
          <li class="contact-item">
            <span class="contact-item__icon"><span class="icon" aria-hidden="true">mail</span></span>
            <div><span class="contact-item__label">${esc(ui('email'))}</span><a class="contact-item__value" href="mailto:${attr(contact.email)}">${esc(contact.email)}</a></div>
            <button class="btn btn--sm" type="button" data-copy="${attr(contact.email)}"><span class="icon" aria-hidden="true">content_copy</span><span>${esc(ui('copy_email'))}</span></button>
          </li>` : ''}
        ${contact.phone ? `
          <li class="contact-item">
            <span class="contact-item__icon"><span class="icon" aria-hidden="true">call</span></span>
            <div><span class="contact-item__label">${esc(t(contact.phoneLabel) || ui('phone'))}</span><a class="contact-item__value" href="tel:${attr(contact.phone.replace(/\s+/g, ''))}">${esc(contact.phone)}</a></div>
          </li>` : ''}
        ${contact.facebookUrl ? `
          <li class="contact-item">
            <span class="contact-item__icon">${brandIcon('facebook')}</span>
            <div><span class="contact-item__label">Facebook</span>${anchor(contact.facebookUrl, 'contact-item__value', esc(contact.facebookLabel || 'Facebook'))}</div>
          </li>` : ''}
      </ul>
    </div>
    <p class="closing">${esc(t(contact.closing))}</p>`;
}

function renderFooter() {
  const social = state.content.social;
  const links = [
    social.github && anchor(social.github, 'text-link', `${brandIcon('github')}GitHub`),
    social.linkedin && anchor(social.linkedin, 'text-link', `${brandIcon('linkedin')}LinkedIn`),
    social.facebook && anchor(social.facebook, 'text-link', `${brandIcon('facebook')}Facebook`)
  ].filter(Boolean);
  $('#site-footer').innerHTML = `
    <span>© ${new Date().getFullYear()} ${esc(state.content.hero.name)} · ${esc(ui('footer_rights'))}</span>
    <nav aria-label="Social">${links.join('')}</nav>`;
  $('#nav-resume').setAttribute('href', safeUrl(social.cvUrl));
  $('[data-bind="brand"]').textContent = state.content.hero.name;
}

function renderWriting() {
  const section = $('#writing');
  const posts = orderedPosts().slice(0, 3);
  if (!posts.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="writing__head" data-reveal="head">
      <h2 class="section-title">${esc(ui('writing'))}</h2>
      <a class="btn nav-link" href="/blog">${esc(ui('all_posts'))}<span class="icon" aria-hidden="true">arrow_forward</span></a>
    </div>
    ${postListHtml(posts)}`;
}

function renderHome() {
  renderHero();
  renderAbout();
  renderProjects();
  renderSkills();
  renderEducation();
  renderContact();
  renderFooter();
  if (state.posts) renderWriting();
}

function applyUiStrings() {
  root.lang = state.lang === 'vn' ? 'vi' : 'en';
  $$('[data-ui]').forEach((el) => {
    el.textContent = ui(el.dataset.ui);
  });
  $('#lang-toggle').setAttribute('aria-label', ui('lang_switch'));
}

// ---------------------------------------------------------------- Blog data

function fetchPosts() {
  if (!state.postsPromise) {
    state.postsPromise = apiFetch('/api/blog/posts?status=published&limit=100')
      .then((data) => {
        state.posts = data.items || [];
        return state.posts;
      })
      .catch((error) => {
        state.postsPromise = null;
        throw error;
      });
  }
  return state.postsPromise;
}

// Order and visibility come from the admin's "Blog listing" settings.
function orderedPosts() {
  const featured = new Map((state.content.blog?.featured || []).map((slug, index) => [slug, index]));
  const hidden = new Set(state.content.blog?.hidden || []);
  return [...(state.posts || [])]
    .filter((post) => !hidden.has(post.slug))
    .sort((a, b) => {
      const rankA = featured.get(a.slug) ?? 999;
      const rankB = featured.get(b.slug) ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
}

function postListHtml(posts) {
  return `
    <ol class="post-list lens">
      ${posts.map((post) => `
        <li class="post-row">
          <a class="nav-link" href="/blog/${attr(encodeURIComponent(post.slug))}">
            <span class="meta">${esc(formatDate(post.publishedAt))}</span>
            <h3>${esc(post.title)}</h3>
            <span class="icon" aria-hidden="true">arrow_forward</span>
            <p>${esc(post.excerpt)}</p>
          </a>
        </li>`).join('')}
    </ol>`;
}

function stateHtml(message, { retry = false, back = false } = {}) {
  return `
    <div class="state lens" role="status">
      <span>${esc(message)}</span>
      <span>
        ${back ? `<a class="btn btn--sm nav-link" href="/blog"><span class="icon" aria-hidden="true">arrow_back</span>${esc(ui('back_to_blog'))}</a>` : ''}
        ${retry ? `<button class="btn btn--sm" type="button" data-retry><span class="icon" aria-hidden="true">refresh</span>${esc(ui('retry'))}</button>` : ''}
      </span>
    </div>`;
}

const skeletonRows = (n) => `<div class="post-list lens" aria-hidden="true">${Array.from({ length: n }, () => `<div style="padding:1.4rem 1rem;display:grid;gap:.7rem"><span class="skeleton" style="width:30%"></span><span class="skeleton" style="width:72%;height:20px"></span><span class="skeleton" style="width:55%"></span></div>`).join('')}</div>`;

async function showBlogList() {
  const view = $('#view-blog');
  view.innerHTML = `
    <section class="section blog-head">
      <h1>${esc(ui('blog_title'))}</h1>
      <p class="section-lead">${esc(ui('blog_intro'))}</p>
    </section>
    <section class="section blog-body" id="blog-list" aria-live="polite">${state.posts ? '' : `<p class="sr-only">${esc(ui('loading_posts'))}</p>${skeletonRows(3)}`}</section>`;
  const list = $('#blog-list');
  try {
    await fetchPosts();
    if (state.route?.name !== 'blog') return;
    const posts = orderedPosts();
    list.innerHTML = posts.length ? postListHtml(posts) : stateHtml(ui('no_posts'));
    revealList($$('.post-row', list));
  } catch (_error) {
    if (state.route?.name !== 'blog') return;
    list.innerHTML = stateHtml(ui('posts_failed'), { retry: true });
  }
}

async function showPost(slug) {
  const view = $('#view-post');
  view.innerHTML = `
    <div class="section reader">
      <div class="reader__article lens lens--strong" aria-busy="true">
        <span class="skeleton" style="width:25%"></span>
        <span class="skeleton" style="width:80%;height:38px;margin-top:1.2rem"></span>
        <span class="skeleton" style="width:60%;margin-top:1rem"></span>
        <span class="skeleton" style="width:100%;margin-top:2.5rem"></span>
        <span class="skeleton" style="width:94%;margin-top:.8rem"></span>
        <span class="skeleton" style="width:88%;margin-top:.8rem"></span>
      </div>
    </div>`;

  let post;
  try {
    const [detail] = await Promise.all([apiFetch(`/api/blog/posts/${encodeURIComponent(slug)}`), fetchPosts().catch(() => null)]);
    post = detail.item;
  } catch (error) {
    if (state.route?.name !== 'post' || state.route.slug !== slug) return;
    view.innerHTML = `<div class="section reader" style="grid-template-columns:1fr">${stateHtml(error.status === 404 ? ui('not_found') : ui('post_failed'), { retry: error.status !== 404, back: true })}</div>`;
    return;
  }
  if (state.route?.name !== 'post' || state.route.slug !== slug) return;

  document.title = `${post.title} — ${state.content.hero.name}`;
  const toc = buildToc(post.contentBlocks || [], post.title);
  const all = state.posts || [];
  const index = all.findIndex((item) => item.slug === slug);
  const next = index >= 0 ? all[index - 1] || all[index + 1] || null : null;
  const tocLinks = toc.map((item) => `<li><a href="#${attr(item.id)}" data-toc="${attr(item.id)}">${esc(item.label)}</a></li>`).join('');
  const meta = [formatDate(post.publishedAt), post.readingTimeMinutes ? `${post.readingTimeMinutes} ${ui('min_read')}` : ''].filter(Boolean).join(' · ');

  view.innerHTML = `
    <div class="section reader">
      <article class="reader__article lens lens--strong">
        <header class="reader__header">
          <p class="meta">${esc(meta)}</p>
          <h1>${esc(post.title)}</h1>
          ${post.excerpt ? `<p class="reader__excerpt">${esc(post.excerpt)}</p>` : ''}
          ${(post.tags || []).length ? `<div class="reader__tags">${post.tags.map((tag) => `<span class="chip">${esc(tag)}</span>`).join('')}</div>` : ''}
        </header>
        ${toc.length ? `<details class="toc-mobile lens"><summary>${esc(ui('contents'))}</summary><ol>${tocLinks}</ol></details>` : ''}
        <div class="article-body">
          ${post.contentBlocks?.length ? blocksToHtml(post.contentBlocks) : `<p class="blk-paragraph">${esc(post.contentMarkdown || '')}</p>`}
        </div>
        <footer class="reader__footer">
          <a class="btn nav-link" href="/blog"><span class="icon" aria-hidden="true">arrow_back</span>${esc(ui('back_to_blog'))}</a>
          ${next ? `<a class="btn nav-link" href="/blog/${attr(encodeURIComponent(next.slug))}">${esc(ui('next_post'))}: ${esc(next.title)}<span class="icon" aria-hidden="true">arrow_forward</span></a>` : ''}
        </footer>
      </article>
      ${toc.length ? `<aside class="toc lens" aria-label="${attr(ui('contents'))}"><h2>${esc(ui('contents'))}</h2><ol>${tocLinks}</ol></aside>` : ''}
    </div>`;

  bindPostReading(view);
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
}

// The current section is the last TOC heading that has scrolled past the top band.
function bindPostReading(view) {
  const links = $$('[data-toc]', view);
  state.tocHeadings = links.map((link) => ({ link, heading: document.getElementById(link.dataset.toc) })).filter((item) => item.heading);
  updateReadingProgress();
}

function updateReadingProgress() {
  const bar = $('#reading-progress');
  if (state.route?.name !== 'post') return;
  const article = $('.reader__article');
  if (!article) return;
  const rect = article.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
  bar.style.setProperty('--progress', progress.toFixed(4));

  const items = state.tocHeadings || [];
  let current = items[0];
  for (const item of items) {
    if (item.heading.getBoundingClientRect().top <= 140) current = item;
  }
  items.forEach((item) => item.link.setAttribute('aria-current', String(item === current)));
}

// ---------------------------------------------------------------- Routing

function parseRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin/')) return { name: 'admin' };
  if (path === '/blog') return { name: 'blog' };
  if (path.startsWith('/blog/')) return { name: 'post', slug: decodeURIComponent(path.slice(6)) };
  return { name: 'home', section: SECTION_ROUTES[path] || null };
}

function restoreSpaRedirect() {
  try {
    const stored = sessionStorage.getItem('spa:redirect');
    if (stored && location.pathname === '/') {
      sessionStorage.removeItem('spa:redirect');
      const url = new URL(stored, location.origin);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  } catch (_error) {
    // Storage blocked: stay on the home page.
  }
}

function viewFor(name) {
  return name === 'blog' ? $('#view-blog') : name === 'post' ? $('#view-post') : $('#view-home');
}

async function swapView(nextName) {
  const next = viewFor(nextName);
  const current = $$('.view').find((view) => !view.hidden);
  if (current === next) return;
  if (motion && current) {
    await gsap.to(current, { autoAlpha: 0, y: -10, filter: 'blur(4px)', duration: 0.18, ease: 'power2.in' });
    gsap.set(current, { clearProps: 'all' });
  }
  $$('.view').forEach((view) => {
    view.hidden = view !== next;
  });
  window.scrollTo(0, 0);
  if (motion) {
    gsap.fromTo(next, { autoAlpha: 0, y: 16, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', clearProps: 'all' });
  }
}

function scrollToSection(id, smooth) {
  const target = id ? document.getElementById(id) : null;
  const behavior = smooth && !reduceMotion ? 'smooth' : 'auto';
  if (target) target.scrollIntoView({ behavior, block: 'start' });
  else window.scrollTo({ top: 0, behavior });
}

async function handleRoute({ initial = false } = {}) {
  const route = parseRoute(location.pathname);
  if (route.name === 'admin') {
    location.replace('/admin/');
    return;
  }
  const previous = state.route;
  state.route = route;
  document.body.dataset.route = route.name;
  $('#reading-progress').hidden = route.name !== 'post';
  state.tocHeadings = [];

  if (route.name === 'home') {
    document.title = SITE_TITLE;
    const wasHome = previous?.name === 'home';
    await swapView('home');
    if (!wasHome) ScrollTrigger?.refresh();
    scrollToSection(route.section, !initial && wasHome);
    if (!wasHome && previous) {
      // Coming back from the blog: dive and morph to the section in view, then scroll takes over.
      const section = document.getElementById(route.section || state.activeSection) || $('#hero');
      state.scene?.dive();
      state.scene?.setShape(section.dataset.shape || 'manifold');
    }
    requestAnimationFrame(updateSceneFromScroll);
    updateNav(route.section || state.activeSection);
  } else if (route.name === 'blog') {
    document.title = `${ui('blog_title')} — ${state.content.hero.name}`;
    await swapView('blog');
    setRouteScene({ x: 0, intensity: 0.55 });
    updateNav('blog');
    showBlogList();
  } else {
    await swapView('post');
    setRouteScene({ x: 0, intensity: 0.4 });
    updateNav('blog');
    showPost(route.slug);
  }
}

function navigate(href) {
  const url = new URL(href, location.origin);
  if (url.pathname + url.hash === location.pathname + location.hash && parseRoute(url.pathname).name === 'home') {
    scrollToSection(parseRoute(url.pathname).section, true);
    return;
  }
  history.pushState(null, '', url.pathname + url.search + url.hash);
  handleRoute();
}

// ---------------------------------------------------------------- Navigation state

function updateNav(sectionId) {
  const key = sectionId === 'hero' || !sectionId ? null : sectionId === 'writing' ? 'blog' : sectionId;
  $$('[data-nav]').forEach((link) => link.setAttribute('aria-current', String(link.dataset.nav === key)));
  const indicator = $('.nav-indicator');
  const active = $(`#nav-links [data-nav="${key}"]`);
  if (!indicator) return;
  if (!active) {
    indicator.style.opacity = '0';
    return;
  }
  indicator.style.width = `${active.offsetWidth}px`;
  indicator.style.setProperty('--ix', `${active.offsetLeft}px`);
  indicator.style.opacity = '1';
}

function observeSections() {
  const observer = new IntersectionObserver((entries) => {
    if (state.route?.name !== 'home') return;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (state.activeSection !== entry.target.id) state.scene?.wave();
      state.activeSection = entry.target.id;
      updateNav(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('#view-home > section').forEach((section) => observer.observe(section));
}

// ---------------------------------------------------------------- Scene

// Where the field sits and how bright it is per section (x in world units; content side decides it).
const SECTION_FOCUS = {
  hero: { x: 2.3, intensity: 1 },
  about: { x: 1.9, intensity: 0.95 },
  project: { x: 0, intensity: 0.9 },
  skill: { x: 0, intensity: 0.9 },
  education: { x: 0, intensity: 0.9 },
  writing: { x: 0, intensity: 0.85 },
  contact: { x: 1.9, intensity: 0.95 }
};

function setRouteScene(focus) {
  state.scene?.dive();
  state.scene?.setShape('haze');
  state.scene?.setFocus(focus);
}

const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

// Signature: the field morphs with the scroll position. The last 40% of each section blends into the next shape.
function updateSceneFromScroll() {
  const scene = state.scene;
  if (!scene || state.route?.name !== 'home') return;
  const sections = $$('#view-home > section').filter((section) => !section.hidden);
  if (!sections.length) return;
  const center = window.scrollY + window.innerHeight * 0.5;
  let index = 0;
  sections.forEach((section, i) => {
    if (section.offsetTop <= center) index = i;
  });
  const current = sections[index];
  const next = sections[index + 1] || current;
  const progress = (center - current.offsetTop) / Math.max(current.offsetHeight, 1);
  const t = next === current ? 0 : smoothstep(0.6, 1, progress);
  scene.scrub(current.dataset.shape || 'manifold', next.dataset.shape || 'manifold', t);
  const a = SECTION_FOCUS[current.id] || SECTION_FOCUS.hero;
  const b = SECTION_FOCUS[next.id] || a;
  scene.setFocus({ x: a.x + (b.x - a.x) * t, intensity: a.intensity + (b.intensity - a.intensity) * t });
}

let scrollFrame = 0;
function onScrollFrame() {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    updateSceneFromScroll();
    updateReadingProgress();
    // Glass rims catch the light from a slowly rotating angle as the page moves.
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    root.style.setProperty('--sheen-angle', `${(125 + (window.scrollY / max) * 70).toFixed(1)}deg`);
  });
}

function startSceneWhenIdle() {
  const begin = async () => {
    const { startScene } = await import('./scene.js');
    const controller = await startScene($('#field'), { reducedMotion: reduceMotion });
    if (!controller) return;
    state.scene = controller;
    if (state.route?.name === 'home') {
      controller.setFocus(SECTION_FOCUS.hero);
      // The boot morph runs first; scroll scrubbing resumes when it finishes.
      setTimeout(updateSceneFromScroll, 2700);
    } else {
      setRouteScene({ x: 0, intensity: state.route?.name === 'post' ? 0.4 : 0.55 });
    }
    root.classList.add('scene-ready');
  };
  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 200));
  idle(() => begin().catch(() => {}), { timeout: 1500 });
}

// ---------------------------------------------------------------- Motion

function playHeroIntro() {
  if (state.heroPlayed) return;
  state.heroPlayed = true;
  if (!motion) {
    root.classList.add('hero-done');
    return;
  }
  const items = $$('#hero [data-hero]');
  const name = $('#hero .hero__name');
  let split = null;
  if (window.SplitText) {
    gsap.registerPlugin(window.SplitText);
    split = window.SplitText.create(name, { type: 'lines,words', mask: 'lines', linesClass: 'line' });
  }
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => {
    root.classList.add('hero-done');
    gsap.set(items, { clearProps: 'all' });
    split?.revert();
  } });
  tl.fromTo('#site-nav', { y: -24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0);
  tl.set(items, { opacity: 1 }, 0);
  if (split) tl.from(split.words, { yPercent: 115, duration: 1.1, stagger: 0.06 }, 0.1);
  else tl.from(name, { y: 40, autoAlpha: 0, duration: 1 }, 0.1);
  tl.from(items.filter((item) => item !== name), { y: 18, autoAlpha: 0, filter: 'blur(8px)', duration: 0.9, stagger: 0.07 }, 0.35);
}

function revealList(elements) {
  if (!motion || !elements.length) return;
  gsap.from(elements, { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out', clearProps: 'all' });
}

// One-shot scroll reveals, one GSAP context per section so a section can be rebuilt (new posts, language
// switch, admin content) without re-running from() tweens on elements that are still mid-reveal or hidden.
const REVEALS = {
  about: (add, section) => {
    const timeline = $('.timeline', section);
    add($('.timeline__rail', section), { scaleY: 0, duration: 1.2, ease: 'expo.out' }, timeline);
    add($$('.timeline__item', section), { x: -14, autoAlpha: 0, duration: 0.7, stagger: 0.09, ease: 'expo.out' }, timeline);
  },
  project: (add, section) => {
    $$('.project', section).forEach((card) => add(card, {
      y: 56,
      autoAlpha: 0,
      clipPath: 'inset(14% 0% 0% 0% round 32px)',
      duration: 1,
      ease: 'expo.out',
      clearProps: 'clipPath'
    }, card, 'top 88%'));
  },
  skill: (add, section) => {
    const panel = $('.skills', section);
    add($$('.skill-row', section), { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'expo.out' }, panel);
    add($$('.chip', section), { scale: 0.9, autoAlpha: 0, duration: 0.4, stagger: 0.02, ease: 'back.out(2)' }, panel, 'top 75%');
  },
  education: (add, section) => {
    add($$('.panel', section), { y: 36, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, $('.education', section));
  },
  writing: (add, section) => {
    add($$('.post-row', section), { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out' }, $('.post-list', section));
  },
  contact: (add, section) => {
    add($$('.contact-item', section), { x: 16, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'expo.out' }, $('.contact-list', section));
  }
};

function setupReveals(ids = Object.keys(REVEALS)) {
  if (!motion || !window.ScrollTrigger) return;
  gsap.registerPlugin(window.ScrollTrigger);
  ids.forEach((id) => {
    state.revealCtx[id]?.revert();
    delete state.revealCtx[id];
    const section = document.getElementById(id);
    if (!section || section.hidden) return;
    state.revealCtx[id] = gsap.context(() => {
      const add = (targets, vars, trigger, start = 'top 82%') => {
        const nodes = [].concat(targets).filter(Boolean);
        if (!nodes.length || !trigger) return;
        gsap.from(nodes, { ...vars, scrollTrigger: { trigger, start, once: true } });
      };
      const head = $('[data-reveal="head"]', section);
      add(head, { y: 32, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, head);
      REVEALS[id](add, section);
    }, section);
  });
  window.ScrollTrigger.refresh();
}

// ---------------------------------------------------------------- Events

function bindEvents() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a.nav-link');
    if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      const href = link.getAttribute('href');
      if (href?.startsWith('/') && !href.startsWith('//')) {
        event.preventDefault();
        navigate(href);
        return;
      }
    }

    const tocLink = event.target.closest('[data-toc]');
    if (tocLink) {
      event.preventDefault();
      const target = document.getElementById(tocLink.dataset.toc);
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${tocLink.dataset.toc}`);
      tocLink.closest('details')?.removeAttribute('open');
      return;
    }

    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) {
      const label = copyButton.querySelector('span:last-child');
      navigator.clipboard?.writeText(copyButton.dataset.copy).then(() => {
        label.textContent = ui('copied');
        copyButton.querySelector('.icon').textContent = 'check';
        setTimeout(() => {
          label.textContent = ui('copy_email');
          copyButton.querySelector('.icon').textContent = 'content_copy';
        }, 1800);
      }).catch(() => {
        location.href = `mailto:${copyButton.dataset.copy}`;
      });
      return;
    }

    if (event.target.closest('[data-retry]')) {
      handleRoute();
    }
  });

  $('#lang-toggle').addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'vn' : 'en';
    try {
      localStorage.setItem('preferred_lang', state.lang);
    } catch (_error) {
      // Preference just will not persist.
    }
    applyUiStrings();
    renderHome();
    setupReveals();
    if (state.route?.name === 'blog') showBlogList();
    if (state.route?.name === 'post') showPost(state.route.slug);
    updateNav(state.route?.name === 'home' ? state.activeSection : 'blog');
  });

  document.addEventListener('pointermove', (event) => {
    const lens = event.target.closest?.('.lens[data-specular]');
    if (!lens) return;
    const rect = lens.getBoundingClientRect();
    lens.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    lens.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });

  window.addEventListener('popstate', () => handleRoute());
  window.addEventListener('scroll', onScrollFrame, { passive: true });
  window.addEventListener('resize', () => {
    updateNav(state.route?.name === 'home' ? state.activeSection : 'blog');
    onScrollFrame();
  });
}

// ---------------------------------------------------------------- Boot

async function loadSiteContent() {
  try {
    const data = await apiFetch('/api/site', { timeoutMs: 6000 });
    return data?.sections || null;
  } catch (_error) {
    return null;
  }
}

async function boot() {
  restoreSpaRedirect();
  applyUiStrings();
  renderHome();
  bindEvents();
  observeSections();
  await handleRoute({ initial: true });

  const sitePromise = loadSiteContent();
  const early = await Promise.race([sitePromise, new Promise((resolve) => setTimeout(() => resolve(undefined), SITE_TIMEOUT_MS))]);
  if (early) {
    state.content = mergeSections(early);
    renderHome();
  }
  // SplitText measures lines, so wait (briefly) for the display font.
  await Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 600))]);
  playHeroIntro();
  setupReveals();
  startSceneWhenIdle();

  if (early === undefined) {
    sitePromise.then((sections) => {
      if (!sections) return;
      state.content = mergeSections(sections);
      renderHome();
      setupReveals();
      window.ScrollTrigger?.refresh();
    });
  }

  fetchPosts().then(() => {
    renderWriting();
    setupReveals(['writing']);
    onScrollFrame();
  }).catch(() => {});
}

const ScrollTrigger = window.ScrollTrigger;
boot();
