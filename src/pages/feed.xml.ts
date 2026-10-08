import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts, postUrl, excerpt } from '../utils';
import { SITE } from '../site';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    customData: '<language>zh-CN</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary ?? excerpt(post, 200),
      link: postUrl(post),
      categories: post.data.tags,
    })),
  });
};
