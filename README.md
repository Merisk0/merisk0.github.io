# Merisk'B1og

这是一个使用 [Astro](https://astro.build/) 构建的个人博客，并由 GitHub Pages 自动构建和发布。

> 本仓库原先使用 Jekyll，现已迁移到 Astro。站点地址（`/Articles/1.html`、`/archive.html` 等）保持与旧站完全一致。

## 环境要求

- Node.js **>= 22.12**
- npm

## 本地开发

```powershell
cd "D:\Merisk'blog"
npm install        # 首次运行
npm run dev        # 启动本地预览，默认 http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 新增文章

在 `src/content/posts/` 中新建 Markdown 文件，文件名格式为：

```text
YYYY-MM-DD-english-slug.md
```

例如：

```text
src/content/posts/2026-10-09-my-new-article.md
```

文件内容示例：

```markdown
---
title: "我的新文章"
date: 2026-10-09
author: "Merisk"
tags: [随笔, Markdown]
summary: "首页显示的文章摘要。"
---

## 小标题

这里是正文。

- 支持列表
- 支持 **粗体**
- 支持 [链接](https://example.com)
```

保存后首页、归档、标签、状态、搜索和 RSS 都会自动更新。

### 固定文章地址

默认地址是 `/Articles/<文件名去掉日期>.html`。如果想保留旧站那样的编号地址，在 front matter 里加一行：

```yaml
permalink: /Articles/10.html
```

现有文章通过这种方式保留了 `/Articles/1.html` 至 `/Articles/9.html`。

### 草稿

未发布的文章可以放在根目录的 `_drafts/` 里（Astro 不会构建该目录）。写完后把文件移动到 `src/content/posts/` 即会发布。

也可以在 front matter 里写 `draft: true`，这样即使放在 `src/content/posts/` 中也不会被构建。

## 标签

标签是唯一的内容分类系统。在 front matter 中写：

```yaml
tags: [随笔, Markdown]
```

首页、归档页、标签页和状态页都会自动读取 `tags`，新增标签无需修改任何代码。

如果想让某个标签在标签页有专属的图标和颜色，在 `src/data/tags.ts` 的 `TAG_META` 里补一项即可。

## 目录结构

```text
├─ public/                 # 静态资源（原样复制到 dist/）
│  ├─ style.css            # 全站样式
│  ├─ theme.js             # 主题切换、目录、灯箱、搜索等前端脚本
│  ├─ Articles/Articles.css
│  ├─ img/                 # 图片
│  ├─ admin/               # Decap CMS 配置
│  ├─ manifest.webmanifest
│  ├─ service-worker.js    # PWA
│  └─ robots.txt
├─ src/
│  ├─ content/posts/       # 文章 Markdown
│  ├─ data/tags.ts         # 标签图标/颜色
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/               # 页面与路由
│  │  ├─ index.astro
│  │  ├─ archive.astro     # → /archive.html
│  │  ├─ tags.astro        # → /tags.html
│  │  ├─ Articles/[slug].astro  # 文章详情 → /Articles/<slug>.html
│  │  ├─ search.json.ts    # → /search.json
│  │  ├─ feed.xml.ts       # → /feed.xml
│  │  └─ sitemap.xml.ts    # → /sitemap.xml
│  ├─ site.ts              # 站点信息、导航、giscus 配置
│  └─ utils.ts             # 文章排序、URL、日期等工具函数
├─ astro.config.mjs
└─ package.json
```

> `build.format: 'file'` 让页面生成 `archive.html` 这样的文件式地址，而不是 `archive/index.html`，从而与旧站 URL 保持一致。

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/pages.yml`）会自动执行 `npm ci && npm run build`，并把 `dist/` 发布到 GitHub Pages。

仓库的 **Settings → Pages → Build and deployment → Source** 需设置为 **GitHub Actions**。

发布流程：

```powershell
cd "D:\Merisk'blog"
git add .
git commit -m "更新文章"
git push
```

GitHub Pages 通常会在推送后自动更新：

https://merisk0.github.io/
