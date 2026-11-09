#!/usr/bin/env python3
"""images/ の魚の切り抜き（白・透過）を散らして、ヘッダー用の模様 images/header-pattern.png を作る。
使い方:  python3 tools/make_header_pattern.py
"""
import pathlib
import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "images"
W, H, K = 300, 128, 2          # 模様1枚の大きさ（表示サイズ）と、細かさの倍率
src = {n: cv2.imread(str(IMG / (n + ".png")), cv2.IMREAD_UNCHANGED) for n in ("tiger", "polypterus", "moray")}

# (魚, 横幅, 中心x, 中心y, 角度, 左右反転)  ← 散らし方はここで調整する
PLACE = [
    ("tiger",      46,  34,  30,  -12, False),
    ("moray",      64, 120,  22,   10, True),
    ("polypterus", 40, 196,  40,  -28, False),
    ("tiger",      34, 262,  16,   16, True),
    ("polypterus", 34,  18,  98,   24, True),
    ("moray",      58,  96,  92,  -14, False),
    ("tiger",      40, 176, 104,    8, True),
    ("moray",      50, 252,  86,  -22, False),
    ("polypterus", 30, 142,  64,  -50, False),
    ("tiger",      26,  70,  60,   30, False),
]

def sprite(name, width, ang, flip):
    im = src[name]
    if flip:
        im = im[:, ::-1]
    s = width * K / im.shape[1]
    im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    h, w = im.shape[:2]
    d = int(np.hypot(h, w)) + 4
    c = np.zeros((d, d, 4), np.uint8)
    c[(d - h) // 2:(d - h) // 2 + h, (d - w) // 2:(d - w) // 2 + w] = im
    M = cv2.getRotationMatrix2D((d / 2, d / 2), ang, 1.0)
    return cv2.warpAffine(c, M, (d, d), flags=cv2.INTER_LINEAR)

canvas = np.zeros((H * K, W * K, 4), np.float32)
def paste(sp, cx, cy):
    d = sp.shape[0]
    for ox in (-W * K, 0, W * K):            # 端からはみ出した分は反対側に出す（つなぎ目が見えない）
        for oy in (-H * K, 0, H * K):
            x0, y0 = int(cx * K - d / 2) + ox, int(cy * K - d / 2) + oy
            xs, ys, xe, ye = max(0, x0), max(0, y0), min(W * K, x0 + d), min(H * K, y0 + d)
            if xs >= xe or ys >= ye:
                continue
            part = sp[ys - y0:ye - y0, xs - x0:xe - x0].astype(np.float32)
            a = part[..., 3:4] / 255.0
            dst = canvas[ys:ye, xs:xe]
            dst[..., :3] = part[..., :3] * a + dst[..., :3] * (1 - a)
            dst[..., 3:4] = a + dst[..., 3:4] * (1 - a)

for name, w, x, y, ang, flip in PLACE:
    paste(sprite(name, w, ang, flip), x, y)
out = canvas.copy()
out[..., :3] = 255
out[..., 3] = canvas[..., 3] * 255
cv2.imwrite(str(IMG / "header-pattern.png"), np.clip(out, 0, 255).astype(np.uint8))
print("header-pattern.png", W * K, "x", H * K)
