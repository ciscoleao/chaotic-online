import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
from PIL import Image, ImageDraw, ImageFont
import json

S = {}
def spr(key, w, h, pal, rows):
    assert len(rows) == h, f'{key}: {len(rows)} rows != {h}'
    for i, r in enumerate(rows):
        assert len(r) == w, f'{key} r{i}: len {len(r)} != {w}'
    S[key] = dict(w=w, h=h, pal=pal, rows=rows)

def c(s, w=28):
    pad = w - len(s); l = pad // 2
    return '.'*l + s + '.'*(pad-l)

spr('lobby_bot', 48, 56,
    ['#20232e', '#cfd6e4', '#8b93a7', '#3fe3ea', '#ffb02e', '#0e1420', '#eaf6ff'],
    [    "......................dggd......................",
    "......................dddd......................",
    "......................aaaa......................",
    "......................aaaa......................",
    "..................aaaabbbbaaaa..................",
    "..................aaaabbbbaaaa..................",
    "..............aaaabbbbbbbbbbaaaa................",
    "..............aaaabbbbbbbbbbaaaa................",
    "............aaaabbbbbbbbbbbbbbaaaa..............",
    "............aaaabbbbbbbbbbbbbbaaaa..............",
    "............aabbbbbbbbbbbbbbbbbbaa..............",
    "............aabbbbbbbbbbbbbbbbbbaa..............",
    "............aabbggeeeeeeeeeeeeegbbaa............",
    "............aabbggeeeeeeeeeeeeeebbaa............",
    "..........aabbeeeeeeffffeeeeeeeebbaa............",
    "..........aabbeeeeeeffffeeeeeeeebbaa............",
    "............aabbeeeeeeeeeeeeeeeebbaa............",
    "............aabbeeeeeeeeeeeeeeeebbaa............",
    "............aaaabbbbbbbbbbbbbbaaaa..............",
    "............aaaabbbbbbbbbbbbbbaaaa..............",
    "..............aaaabbbbbbbbbbaaaa................",
    "..............aaaabbbbbbbbbbaaaa................",
    "..................aaaaaaaaaa....................",
    "..................aaaaaaaaaa....................",
    "..........aaaa..aaaaaaaaaaaaaa..aaaa............",
    "..........aaaa..aaaaaaaaaaaaaa..aaaa............",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "........aabbbbaabbbbddddddddbbbbaabbbbaa........",
    "........aabbbbaabbbbddddddddbbbbaabbbbaa........",
    "........aabbbbaabbbbddcggcddbbbbaabbbbaa........",
    "........aabbbbaabbbbddcggcddbbbbaabbbbaa........",
    "........aabbbbaabbbbddddddddbbbbaabbbbaa........",
    "........aabbbbaabbbbddddddddbbbbaabbbbaa........",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "........aaaabbbbaaaabbbbbbbbaaaabbbbaaaa........",
    "..........aaaa..aaaaaaaaaa..aaaa................",
    "..........aaaa..aaaaaaaaaa..aaaa................",
    "..............aaaaddddggddddaaaa................",
    "..............aaaaddddggddddaaaa................",
    "..........aaaaddddddddddddddddddaaaa............",
    "..........aaaaddddddddddddddddddaaaa............",
    "........aaaaddddddddddddddddddddddddaaaa........",
    "........aaaaddddddddddddddddddddddddaaaa........",
    "..........dddd....dddddddddd....dddd............",
    "..........dddd....dddddddddd....dddd............",
    "..................dddddddddd....................",
    "..................dddddddddd....................",
    "............dd....dddddddddd....dd..............",
    "............dd....dddddddddd....dd..............",
    "....................dddddd......................",
    "....................dddddd......................",
    "................................................",
    "................................................"
    ])

