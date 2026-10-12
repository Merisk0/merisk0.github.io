/**
 * 站点标记：把一段短信息不可见地写进导出文件。
 *
 * 与桌面版格式兼容：
 *  - 标记串 MSW1|标签|时间|宽x高x帧数|指纹|CRC
 *  - CRC32（zlib 多项式）、SHA-256 指纹
 *  - 像素最低位（低位）写入：2 字节大端长度 + UTF-8 内容，
 *    按行优先写进每个像素的 R/G/B 最低位；调色板格式（如 GIF）走注释块
 */
export const MAGIC = 'MSW1';
/** 站点标记（不提供任何修改入口，源码中也不留明文） */
const _MARK_CODES = [109, 101, 114, 105, 115, 107];
export const MARK = String.fromCharCode(..._MARK_CODES);

let CRC_TABLE = null;

function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  CRC_TABLE = table;
  return table;
}

/** 与 Python zlib.crc32 一致 */
export function crc32(bytes) {
  const table = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function utf8(str) {
  return new TextEncoder().encode(str);
}

function hex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function stamp(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** 内容指纹：与桌面版 signature_for 相同（sha256 前 16 位） */
export async function signature(width, height, frameCount, totalMs, firstFrameRGBA) {
  const head = utf8(`${width}x${height}|${frameCount}|`);
  const tail = utf8(String(totalMs || 0));
  const payload = new Uint8Array(head.length + tail.length + (firstFrameRGBA?.length || 0));
  payload.set(head, 0);
  payload.set(tail, head.length);
  if (firstFrameRGBA?.length) payload.set(firstFrameRGBA, head.length + tail.length);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return hex(new Uint8Array(digest)).slice(0, 16);
}

/** 生成标记串 */
export async function makeMark({ width, height, frameCount, totalMs, firstFrameRGBA, date }) {
  const sig = await signature(width, height, frameCount, totalMs, firstFrameRGBA);
  const when = stamp(date || new Date());
  const body = `${MAGIC}|${MARK}|${when}|${width}x${height}x${frameCount}|${sig}`;
  const sum = crc32(utf8(body)).toString(16).padStart(8, '0');
  return `${body}|${sum}`;
}

/** 校验标记串（改一个字符就会失败） */
export function parseMark(payload) {
  if (!payload || !payload.startsWith(`${MAGIC}|`)) return null;
  const parts = payload.split('|');
  if (parts.length !== 6) return null;
  const body = parts.slice(0, 5).join('|');
  const expect = crc32(utf8(body)).toString(16).padStart(8, '0');
  if (expect !== parts[5]) return null;
  return { magic: parts[0], text: parts[1], time: parts[2], size: parts[3], signature: parts[4] };
}

function bitsFrom(bytes) {
  const bits = new Uint8Array(bytes.length * 8);
  let i = 0;
  for (const byte of bytes) {
    for (let shift = 7; shift >= 0; shift--) bits[i++] = (byte >> shift) & 1;
  }
  return bits;
}

function bytesFrom(bits) {
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    let value = 0;
    for (let k = 0; k < 8; k++) value = (value << 1) | bits[i * 8 + k];
    out[i] = value;
  }
  return out;
}

/**
 * 把标记写进 RGBA 像素数据的最低位的**副本**（不修改入参）。
 * @param {Uint8ClampedArray} rgba
 * @param {string} payload
 * @returns {Uint8ClampedArray}
 */
export function writeMark(rgba, payload) {
  const data = utf8(payload);
  const stream = new Uint8Array(2 + data.length);
  stream[0] = (data.length >> 8) & 0xff;
  stream[1] = data.length & 0xff;
  stream.set(data, 2);

  const bits = bitsFrom(stream);
  const out = new Uint8ClampedArray(rgba);
  const pixels = out.length / 4;
  let idx = 0;
  for (let p = 0; p < pixels && idx < bits.length; p++) {
    const base = p * 4;
    for (let c = 0; c < 3 && idx < bits.length; c++) {
      out[base + c] = (out[base + c] & 0xfe) | bits[idx++];
    }
  }
  if (idx < bits.length) throw new Error('图片太小');
  return out;
}

/** 从 RGBA 像素数据里读回标记（读不到返回 null）。 */
export function readMark(rgba) {
  const pixels = rgba.length / 4;
  const all = new Uint8Array(pixels * 3);
  let n = 0;
  for (let p = 0; p < pixels; p++) {
    const base = p * 4;
    all[n++] = rgba[base] & 1;
    all[n++] = rgba[base + 1] & 1;
    all[n++] = rgba[base + 2] & 1;
  }
  if (all.length < 16) return null;
  const length = (bytesFrom(all.slice(0, 16))[0] << 8) | bytesFrom(all.slice(0, 16))[1];
  if (length <= 0 || length > 4096) return null;
  const need = 16 + length * 8;
  if (all.length < need) return null;
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytesFrom(all.slice(16, need)));
  return text.startsWith(`${MAGIC}|`) ? text : null;
}
