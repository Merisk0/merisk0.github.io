/**
 * 站点文案词典：所有界面文字都从这里取，页面里不硬编码中文。
 * 新增语言时在这里加一份即可；路径规则见 localePath()。
 */
export type Lang = 'zh' | 'en';

export const LANGS: Lang[] = ['zh', 'en'];

export const DEFAULT_LANG: Lang = 'zh';

/** 英文版挂在 /en 前缀下，中文版保持在根路径 */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang !== 'en') return clean;
  // 首页在构建配置 format:'file' 下会输出成 /en.html
  if (clean === '/') return '/en.html';
  return `/en${clean}`;
}

/** 是否英文路径（/en.html 或 /en/...） */
export function isEnPath(path: string): boolean {
  return path === '/en' || path === '/en.html' || path.startsWith('/en/');
}

/** 把当前路径换算成另一语言的路径；不是英文路径就当中文处理 */
export function swapLangPath(path: string): string {
  if (isEnPath(path)) {
    const bare = path.replace(/^\/en(\.html)?/, '');
    return bare || '/';
  }
  return path === '/' ? '/en.html' : `/en${path}`;
}

type Dict = {
  htmlLang: string;
  /** 语言切换器里显示的本语言名 */
  selfName: string;
  /** 语言切换器里显示的目标语言名 */
  otherName: string;
  skip: string;
  nav: {
    home: string;
    posts: string;
    archive: string;
    tags: string;
    about: string;
    status: string;
    more: string;
    search: string;
  };
  theme: { toggle: string; toDark: string; toLight: string };
  footer: { archive: string; tags: string; search: string; more: string; poweredBy: string; langLabel: string; top: string };
  home: {
    readAll: string;
    random: string;
    about: string;
    stats: (posts: number, tags: number, years: number, updated: string) => string;
  };
  list: {
    title: string;
    subtitle: (n: number) => string;
    latest: string;
    chars: (n: string) => string;
    minutes: (n: number) => string;
    reads: (n: string) => string;
    encrypted: string;
    loadMore: string;
    shown: (a: number, b: number) => string;
    empty: string;
  };
  article: { encrypted: string; toc: string; prev: string; next: string; related: string; updated: string };
  archive: { title: string; subtitle: (n: number, years: number, tags: number) => string; all: string };
  tags: { title: string; subtitle: (tags: number, posts: number) => string; posts: (n: number) => string };
};

const zh: Dict = {
  htmlLang: 'zh-CN',
  selfName: '中文',
  otherName: 'English',
  skip: '跳到主要内容',
  nav: {
    home: '首页',
    posts: '文章',
    archive: '归档',
    tags: '标签',
    about: '关于我',
    status: '状态',
    more: '更多',
    search: '搜索',
  },
  theme: { toggle: '切换深浅色', toDark: '切换到深色', toLight: '切换到浅色' },
  footer: {
    archive: '归档',
    tags: '标签',
    search: '搜索',
    more: '更多',
    poweredBy: 'Powered by',
    langLabel: '语言',
    top: '回到顶部',
  },
  home: {
    readAll: '全部文章',
    random: '随机逛一篇',
    about: '关于我',
    stats: (posts, tags, years, updated) => `${posts} 篇文章 · ${tags} 个标签 · ${years} 个年份 · 更新至 ${updated}`,
  },
  list: {
    title: '文章',
    subtitle: (n) => `共 ${n} 篇 · 按时间倒序。`,
    latest: '最新',
    chars: (n) => `${n} 字`,
    minutes: (n) => `${n} 分钟`,
    reads: (n) => `${n} 次阅读`,
    encrypted: '已加密',
    loadMore: '加载更多',
    shown: (a, b) => `已显示 ${a} / ${b} 篇`,
    empty: '没有匹配的文章。',
  },
  article: {
    encrypted: '已加密，需要密码查看',
    toc: '文章目录',
    prev: '上一篇',
    next: '下一篇',
    related: '相关文章',
    updated: '更新于',
  },
  archive: {
    title: '归档',
    subtitle: (n, years, tags) => `共 ${n} 篇文章 · ${years} 个年份 · ${tags} 个标签`,
    all: '全部',
  },
  tags: {
    title: '标签',
    subtitle: (tags, posts) => `${tags} 个标签 · ${posts} 篇文章`,
    posts: (n) => `${n} 篇`,
  },
};

const en: Dict = {
  htmlLang: 'en',
  selfName: 'English',
  otherName: '中文',
  skip: 'Skip to content',
  nav: {
    home: 'Home',
    posts: 'Posts',
    archive: 'Archive',
    tags: 'Tags',
    about: 'About',
    status: 'Status',
    more: 'More',
    search: 'Search',
  },
  theme: { toggle: 'Toggle theme', toDark: 'Switch to dark', toLight: 'Switch to light' },
  footer: {
    archive: 'Archive',
    tags: 'Tags',
    search: 'Search',
    more: 'More',
    poweredBy: 'Powered by',
    langLabel: 'Language',
    top: 'Back to top',
  },
  home: {
    readAll: 'All posts',
    random: 'Random post',
    about: 'About me',
    stats: (posts, tags, years, updated) => `${posts} posts · ${tags} tags · ${years} years · updated ${updated}`,
  },
  list: {
    title: 'Posts',
    subtitle: (n) => `${n} posts, newest first.`,
    latest: 'New',
    chars: (n) => `${n} words`,
    minutes: (n) => `${n} min read`,
    reads: (n) => `${n} views`,
    encrypted: 'Encrypted',
    loadMore: 'Load more',
    shown: (a, b) => `Showing ${a} / ${b}`,
    empty: 'No posts matched.',
  },
  article: {
    encrypted: 'Encrypted — password required',
    toc: 'Contents',
    prev: 'Previous',
    next: 'Next',
    related: 'Related posts',
    updated: 'Updated',
  },
  archive: {
    title: 'Archive',
    subtitle: (n, years, tags) => `${n} posts · ${years} years · ${tags} tags`,
    all: 'All',
  },
  tags: {
    title: 'Tags',
    subtitle: (tags, posts) => `${tags} tags · ${posts} posts`,
    posts: (n) => `${n}`,
  },
};

const DICTS: Record<Lang, Dict> = { zh, en };

export function dict(lang: Lang): Dict {
  return DICTS[lang] ?? DICTS.zh;
}

/** 从路径判断当前语言：/en 或 /en/... 视为英文 */
export function langFromPath(path: string): Lang {
  return isEnPath(path) ? 'en' : 'zh';
}
