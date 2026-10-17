# CLAUDE.md — lilkremxxxx.github.io

Portfolio + blog cá nhân của **Nguyễn Nhật Bằng (AI Engineer)**. Site public: https://lilkremxxxx.github.io
Repo: `github.com/Lilkremxxxx/lilkremxxxx.github.io`, nhánh `main`. Thư mục cha `nhatbang_web/` là một git repo rỗng khác — chỉ làm việc trong thư mục này.

## Kiến trúc (3 phần)

```
Browser ──► GitHub Pages (static, nguồn: nhánh gh-pages do workflow build)   index.html (site) · admin/index.html (admin) · assets/
   │
   └─fetch─► https://blog-api.verbaa.pp.ua  (Cloudflare Tunnel, unit: blog-api-verbaa-cloudflared)
                └─► Express  server/app.js  :8787  (systemd user unit: blog-backend, chạy thẳng từ thư mục repo)
                       └─► PostgreSQL  100.82.138.69:5432 (chính máy minipc này, qua Tailscale)
```

### 1. Frontend public — `index.html` + `assets/`
- **Không có build step, không Tailwind.** CSS thuần: `assets/css/tokens.css` (tokens, `.lens` = vật liệu kính, `.btn`, `.chip`), `site.css` (layout), `article.css` (render block bài viết, dùng chung với admin). JS là ES module: `assets/js/site.js` (router, render, motion), `content.js` (nội dung mặc định EN/VN + `mergeSections`), `blocks.js` (render block, dùng chung), `api.js` (fetch + API base), `scene.js` (nền three.js).
- Thư viện qua CDN có pin version: GSAP 3.13.0 (+ScrollTrigger, SplitText), three 0.170.0 (import động, chỉ tải khi rảnh). Font Geist/Inter/JetBrains Mono, Material Symbols Rounded (subset qua `icon_names=`, **phải sắp xếp abc**; thêm icon mới thì thêm vào danh sách).
- **Trang chủ là một trang cuộn dài**: `#hero #about #project #skill #education #writing #contact`. Routes `/about` `/project` `/skill` `/education` `/contact` cuộn tới section; `/blog`, `/blog/:slug` là view riêng. `/admin/blog` (cũ) chuyển tới `/admin/`. Link nội bộ cần class `nav-link`.
- **Deep link trên GitHub Pages:** `404.html` lưu path vào `sessionStorage['spa:redirect']`, `site.js` khôi phục.
- **Nội dung trang chủ**: render từ `SITE_DEFAULTS` ngay lập tức, sau đó lấy `GET /api/site` (chờ tối đa 900ms trước khi chạy intro) và ghép đè từng section. API lỗi → vẫn hiện nội dung mặc định.
- **Motion**: intro hero (SplitText), reveal riêng cho từng section (ScrollTrigger, `once`), chuyển view bằng GSAP. Mọi thứ tắt khi `prefers-reduced-motion`; nội dung không bao giờ bị ẩn nếu JS lỗi (lớp `motion-ok` + failsafe 2.5s trong `<head>`).
- **Nền 3D (`scene.js`)**: point cloud morph **theo vị trí cuộn** (scroll-scrub, `updateSceneFromScroll()` trong site.js) giữa các hình theo `data-shape` của từng `<section>` (lorenz → aizawa → network → thomas → helix → galaxy → waves; blog/bài viết dùng một `galaxy` xuyên suốt ở chế độ calm (`setCalm`, `READING_FOCUS` trong site.js: chậm, ít glow, không sóng/không hiệu ứng chuột); `core` lúc khởi động — điểm sinh theo thứ tự quỹ đạo để xung sáng chạy dọc đường cong; preview từng hình: tạo trang tạm import `startScene` rồi `scrub(name, name, 0)`). Có sóng "forward pass" khi đổi section, con trỏ đẩy điểm, click tạo gợn sóng, camera "lao vào" khi đổi route. Vị trí/độ sáng từng section ở `SECTION_FOCUS`. Tạm dừng khi tab ẩn, ít điểm hơn trên mobile/máy ≤2 nhân, khung tĩnh khi reduced-motion.
- **Hiệu năng cảm ứng** (`pointer: coarse`): ít điểm hơn (2800 điện thoại / 3600 tablet), DPR ≤1.25, vẽ cách frame khi đang vuốt, tự hạ DPR nếu frame chậm; panel nội dung dùng kính tint không `backdrop-filter` (chỉ nav/dock/hero lens còn blur) — mỗi lớp backdrop-filter là một pass đọc-lại mỗi frame, chi phí gần như không phụ thuộc bán kính. Đo bằng Chrome giả lập + CPU throttle 4×: điện thoại 64→196 frame/lượt cuộn, iPad 37→131.
- **Kính (liquid glass)**: `.lens` gần trong suốt (3.5% trắng, `blur(7px) saturate(185%) brightness(0.78)`), viền sáng `::before` xoay theo `--sheen-angle` (site.js cập nhật khi cuộn). Nav/dock/bài đọc dùng biến `--glass`/`--glass-blur` riêng, đậm hơn để dễ đọc.
- **Reveal khi cuộn**: mỗi section một `gsap.context` (`REVEALS` + `setupReveals(ids)`). Render lại section nào thì gọi `setupReveals(['id'])` cho đúng section đó — không gọi lại `gsap.from()` trên phần tử đang ẩn.
- **Blog**: code block chỉ hiện dưới heading kiểu Method/Implementation/… (`isCodeVisibleInSection`). Thứ tự ghim và bài ẩn lấy từ section `blog` (`{ featured: [slug], hidden: [slug] }`, chỉnh ở admin "Blog listing"; mặc định trong `content.js`).
- **i18n**: field nội dung là chuỗi hoặc `{ en, vn }` (`localize`), chuỗi giao diện ở `UI` trong `content.js`. Lưu lựa chọn ở `localStorage['preferred_lang']`.

