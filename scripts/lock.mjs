/**
 * 把 _private/posts/*.md 的正文加密，生成仓库中的「壳 + 密文」。
 *
 *   明文： _private/posts/<name>.md              （gitignore，绝不提交）
 *   壳：   src/content/posts/<name>.md           （只留 front matter + protected: true）
 *   密文： src/data/protected/<name>.json
 *
 * 用法：
 *   node scripts/lock.mjs             # 密码取 _private/password.txt
 *   node scripts/lock.mjs "新密码"     # 换密码
 *   npm run lock
 */
import fs from 'node:fs';
import path from 'node:path';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import GithubSlugger from 'github-slugger';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, '_private', 'posts');
const OUT_POSTS = path.join(ROOT, 'src', 'content', 'posts');
const OUT_DATA = path.join(ROOT, 'src', 'data', 'protected');
const ITERATIONS = 200000;

function readPassword() {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  const file = path.join(ROOT, '_private', 'password.txt');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  throw new Error('未提供密码：用 `node scripts/lock.mjs <密码>`，或写入 _private/password.txt');
}

/** 给 front matter 的 tags 列表补上「加密」标签 */
function withLockTag(front) {
  const m = /^tags:\s*\[(.*?)\]\s*$/m.exec(front);
  if (!m) return `${front}\ntags: [加密]`;
  const tags = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  if (!tags.includes('加密')) tags.push('加密');
  return front.replace(m[0], `tags: [${tags.join(', ')}]`);
}

function splitFrontMatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) throw new Error('缺少 front matter（文件必须以 --- 开头）');
  const front = m[1].replace(/\r\n/g, '\n').replace(/\nprotected:\s*true\s*$/m, '').trimEnd();
  return { front, body: raw.slice(m[0].length) };
}

/** markdown -> HTML，并给标题补上 github-slugger 风格的 id（和 Astro 一致） */
function renderMarkdown(markdown) {
  const marked = new Marked({ gfm: true, breaks: false });
  const html = marked.parse(markdown);
  if (typeof html !== 'string') throw new Error('marked 返回了非字符串结果');
  const slugger = new GithubSlugger();
  return html.replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    return `<h${level} id="${slugger.slug(text)}">${inner}</h${level}>`;
  });
}

const toB64 = (buf) => Buffer.from(buf).toString('base64');

async function encrypt(plaintext, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: toB64(salt),
    iv: toB64(iv),
    ct: toB64(cipher),
  };
}

const password = readPassword();
if (!fs.existsSync(SRC_DIR)) throw new Error(`找不到明文目录：${SRC_DIR}`);
const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md')).sort();
if (!files.length) throw new Error(`明文目录为空：${SRC_DIR}`);

fs.mkdirSync(OUT_DATA, { recursive: true });
fs.mkdirSync(OUT_POSTS, { recursive: true });

for (const file of files) {
  const raw = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
  const { front, body } = splitFrontMatter(raw);
  const html = renderMarkdown(body);
  const payload = await encrypt(html, password);
  const name = file.replace(/\.md$/, '');

  fs.writeFileSync(path.join(OUT_POSTS, file), `---\n${withLockTag(front)}\nprotected: true\n---\n`, 'utf8');
  fs.writeFileSync(path.join(OUT_DATA, `${name}.json`), JSON.stringify(payload), 'utf8');
  console.log(`locked  ${file}   html ${html.length}B -> ct ${payload.ct.length}B`);
}

console.log(`\n完成：${files.length} 篇已加密。明文留在 _private/posts/，请勿提交。`);
