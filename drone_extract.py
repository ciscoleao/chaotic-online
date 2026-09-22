import os
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
#!/usr/bin/env python3
"""Extrai os drones do desenho (uploads/image-1.png) para pixel-art RLE do lobby."""
from PIL import Image
import numpy as np
from collections import deque
import json
try:
    from scipy.ndimage import binary_dilation
    _HAS_SCI = True
except ImportError:
    _HAS_SCI = False

SRC = str(ROOT / 'uploads' / 'image-1.png')
TW, TH = 48, 60          # canvas do sprite no jogo
NCOLORS = 12             # entradas da paleta
BG_T = 24                # limiar "preto de fundo"

im = Image.open(SRC).convert('RGB')
A = np.asarray(im).astype(np.int16)
H, W, _ = A.shape
B = A.max(axis=2)

# ---------- 1. fundo via flood-fill a partir das bordas ----------
low = B < BG_T
bg = np.zeros((H, W), bool)
dq = deque()
for x in range(W):
    if low[0, x] and not bg[0, x]: bg[0, x] = True; dq.append((0, x))
    if low[H-1, x] and not bg[H-1, x]: bg[H-1, x] = True; dq.append((H-1, x))
for y in range(H):
    if low[y, 0] and not bg[y, 0]: bg[y, 0] = True; dq.append((y, 0))
    if low[y, W-1] and not bg[y, W-1]: bg[y, W-1] = True; dq.append((y, W-1))
while dq:
    y, x = dq.popleft()
    if y > 0 and low[y-1, x] and not bg[y-1, x]: bg[y-1, x] = True; dq.append((y-1, x))
    if y < H-1 and low[y+1, x] and not bg[y+1, x]: bg[y+1, x] = True; dq.append((y+1, x))
    if x > 0 and low[y, x-1] and not bg[y, x-1]: bg[y, x-1] = True; dq.append((y, x-1))
    if x < W-1 and low[y, x+1] and not bg[y, x+1]: bg[y, x+1] = True; dq.append((y, x+1))
content = ~bg
print(f'content: {content.mean()*100:.1f}% dos pixels')

# ---------- 2. dilata (recupera o contorno preto) ----------
from scipy.ndimage import binary_dilation
try:
    content = binary_dilation(content, iterations=2)
except NameError:
    pass

# ---------- 3. recorta cada pose ----------
# celulas: x [0,443,887,1330,1774], y [0,443,887]
xs = [0, 443, 887, 1330, 1774]
ys = [0, 443, 887]
POSES = {'front': (0, 0), 'side': (1, 0), 'back': (0, 1), 'fullside': (3, 0)}

def median_cut(px, k):
    boxes = [np.arange(len(px))]
    while len(boxes) < k:
        # escolhe a caixa com maior amplitude
        bi, best = -1, -1
        for i, b in enumerate(boxes):
            if len(b) < 2: continue
            r = px[b].max(axis=0) - px[b].min(axis=0)
            score = r.max() * len(b)
            if score > best: best, bi = score, i
        if bi < 0: break
        b = boxes.pop(bi)
        ch = int(np.argmax(px[b].max(axis=0) - px[b].min(axis=0)))
        order = np.argsort(px[b][:, ch])
        mid = len(order) // 2
        boxes.append(b[order[:mid]]); boxes.append(b[order[mid:]])
    pal = np.array([px[b].mean(axis=0).round().astype(int) for b in boxes])
    return pal

def rle_encode(grid, w, h):
    """grid: h x w ints, -1 = transparente, senao indice da paleta."""
    out = []
    for y in range(h):
        x = 0
        while x < w:
            v = grid[y, x]; n = 1
            while x + n < w and grid[y, x+n] == v: n += 1
            out.append(f"{n}{'.' if v < 0 else chr(97 + v)}")
            x += n
    return ''.join(out)