### 2. Admin — `admin/index.html` + `assets/js/admin.js` + `assets/css/admin.css`
- Đăng nhập mật khẩu → token có hạn (12h) lưu `localStorage['admin_session']`. Hash routes: `#/posts`, `#/posts/new`, `#/posts/edit/:slug`, `#/tags`, `#/media`, `#/site/:key` (gồm `#/site/blog` = Blog listing).
- **Ảnh**: upload trong block ảnh, ô cover, hoặc trang Media → lưu trên mini PC ở `uploads/` (gitignored, đổi bằng `UPLOAD_DIR`), phục vụ tại `https://blog-api.verbaa.pp.ua/uploads/<file>`; URL tuyệt đối được ghi vào bài. Thư mục `uploads/` không nằm trong git; được backup hằng ngày cùng database (xem Trạng thái vận hành).
- **CV/Resume** (`#/cv`): upload PDF (≤10MB, kiểm tra `%PDF-`) → lưu `uploads/cv/<yyyymmdd>-<hex>--<Ten_file>.pdf`, phục vụ với `Content-Disposition: attachment` theo tên sau `--`; trang admin tự đặt `social.cvUrl` = URL bản mới. Mọi nút Resume/Download CV đọc `social.cvUrl` (nút hero dùng nó khi link trống hoặc là đường dẫn PDF cũ trong repo). "Use repo file" quay về `/Nguyen_Nhat_Bang_AI_Engineer.pdf`.
- Form section sinh từ schema `SECTIONS` trong `admin.js` — **thêm field vào trang chủ thì sửa cả `SITE_DEFAULTS` (content.js), `SECTIONS` (admin.js) và hàm render trong site.js.**
- `?api=` chỉ có hiệu lực trên localhost (chặn phishing đổi API khi đăng nhập).

