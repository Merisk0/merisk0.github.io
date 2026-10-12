/**
 * 对称表情包生成器 · 在线版
 * 纯前端：解码（含 GIF 逐帧）→ 镜像 → 预览 → 导出 PNG / GIF
 */
import { makeSymmetric, axisCenteredSize, MODES } from './mirror.js';
import { makeMark, writeMark } from './payload.js';
import { encodeGIF } from './gif-encoder.js';

const I18N = {
  zh: {
    open: '打开图片', paste: '粘贴', demo: '示例', modeTitle: '对称方式', axisTitle: '对称轴位置',
    centre: '回到正中', axisHint: '偏离正中时，图案会平铺成万花筒效果。',
    centerAxis: '对称轴居中输出', centerAxisHint: '偏心时自动裁成对称尺寸，让对称轴落在正中间。',
    animTitle: '动图', play: '播放动画预览', staticImage: '当前是静态图',
    exportTitle: '导出',
    downloadPng: '下载 PNG', downloadGif: '下载 GIF',
    privacy: '所有处理都在你的浏览器里完成，图片不会上传到任何服务器。',
    article: '阅读实现笔记 →', source: '原图', result: '对称结果',
    dropHint: '拖入图片 / GIF<br>或按 Ctrl+V 粘贴', resultHint: '对称结果会显示在这里',
    ready: '拖入图片或 GIF，或者点右上角「打开图片」开始。',
    axisCentre: '正中 50%', axisCustom: '轴位 {v}%', chipGif: 'GIF · {n} 帧', chipStatic: '静态图',
    frameInfo: '第 {i} / {n} 帧 · 每帧 {ms} ms', sizeInfo: '输出尺寸 {w}×{h}{scaled}',
    scaled: '（原始 {sw}×{sh}）', loaded: '已载入 {name} —— {w}×{h} · {n} 帧',
    gifUnsupported: '这个浏览器不支持逐帧解码 GIF，只载入了第一帧（建议用 Chrome / Edge）。',
    decoding: '正在解码…', exportedPng: '已导出 PNG', exportingGif: '正在编码 GIF…',
    exportedGif: '已导出 GIF（{n} 帧）', noImage: '还没有图片', openFail: '打不开这个文件',
    flipH: '整图左右翻转', flipV: '整图上下翻转',
    m_lr_left: '左半镜像到右边', m_lr_right: '右半镜像到左边', m_tb_top: '上半镜像到下边',
    m_tb_bottom: '下半镜像到上边', m_flip_h: '整图左右翻转', m_flip_v: '整图上下翻转',
  },
  en: {
    open: 'Open', paste: 'Paste', demo: 'Demo', modeTitle: 'Symmetry mode', axisTitle: 'Mirror axis',
    centre: 'Centre', axisHint: 'Off-centre tiles the pattern like a kaleidoscope.',
    centerAxis: 'Centre axis in output', centerAxisHint: 'When off-centre, crop to the symmetric size so the axis lands in the middle.',
    animTitle: 'Animation', play: 'Play preview', staticImage: 'Still image',
    exportTitle: 'Export',
    downloadPng: 'Download PNG', downloadGif: 'Download GIF',
    privacy: 'Everything runs locally in your browser — nothing is uploaded.',
    article: 'Read the write-up →', source: 'Source', result: 'Result',
    dropHint: 'Drop an image / GIF<br>or press Ctrl+V', resultHint: 'The mirrored result shows here',
    ready: 'Drop an image or GIF, or click Open at the top right.',
    axisCentre: 'Centre 50%', axisCustom: 'Axis {v}%', chipGif: 'GIF · {n} frames', chipStatic: 'Still',
    frameInfo: 'Frame {i} / {n} · {ms} ms', sizeInfo: 'Output {w}×{h}{scaled}',
    scaled: ' (source {sw}×{sh})', loaded: 'Loaded {name} — {w}×{h} · {n} frames',
    gifUnsupported: 'This browser cannot decode GIF frames; only the first frame was loaded (try Chrome / Edge).',
    decoding: 'Decoding…', exportedPng: 'PNG exported', exportingGif: 'Encoding GIF…',
    exportedGif: 'GIF exported ({n} frames)', noImage: 'No image yet', openFail: 'Cannot open this file',
    flipH: 'Flip horizontal', flipV: 'Flip vertical',
    m_lr_left: 'Left → right', m_lr_right: 'Right → left', m_tb_top: 'Top → bottom',
    m_tb_bottom: 'Bottom → top', m_flip_h: 'Flip horizontal', m_flip_v: 'Flip vertical',
  },
};