results = {}
previews = []
for name, (cx, cy) in POSES.items():
    x0, x1, y0, y1 = xs[cx], xs[cx+1], ys[cy], ys[cy+1]
    m = content[y0:y1, x0:x1]
    ys_, xs_ = np.where(m)
    if len(xs_) == 0:
        print(name, 'VAZIO'); continue
    px0, px1 = xs_.min(), xs_.max() + 1
    py0, py1 = ys_.min(), ys_.max() + 1
    pad = 4
    cx0, cx1 = max(x0, x0 + px0 - pad), min(x1, x0 + px1 + pad)
    cy0, cy1 = max(y0, y0 + py0 - pad), min(y1, y0 + py1 + pad)
    crop = im.crop((cx0, cy0, cx1, cy1))
    alpha = Image.fromarray((m[py0-pad:py1+pad, px0-pad:px1+pad] * 255).astype(np.uint8)).resize(crop.size)
    rgba = crop.copy(); rgba.putalpha(alpha)
    # redimensiona p/ caber em TW x TH
    s = min(TW / crop.width, TH / crop.height)
    nw, nh = max(1, round(crop.width * s)), max(1, round(crop.height * s))
    small = rgba.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    canvas.alpha_composite(small, ((TW - nw) // 2, (TH - nh) // 2))
    arr = np.asarray(canvas)
    opaque = arr[:, :, 3] > 128
    px = arr[:, :, :3][opaque].astype(int)
    print(f'{name}: crop {crop.size} -> {nw}x{nh}, opacos {opaque.sum()}')
    pal = median_cut(px, NCOLORS)
    # mapeia p/ cor mais proxima
    d2 = ((px[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
    idx = d2.argmin(axis=1)
    grid = np.full((TH, TW), -1)
    grid[opaque] = idx
    # ordena paleta por frequencia (a = mais comum); mantem deterministico
    freq = np.bincount(idx, minlength=len(pal))
    order = np.argsort(-freq, kind='stable')
    remap = np.empty(len(pal), int); remap[order] = np.arange(len(pal))
    grid[opaque] = remap[idx]
    pal = pal[order]
    palhex = [f'#{r:02x}{g:02x}{b:02x}' for r, g, b in pal]
    data = rle_encode(grid, TW, TH)
    # valida decodificacao (replica o JS)
    import re as _re
    gx = np.full((TH, TW, 3), -1)
    xx = yy = 0
    for mm in _re.finditer(r'(\d+)(\.|[a-z])', data):
        n, ch = int(mm.group(1)), mm.group(2)
        if ch != '.':
            rgb = pal[ord(ch) - 97]
            for _ in range(n):
                gx[yy, xx] = rgb
                xx += 1
                if xx >= TW: yy += 1; xx = 0
        else:
            xx += n
            while xx >= TW: yy += 1; xx -= TW
    assert yy == TH, (name, yy, TH)
    results[name] = {'w': TW, 'h': TH, 'palette': palhex, 'data': data}
    # preview 4x sobre fundo escuro
    pv = Image.new('RGB', (TW * 4, TH * 4), (10, 14, 24))
    fg = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    _px = fg.load()
    _pt = [tuple(int(c) for c in rgb) + (255,) for rgb in pal]
    for _y in range(TH):
        for _x in range(TW):
            _v = grid[_y, _x]
            if _v >= 0:
                _px[_x, _y] = _pt[_v]
    _big = fg.resize((TW * 4, TH * 4), Image.NEAREST)
    pv.paste(_big, (0, 0), _big)
    previews.append((name, pv, crop))

# ---------- 4. monta folha de preview ----------
sheet = Image.new('RGB', (TW * 4 * len(previews) + 20, TH * 4 + 30), (24, 28, 40))
for i, (name, pv, crop) in enumerate(previews):
    sheet.paste(pv, (10 + i * TW * 4, 10))
sheet.save(ROOT / 'previews' / 'drone_preview.png')
json.dump(results, open(ROOT / 'tools' / 'drone_rle.json', 'w'))
for k, v in results.items():
    print(k, v['w'], 'x', v['h'], 'cores:', len(v['palette']), 'rle:', len(v['data']), 'chars')
    print('  pal:', ' '.join(v['palette']))
print('OK -> drone_preview.png, drone_rle.json')