### 3. Backend — `server/app.js` (Express 5, ESM)
- Public: `GET /api/health` · `GET /api/blog/posts?status=published` · `GET /api/blog/posts/:slug` (chỉ bài published) · `GET /api/blog/tags` · `GET /api/site` · `GET /uploads/:file`
- CV (admin): `POST /api/admin/cv?name=` (body = PDF), `GET /api/admin/cv`, `DELETE /api/admin/cv/:name`.
- Media (admin): `POST /api/admin/uploads?name=` (body = file ảnh, Content-Type ảnh, ≤6MB, kiểm tra magic bytes PNG/JPG/WebP/GIF), `GET /api/admin/uploads`, `DELETE /api/admin/uploads/:name`.
- Admin (`Authorization: Bearer <token>` hoặc `x-admin-key` nếu đặt `ADMIN_API_KEY`): `POST /api/admin/login` (giới hạn 5 lần sai/15 phút/IP), `GET /api/admin/session`, posts `status=draft|archived|all`, `POST/PUT/DELETE /api/blog/posts`, `GET /api/blog/tags?scope=all`, `PATCH/DELETE /api/blog/tags/:slug` (đổi tên trùng = gộp), `PUT/DELETE /api/site/:key`.
- Không cấu hình auth → các route admin trả 503 (fail closed). CORS theo `CORS_ORIGINS`. Lỗi trả JSON qua error handler cuối file.
- Đặt mật khẩu: `npm run admin:set-password` (ghi `ADMIN_PASSWORD_HASH` scrypt + `ADMIN_TOKEN_SECRET` vào `.env`). Đổi mật khẩu = thu hồi mọi token.
- `server/index.js` **không** tự đọc `.env` — systemd dùng `EnvironmentFile`; chạy tay thì `set -a; . ./.env; set +a` trước. Service chạy thẳng từ repo, nên **restart = deploy code backend mới**.

### 4. Database — `db/`
- `schema.sql`: `blog_posts`, `blog_tags`, `blog_post_tags`, `blog_assets` (chưa dùng), `site_sections (key, data JSONB, updated_at)`.
- Migrations: `001_add_content_blocks.sql`, `002_site_sections.sql`. `seed.sql`: 3 bài (seed không gắn tag vào bài).
- Lệnh: `npm run db:schema` / `db:migrate:content-blocks` / `db:migrate:site-sections` / `db:seed`.

### Dev local
- `npm run dev:static` (cổng 5500, giả lập GitHub Pages) + API ở 8787, mở `http://localhost:5500/?api=http://localhost:8787`. Chi tiết: `docs/blog-admin.md`.

### Deploy
- **GitHub Pages lấy nguồn từ nhánh `gh-pages`** (từ 2026-10-17). Push `main` → workflow `.github/workflows/pages.yml` copy `index.html 404.html admin assets *.pdf *.png` sang `gh-pages`. File/thư mục frontend mới ở gốc repo (ngoài `assets/`, `admin/`) **phải thêm vào bước `cp`**, nếu không sẽ không được deploy. `docs/`, `db/`, `server/`, các file .md không được phục vụ trên site.
- Repo public — không bao giờ ghi secret vào bất kỳ file nào được commit.

## Phạm vi (tránh out of scope)

**Trong phạm vi**
- UI/UX trang chính (home, about, education, project, skill, contact, blog list, blog post).
- Trang admin quản trị nội dung: bài viết blog, tag, và nội dung các section của trang chính.
- API Express + schema Postgres phục vụ hai mục trên.
- Redesign: **glassmorphism là chủ đạo + motion đẹp** (GSAP), responsive, tôn trọng `prefers-reduced-motion`.

**Ngoài phạm vi — không đụng nếu không được yêu cầu rõ**
- `Project/` (2.8 GB, untracked): code ML/paper gốc (stroke prediction, lung cancer). Chỉ đọc để lấy nội dung bài viết; **không commit, không sửa**.
- Các service khác trên minipc (invera, verbaa, taskmanage, nextcloud, cloudflared của project khác…), cấu hình `~/.config/*/cloudflared.yml`.
- Vercel, đổi framework/thêm build tool (React, Vite…) khi chưa được đồng ý.
- Nội dung CV/kinh nghiệm/học vấn: giữ nguyên chữ, chỉ đổi trình bày — trừ khi được bảo sửa.
- `.env`: không đọc giá trị, không in, không commit.