spr('lobby_drone', 56, 32,
    ['#20232e', '#9fb4d8', '#5b6b8c', '#3fe3ea', '#ff5a5a', '#ffdfe0'],
    [    "..........................dddd..........................",
    "..........................dddd..........................",
    "..........................aaaa..........................",
    "..........................aaaa..........................",
    "......................aaaabbbbaaaa......................",
    "......................aaaabbbbaaaa......................",
    "..................aaaabbbbbbbbbbaaaa....................",
    "..................aaaabbbbbbbbbbaaaa....................",
    "..................aabbbbbbccccbbbbbbaa..................",
    "..................aabbbbbbccccbbbbbbaa..................",
    "............aaaabbbbbbbbbbbbbbbbbbbbbbaaaa..............",
    "............aaaabbbbbbbbbbbbbbbbbbbbbbaaaa..............",
    "......aaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaaaaaa......",
    "......aaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaaaaaa......",
    "..aabbbbeefebbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbeefebbbbaa..",
    "..aabbbbeefebbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbeefebbbbaa..",
    "aaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaaaa",
    "aaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaaaa",
    "..aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa..",
    "..aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa..",
    "......aaaaddddddddddddddddddddddddddddddddddddaaaa......",
    "......aaaaddddddddddddddddddddddddddddddddddddaaaa......",
    "............aaaaddddddddddddddddddddddddaaaa............",
    "............aaaaddddddddddddddddddddddddaaaa............",
    "................aaaaddddddddddddddddaaaa................",
    "................aaaaddddddddddddddddaaaa................",
    "....................aaaaddddddddaaaa....................",
    "....................aaaaddddddddaaaa....................",
    "........................aaddddaa........................",
    "........................aaddddaa........................",
    "..........................dddd..........................",
    "..........................dddd.........................."
    ])

WOOD='#8a5a33'; WOODD='#5d3a1f'; RED='#c22636'; REDD='#7d1420'; WHT='#f2f3f7'
GOLD='#f0c040'; DARK='#20232e'; MET='#454e63'; METD='#2b2e3a'; FIRE='#ff7a1a'; FIREC='#ffe297'
CYAN='#3fe3ea'; GRN='#3fae5a'; GRNL='#7ce68a'; TERRA='#a34a2a'; SCR='#182a44'; PUR='#7a4fd0'
spr('room_cama', 44, 30, [DARK, WOOD, WOODD, RED, REDD, WHT],
    ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
     "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
     "abccccccccccccccccccccccccccccccccccccccccba",
     "abcfbbbbbbbbfddddddddddddddddddddddddddddcba",
     "abcfbbbbbbbbfddddddddddddddddddddddddddddcba",
     "abcfbbbbbbbbfddddddddddddddddddddddddddddcba",
     "abcfbbbbbbbbfddddddddddddddddddddddddddddcba",
     "abcfbbbbbbbbfddddddddddddddddddddddddddddcba",
     "abccccccccccceeeeeeeeeeeeeeeeeeeeeeeeeeeecba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeecba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeecba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abcddddddddddddddddddddddddddddddddddddddcba",
     "abccccccccccccccccccccccccccccccccccccccccba",
     "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
     "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
     "..aa....................................aa..",
     "..aa....................................aa..",
     "..aa....................................aa..",
     "..aa....................................aa..",
     "..aa....................................aa.."])
spr('room_bau', 26, 20, [DARK, WOOD, WOODD, GOLD],
    ["aaaaaaaaaaaaaaaaaaaaaaaaaa",
     "abbbbbbbbbbbbbbbbbbbbbbbba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "aaaabbbbdaaaaddaaabbbbaaaa",
     "abbbbbbbdbbddddbbdbbbbbbba",
     "abcbbbbbdbbddddbbdbbbbbcba",
     "abcbbbbbdbbddddbbdbbbbbcba",
     "abcbbbbbdbbddddbbdbbbbbcba",
     "abcbbbbbdbbdaadbbdbbbbbcba",
     "abcbbbbbdbbdaadbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abcbbbbbdbbbbbbbbdbbbbbcba",
     "abbbbbbbbbbbbbbbbbbbbbbbba",
     "aaaaaaaaaaaaaaaaaaaaaaaaaa",
     ".........................."])
