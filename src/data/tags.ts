export type TagMeta = { icon: string; color: string };

// 与旧 Jekyll 的 _data/tags.yml 保持一致
export const TAG_META: Record<string, TagMeta> = {
  测试: { icon: '⌘', color: '#8b7cf6' },
  生活: { icon: '✎', color: '#7fa58a' },
  文学: { icon: '文', color: '#d19a66' },
  游戏: { icon: '◈', color: '#6fb1fc' },
  更新日志: { icon: '↻', color: '#9ac3a2' },
  加密: { icon: '🔒', color: '#d0a24c' },
};

export const DEFAULT_TAG_COLOR = '#4f7b59';

export function tagMeta(tag: string): TagMeta {
  return TAG_META[tag] ?? { icon: '#', color: DEFAULT_TAG_COLOR };
}
