import type { APIRoute } from 'astro';
import { getPosts, postUrl, excerpt, formatDate } from '../utils';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const data = posts.map((post) => ({
    title: post.data.title,
    url: postUrl(post),
    summary: post.data.summary ?? excerpt(post, Number.MAX_SAFE_INTEGER),
    tags: post.data.tags,
    date: formatDate(post.data.date),
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