const $ = (id) => document.getElementById(id);
const state = {
  lang: localStorage.getItem('ms-lang') || 'zh',
  mode: 'lr_left', split: 50, centerAxis: true, play: true,
  source: null, frameIndex: 0, cache: null, timer: null,
};

const t = (key, vars) => {
  let s = (I18N[state.lang] || I18N.zh)[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
};

/* ------------------------------------------------------------------ 界面 */
function applyLang() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = state.lang === 'zh' ? '对称表情包生成器 · 在线版' : 'Mirror Symmetry Studio · Web';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = t(el.dataset.i18n);
    if (text.includes('<br>')) el.innerHTML = text; else el.textContent = text;
  });
  $('langBtn').textContent = state.lang === 'zh' ? 'English' : '中文';
  buildModes();
  refreshTexts();
}

function buildModes() {
  const box = $('modes');
  box.innerHTML = '';
  for (const [key] of MODES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t(`m_${key}`);
    btn.setAttribute('aria-pressed', String(state.mode === key));
    btn.addEventListener('click', () => {
      state.mode = key;
      box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === btn.textContent)));
      invalidate(); render();
    });
    box.appendChild(btn);
  }
}

function refreshTexts() {
  const v = Number($('axis').value);
  $('axisValue').textContent = Math.abs(v - 50) < 0.6 ? t('axisCentre') : t('axisCustom', { v });
  if (!state.source) {
    $('frameInfo').textContent = t('staticImage');
    $('srcChip').textContent = '—';
    $('resChip').textContent = '—';
    $('sizeInfo').textContent = '—';
    return;
  }
  const n = state.source.frames.length;
  $('srcChip').textContent = n > 1 ? t('chipGif', { n }) : t('chipStatic');
  if (n > 1) {
    const ms = Math.round(state.source.frames[state.frameIndex].delay);
    $('frameInfo').textContent = t('frameInfo', { i: state.frameIndex + 1, n, ms });
  } else {
    $('frameInfo').textContent = t('staticImage');
  }
  const size = targetSize();
  $('resChip').textContent = `${size[0]}×${size[1]}`;
  const src = state.source;
  $('sizeInfo').textContent = t('sizeInfo', {
    w: size[0], h: size[1],
    scaled: (size[0] !== src.width || size[1] !== src.height)
      ? t('scaled', { sw: src.width, sh: src.height }) : '',
  });
}

function status(text) { $('status').textContent = text; }

/* ---------------------------------------------------------------- 解码 */
function guessType(file) {
  if (file.type) return file.type;
  const ext = (file.name || '').toLowerCase().split('.').pop();
  return { gif: 'image/gif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' }[ext] || 'image/png';
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image decode failed')); };
    img.src = url;
  });
}

function canvasFromImage(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

async function decodeFile(file) {
  const buffer = await file.arrayBuffer();
  const type = guessType(file);
  if (type === 'image/gif' && 'ImageDecoder' in window) {
    try {
      const decoder = new ImageDecoder({ data: buffer, type });
      await decoder.completed;
      const track = decoder.tracks.selectedTrack;
      const count = track?.frameCount || 1;
      const frames = [];
      let width = 0, height = 0;
      for (let i = 0; i < count; i++) {
        const { image } = await decoder.decode({ frameIndex: i, complete: true });
        width = image.displayWidth; height = image.displayHeight;
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, width, height).data;
        frames.push({ data, delay: Math.max(20, Math.round((image.duration || 100000) / 1000)) });
        image.close();
      }
      if (frames.length) return { width, height, frames, name: file.name, multi: frames.length > 1 };
    } catch (err) {
      console.warn('ImageDecoder failed, falling back to first frame', err);
    }
  }
  const img = await fileToImage(file);
  const data = canvasFromImage(img);
  return { width: data.width, height: data.height, frames: [{ data: data.data, delay: 100 }], name: file.name, multi: false };
}

/* ------------------------------------------------------------ 镜像计算 */
function invalidate() { state.cache = null; }

function targetSize() {
  const src = state.source;
  if (!src) return [0, 0];
  const split = state.split / 100;
  if (state.centerAxis) return axisCenteredSize(src.width, src.height, state.mode, split);
  return [src.width, src.height];
}

