# Merisk'B1og

这是一个使用 [Astro](https://astro.build/) 构建的个人博客，并由 GitHub Pages 自动构建和发布。

> 本仓库原先使用 Jekyll，现已迁移到 Astro。站点地址（`/Articles/1.html`、`/archive.html` 等）保持与旧站完全一致。
>
> 版式参考 [chen-yingfa.github.io](https://chen-yingfa.github.io/) 的 PaperMod 风格，已于 2026-10-16 整体重写；细节见下面「版式」一节，变更记录见[更新日志](/Articles/auto-generated-article.html)。

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

提交前建议跑一次 `npm run build` 自检：约 1 秒，输出 26 个页面，有任何模板或内容错误都会在这里报出来。

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

保存后首页、`/posts.html`、归档、标签、状态和搜索页都会自动更新。

### 固定文章地址

默认地址是 `/Articles/<文件名去掉日期>.html`。如果想保留旧站那样的编号地址，在 front matter 里加一行：

```yaml
permalink: /Articles/10.html
```

现有文章通过这种方式保留了 `/Articles/1.html` 至 `/Articles/9.html`。

### 草稿

未发布的文章可以放在根目录的 `_drafts/` 里（Astro 不会构建该目录）。写完后把文件移动到 `src/content/posts/` 即会发布。

也可以在 front matter 里写 `draft: true`，这样即使放在 `src/content/posts/` 中也不会被构建。

## 加密文章

部分文章可以加密：正文以 **AES-256-GCM** 密文形式存放在仓库中，读者在浏览器里输入密码后**本地解密**。GitHub Pages 是静态站点，所以解密完全在前端完成。

### 文件分工

```text
_private/posts/<name>.md        # 明文（gitignore，绝不提交）
_private/password.txt           # 密码（gitignore）
src/content/posts/<name>.md     # 仓库里只留 front matter + protected: true
src/data/protected/<name>.json  # 密文
```

### 编辑一篇已加密的文章

```powershell
# 1. 编辑明文
code _private/posts/2021-11-14-double-eleven.md

# 2. 重新加密（写入壳文件与密文）
npm run lock

# 3. 提交
git add . && git commit -m "更新文章" && git push
```

### 换密码

```powershell
npm run lock -- 新密码
```

> 换密码后需要把新密码重新分发给读者。密码只存在 `_private/password.txt`，**不会进入仓库**。

### 加密一篇新文章

1. 把文章放进 `_private/posts/`（文件名 `YYYY-MM-DD-slug.md`，需带 front matter）
2. 跑 `npm run lock`
3. 提交 `src/content/posts/` 与 `src/data/protected/` 的变化

### 注意

- ⚠️ 仓库是**公开**的，而且**加密之前的明文确实还留在 git 历史里**（2026-10-16 已核实）：要彻底清除必须改写历史（`git filter-repo`）后强推，并让读者重新克隆——旧的 clone 里依然能读到。受影响的提交与文章**不在此处公开**。
- 加锁只保护**正文**，标题、摘要、标签仍会出现在首页、归档和搜索里。
- 浏览器需支持 `WebCrypto`（HTTPS 或 localhost 环境）。
- `_drafts/` 里的文件**会被提交**（现在放的是空文章模板），不要把敏感草稿放在那里。

## 标签

标签是唯一的内容分类系统。在 front matter 中写：

```yaml
tags: [随笔, Markdown]
```

首页、归档页、标签页和状态页都会自动读取 `tags`，新增标签无需修改任何代码。

标签页目前只渲染**标签名 + 篇数**，不显示图标和颜色。`src/data/tags.ts` 里的 `TAG_META`（每个标签的图标 / 颜色）暂时没有被引用，想恢复彩色图标可以在 `tags.astro` 里重新取用。

## 版式

- **设计令牌**集中在 `public/style.css` 顶部的 `:root` 与 `body.dark` 两组变量里（背景 / 表面 / 文字 / 分隔线 / 链接蓝 / 站点绿 / 圆角）。换配色只改这里。
- **主题**：`body.dark` class + `localStorage['pref-theme']`，默认跟随系统；`<body>` 之后有一段内联脚本先定色，避免首屏闪白。
- **页面骨架**统一为 `main.container` + 标题区 + `.post-content`；首页例外，是「横幅 + profile」。
- **站点绿** `--brand` 只在三处点缀：导航站名后的小圆点、首页引用条的左边框、状态页的环形图与「最新」标记。
- 首页横幅里的头像靠 `margin-top: -4rem` 压边；它必须带 `position: relative; z-index: 1`，否则深色下会被横幅 `img` 的 `filter` 生成的层叠上下文盖住。
- 归档页那条大号月日水印是 `.archive-date`（绝对定位 + 低透明度 + `pointer-events: none`）。
- 状态页的环形图是构建期算好的 SVG 路径（`status.astro` 顶部的 `arcPath`），悬浮气泡逻辑在 `theme.js` 的「悬浮详情气泡」一段。

## 目录结构

```text
├─ public/                 # 静态资源（原样复制到 dist/）
│  ├─ style.css            # 全站样式（含各页面级样式）
│  ├─ theme.js             # 主题切换、菜单、灯箱、搜索、悬浮气泡等
│  ├─ img/                 # 图片（portrait.webp 为首页头像）
│  ├─ admin/               # Decap CMS 配置
│  ├─ CNAME                # 自定义域名
│  ├─ manifest.webmanifest
│  ├─ service-worker.js    # PWA
│  └─ robots.txt
├─ scripts/lock.mjs        # 加密文章：明文 → 壳文件 + 密文
├─ src/
│  ├─ content/posts/       # 文章 Markdown（加密文章只留 front matter）
│  ├─ data/tags.ts         # 标签图标/颜色（当前未渲染）
│  ├─ data/protected/      # 加密文章的密文 JSON
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/               # 页面与路由
│  │  ├─ index.astro       # 首页（profile）
│  │  ├─ posts.astro       # → /posts.html 文章列表
│  │  ├─ archive.astro     # → /archive.html
│  │  ├─ tags.astro        # → /tags.html
│  │  ├─ status.astro      # → /status.html
│  │  ├─ search.astro      # → /search.html
│  │  ├─ AboutMe.astro     # → /AboutMe.html
│  │  ├─ Articles/[slug].astro  # 文章详情 → /Articles/<slug>.html
│  │  ├─ search.json.ts    # → /search.json
│  │  └─ sitemap.xml.ts    # → /sitemap.xml（RSS 已移除）
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

https://merisk.top/
