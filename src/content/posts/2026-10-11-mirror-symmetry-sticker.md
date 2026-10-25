---
title: "对称表情包：把图片和 GIF 从中间镜像一下"
titleEn: "Mirror Symmetry: Flipping Images and GIFs Across the Centre"
date: 2026-10-11
author: "Merisk"
tags: [工具, Python, 科技]
summary: "为了给 QQ 群做对称表情包，写了一个能把图片和 GIF 从中间镜像的桌面小工具。顺手记一下镜像算法、GIF 逐帧处理和踩过的坑。"
summaryEn: "A small desktop tool that mirrors an image or GIF across its centre axis, built for QQ sticker packs - with notes on the mirroring maths, frame-by-frame GIF handling and the pitfalls along the way."
---

最近在QQ群聊天时,经常需要对表情包对称来获得一些更有趣味性的表情。

一张歪着脑袋的表情，把左半边镜像到右边，就成了一张"对称脸"；一个只会朝左挥手的小人，翻过去就变成左右开弓；要是碰上动图，把人物的动作沿中线对折，效果往往更离谱。这类表情好笑的地方在于"熟悉的东西突然变得有点不对劲"，而它的原理又简单到只有一句话：把一半的像素，沿一条轴翻过去。

但手工做起来一点都不轻松。用画图或者 PS，每次都得走一遍流程：裁出一半 → 复制 → 水平翻转 → 对齐中线 → 合并图层 → 导出；透明背景要小心别把 alpha 弄丢；如果是 GIF，这一套还要重复几十遍。做了几次之后我决定写个工具，把这件事压缩成"拖进去、选方向、保存"。

<img src="/img/mirror-symmetry/ui-zh-1320.webp" srcset="/img/mirror-symmetry/ui-zh-900.webp 900w, /img/mirror-symmetry/ui-zh-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="对称表情包生成器界面（中文）" loading="lazy" decoding="async" width="1320" height="860">

左边选对称方式和对称轴，右边并排显示原图和结果：透明区域显示棋盘格，紫色虚线是当前的对称轴，动图会在两个预览框里同步播放。窗口大小、上次用的模式、轴位、倍率、底色都会记住，下次打开还是上次的样子。

## 六种对称方式，和一条能拖的轴

| 模式 | 效果 |
| --- | --- |
| 左半镜像到右边 | 取左半翻到右边，最常用的"正面对称" |
| 右半镜像到左边 | 取右半翻到左边 |
| 上半镜像到下边 | 取上半翻到下边 |
| 下半镜像到上边 | 取下半翻到上边 |
| 整图左右翻转 | 整张图水平翻转，不裁切 |
| 整图上下翻转 | 整张图垂直翻转，不裁切 |

默认从正中切开，也就是 50%。但想保留的那部分常常不在中线上，所以对称轴可以在 10%~90% 之间随便拖。

这里有个不太直观的地方：**轴不在正中时，"对称"其实有两种完全不同的做法。**

第一种是**保持画布尺寸不变**。这时只能让图案像万花筒一样平铺——取切线一侧的半张图，翻过去，再翻回来，用 `2 × 半宽` 的周期把整张画布铺满。好处是尺寸不变，接在原图的位置很自然；代价是画面里会出现重复的小块。

第二种是**把画布裁成对称的尺寸**。只保留切线一侧的半张图，镜像之后拼成新画布，这样对称轴一定落在输出图片的正中间。轴越偏，输出就越"瘦"：260×220 的动图，轴放在 35% 时输出是 182×220——保留的左半 91 像素，镜像之后自然就是 182 宽。

<img src="/img/mirror-symmetry/axis-1320.webp" srcset="/img/mirror-symmetry/axis-900.webp 900w, /img/mirror-symmetry/axis-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="对称轴放在 35% 时的轴居中输出" loading="lazy" decoding="async" width="1320" height="860">

我把第二种做成了默认开启的开关（可以关掉），因为做表情包的时候，大部分场景想要的是"一张正经的对称图"，而不是一张万花筒。核心算法就是一段三角形波的索引映射：

```python
def make_symmetric(img, mode="lr_left", split=0.5, center_axis=False):
    """按 split 处的轴镜像；center_axis=True 时输出尺寸改变，轴落在正中。"""
    img = img.convert("RGBA")
    w, h = img.size

    if mode in ("lr_left", "lr_right"):
        frac = split if mode == "lr_left" else 1.0 - split
        cx = min(max(int(w * frac + 0.5), 1), w - 1)   # 保留的那半有多宽

        if center_axis:                                # 输出 2*cx 宽，轴在正中
            if mode == "lr_left":
                half = img.crop((0, 0, cx, h))
            else:
                half = img.crop((w - cx, 0, w, h))
            flip = half.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            out = Image.new("RGBA", (2 * cx, h), (0, 0, 0, 0))
            out.paste(half if mode == "lr_left" else flip, (0, 0))
            out.paste(flip if mode == "lr_left" else half, (cx, 0))
            return out

        # 原尺寸模式：以 2*cx 为周期左右平铺，形成万花筒
        unit = Image.new("RGBA", (2 * cx, h), (0, 0, 0, 0))
        ...
```

