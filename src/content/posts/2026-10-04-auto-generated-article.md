---
title: "博客更新日志"
date: 2026-10-16
author: "Merisk"
tags: [更新日志]
summary: "记录博客功能、样式与文章系统的变更（Astro 迁移、自定义域名、文章加密等）。"
---

## 2026-10-16

### 新增

- **整套版式重写**，参考 [chen-yingfa.github.io](https://chen-yingfa.github.io/) 的 PaperMod 风格：细边框代替阴影、直角小圆角、无衬线正文配衬线标题、全站胶囊扁平化。
- 首页改成 **profile 页**：顶部横幅 + 压边头像 + 名字 + 随机引用 + 简介 + 按钮 + 站点数据 + 社交链接。
- 新增 **`/posts.html`** 文章列表页（结构对齐参考站的 Blog 页）：面包屑 + 标题 + 条目 + 加载更多。
- 新增 **`/search.html`** 站内搜索页，替换原来的导航搜索浮层。
- 状态页重构为 **Google Scholar 风格**：纯文本键值表、细线分隔、蓝链接配灰元信息；「构成」用两个手写 SVG 环形图（加密占比 / 年份分布），鼠标悬浮显示更详细的数据。
- 文章页目录改成**宽屏右侧固定**：小字、72% 透明度、无边框（参考 xbmlz.github.io 文章页的 `post-toc`），滚动时自动高亮当前小节；中窄屏仍是正文上方的折叠目录，两套都由同一份 headings 渲染。
- 归档页把月日做成条目右侧的大号半透明水印；标签页条目不再显示日期。
- 导航新增搜索图标与汉堡菜单（≤640px 竖屏展开）。

### 优化

- 文章目录改为**构建时**渲染进 `<details>`，不再由前端脚本拼装。
- 代码块改为双主题高亮（`github-light` / `github-dark`），跟随 `body.dark` 切换。
- 修掉深色模式头像被挡住的问题：横幅的 `filter` 会生成层叠上下文，反过来盖住了压边上来的头像。
- 链接蓝降饱和：`#0b57d0` → `#416b8f`（深色 `#8ab4ff` → `#9bb6d0`）。
- 标签页去掉彩色的标签图标与专属颜色（`TAG_META` 暂时不再渲染），并清掉全站的彩色 emoji。
- 归档 / 标签两页收紧行距，条目内边距从 `0.85rem` 收到 `0.5rem`。
- 首页文案收成一栏（`max-width: 40rem`），引用移到名字下方并缩小字号。

### 性能

- **字体改为自托管**：去掉 Google Fonts 的 `<link>`（国内基本不可达，而且它是渲染阻塞资源，会让首屏一直等），改用两个 variable woff2（Inter、Cormorant Garamond，共约 84 KB）放在 `public/fonts/`。首页的第三方字体请求从 2 个变成 **0 个**，整页资源请求只剩 6 个。
- `theme.js` 加 `defer`，不再阻塞 HTML 解析。
- Service Worker 从「每次导航都强制走网络」改为 **stale-while-revalidate**：有缓存就先出页面、同时后台更新，回访基本瞬开（缓存版本升到 `merisk-blog-v9`，预缓存加入两个字体文件）。
- 状态页的 GitHub API 请求延后到页面空闲（`requestIdleCallback`）再发，不再和首屏抢带宽。
- 文章页的 giscus 评论改为**滚到评论区附近才注入**，不再一进文章页就请求 `giscus.app`。

### 整理

- 清掉全站 **16 个不再使用的 CSS 类**（`article-tags`、`data-row-bar`、`entry-cover`、`has-cover`、`section-head`、`status-grid`、`status-live`、`tag-title-wrap` 等）及其规则，并删掉整块只剩死规则的 `@media (max-width: 520px)`。
- **滚动位置记忆重做**：原来那段是只写不读的死代码（`backStateKey` 有人写、`restoreStateKey` 从来没人写），实际从没生效过。现在改成离开页面时把位置按路径存进 `sessionStorage`，**后退 / 前进 / 刷新**时恢复原位；带 `#` 锚点（标签页的 `#tag-xxx`、文章目录）或从别的页面点进来时不跳位置。
- 面包屑抽成 `src/components/Breadcrumbs.astro`，15 个页面共用，顺便把容器从 `div` 改成 `<nav aria-label="面包屑">`。
- 文章目录的列表抽成 `src/components/TocList.astro`，宽屏右侧目录与正文上方的折叠目录共用同一份渲染，不再各自复制一遍嵌套 `<ul>`。
- 删除三个无人引用的文件：`public/img/head.jpg`（736 KB）、`public/texture/*.zip`（4.1 MB，旧主题留下的贴图包）、`src/data/tags.ts`（标签图标已不渲染），以及 `formatDate` 之类不再使用的 import。
- 体积变化：`style.css` 1165 → 1135 行（39.5 → 38.2 KB）、`theme.js` 641 → 609 行（28.2 → 26.7 KB）、构建产物 `dist/` 6.66 → 1.91 MB。

### 调整

- **移除 RSS**：删除 `src/pages/feed.xml.ts`、`<link rel="alternate">`、页脚与关于页的入口，并卸载 `@astrojs/rss`；`/feed.xml` 现在 404（Sitemap 保留）。
- 加密文章不再显示 🔒 emoji，统一为纯文字「已加密，需要密码查看」。
- 删除 `public/Articles/Articles.css`，样式合并进 `public/style.css`。
- 修掉文章页「文章」面包屑指向 `/#posts` 的死链（首页改版后已没有这个锚点），改为指向 `/posts.html`。
- 全站面包屑统一为「只显示到上一级、不重复当前页」：文章详情页是「首页 › 文章」，「更多」的 5 个子页（链接 / 近况 / 项目 / 系列 / 设备与软件）是「首页 › 更多」，其余一级页面（文章列表 / 归档 / 标签 / 状态 / 关于我 / 更多 / 搜索 / 404 / 离线）只显示「首页」。
- **主题色从墨绿改为低饱和蓝**：`--brand` 用 `#416b8f`（深色 `#9bb6d0`），和正文链接同族；导航小圆点、引用条、最新标记、状态页环形图一起换成蓝色。
- **深色模式背景不再用纯黑**：改成带蓝调的 `#131b24`，表面色、分隔线、文字灰阶同步偏冷，`theme-color` 与 PWA manifest 的背景色一并更新。
- 深色背景再压深到 **`#0f151c`**，`--surface` / `--line` 跟着下调，深色下的搜索框与代码块底色改用 token。
- **首页横幅换成新的夜景照片**（`/img/banner-night.webp`，1600×900 WebP、78 KB，原来那张 `head2.webp` 已删除），深色下的压暗从 0.82 收到 0.92，避免夜景再被压死。
- **文章标题改用衬线体**：`--font-serif` 的中文回退从无衬线换成 Noto Serif SC / 宋体 / Songti（不额外下载字体），文章页 h1 与 `/posts.html` 列表标题都跟着变。
- 新增头像 `public/img/portrait.webp`（由 `head.jpg` 居中裁切为 420×420）。
- PWA 缓存版本升级到 `merisk-blog-v8`，预缓存加入 `/posts.html` 与头像。

### 安全

- 全仓扫描：已跟踪文件中**没有** API key、访问令牌、私钥或 `.env`；`_private/` 从未进入 git 历史；Decap CMS 配置里没有凭据；GitHub Actions 使用 OIDC 与内置 `GITHUB_TOKEN`，无 Personal Access Token。
- 已确认**加密文章的旧明文仍留在迁移前的 git 历史里**（受影响的提交与篇目不在这里列出，说明见 README「加密文章 → 注意」）。要彻底清除需改写历史并强推，之后让读者重新克隆；若担心密码外泄，可 `npm run lock -- 新密码` 轮换。
- `_drafts/` 目录会被提交（其中的 `114514.md` 是空的文章模板），后续不要把敏感草稿放在这里。

### 验证

- `npm run build` 通过，共 26 个页面；`/`、`/posts.html`、`/archive.html`、`/tags.html`、`/status.html`、`/search.html`、`/Articles/1.html` 全部 200。
- 无头 Chrome 截图核对浅色 / 深色 / 431px 移动端；交互回归覆盖列表分页、归档年份筛选、标签搜索、站内搜索、目录展开、代码复制、汉堡菜单、主题持久化与状态页悬浮气泡。

## 2026-10-10

### 新增

- 绑定自定义域名 `merisk.top`，全站启用 HTTPS，旧地址 `merisk0.github.io` 自动 301 跳转到新域名。
- 新增**全局返回键**：所有页面左下角可用，与右下角的「回到顶部」左右对称；点击会优先回到真实来源页并恢复滚动位置。
- 新增**文章加密**：8 篇文章的正文以 AES-256-GCM 密文存放，读者输入密码后在浏览器本地解密。
- 加密文章统一归入「🔒 加密」标签，方便集中浏览。

### 优化

- 重绘首页邮箱图标，改用跟随主题的内联 SVG（浅绿底 + 绿色描边），替换原来的黑底 PNG。
- 加密文章的**摘要不再公开**：首页、归档、标签、搜索和 RSS 中统一显示「🔒 已加密，需要密码查看」。
- 解锁状态改为**滑动有效期**：10 分钟无操作后自动重新上锁；滚动、点击、按键等操作会重置计时。

### 调整

- 加密文章的明文移出仓库（保存在本地 `_private/`），仓库中只保留密文，该目录已加入 `.gitignore`。
- 新增 `npm run lock` 命令，用于重新加密文章或更换密码。
- PWA 缓存版本升级到 `merisk-blog-v5`。

## 2026-10-09

### 迁移

- 博客从 Jekyll 迁移到 Astro，改由 GitHub Actions 构建并发布到 GitHub Pages。
- 所有旧地址保持不变：首页、归档、标签、状态、更多等页面，以及 `/Articles/1.html` 至 `/Articles/9.html`。
- 文章改用 Astro 内容集合（Content Collections）管理，正文仍是 Markdown，front matter 基本不变。
- 搜索、RSS、Sitemap 改为构建时生成，地址仍为 `/search.json`、`/feed.xml`、`/sitemap.xml`。
- 保留深色/浅色主题、文章目录、代码复制、图片灯箱、阅读进度、分享、giscus 评论与 PWA。

### 优化

- 文章地址通过 `build.format: 'file'` 输出为 `xxx.html`，与旧站保持一致。
- 构建流程改为 Node 环境（`npm ci && npm run build`），产物目录为 `dist/`。
- Decap CMS 配置指向新的文章目录 `src/content/posts`。
- 状态页「构建方式」更新为 Astro / GitHub Pages，PWA 缓存升级到 `merisk-blog-v4`。

### 调整

- 写作目录由 `_posts` 改为 `src/content/posts`，新增文章仍用 `YYYY-MM-DD-slug.md` 命名。
- 未发布的草稿继续放在 `_drafts`，也可以在 front matter 里用 `draft: true` 标记。
- 需要固定地址时，在 front matter 里加 `permalink`。

### 验证

- 本地 `astro check` 与 `npm run build` 通过（0 错误 / 0 警告）。
- 逐个请求全部路由，首页、文章页、归档、标签、状态、搜索、RSS、Sitemap 等均返回 200。
- GitHub Actions 构建与部署成功，线上站点已更新为 Astro 版本。

## 2026-10-04

### 新增

- 博客文章正式迁移为 Markdown，后续可以直接在 `_posts` 中写作和发布。
- 首页文章卡片改为根据 `site.posts` 自动生成。
- 新增「更新日志」标签，并接入首页和标签页。
- 接入 giscus 评论系统，支持 GitHub Discussions 和深色模式同步。
- 新增状态页，统计文章、分类、标签、最近更新和系统信息。
- 新增归档页，支持标题、摘要、分类和标签搜索，以及年份筛选。
- 新增标签总览页，按标签展示文章数量和文章列表。
- 文章页新增自动目录、上一篇/下一篇和相关文章。
- 新增代码复制按钮和图片灯箱预览。
- 默认主题改为深色模式，同时保留手动切换。

### 优化

- 文章图片转换为 WebP，并改为响应式 `srcset`。
- 图片体积从约 14.8 MB 降至约 0.82 MB。
- 接入 SEO、Sitemap、RSS 和 robots.txt。
- 移除阻塞式字体导入，改为预连接加载。
- 移除重复 CSS 加载，并为文章图片增加懒加载。
- 返回按钮优先返回真实来源页面，例如从状态页进入文章时返回状态页。

### 调整

- 保留原有文章网址 `/Articles/1.html` 至 `/Articles/9.html`。
- 将 `文化` 分类显示调整为 `文学`。
- 整理标签体系，避免分类和标签重复。
- 游戏相关标签统一显示为 `游戏`。
- 移除旧文章中的 Gitalk 评论配置。

### 当前标签

- `生活`：2 篇
- `测试`：2 篇
- `游戏`：4 篇
- `文学`：1 篇
- `更新日志`：1 篇

### 验证

- 完成本地预览和 GitHub Pages 构建验证。
- 已验证首页、归档页、标签页、状态页、文章页、RSS、Sitemap 和 giscus 评论资源均可访问。
