# Portfolio Static Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the portfolio into a static multi-page site with a redesigned home page, a blog index, and two fully populated project blog posts.

**Architecture:** Keep the existing dark editorial visual language, but split the site into separate static HTML routes for GitHub Pages stability. Share one CSS file and one JS file across pages so navigation, language toggling, sticky table of contents behavior, and reusable sections stay consistent. Use the existing root `index.html` as the home page entry point, then add dedicated blog pages under `blog/` for the blog index and each project post.

**Tech Stack:** HTML, CSS, vanilla JavaScript, GitHub Pages-compatible static routing.

---

### Task 1: Extract shared styling and behavior

**Files:**
- Create: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/assets/site.css`
- Create: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/assets/site.js`
- Modify: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/index.html`

- [ ] **Step 1: Write the shared CSS and JS shell**

```css
/* Shared portfolio theme: dark surface, neon accent, editorial spacing */
```

```js
// Shared navigation, language toggle, and TOC helpers.
```

- [ ] **Step 2: Run a quick static sanity check**

Run: `python -m http.server 8000` from the repo root and open `http://localhost:8000/`
Expected: the home page loads without console errors and the navbar links are visible.

- [ ] **Step 3: Move the existing home-page behavior into the shared files**

```html
<!-- Link shared assets from every page -->
<link rel="stylesheet" href="/assets/site.css">
<script defer src="/assets/site.js"></script>
```

- [ ] **Step 4: Verify the shared assets are referenced from the root page**

Run: `rg -n "assets/site\\.(css|js)" index.html blog`
Expected: each page includes the shared stylesheet and script.

### Task 2: Rebuild the home page

**Files:**
- Modify: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/index.html`
- Create or update asset: `/home/nhatbang/Porfolio/Lilkremxxxx/img 1.webp`

- [ ] **Step 1: Replace the current multi-section landing page with the requested home layout**

```html
<header class="site-header">Home page | Blog | About me | Contact | Resume | Language</header>
```

```html
<section class="hero">
  <h1>BRIDGING FUNDAMENTAL MATHEMATICS, AI MODELS, AND ROBUST SYSTEM ARCHITECTURE.</h1>
  <p>I design and implement AI solutions with a strong focus on first-principles understanding, mathematical logic, and building practical systems from the ground up.</p>
  <img src="/Porfolio/Lilkremxxxx/img 1.webp" alt="Nhat Bang portrait or portfolio visual">
</section>
```

- [ ] **Step 2: Add recent blog boxes below the hero**

```html
<article class="recent-blog-card">
  <div class="meta">2026-06-09 • Owner: Nhat Bang</div>
  <h2>HEALTHCARE STROKE PREDICTION</h2>
  <p>Machine learning, deduplication, estimated calories, SHAP, and deployment notes.</p>
</article>
```

- [ ] **Step 3: Add the footer with Gmail, LinkedIn, and GitHub links**

```html
<a href="mailto:nhatbang.work@gmail.com">nhatbang.work@gmail.com</a>
<a href="https://www.linkedin.com/in/nhatbang/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
<a href="https://github.com/Lilkremxxxx" target="_blank" rel="noopener noreferrer">GitHub</a>
```

- [ ] **Step 4: Verify the home page renders the correct hero text and links**

Run: `rg -n "BRIDGING FUNDAMENTAL|nhatbang.work@gmail.com|linkedin.com/in/nhatbang|github.com/Lilkremxxxx" index.html`
Expected: all requested strings are present in the home page markup.

### Task 3: Add the blog index and welcome post

**Files:**
- Create: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/blog/index.html`

- [ ] **Step 1: Build a blog landing page that introduces the blog section**

```html
<article class="welcome-post">
  <h1>WELCOME TO THE BLOG OF NHAT BANG</h1>
</article>
```

- [ ] **Step 2: List the two project posts with click-through links**

```html
<a href="/blog/healthcare-stroke-prediction/">Healthcare Stroke Prediction</a>
<a href="/blog/lung-cancer/">Lung Cancer</a>
```

- [ ] **Step 3: Verify the blog index is reachable under GitHub Pages-style paths**

Run: `python -m http.server 8000` and open `http://localhost:8000/blog/`
Expected: the blog landing page renders and its links point to the two posts.

### Task 4: Write the healthcare stroke prediction post

**Files:**
- Create: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/blog/healthcare-stroke-prediction/index.html`

- [ ] **Step 1: Build the post header, hashtags, title, and sticky TOC**

```html
<header class="post-header"># Tech # Machine Learning # Healthcare</header>
<aside class="toc">Table of contents</aside>
```

- [ ] **Step 2: Write the post body using the project facts from the repo**

```html
<section id="overview">
  <h2>Overview</h2>
</section>
```

- [ ] **Step 3: Add code samples and repo links where relevant**

```html
<pre><code>python Code/Model.py</code></pre>
<a href="https://github.com/Lilkremxxxx" target="_blank" rel="noopener noreferrer">Repo</a>
```

- [ ] **Step 4: Add previous/next and back-to-blog navigation**

```html
<nav class="post-nav">
  <a href="/blog/lung-cancer/">Previous blog</a>
  <a href="/blog/lung-cancer/">Next blog</a>
</nav>
```

- [ ] **Step 5: Verify the post includes the key project themes**

Run: `rg -n "Estimated_calories|SHAP|XGBoost|deduplicat|C\\+\\+" blog/healthcare-stroke-prediction/index.html`
Expected: the article mentions the pipeline, explanation, and deployment story.

### Task 5: Write the lung cancer post

**Files:**
- Create: `/home/nhatbang/nhatbang_web/Lilkremxxx.github.io/blog/lung-cancer/index.html`

- [ ] **Step 1: Build the post header, hashtags, title, and sticky TOC**

```html
<header class="post-header"># Tech # Computer Vision # Deep Learning</header>
<aside class="toc">Table of contents</aside>
```

- [ ] **Step 2: Write the post body using the pipeline details from the repo**

```html
<section id="preprocessing">
  <h2>Preprocessing</h2>
</section>
```

- [ ] **Step 3: Add code samples and execution notes**

```html
<pre><code>python Model_Interface/full_pipeline.py</code></pre>
<pre><code>python Model_Interface/Transfer_model_to_onnx.py</code></pre>
```

- [ ] **Step 4: Add previous/next and back-to-blog navigation**

```html
<nav class="post-nav">
  <a href="/blog/healthcare-stroke-prediction/">Previous blog</a>
  <a href="/blog/healthcare-stroke-prediction/">Next blog</a>
</nav>
```

- [ ] **Step 5: Verify the post mentions the key computer vision and deployment pieces**

Run: `rg -n "GLCM|LBP|InceptionV3|AFF|ONNX|C\\+\\+" blog/lung-cancer/index.html`
Expected: the article covers the preprocessing, model stack, and export path.

### Task 6: Final verification

**Files:**
- Modify as needed: the HTML, CSS, JS, and any copied image asset

- [ ] **Step 1: Run a local static server and open each route**

Run: `python -m http.server 8000`

- [ ] **Step 2: Check the three routes manually**

Open:
- `http://localhost:8000/`
- `http://localhost:8000/blog/`
- `http://localhost:8000/blog/healthcare-stroke-prediction/`
- `http://localhost:8000/blog/lung-cancer/`

- [ ] **Step 3: Confirm navigation, language toggle, TOC anchors, and footer links work**

Expected: header links route correctly, language toggle changes visible labels, TOC jumps to headings, and footer links open the intended destinations.

