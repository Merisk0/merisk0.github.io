import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().default('Merisk'),
    tags: z.array(z.string()).default([]),
    summary: z.string().optional(),
    // 旧 Jekyll 站点的自定义地址，如 /Articles/6.html
    permalink: z.string().optional(),
    draft: z.boolean().default(false),
    // 加密文章：正文以密文形式存放，浏览器端凭密码解密
    protected: z.boolean().default(false),
  }),
});

export const collections = { posts };
