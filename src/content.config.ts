import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    // 英文版标题 / 摘要：填了英文页面就用它，没填回落到中文
    titleEn: z.string().optional(),
    date: z.coerce.date(),
    author: z.string().default('Merisk'),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    summaryEn: z.string().optional(),
    // 旧 Jekyll 站点的自定义地址，如 /Articles/6.html
    permalink: z.string().optional(),
    draft: z.boolean().default(false),
    // 加密文章：正文以密文形式存放，浏览器端凭密码解密
    protected: z.boolean().default(false),
  }),
});


// 文章的英文正文：按需翻译，文件名用文章 URL slug；没有译文就不生成英文正文
const postsEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts-en' }),
  schema: z.object({}),
});
export const collections = { posts, postsEn };
