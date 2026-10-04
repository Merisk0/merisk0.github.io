# Merisk'B1og

这是一个使用 Jekyll 的个人博客，并由 GitHub Pages 自动构建和发布。

## 新增文章

在 `_posts` 目录中创建 Markdown 文件，文件名格式为：

```text
YYYY-MM-DD-english-slug.md
```

例如：

```text
_posts/2026-10-04-my-new-article.md
```

文件内容示例：

```markdown
---
title: "我的新文章"
date: 2026-10-04
author: "Merisk"
categories: [tech]
tags: [随笔, Markdown]
summary: "首页显示的文章摘要。"
---

## 小标题

这里是正文。

- 支持列表
- 支持 **粗体**
- 支持 [链接](https://example.com)
```

首页会自动读取并显示文章。分类可用值：

- `project`：项目
- `game`：游戏
- `life`：生活
- `tech`：科技
- `culture`：文化

如果要保留自定义文章网址，可以添加：

```yaml
permalink: /Articles/10.html
```

## 更新已有文章

直接编辑 `_posts` 中对应的 `.md` 文件，然后提交并推送。

## 发布

```powershell
cd "D:\Merisk'blog"
git pull
git add .
git commit -m "更新文章"
git push
```

GitHub Pages 通常会在推送后自动更新：

https://merisk0.github.io/

## 草稿

未发布的文章可以放在 `_drafts` 目录。Jekyll 默认不会发布草稿。

## 标签

在文章 front matter 中添加 `tags`：

```yaml
tags: [随笔, Markdown]
```

首页会自动生成标签筛选按钮，每篇有 `tags` 的文章会显示对应标签。以后新增标签不需要手动修改 `index.html`。

## 状态页

`status.html` 会自动统计文章、分类、标签和最近更新，并在导航栏提供“状态”入口。