function mirroredFrames() {
  const src = state.source;
  const key = `${state.mode}|${state.split}|${state.centerAxis}|${src.width}x${src.height}|${src.frames.length}`;
  if (state.cache && state.cache.key === key) return state.cache.frames;
  const split = state.split / 100;
  const frames = src.frames.map((f) => {
    const r = makeSymmetric(f.data, src.width, src.height, state.mode, split, state.centerAxis);
    return { data: r.data, width: r.width, height: r.height, delay: f.delay };
  });
  state.cache = { key, frames };
  return frames;
}

/* ---------------------------------------------------------------- 绘制 */
let checkerPattern = null;
function getChecker() {
  if (checkerPattern) return checkerPattern;
  const c = document.createElement('canvas');
  c.width = c.height = 20;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 20, 20);
  ctx.fillStyle = '#eef0f5'; ctx.fillRect(0, 0, 10, 10); ctx.fillRect(10, 10, 10, 10);
  checkerPattern = ctx.createPattern(c, 'repeat');
  return checkerPattern;
}

function paint(canvas, data, width, height, axis) {
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getChecker();
  ctx.fillRect(0, 0, width, height);
  const tmp = document.createElement('canvas');
  tmp.width = width; tmp.height = height;
  tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
  ctx.drawImage(tmp, 0, 0);
  if (axis) {
    const pos = axis === 'v' ? Math.round(width * state.split / 100) : Math.round(height * state.split / 100);
    ctx.save();
    ctx.strokeStyle = '#6c5ce7'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath();
    if (axis === 'v') { ctx.moveTo(pos, 0); ctx.lineTo(pos, height); }
    else { ctx.moveTo(0, pos); ctx.lineTo(width, pos); }
    ctx.stroke();
    ctx.restore();
  }
}

function render() {
  const src = state.source;
  $('srcEmpty').style.display = src ? 'none' : 'flex';
  $('resEmpty').style.display = src ? 'none' : 'flex';
  $('pngBtn').disabled = !src;
  $('gifBtn').disabled = !src || src.frames.length < 2;
  if (!src) { refreshTexts(); return; }
  const axis = state.mode.startsWith('lr') ? 'v' : (state.mode.startsWith('tb') ? 'h' : null);
  const frame = src.frames[state.frameIndex];
  paint($('srcCanvas'), frame.data, src.width, src.height, axis);
  const out = mirroredFrames()[state.frameIndex];
  paint($('resCanvas'), out.data, out.width, out.height, axis);
  refreshTexts();
}

/* ------------------------------------------------------------ 动画播放 */
function stopTimer() { if (state.timer) { clearTimeout(state.timer); state.timer = null; } }
function schedule() {
  stopTimer();
  const src = state.source;
  if (!src || src.frames.length < 2 || !state.play) return;
  const delay = src.frames[state.frameIndex].delay || 100;
  state.timer = setTimeout(() => {
    state.frameIndex = (state.frameIndex + 1) % src.frames.length;
    render();
    schedule();
  }, delay);
}

