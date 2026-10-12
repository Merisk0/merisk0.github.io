/**
 * 镜像对称算法 —— 与桌面版（Python core.make_symmetric）逐像素一致。
 *
 * 输入输出都是 RGBA 的 Uint8ClampedArray + 尺寸，不依赖 DOM，方便在 Node 里测。
 */

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export const CUT_MODES = ['lr_left', 'lr_right', 'tb_top', 'tb_bottom'];

/** 「对称轴居中输出」时的画布尺寸（与桌面版 axis_centered_size 一致） */
export function axisCenteredSize(width, height, mode, split) {
  const s = clamp(split, 0.05, 0.95);
  if (Math.abs(s - 0.5) < 1e-9) return [width, height];
  if (mode === 'lr_left' || mode === 'lr_right') {
    const frac = mode === 'lr_left' ? s : 1 - s;
    const cx = clamp(Math.round(width * frac), 1, width - 1);
    return [2 * cx, height];
  }
  if (mode === 'tb_top' || mode === 'tb_bottom') {
    const frac = mode === 'tb_top' ? s : 1 - s;
    const cy = clamp(Math.round(height * frac), 1, height - 1);
    return [width, 2 * cy];
  }
  return [width, height];
}

/**
 * @param {Uint8ClampedArray} src 源 RGBA 数据
 * @param {number} width
 * @param {number} height
 * @param {string} mode lr_left | lr_right | tb_top | tb_bottom | flip_h | flip_v
 * @param {number} split 0~1 对称轴位置
 * @param {boolean} centerAxis 是否让对称轴落在输出正中（会改尺寸）
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
export function makeSymmetric(src, width, height, mode, split = 0.5, centerAxis = false) {
  const s = clamp(split, 0.05, 0.95);

  if (mode === 'flip_h' || mode === 'flip_v') {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < height; y++) {
      const sy = mode === 'flip_v' ? height - 1 - y : y;
      for (let x = 0; x < width; x++) {
        const sx = mode === 'flip_h' ? width - 1 - x : x;
        const di = (y * width + x) * 4;
        const si = (sy * width + sx) * 4;
        out[di] = src[si];
        out[di + 1] = src[si + 1];
        out[di + 2] = src[si + 2];
        out[di + 3] = src[si + 3];
      }
    }
    return { data: out, width, height };
  }

  const centered = centerAxis && Math.abs(s - 0.5) > 1e-9 && CUT_MODES.includes(mode);
  const [ow, oh] = centered ? axisCenteredSize(width, height, mode, s) : [width, height];
  const out = new Uint8ClampedArray(ow * oh * 4);

  if (centered) {
    // 轴居中输出：只取切线一侧的半张图，镜像后拼成新画布（与桌面版同一分支）
    const horizontal0 = mode === 'lr_left' || mode === 'lr_right';
    const frac0 = horizontal0
      ? (mode === 'lr_left' ? s : 1 - s)
      : (mode === 'tb_top' ? s : 1 - s);
    const half0 = horizontal0
      ? clamp(Math.round(width * frac0), 1, width - 1)
      : clamp(Math.round(height * frac0), 1, height - 1);
    const period0 = 2 * half0;
    const first0 = mode === 'lr_left' || mode === 'tb_top';
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        let sx;
        let sy;
        if (horizontal0) {
          sy = y;
          if (first0) {
            sx = x < half0 ? x : period0 - 1 - x;          // 保留左半，翻到右边
          } else {
            sx = (x < half0 ? half0 - 1 - x : x - half0) + (width - half0);  // 保留右半
          }
        } else {
          sx = x;
          if (first0) {
            sy = y < half0 ? y : period0 - 1 - y;          // 保留上半，翻到下边
          } else {
            sy = (y < half0 ? half0 - 1 - y : y - half0) + (height - half0); // 保留下半
          }
        }
        const di = (y * ow + x) * 4;
        const si = (sy * width + sx) * 4;
        out[di] = src[si];
        out[di + 1] = src[si + 1];
        out[di + 2] = src[si + 2];
        out[di + 3] = src[si + 3];
      }
    }
    return { data: out, width: ow, height: oh };
  }

  const horizontal = mode === 'lr_left' || mode === 'lr_right';
  const frac = horizontal
    ? (mode === 'lr_left' ? s : 1 - s)
    : (mode === 'tb_top' ? s : 1 - s);
  const half = horizontal
    ? clamp(Math.round(width * frac), 1, width - 1)
    : clamp(Math.round(height * frac), 1, height - 1);
  const period = 2 * half;
  const first = mode === 'lr_left' || mode === 'tb_top';
  // 平铺时 unit 的起点（与桌面版一致）
  const origin = first ? 0 : (horizontal ? width - period : height - period);

  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let u;
      if (horizontal) {
        u = ((x - origin) % period + period) % period;
      } else {
        u = ((y - origin) % period + period) % period;
      }
      const local = u < half ? u : period - 1 - u;
      let sx;
      let sy;
      if (horizontal) {
        sy = y;
        if (first) {
          sx = local;                       // 保留左半
        } else {
          sx = width - half + (half - 1 - local);  // 保留右半（翻转方向相反）
        }
      } else {
        sx = x;
        if (first) {
          sy = local;                       // 保留上半
        } else {
          sy = height - half + (half - 1 - local);
        }
      }
      const di = (y * ow + x) * 4;
      const si = (sy * width + sx) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return { data: out, width: ow, height: oh };
}

export const MODES = [
  ['lr_left', '左右对称', '左半镜像到右边'],
  ['lr_right', '左右对称', '右半镜像到左边'],
  ['tb_top', '上下对称', '上半镜像到下边'],
  ['tb_bottom', '上下对称', '下半镜像到上边'],
  ['flip_h', '整图翻转', '整图左右翻转'],
  ['flip_v', '整图翻转', '整图上下翻转'],
];