spr('room_fornalha', 30, 28, [DARK, MET, METD, FIRE, FIREC],
    [
    ".......aaaaaaaaaaaaaaaa.......",
    ".......abbbbbbbbbbbbbba.......",
    ".....aabbbbbbbbbbbbbbbbaa.....",
    "....abbbbbbbbbbbbbbbbbbbba....",
    "...abccccccccccccccccccccba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abcbbbddddddddddddbbbcba...",
    "...abcbbddddddddddddddbbcba...",
    "...abcbbbbdddeeeedddbbbbcba...",
    "...abcbbbbdddeeeedddbbbbcba...",
    "...abcbbbbdddeeeedddbbbbcba...",
    "...abcbbbbdddeeeedddbbbbcba...",
    "...abcbbbbdddeeeedddbbbbcba...",
    "...abcbbddddddddddddddbbcba...",
    "...abcbbbddddddddddddbbbcba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abcbbcbbcbbcbbcbbcbbccba...",
    "...abcbbcbbcbbcbbcbbcbbccba...",
    "...abcbbbbbbbbbbbbbbbbbbcba...",
    "...abccccccccccccccccccccba...",
    "....aabbbbbbbbbbbbbbbbbbaa....",
    "......aabbbbbbbbbbbbbbaa......",
    "......aa..............aa......",
    "......aa..............aa......",
    "......aa..............aa......"])
spr('room_bancada', 40, 26, [DARK, WOOD, WOODD, '#9fb4d8', CYAN, WHT],
    [
    "........................................",
    "..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..",
    "..abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba..",
    "..abcddddccbbbbbffffffffbbbbcceddcbcba..",
    "..abcddddccbbbbbffffffffbbbbcceddcbcba..",
    "..abcddddccbbbbbffffffffbbbbcceddcbcba..",
    "..abcddddccbbbbbffffffffbbbbcccddcbcba..",
    "..abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba..",
    "..aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa..",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbbbbbbbbbbbbbbbbbbbbbbbbbbabbb....",
    "....abbbbbbbbbbbbbbbbbbbbbbbbbbbabbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....abbb........................abbb....",
    "....aaaa........................aaaa....",
    "........................................",
    "........................................"])
spr('room_lampada', 16, 34, [DARK, MET, '#ffe9a2', '#c98f66', CYAN],
    [
    ".......cc.......",
    "......cccc......",
    ".....ccccdd.....",
    ".....cccccc.....",
    "....dddddddd....",
    "....dccccccd....",
    "....dccccccd....",
    "....dccccccd....",
    "....dccccccd....",
    "....dddddddd....",
    ".....dddddd.....",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".......bb.......",
    ".....bbbbbb.....",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "..aaaaaaaaaaaa..",
    "................"])
