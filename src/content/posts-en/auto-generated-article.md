## 2026-10-25

### Added

- **Full Chinese–English bilingual site**: a new `src/i18n.ts` string dictionary, with English under `/en` (`/en.html`, `/en/posts.html`, `/en/archive.html`, `/en/tags.html`, `/en/Articles/*.html`) while the root paths stay Chinese. `<html lang>`, `hreflang` (zh-CN / en / x-default) and `og:locale` follow the language, and the nav, footer, breadcrumbs and buttons all read from the dictionary.
- **Footer language switch**: one `English · 中文` line; a click is remembered in `localStorage['pref-lang']`, and later visits jump to the matching language automatically (with a one-shot guard against redirect loops).
- Optional post front-matter fields **`titleEn` / `summaryEn`**, filled in for all 11 posts: English pages prefer them and fall back to Chinese. Translated bodies live in `src/content/posts-en/` (the `postsEn` collection); three public posts are translated so far — Blog Changelog, Mirror Symmetry and Turbo-Boost Horizon 4.
- **Read counts on the list page**: each entry ends with `N reads` from the third-party counter `abacus.jasoncameron.dev`. Opening a post bumps its counter (local previews don't count), and a failing API hides the whole segment instead of breaking the line.

### Changed

- **Post list redesign**: from a card with a sidebar to a plain single-column list — title → summary → `date · words · read time`. The About Me card, the search box and the tag pills are gone, as is the "Article index" heading, and the row spacing is tighter.
- List entries now have three clear levels: the title at 1.16rem / 700 serif, the summary at 0.95rem in muted grey, and the metadata at 0.8rem and dimmer again; the "New" marker is a compact pill (33×16px) instead of bare text.
- Summaries use a shared `--text-summary` variable (0.95rem on desktop, 0.88rem on mobile), and the "New" pill scales with it.
- Encrypted posts no longer repeat a summary line in the list; a single "Encrypted" tag in the metadata is enough.
- On English pages an encrypted post shows only the lock notice and a "Read the Chinese original" button — the ciphertext and the decrypt script stay on the Chinese page.

### Verified

- `npm run build` passes with 41 pages (26 Chinese + 15 English), including `/en.html`, `/en/posts.html`, `/en/archive.html`, `/en/tags.html` and `/en/Articles/mirror-symmetry-sticker.html`.
- Headless-Chrome screenshots covered both languages, light and dark themes, and desktop plus a 420px mobile viewport; interaction checks covered list paging, archive year filters, tag search, read counts, language switching and the `pref-lang` memory.

## 2026-10-17

### Added

- **Site icon**: the Minecraft pixel avatar that had been there for years is replaced with a hand-drawn **pixel fern**. I first computed the frond as vectors (18 pairs of lens-shaped pinnae plus a curved rachis), then dropped it onto a 32×32 pixel grid and coloured it cell by cell (one light cell for the rachis, two alternating greens for neighbouring pinnae, one brighter cell at the tip) — tying it back to the fern photo in the avatar while keeping the "pixel block" feel of the old icon. The same geometry also produced `favicon.svg`, `favicon.png`, `apple-touch-icon.png` and the two manifest icons.

### Fixed

- **The header on the home page was 16px taller than after scrolling**: the home page's `<body>` also carries `class="profile"`, so the rule meant for the inner div — `.profile { margin-top: 1rem; padding: 0 0.8rem }` — applied to the body as well, leaving 1rem of empty space at the top and pushing the header down; once you scrolled, the sticky header snapped back to 0, which looked as if the header had grown. The rule is now scoped to `.main > .profile`, the body keeps only its horizontal padding, and the distance from the top to the banner is 65px both before and after scrolling.

### Changed

- **Smaller tags on the article page, and "New" back to a compact pill**: added `--text-sm: 0.9rem` (the size of the summary / meta line under a title) and `--text-summary: 0.95rem` (the size of the excerpt under each entry in the list). The tags at the bottom of an article now use `calc(var(--text-sm) * 0.82)` (11.8px, down from 13.1px), so they follow the summary size from now on. The "New" marker in the list is no longer bare text: it is a pill again (`border-radius: 999px` plus a 12% brand tint), but with em-based padding (`0.04em 0.42em`) and a line height of 1.35, so the whole thing is only 33×16px, with the font size still at 0.72rem.

## 2026-10-16

### Added

- **The whole layout was rewritten**, following the PaperMod style of [chen-yingfa.github.io](https://chen-yingfa.github.io/): thin borders instead of shadows, small square-ish radii, sans-serif body text with serif titles, and flattened pills everywhere.
- The home page became a **profile page**: top banner plus an overlapping avatar, name, a random quote, a short introduction, buttons, site statistics and social links.
- Added **`/posts.html`**, a post list page (structured like the reference site's Blog page): breadcrumbs, title, entries, load more.
- Added **`/search.html`**, an in-site search page, replacing the old navigation search overlay.
- The status page was rebuilt in a **Google Scholar style**: a plain-text key/value table, thin rules, blue links with grey metadata; the "composition" section uses two hand-written SVG donuts (encrypted share / years), with hover tooltips for more detail.
- The article table of contents moved to a **fixed position on the right at wide widths**: small type, 72% opacity, no border (following the `post-toc` on xbmlz.github.io's article pages), highlighting the current section as you scroll; at medium and narrow widths it is still a collapsible list above the body, both rendered from the same headings.
- The archive page turns the month and day into a large translucent watermark on the right of each entry; entries on the tags page no longer show dates.
- Added a search icon and a hamburger menu to the navigation (the latter expands on portrait screens at 640px and below).

### Improved

- The table of contents is now rendered **at build time** into a `<details>` element instead of being assembled by client-side script.
- Code blocks use dual-theme highlighting (`github-light` / `github-dark`) that follows `body.dark`.
- Fixed the avatar being covered in dark mode: the banner's `filter` creates a stacking context that painted over the avatar overlapping it.
- Link blue desaturated: `#0b57d0` → `#416b8f` (dark mode `#8ab4ff` → `#9bb6d0`).
- The tags page dropped its coloured tag icons and per-tag colours (`TAG_META` is no longer rendered for now), and coloured emoji were removed across the site.
- Tighter line spacing on the archive and tags pages; entry padding went from `0.85rem` to `0.5rem`.
- The home page copy was narrowed to a single column (`max-width: 40rem`); the quote moved below the name with a smaller font size.

### Performance

- **Fonts are now self-hosted**: the Google Fonts `<link>` is gone (it is largely unreachable from mainland China and is a render-blocking resource, so the first screen waited on it), replaced by two variable woff2 files (Inter, Cormorant Garamond, about 84 KB in total) in `public/fonts/`. The home page went from 2 third-party font requests to **0**, and the whole page now makes just 6 requests.
- `theme.js` got `defer`, so it no longer blocks HTML parsing.
- The Service Worker changed from "always hit the network on navigation" to **stale-while-revalidate**: serve from cache first and update in the background, so repeat visits open almost instantly (cache version bumped to `merisk-blog-v9`, with both fonts added to the precache).
- The status page's GitHub API requests are deferred until the page is idle (`requestIdleCallback`), so they no longer compete with the first screen for bandwidth.
- giscus comments on article pages are **only injected once you scroll near them**, instead of requesting `giscus.app` as soon as an article opens.

### Cleanup

- Removed **16 unused CSS classes** across the site (`article-tags`, `data-row-bar`, `entry-cover`, `has-cover`, `section-head`, `status-grid`, `status-live`, `tag-title-wrap` and others) along with their rules, and deleted the whole `@media (max-width: 520px)` block that contained nothing but dead rules.
- **Scroll position memory was redone**: the old block was dead code that only ever wrote and never read (`backStateKey` was written, `restoreStateKey` never was), so it had never actually worked. Now the position is stored per path in `sessionStorage` when you leave a page, and restored on **back / forward / reload**; it is skipped when the URL has a `#` anchor (such as `#tag-xxx` on the tags page or a table-of-contents link) or when you arrived by clicking a link from another page.
- Breadcrumbs were extracted into `src/components/Breadcrumbs.astro`, shared by 15 pages, and the container changed from a `div` to `<nav aria-label="面包屑">`.
- The table-of-contents list was extracted into `src/components/TocList.astro`, shared by the wide-screen sidebar and the collapsible list above the body, so the nested `<ul>` is no longer copied twice.
- Deleted three unreferenced files: `public/img/head.jpg` (736 KB), `public/texture/*.zip` (4.1 MB, a texture pack left over from the old theme) and `src/data/tags.ts` (tag icons are no longer rendered), plus unused imports such as `formatDate`.
- Size changes: `style.css` 1165 → 1135 lines (39.5 → 38.2 KB), `theme.js` 641 → 609 lines (28.2 → 26.7 KB), build output `dist/` 6.66 → 1.91 MB.

### Changed

- **RSS removed**: deleted `src/pages/feed.xml.ts`, the `<link rel="alternate">`, and the footer and about-page entries, and uninstalled `@astrojs/rss`; `/feed.xml` now returns 404 (the sitemap stays).
- Encrypted articles no longer show a 🔒 emoji; they all use the plain text "已加密，需要密码查看".
- Deleted `public/Articles/Articles.css`; its styles were merged into `public/style.css`.
- Fixed the dead "文章" breadcrumb on article pages, which pointed at `/#posts` (an anchor that no longer exists after the home page rewrite); it now points at `/posts.html`.
- Breadcrumbs are now consistent across the site — "show only the parent, never repeat the current page": an article page shows "首页 › 文章", the five sub-pages under More (links / now / projects / series / uses) show "首页 › 更多", and every other top-level page (post list / archive / tags / status / about / more / search / 404 / offline) shows only "首页".
- **The brand colour moved from dark green to a low-saturation blue**: `--brand` is `#416b8f` (dark mode `#9bb6d0`), in the same family as the body links; the navigation dot, the quote bar, the "New" marker and the status page donuts all turned blue with it.
- **The dark background is no longer pure black**: it became a blue-tinted `#131b24`, with surfaces, rules and text greys shifted cooler, and the `theme-color` and PWA manifest background updated to match.
- The dark background was deepened again to **`#0f151c`**, with `--surface` / `--line` brought down to match, and the search box and code-block backgrounds in dark mode now use tokens.
- **The home banner was replaced with a new night photo** (`/img/banner-night.webp`, 1600×900 WebP, 78 KB; the old `head2.webp` was deleted), and the dark-mode dimming went from 0.82 to 0.92 so the night scene is no longer crushed.
- **Article titles now use a serif face**: the Chinese fallback of `--font-serif` went from sans-serif to Noto Serif SC / Songti (no extra download), affecting the article `h1` and the `/posts.html` list titles.
- **The site icon was redone**: the old Minecraft pixel avatar became a "pixel fern" — a dark-blue rounded square with a fern drawn from 32×32 blocks (a curved rachis plus 18 pairs of pinnae, three shades of fern green and a bright tip), taking its structure from the fern photo in the avatar and its drawing method from the old icon's pixel grid. The vector source is `public/favicon.svg`, from which `favicon.png` / `apple-touch-icon.png` / `img/icon-192.png` / `img/icon-512.png` are all rendered; `BaseLayout.astro` declares both the SVG and the PNG `<link rel="icon">`, with older browsers falling back to the PNG.
- Added the avatar `public/img/portrait.webp` (centre-cropped from `head.jpg` to 420×420).
- PWA cache version bumped to `merisk-blog-v8`, with `/posts.html` and the avatar added to the precache.

### Security

- Whole-repository scan: the tracked files contain **no** API keys, access tokens, private keys or `.env`; `_private/` has never entered the git history; the Decap CMS config holds no credentials; GitHub Actions uses OIDC and the built-in `GITHUB_TOKEN`, with no Personal Access Token.
- Confirmed that **the old plaintext of encrypted articles is still present in the git history from before the migration** (the affected commits and posts are not listed here; see "Encrypted articles → Note" in the README). Removing it completely would mean rewriting history and force-pushing, after which readers would have to re-clone; if you are worried about the password leaking, rotate it with `npm run lock -- <new password>`.
- The `_drafts/` directory is committed (its `114514.md` is an empty article template), so do not keep sensitive drafts there.

### Verification

- `npm run build` passes, 26 pages in total; `/`, `/posts.html`, `/archive.html`, `/tags.html`, `/status.html`, `/search.html` and `/articles/1.html` all return 200.
- Checked light / dark / 431px mobile with headless Chrome screenshots; the interaction regression covered list pagination, archive year filtering, tag search, in-site search, table-of-contents expansion, code copying, the hamburger menu, theme persistence and the status page tooltips.

## 2026-10-10

### Added

- Bound the custom domain `merisk.top`, enabled HTTPS across the site, and set the old address `merisk0.github.io` to redirect with a 301.
- Added a **global back button**: available in the bottom-left of every page, mirroring "back to top" in the bottom-right; it prefers returning to the real referrer and restores the scroll position.
- Added **article encryption**: the bodies of 8 articles are stored as AES-256-GCM ciphertext and decrypted locally in the browser after the reader enters the password.
- Encrypted articles are filed under a single "🔒 加密" tag for easy browsing.

### Improved

- Redrew the email icon on the home page as an inline SVG that follows the theme (light green fill with a green stroke), replacing the old black PNG.
- The **summary of encrypted articles is no longer public**: the home page, archive, tags, search and RSS all show "🔒 已加密，需要密码查看".
- Unlock state now uses a **sliding expiry**: it re-locks after 10 minutes of inactivity, and scrolling, clicking or typing resets the timer.

### Changed

- The plaintext of encrypted articles moved out of the repository (kept locally in `_private/`); only the ciphertext stays in the repository, and that directory is in `.gitignore`.
- Added an `npm run lock` command for re-encrypting articles or changing the password.
- PWA cache version bumped to `merisk-blog-v5`.

## 2026-10-09

### Migration

- The blog moved from Jekyll to Astro, now built by GitHub Actions and published to GitHub Pages.
- All old addresses are unchanged: the home page, archive, tags, status, more and so on, plus `/Articles/1.html` through `/Articles/9.html`.
- Articles are now managed with Astro content collections; the bodies are still Markdown and the front matter is essentially unchanged.
- Search, RSS and the sitemap are generated at build time, still at `/search.json`, `/feed.xml` and `/sitemap.xml`.
- Kept the light/dark themes, table of contents, code copying, image lightbox, reading progress, sharing, giscus comments and the PWA.

### Improved

- Article URLs are emitted as `xxx.html` via `build.format: 'file'`, matching the old site.
- The build now runs in a Node environment (`npm ci && npm run build`), with the output in `dist/`.
- The Decap CMS config points at the new post directory `src/content/posts`.
- The status page's "build" row was updated to Astro / GitHub Pages, and the PWA cache bumped to `merisk-blog-v4`.

### Changed

- The writing directory moved from `_posts` to `src/content/posts`; new articles are still named `YYYY-MM-DD-slug.md`.
- Unpublished drafts stay in `_drafts`, or can be marked with `draft: true` in the front matter.
- Add `permalink` to the front matter when a fixed address is needed.

### Verification

- `astro check` and `npm run build` pass locally (0 errors / 0 warnings).
- Every route was requested one by one: home, article pages, archive, tags, status, search, RSS and the sitemap all return 200.
- The GitHub Actions build and deploy succeeded, and the live site is on the Astro version.

## 2026-10-04

### Added

- The blog's articles moved to Markdown for good; from then on writing and publishing could happen directly in `_posts`.
- The home page's article cards are now generated from `site.posts`.
- Added a "更新日志" (changelog) tag, wired into the home page and the tags page.
- Integrated giscus comments, with GitHub Discussions and dark-mode sync.
- Added a status page covering articles, categories, tags, recent updates and system information.
- Added an archive page with search over titles, summaries, categories and tags, plus year filtering.
- Added a tag overview page showing the number of articles per tag and the article lists.
- Article pages gained an automatic table of contents, previous/next links and related articles.
- Added a code-copy button and an image lightbox.
- The default theme became dark mode, while manual switching was kept.

### Improved

- Article images were converted to WebP and switched to responsive `srcset`.
- Image weight dropped from about 14.8 MB to about 0.82 MB.
- Added SEO, a sitemap, RSS and `robots.txt`.
- Removed the blocking font import in favour of preconnect loading.
- Removed duplicated CSS loading and added lazy loading for article images.
- The back button prefers returning to the real referrer page — from the status page into an article, back goes to the status page.

### Changed

- Kept the original article URLs `/Articles/1.html` through `/Articles/9.html`.
- The `文化` category display was changed to `文学`.
- The tag system was tidied up to avoid duplicating categories and tags.
- Game-related tags were unified as `游戏`.
- Removed the Gitalk comment config from the old articles.

### Tags at the time

- `生活`: 2
- `测试`: 2
- `游戏`: 4
- `文学`: 1
- `更新日志`: 1

### Verification

- Local preview and the GitHub Pages build were both verified.
- Confirmed that the home page, archive, tags, status, article pages, RSS, sitemap and the giscus comment assets are all reachable.