/* ---------------------------------------------------------------- 导出 */
async function markFor(frames, width, height) {
  const total = frames.reduce((sum, f) => sum + (f.delay || 100), 0);
  return makeMark({
    width, height, frameCount: frames.length, totalMs: total,
    firstFrameRGBA: frames[0].data,
  });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function stamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function exportPNG() {
  if (!state.source) return status(t('noImage'));
  const out = mirroredFrames()[state.frameIndex];
  const frames = mirroredFrames();
  const mark = await markFor(frames, out.width, out.height);
  const data = writeMark(out.data, mark);
  const c = document.createElement('canvas');
  c.width = out.width; c.height = out.height;
  c.getContext('2d').putImageData(new ImageData(data, out.width, out.height), 0, 0);
  c.toBlob((blob) => {
    download(blob, `mirror-symmetry_${state.mode}_${stamp()}.png`);
    status(t('exportedPng'));
  }, 'image/png');
}

async function exportGIF() {
  if (!state.source || state.source.frames.length < 2) return status(t('noImage'));
  status(t('exportingGif'));
  const frames = mirroredFrames();
  const width = frames[0].width, height = frames[0].height;
  const mark = await markFor(frames, width, height);
  await new Promise((r) => setTimeout(r, 10));
  try {
    const bytes = encodeGIF({ width, height, frames, loop: 0, label: mark });
    download(new Blob([bytes], { type: 'image/gif' }), `mirror-symmetry_${state.mode}_${stamp()}.gif`);
    status(t('exportedGif', { n: frames.length }));
  } catch (err) {
    console.error(err);
    status(String(err.message || err));
  }
}


/* ---------------------------------------------------------------- 示例 */
function buildDemo() {
  const w = 260, h = 220, n = 12;
  const frames = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    const blink = i % 6 === 0;
    // 身体（只画左边一半偏右，便于看出镜像效果）
    ctx.fillStyle = '#FFBA42';
    ctx.strokeStyle = '#C46C16';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(96, 118, 76, 78, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // 眼睛
    if (blink) {
      ctx.fillRect(58, 104, 40, 8);
    } else {
      ctx.fillStyle = '#2A2C38';
      ctx.beginPath(); ctx.ellipse(78, 106, 16, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.ellipse(83, 101, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    // 嘴
    ctx.strokeStyle = '#2A2C38';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(96, 138, 26, 0.25 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();
    // 挥动的手
    ctx.save();
    ctx.translate(150, 148);
    ctx.rotate(Math.sin((i / n) * Math.PI * 2) * 0.3);
    ctx.fillStyle = '#FFBA42';
    ctx.strokeStyle = '#C46C16';
    ctx.lineWidth = 5;
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath(); ctx.roundRect(0, -16, 64, 32, 16); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillRect(0, -16, 64, 32); ctx.strokeRect(0, -16, 64, 32);
    }
    ctx.restore();
    // 方块身体
    ctx.fillStyle = '#26262E';
    ctx.fillRect(34, 158, 76, 52);
    frames.push({ data: ctx.getImageData(0, 0, w, h).data, delay: 90 });
  }
  return { width: w, height: h, frames, name: 'demo.gif', multi: true };
}

function loadDemo() {
  state.source = buildDemo();
  state.frameIndex = 0;
  invalidate();
  render();
  schedule();
  status(t('loaded', { name: 'demo.gif', w: state.source.width, h: state.source.height, n: state.source.frames.length }));
}

/* ------------------------------------------------------------ 载入文件 */
async function loadFile(file) {
  if (!file) return;
  status(t('decoding'));
  try {
    const src = await decodeFile(file);
    state.source = src;
    state.frameIndex = 0;
    invalidate();
    if (file.type === 'image/gif' && src.frames.length === 1 && !('ImageDecoder' in window)) {
      status(t('gifUnsupported'));
    } else {
      status(t('loaded', { name: file.name || 'clipboard', w: src.width, h: src.height, n: src.frames.length }));
    }
    render();
    schedule();
  } catch (err) {
    console.error(err);
    status(`${t('openFail')}: ${err.message || err}`);
  }
}

/* ---------------------------------------------------------------- 事件 */
function init() {
  applyLang();
  $('langBtn').addEventListener('click', () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('ms-lang', state.lang);
    applyLang(); render();
  });
  $('openBtn').addEventListener('click', () => $('fileInput').click());
  $('demoBtn').addEventListener('click', loadDemo);
  $('fileInput').addEventListener('change', (e) => { loadFile(e.target.files[0]); e.target.value = ''; });
  $('pasteBtn').addEventListener('click', async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((tp) => tp.startsWith('image/'));
        if (type) { return loadFile(new File([await item.getType(type)], 'clipboard', { type })); }
      }
      status(t('noImage'));
    } catch (err) { status(state.lang === 'zh' ? '浏览器不允许读取剪贴板，请按 Ctrl+V' : 'Clipboard blocked — press Ctrl+V instead'); }
  });

  $('axis').addEventListener('input', (e) => { state.split = Number(e.target.value); invalidate(); render(); });
  $('axisReset').addEventListener('click', () => { state.split = 50; $('axis').value = '50'; invalidate(); render(); });
  $('centerAxis').addEventListener('change', (e) => { state.centerAxis = e.target.checked; invalidate(); render(); });
  $('play').addEventListener('change', (e) => { state.play = e.target.checked; schedule(); });
  $('pngBtn').addEventListener('click', exportPNG);
  $('gifBtn').addEventListener('click', exportGIF);

  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) { const f = item.getAsFile(); if (f) loadFile(f); }
  });
  ['dragenter', 'dragover'].forEach((ev) => window.addEventListener(ev, (e) => {
    e.preventDefault(); document.body.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => {
    e.preventDefault(); if (ev === 'drop' || e.target === document.body) document.body.classList.remove('dragover');
  }));
  window.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });
}

init();
if (new URLSearchParams(location.search).has('demo')) loadDemo();
