I have been chatting in QQ groups a lot lately, and half the time it turns into making symmetric stickers — mirror one side of a face and the result is a lot more entertaining.

A face with its head tilted to one side, mirrored left-to-right, becomes a "symmetric face"; a little figure that only waves left, flipped over, suddenly waves with both arms; and if it is an animated GIF, folding the whole motion along the centre line is even more absurd. What makes these funny is that "something familiar has suddenly gone slightly wrong", and the principle behind it is small enough to fit in one sentence: take half the pixels and flip them across an axis.

Doing it by hand is not much fun, though. In Paint or Photoshop every sticker means the same routine: crop half → copy → flip horizontally → align to the centre → merge layers → export; with transparency you have to be careful not to lose the alpha channel; and for a GIF the whole thing repeats dozens of times. After a few rounds of that I decided to write a tool and squeeze the job down to "drop it in, pick a direction, save".

<img src="/img/mirror-symmetry/ui-zh-1320.webp" srcset="/img/mirror-symmetry/ui-zh-900.webp 900w, /img/mirror-symmetry/ui-zh-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="Mirror Symmetry Studio UI (Chinese)" loading="lazy" decoding="async" width="1320" height="860">

Symmetry mode and axis on the left; original and result side by side on the right: transparency shows a checkerboard, the purple dashed line is the current axis, and animated GIFs play in both previews at once. Window size, last mode, axis position, scale and background colour are all remembered, so it opens exactly as you left it.

## Six ways to mirror, and one draggable axis

| Mode | What it does |
| --- | --- |
| Left half to the right | Take the left half, flip it to the right — the usual "mirror face" |
| Right half to the left | Take the right half, flip it to the left |
| Top half to the bottom | Take the top half, flip it down |
| Bottom half to the top | Take the bottom half, flip it up |
| Flip whole image horizontally | Mirror the entire image, no cropping |
| Flip whole image vertically | Flip the entire image, no cropping |

By default the cut is exactly in the middle, at 50%. But the half you want to keep is often not on the centre line, so the axis can be dragged anywhere between 10% and 90%.

Here is the part that is not obvious: **when the axis is off-centre, "symmetry" can mean two completely different things.**

The first is **keeping the canvas size**. Then the only option is to tile the pattern like a kaleidoscope — take the half on one side of the cut, flip it, flip it again, and fill the whole canvas with a period of `2 × half-width`. The advantage is that the size does not change and the result drops naturally into the original's place; the cost is that repeated blocks appear in the picture.

The second is **cropping the canvas to a symmetric size**. Keep only the half on one side of the cut, mirror it and join the two into a new canvas, so the axis always lands exactly in the middle of the output. The more off-centre the axis, the "thinner" the output: for a 260×220 GIF with the axis at 35%, the output is 182×220 — the retained left half is 91 pixels, and mirrored it is naturally 182 wide.

<img src="/img/mirror-symmetry/axis-1320.webp" srcset="/img/mirror-symmetry/axis-900.webp 900w, /img/mirror-symmetry/axis-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="Axis-centred output with the axis at 35%" loading="lazy" decoding="async" width="1320" height="860">

I made the second one the default (it can be switched off), because most of the time, when you are making a sticker, you want "a proper symmetric picture", not a kaleidoscope. The core of the algorithm is a single triangular-wave index mapping:

```python
def make_symmetric(img, mode="lr_left", split=0.5, center_axis=False):
    """Mirror around the axis at split; when center_axis=True the output is resized and the axis sits in the middle."""
    img = img.convert("RGBA")
    w, h = img.size

    if mode in ("lr_left", "lr_right"):
        frac = split if mode == "lr_left" else 1.0 - split
        cx = min(max(int(w * frac + 0.5), 1), w - 1)   # width of the half we keep

        if center_axis:                                # output is 2*cx wide, axis in the middle
            if mode == "lr_left":
                half = img.crop((0, 0, cx, h))
            else:
                half = img.crop((w - cx, 0, w, h))
            flip = half.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            out = Image.new("RGBA", (2 * cx, h), (0, 0, 0, 0))
            out.paste(half if mode == "lr_left" else flip, (0, 0))
            out.paste(flip if mode == "lr_left" else half, (cx, 0))
            return out

        # Original-size mode: tile left and right with period 2*cx, giving a kaleidoscope
        unit = Image.new("RGBA", (2 * cx, h), (0, 0, 0, 0))
        ...
```

Flipping is just `transpose(FLIP_LEFT_RIGHT)`; the awkward part is *where to put it afterwards*. With the axis in the middle the answer is trivial; with an off-centre axis, `cx` above is the width of the kept half, so the output width is naturally `2 * cx`.

## Animated GIFs: not a single frame may be lost

