---
title: "博客更新日志"
date: 2026-10-10
author: "Merisk"
tags: [更新日志]
summary: "记录博客功能、样式与文章系统的变更（Astro 迁移、自定义域名、文章加密等）。"
---

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
