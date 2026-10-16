// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://merisk.top',
  // 生成 archive.html / AboutMe.html / Articles/1.html 这类「文件式」URL，
  // 与旧 Jekyll 站点的地址保持一致。
  build: {
    format: 'file',
  },
  // 代码块同时输出浅色/深色两套高亮，配色变量由 style.css 按 body.dark 切换
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
