/**
 * 极简 PNG 编码器（纯 JS，无依赖，浏览器 / Node 都能跑）
 *
 * 为什么要自己编码，而不是 canvas.toBlob：
 * canvas 的 2D 上下文按预乘 alpha 存像素，透明像素（alpha=0）的 RGB 会被抹成 0。
 * `putImageData → toBlob` 走一趟回来，写在像素最低位的站点标记只要落进透明区域就整段消失。
 * 直接按 RGBA 原始字节编码，不经过 canvas，标记就不会被丢掉。
 *
 * 压缩用 CompressionStream('deflate')（zlib 格式，正是 PNG 的 IDAT 需要的），
 * 没有这个 API 的环境返回 null，由调用方退回 canvas 方案。
 */
import { crc32 } from './payload.js';

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** 组装一个 PNG 数据块：长度 + 类型 + 数据 + CRC32(类型+数据) */
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** 每行前面加一个过滤器字节 0（None），后面跟整行 RGBA */
function filterScanlines(rgba, width, height) {
  const stride = width * 4;
  const out = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    out[y * (stride + 1)] = 0;
    out.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return out;
}

async function deflate(bytes) {
  const stream = new CompressionStream('deflate');
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/**
 * 把 RGBA 像素编码成 PNG。
 * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} options
 * @returns {Promise<Uint8Array|null>} 环境不支持压缩时返回 null
 */
export async function encodePNG({ width, height, data }) {
  if (typeof CompressionStream !== 'function') return null;
  const rgba = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.length);

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;   // 位深
  ihdr[9] = 6;   // 颜色类型：真彩 + alpha
  ihdr[10] = 0;  // 压缩方法：deflate
  ihdr[11] = 0;  // 过滤方法：自适应
  ihdr[12] = 0;  // 非隔行

  const idat = await deflate(filterScanlines(rgba, width, height));
  const parts = [SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

export default encodePNG;
