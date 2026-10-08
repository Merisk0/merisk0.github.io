import type { APIRoute } from 'astro';
import { getPosts, postUrl } from '../utils';
import { SITE } from '../site';

const STATIC_PATHS = [
  '/',
  '/archive.html',
  '/tags.html',
  '/status.html',
  '/pages.html',
  '/projects.html',
  '/series.html',
  '/links.html',
  '/now.html',
  '/uses.html',
  '/AboutMe.html',
];

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const urls = [...STATIC_PATHS, ...posts.map(postUrl)];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${new URL(url, SITE.url).href}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
