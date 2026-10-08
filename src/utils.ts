import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

/** 文章的 URL slug：优先用 front matter 里的 permalink，否则用文件名去掉日期前缀。 */
export function postSlug(entry: PostEntry): string {
  const link = entry.data.permalink;
  if (link) return link.replace(/^\/?Articles\//, '').replace(/\.html?$/, '');
  return entry.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** 文章最终地址，例如 /Articles/6.html */
export function postUrl(entry: PostEntry): string {
  return `/Articles/${postSlug(entry)}.html`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 2026/10/09 这类格式 */
export function formatDate(date: Date, sep = '/'): string {
  return `${date.getFullYear()}${sep}${pad(date.getMonth() + 1)}${sep}${pad(date.getDate())}`;
}

export function formatDay(date: Date): string {
  return pad(date.getDate());
}

export function formatMonth(date: Date): string {
  return `${pad(date.getMonth() + 1)}月`;
}

export function formatYear(date: Date): string {
  return String(date.getFullYear());
}

/** 首页卡片摘要：优先 summary，其次从正文截取。 */
export function excerpt(entry: PostEntry, max = 90): string {
  if (entry.data.summary) return entry.data.summary;
  const text = (entry.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 所有已发布文章，按时间倒序（新 → 旧）。 */
export async function getPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 按标签分组，返回 [标签, 文章[]] 列表，按文章数量从多到少、同级按名字排序。 */
export function groupByTag(posts: PostEntry[]): Array<[string, PostEntry[]]> {
  const map = new Map<string, PostEntry[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(post);
    }
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh-Hans-CN'));
}
