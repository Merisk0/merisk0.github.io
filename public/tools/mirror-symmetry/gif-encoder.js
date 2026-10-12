/**
 * 极简 GIF89a 编码器（纯 JS，无依赖，浏览器 / Node 都能跑）
 *
 * 特点：
 *  - 全局调色板：按 32 级/通道直方图统计出最常见颜色，最多 255 色（+1 个透明色）
 *  - 支持透明（alpha < 128 的像素映射到透明索引）与逐帧延迟、循环次数
 *  - LZW 压缩按 GIF 规范实现，帧间 disposal=2（每帧重画，避免残影）
 *
 * 用法：
 *   encodeGIF({ width, height, frames: [{data: Uint8ClampedArray, delay: 100}], loop: 0 })
 *   → Uint8Array（可直接 new Blob([...], {type:'image/gif'})）
 */

const MAX_COLORS = 255; // 留 1 个给透明色

/** 把 RGBA 像素量化成调色板索引。 */
function buildPalette(frames, limit = MAX_COLORS) {
  const hist = new Map(); // key = r5<<10 | g5<<5 | b5
  for (const frame of frames) {
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      const entry = hist.get(key);
      if (entry) {
        entry.count++;
        entry.r += d[i];
        entry.g += d[i + 1];
        entry.b += d[i + 2];
      } else {
        hist.set(key, { count: 1, r: d[i], g: d[i + 1], b: d[i + 2] });
      }
    }
  }
  const entries = [...hist.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit);

  const palette = [];
  const lookup = new Map(); // 5bit 桶 -> 调色板索引
  for (const [key, e] of entries) {
    const idx = palette.length;
    palette.push([
      Math.round(e.r / e.count),
      Math.round(e.g / e.count),
      Math.round(e.b / e.count),
    ]);
    lookup.set(key, idx);
  }
  if (palette.length === 0) palette.push([0, 0, 0]);
  return { palette, lookup };
}

/** 把一帧 RGBA 转成调色板索引数组；透明像素用 transparentIndex。 */
function quantizeFrame(frame, lookup, transparentIndex) {
  const d = frame.data;
  const out = new Uint8Array(d.length / 4);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    if (d[i + 3] < 128) {
      out[p] = transparentIndex;
      continue;
    }
    const key = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    let idx = lookup.get(key);
    if (idx === undefined) {
      // 该 5bit 桶没进调色板（被截断），找最接近的颜色
      idx = nearestIndex(lookup, d[i], d[i + 1], d[i + 2]);
    }
    out[p] = idx;
  }
  return out;
}

function nearestIndex(lookup, r, g, b) {
  let best = 0;
  let bestDist = Infinity;
  for (const idx of lookup.values()) {
    const d = Math.abs((idx & 31) - (r >> 3)) + Math.abs(((idx >> 5) & 31) - (g >> 3)) + Math.abs(((idx >> 10) & 31) - (b >> 3));
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
    if (d === 0) break;
  }
  return best;
}

/** GIF LZW 压缩（返回子块字节流）。 */
function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const out = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeSize = minCodeSize + 1;
  let dict = new Map();
  let nextCode = eoiCode + 1;
  let prefix = -1;

  const emit = (code) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);

  for (let i = 0; i < indices.length; i++) {
    const k = indices[i];
    if (prefix === -1) {
      prefix = k;
      continue;
    }
    const key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    emit(prefix);
    if (nextCode < 4096) {
      dict.set(key, nextCode++);
      if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
    } else {
      emit(clearCode);
      dict = new Map();
      nextCode = eoiCode + 1;
      codeSize = minCodeSize + 1;
    }
    prefix = k;
  }
  if (prefix !== -1) emit(prefix);
  emit(eoiCode);
  if (bitCount > 0) out.push(bitBuffer & 0xff);
  return out;
}

/** 把字节流切成 GIF 子块（每块最多 255 字节）。 */
function toSubBlocks(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
  return out;
}

function pushString(out, str) {
  for (let i = 0; i < str.length; i++) out.push(str.charCodeAt(i));
}

function pushShort(out, value) {
  out.push(value & 0xff, (value >> 8) & 0xff);
}

/**
 * 编码成 GIF。
 * @param {{width:number,height:number,frames:Array<{data:Uint8ClampedArray,delay?:number}>,loop?:number,label?:string}} options
 * @returns {Uint8Array}
 */
export function encodeGIF(options) {
  const { width, height, frames } = options;
  if (!frames || frames.length === 0) throw new Error('no frames');
  const loop = options.loop ?? 0;
  const hasAlpha = frames.some((f) => {
    const d = f.data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 128) return true;
    return false;
  });

  const { palette, lookup } = buildPalette(frames, hasAlpha ? MAX_COLORS : MAX_COLORS + 1);
  const transparentIndex = 255;
  const colorCount = Math.max(2, palette.length + (hasAlpha ? 1 : 0));
  let bitsPerPixel = 1;
  while (1 << bitsPerPixel < colorCount) bitsPerPixel++;
  const tableSize = 1 << bitsPerPixel;

  const out = [];
  pushString(out, 'GIF89a');
  pushShort(out, width);
  pushShort(out, height);
  out.push(0xf0 | (bitsPerPixel - 1)); // 有全局色表 + 色表大小
  out.push(0);   // 背景色索引
  out.push(0);   // 像素宽高比
  for (let i = 0; i < tableSize; i++) {
    const c = palette[i] || [0, 0, 0];
    out.push(c[0], c[1], c[2]);
  }

  // NETSCAPE 循环扩展
  out.push(0x21, 0xff, 0x0b);
  pushString(out, 'NETSCAPE2.0');
  out.push(0x03, 0x01);
  pushShort(out, loop);
  out.push(0x00);

  if (options.label) {
    const label = String(options.label).slice(0, 250);
    out.push(0x21, 0xfe, label.length);
    pushString(out, label);
    out.push(0x00);
  }

  const minCodeSize = Math.max(2, bitsPerPixel);
  for (const frame of frames) {
    const delay = Math.max(2, Math.round((frame.delay || 100) / 10)); // GIF 单位 1/100 秒
    out.push(0x21, 0xf9, 0x04);
    out.push(0x08 | (hasAlpha ? 0x01 : 0x00) | 0x04); // disposal=2（还原背景）
    pushShort(out, delay);
    out.push(hasAlpha ? transparentIndex : 0);
    out.push(0x00);

    out.push(0x2c);
    pushShort(out, 0);
    pushShort(out, 0);
    pushShort(out, width);
    pushShort(out, height);
    out.push(0x00); // 无局部色表

    const indices = quantizeFrame(frame, lookup, transparentIndex);
    out.push(minCodeSize);
    out.push(...toSubBlocks(lzwEncode(indices, minCodeSize)));
  }

  out.push(0x3b);
  return new Uint8Array(out);
}

export default encodeGIF;