## Quy ước
- Commit theo kiểu `feat: …` / `fix: …` / `chore: …` / `ci: …` (xem `git log`).
- Kế hoạch nhiều bước lưu ở `docs/superpowers/plans/YYYY-MM-DD-<tên>.md` — nhưng nhớ thư mục này bị publish.
- Chuỗi giao diện mới: thêm vào cả `UI.en` và `UI.vn` (content.js), gắn bằng `data-ui` hoặc `ui()`.
- Escape mọi dữ liệu từ API bằng `escapeHtml` / `escapeAttribute` trước khi chèn vào `innerHTML`.
- Trước khi báo "xong": mở site thật bằng trình duyệt (xem skill `playwright-cli` / `browser-use`), chụp màn hình desktop + mobile.

## Skill dùng cho dự án — `.agents/skills/`
| Việc | Skill |
|---|---|
| Định hướng/đánh giá/polish UI | `impeccable`, `make-interfaces-feel-better`, `design-system` |
| Motion | `motion-design` (nguyên tắc), `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins` (SplitText, Flip…), `gsap-utils`, `gsap-performance` |
| Nền 3D sau lớp kính | `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-shaders`, `threejs-interaction` |
| Admin API / DB / auth | `backend-patterns`, `api-design`, `postgres-patterns`, `security-review` |
| Kiểm tra trên trình duyệt | `playwright-cli`, `browser-use` (Chrome headless sẵn ở `127.0.0.1:9222`, env `BU_CDP_URL`) |
| Trước khi báo hoàn thành | `verification-before-completion` |

GSAP dùng bản vanilla qua CDN (không có skill React/Vue vì dự án không dùng framework).

## Quyết định đã chốt với chủ repo (2026-10-17)
- Admin tách thành trang riêng `/admin/` (file `admin/index.html`), có màn đăng nhập mật khẩu → server cấp token có hạn. Bỏ kiểu dán API key vào localStorage.
- Admin sửa được **blog + mọi section trang chính** (hero, about/kinh nghiệm, education/chứng chỉ, project, skill, contact). Nội dung lưu DB; trang chính giữ nội dung tĩnh làm fallback khi API lỗi.
- Style: giữ palette tối + cyber lime + xanh, glassmorphism chủ đạo, motion GSAP, **nền 3D three.js** nhẹ sau lớp kính (có fallback tĩnh cho mobile yếu / `prefers-reduced-motion`).
- Chủ repo **tự xử lý database** — không tự tạo lại / seed DB production.

## Trạng thái vận hành (2026-10-17)
- Database `nhatbang-web` đã tạo lại từ `schema.sql` + `seed.sql`, owner là user riêng `nhatbang_web` (không phải superuser). Blog không còn dùng user `cloud`.
- **Backup tự động**: `blog-backup.timer` (systemd user, 03:30 hằng ngày, chạy bù khi máy tắt) gọi `scripts/backup.sh` → `~/backups/nhatbang-web/`: `db-<stamp>.dump` (pg_dump custom) + `uploads-<stamp>.tar.gz` (ảnh + CV), giữ 14 ngày. Unit nằm trong `systemd/`. Đã thử khôi phục thành công (2026-10-17). Backup cùng ổ đĩa — chưa có bản sao ngoài máy.
- Mật khẩu admin lưu ở `~/.config/blog/admin-password.txt` (quyền 600, ngoài repo). Đổi bằng `npm run admin:set-password` rồi restart `blog-backend`.
- `ADMIN_API_KEY` đã đổi; key cũ bị lộ không còn hiệu lực.
- Postgres (container `postgres`, `~/docker/docker-compose.yml`) chỉ còn nghe trên `127.0.0.1` và IP Tailscale `100.82.138.69` (đã bỏ cổng công khai IPv4/IPv6). User service `postgres-tailscale-guard` khởi động lại container sau khi Tailscale có IP lúc boot.
- **Còn mở (chủ repo quyết định để sau):** mật khẩu superuser `cloud` từng lộ trong lịch sử git vẫn chưa đổi vì nhiều dự án khác dùng chung; hiện chỉ truy cập được từ máy này và tailnet.
- Tunnel công khai `blog-api.verbaa.pp.ua` chạy bằng unit `blog-api-verbaa-cloudflared` (ngoài repo); repo chỉ còn `systemd/blog-backend.service` + `blog.target`.