spr('room_estante', 36, 26, [DARK, WOOD, WOODD, RED, CYAN, GOLD, PUR, GRN],
    [
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abcdddeffggghheeecdddeffggghheeecbba",
    "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
    "abccccccccccccccccccccccccccccccccba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abchhheecdddeffggghheeecdddeffffcbba",
    "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
    "abccccccccccccccccccccccccccccccccba",
    "abcfffcdddhhheeegggcfffcdddhhheecbba",
    "abcfffcdddhhheeegggcfffcdddhhheecbba",
    "abcfffcdddhhheeegggcfffcdddhhheecbba",
    "abcfffcdddhhheeegggcfffcdddhhheecbba",
    "abcfffcdddhhheeegggcfffcdddhhheecbba",
    "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "...................................."])
spr('room_planta', 18, 24, [DARK, TERRA, '#7a3a1f', GRN, GRNL],
    [
    "........dd........",
    "......dddddd......",
    ".....dddddddd.....",
    "....dddeddeedd....",
    "....ddedddeddd....",
    "...dddddddddddd...",
    "...ddeddddddedd...",
    "..dddddddddddddd..",
    "..ddeddddddddedd..",
    "..ddddddeddddddd..",
    "...dddddddddddd...",
    "....dddddddddd....",
    ".....dddddddd.....",
    ".......dddd.......",
    "....aaaaaaaaaa....",
    "...abbbbbbbbbba...",
    "...abbbbbbbbbba...",
    "...abcbbbbbbcba...",
    "...abcbbbbbbcba...",
    "...abcbbbbbbcba...",
    "...abcbbbbbbcba...",
    "...abccccccccba...",
    "....aaaaaaaaaa....",
    ".................."])
spr('room_console', 26, 30, [DARK, MET, METD, SCR, CYAN, FIRE, GOLD],
    [
    "aaaaaaaaaaaaaaaaaaaaaaaaaa",
    "abbbbbbbbbbbbbbbbbbbbbbbba",
    "abcddddddddddddddddddddcba",
    "abcdeeeeeeeeeeeeeeeeeedcba",
    "abcdeccccccccccccccceedcba",
    "abcdecdddddddddddddceedcba",
    "abcdecddccccccccddcceedcba",
    "abcdecddcfffffccddcceedcba",
    "abcdecddcfffffccddcceedcba",
    "abcdecddccccccccddcceedcba",
    "abcdecdddddddddddddceedcba",
    "abcdeccccccccccccccceedcba",
    "abcdeeeeeeeeeeeeeeeeeedcba",
    "abcddddddddddddddddddddcba",
    "abbbbbbbbbbbbbbbbbbbbbbbba",
    "abcggcfaacggcfaacggcfabcba",
    "abcggcfaacggcfaacggcfabcba",
    "abbbbbbbbbbbbbbbbbbbbbbbba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abccccccccccccccccccccccba",
    "abbbbbbbbbbbbbbbbbbbbbbbba",
    "..aaaaaaaaaaaaaaaaaaaaaa..",
    "..abbbbbbbbbbbbbbbbbbbba..",
    "..aaaaaaaaaaaaaaaaaaaaaa..",
    ".........................."])

def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def to_rle(rows):
    out = []
    for r in rows:
        i = 0
        while i < len(r):
            j = i
            while j < len(r) and r[j] == r[i]: j += 1
            out.append(f'{j-i}{r[i]}')
            i = j
    return ''.join(out)

tiles = []
for key, d in S.items():
    w, h = d['w'], d['h']
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = img.load()
    for y, r in enumerate(d['rows']):
        for x, ch in enumerate(r):
            if ch == '.': continue
            idx = ord(ch) - 97
            assert 0 <= idx < len(d['pal']), f'{key}: letra {ch} sem cor'
            px[x, y] = hx(d['pal'][idx]) + (255,)
    sc = 4 if max(w, h) < 30 else 3
    tiles.append((key, img.resize((w*sc, h*sc), Image.NEAREST)))

try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
except: font = ImageFont.load_default()
W = max(t.width for _, t in tiles) + 20
H = sum(t.height + 22 for _, t in tiles) + 10
sheet = Image.new('RGB', (W, H), (20, 24, 34))
dr = ImageDraw.Draw(sheet)
y = 10
for key, t in tiles:
    dr.text((10, y), key, fill=(120, 220, 255), font=font)
    sheet.paste(t, (10, y + 20))
    y += t.height + 22
sheet.save(os.path.join(ROOT, 'previews', 'sprites_preview.png'))
print('sheet:', sheet.size)

js = ['// Pixel-art RLE do Patio (robos, drones, moveis) — formato igual ao HERO_SPRITE: <n><letra>/<n>.',
      'const LOBBY_SPRITES = {};']
for key, d in S.items():
    rle = to_rle(d['rows'])
    js.append(f"LOBBY_SPRITES['{key}'] = {{ w: {d['w']}, h: {d['h']}, palette: {json.dumps(d['pal'])}, data: '{rle}' }};")
open(os.path.join(HERE, 'lobby_sprites.js'), 'w', encoding='utf-8').write('\n'.join(js) + '\n')
print('lobby_sprites.js bytes:', sum(len(l) for l in js))