翻过去这一步用 `transpose(FLIP_LEFT_RIGHT)` 就够了，麻烦的是"翻过去以后放在哪"。轴在正中时答案很平凡；轴不在正中时，上面的 `cx` 就是保留半边的宽度，输出宽度自然是 `2 * cx`。

## GIF 动图：一帧都不能少

静态图就是一句 `transpose` 的事，动图才是真正花时间的部分：

1. **逐帧读**：`n_frames` 有多少帧就取多少帧，`seek(i)` 之后转 RGBA。GIF 的分帧可能带 disposal 和局部更新，只读第一帧、或者不 `seek` 直接 `convert`，拿到的会是一堆残影。
2. **逐帧对称**：每一帧都过一遍镜像，保证动作关系不变、帧数不变。
3. **原样写回**：每帧的 `duration`（每帧时长可以不一样）和 `loop`（循环次数）一起写回去。

```python
frames, durations, loop = load_frames("in.gif")            # 逐帧 seek + RGBA
results = [make_symmetric(f, "lr_left", 0.5) for f in frames]
save_gif("out.gif", results, durations, loop)              # 时长 / 循环原样保留
```

导出动画 WebP 的时候还有个坑：一开始我用 `quality=92` 的有损模式，肉眼看没问题，但把导出的图读回来逐像素比对，发现透明区域飘着"上一帧的轮廓"——libwebp 的帧间混合在带 alpha 的时候会把前一帧混进来。改成无损之后，回读的每一帧和源图完全一致（镜像像素误差 0），而且像表情包这种色块简单的画面，无损 WebP 反而比 GIF 小得多：实测一个 14 帧的表情，GIF 约 40 KB，无损 WebP 只有 3.5 KB。

## 拿一张真的表情包试一下

前面讲的都是原理，找个群里的表情实际看看。下面这张是 13 帧的小人 GIF（每帧 100 ms、无限循环），左边是原图，右边是「左半镜像到右边」的结果：

<img src="/img/mirror-symmetry/case-before-after.webp" alt="同一张表情包对照：左边原图，右边左半镜像后的结果" loading="lazy" decoding="async" width="680" height="368">

一眼能看出来的变化：

- 眼睛从一只变成两只，嘴巴被翻成了左右对称的形状；
- 左上角那枚「Ya」水印，被镜像到了右上角；
- 底部的文案跟着一起翻了过去，变成一行谁都读不出来的字。

最后一条是表情包对称的通病：**文字也会被镜像**。想让文字保持可读，一般有三种做法——把对称轴移到文字上方、只镜像人物那一半；先裁掉文字带，镜像完再贴回去；或者干脆留着这种"乱码感"，反正它本身也挺好笑。

换几个方向、换几个轴位，同一张图能得到完全不同的结果：

<img src="/img/mirror-symmetry/case-axes.webp" alt="同一张表情包在不同对称方式与轴位下的效果对比" loading="lazy" decoding="async" width="1196" height="882">

从上到下、从左到右依次是：原图 / 左半镜像到右边 / 上半镜像到下边 / 轴 35% 且轴居中输出（378×540）/ 轴 65% 且轴居中输出（702×540）/ 轴 65% 但保持原尺寸（万花筒平铺）。

看得出来，同一个素材只要换个轴位就是另一个表情。素材来自群聊，这里只作演示用。

## 顺手做的其他事

- **输出尺寸**：既能按倍率缩放（50%、200%…），也能直接填宽高（比如 512×512）；动图会整体缩放，不会只缩第一帧。
- **批量处理**：选一个文件夹按当前设置全部处理，动图出动画 GIF、静态图出 PNG，带进度窗口。
- **中英双语 + 界面缩放**：菜单里切 中文 / English，英文界面的字号会自动放大一号（英文字母的视觉高度比中文小，同字号看着更小）；界面整体还能在 100% / 110% / 125% / 150% 之间调。
- **粘贴即用**：截图（Win+Shift+S）之后直接 Ctrl+V 就能进来，做表情包的时候这个最顺手。

<img src="/img/mirror-symmetry/ui-en-1320.webp" srcset="/img/mirror-symmetry/ui-en-900.webp 900w, /img/mirror-symmetry/ui-en-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="English UI" loading="lazy" decoding="async" width="1320" height="860">

## 在线版

不想装软件的话，还有网页版：把图片或 GIF 拖进浏览器就能对称，全程在本地处理，不会上传：

**https://merisk.top/tools/mirror-symmetry/**

网页版和桌面版用的是同一套镜像算法——我用同一组数据把两者逐像素比对过一遍，结果完全一致。

## 下载和源码

- 源码（MIT 协议）：[github.com/Merisk0/mirror-symmetry](https://github.com/Merisk0/mirror-symmetry)
- Windows 单文件版（免安装、免 Python）：[Releases](https://github.com/Merisk0/mirror-symmetry/releases/latest)

自己跑也可以，依赖只有 Pillow：

```bat
python -m pip install -e .
mirror-symmetry
```

## 最后

对称这个操作本身很老——从万花筒、剪纸，到界面设计里的镜像按钮，到处都在用；但把它按在表情包上，就变成了一个很好玩的角度：一半的素材，两倍的荒诞。

工具已经开源，随便用。如果碰上喜欢的表情包，不妨试试把它的左半边翻到右边去。