For a still image it is one `transpose` call; animation is where the real work is:

1. **Read frame by frame**: take as many frames as `n_frames` says, `seek(i)` and convert to RGBA. GIF frames may carry disposal methods and partial updates, so if you only read the first frame, or `convert` without seeking, you get a pile of ghosting.
2. **Mirror frame by frame**: run every frame through the mirror, so the motion relationship and the frame count stay intact.
3. **Write it back as it was**: each frame's `duration` (per-frame durations may differ) and the loop count go back in unchanged.

```python
frames, durations, loop = load_frames("in.gif")            # seek each frame + RGBA
results = [make_symmetric(f, "lr_left", 0.5) for f in frames]
save_gif("out.gif", results, durations, loop)              # durations / loop preserved
```

Exporting animated WebP has one more trap: at first I used lossy mode with `quality=92`. It looked fine to the eye, but reading the exported file back and comparing pixel by pixel showed "outlines of the previous frame" floating in transparent areas — libwebp's inter-frame blending mixes the previous frame in when alpha is involved. Switching to lossless made every frame read back identical to the source (zero mirrored-pixel error), and for flat, sticker-like images lossless WebP is actually much smaller than GIF: measured on one 14-frame sticker, the GIF was about 40 KB and the lossless WebP only 3.5 KB.

## Trying it on a real sticker

So far this has all been theory; let us look at an actual sticker from a group chat. Below is a 13-frame figure GIF (100 ms per frame, looping forever): the original on the left, the "left half to the right" result on the right.

<img src="/img/mirror-symmetry/case-before-after.webp" alt="The same sticker: original on the left, left-half mirror on the right" loading="lazy" decoding="async" width="680" height="368">

What you notice straight away:

- the eyes go from one to two, and the mouth is flipped into a left-right symmetric shape;
- the "Ya" watermark in the top-left corner is mirrored into the top-right;
- the caption along the bottom is flipped too, turning into a line nobody can read.

That last point is the usual problem with symmetric stickers: **text gets mirrored as well**. To keep text readable there are three approaches — move the axis above the text and mirror only the character; crop the text band first and paste it back after mirroring; or simply keep the gibberish, since it is funny in its own right.

Change the direction, change the axis position, and the same image gives completely different results:

<img src="/img/mirror-symmetry/case-axes.webp" alt="The same sticker under different symmetry modes and axis positions" loading="lazy" decoding="async" width="1196" height="882">

From top to bottom, left to right: original / left half to the right / top half to the bottom / axis at 35% with axis-centred output (378×540) / axis at 65% with axis-centred output (702×540) / axis at 65% keeping the original size (kaleidoscope tiling).

As you can see, the same material becomes a different sticker as soon as the axis moves. The material comes from a group chat and is only used here as a demonstration.

## Other things I added along the way

- **Output size**: scale by a multiplier (50%, 200%, …) or type the width and height directly (512×512, say); animations are scaled as a whole, not just their first frame.
- **Batch processing**: pick a folder and process everything with the current settings — animations come out as animated GIFs, stills as PNGs, with a progress window.
- **Bilingual UI and interface scaling**: switch between 中文 / English in the menu; the English UI uses one step larger type, because Latin letters look visually smaller at the same size. The whole interface can also scale to 100% / 110% / 125% / 150%.
- **Paste and go**: after a screenshot (Win+Shift+S) just hit Ctrl+V — the handiest thing of all when you are making stickers.

<img src="/img/mirror-symmetry/ui-en-1320.webp" srcset="/img/mirror-symmetry/ui-en-900.webp 900w, /img/mirror-symmetry/ui-en-1320.webp 1320w" sizes="(max-width: 720px) calc(100vw - 64px), 900px" alt="English UI" loading="lazy" decoding="async" width="1320" height="860">

## Web version

If you would rather not install anything, there is a web version: drop an image or GIF into the browser and it is mirrored entirely on your machine, with nothing uploaded:

**https://merisk.top/tools/mirror-symmetry/**

The web and desktop versions share the same mirroring algorithm — I compared the two pixel by pixel on the same data set and the results were identical.

## Download and source

- Source (MIT): [github.com/Merisk0/mirror-symmetry](https://github.com/Merisk0/mirror-symmetry)
- Windows single-file build (no install, no Python): [Releases](https://github.com/Merisk0/mirror-symmetry/releases/latest)

You can also run it yourself; the only dependency is Pillow:

```bat
python -m pip install -e .
mirror-symmetry
```

## Finally

Symmetry itself is an old trick — kaleidoscopes, paper cutting, the mirror button in every design tool — but pressing it onto stickers turns it into a genuinely funny angle: half the material, twice the absurdity.

The tool is open source, use it however you like. And if you come across a sticker you enjoy, try flipping its left half over to the right.
