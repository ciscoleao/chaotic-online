#!/usr/bin/env python3
"""Importa GIFs de 8 direções sem redesenhar os personagens.

O verde sólido é a chave de transparência do sprite. Os GIFs públicos
continuam com 64x64; o atlas segue o contrato 48x48 do motor existente.
Os arquivos enviados contêm poses de rotação, não quadros de caminhada.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'site/assets'

def main():
    for kind in ('m', 'f'):
        source = Image.open(ROOT / f'tools/assets/hero-{kind}-original.gif')
        frames, durations = [], []
        for i in range(source.n_frames):
            source.seek(i)
            im = source.convert('RGBA')
            im.putdata([(r, g, b, 0 if g > 240 and r < 20 and b < 20 else a)
                        for r, g, b, a in im.getdata()])
            frames.append(im)
            durations.append(source.info.get('duration', 180))
        if len(frames) != 8:
            raise ValueError('São necessárias oito direções no GIF')
        frames[0].save(ASSETS / f'hero-{kind}.gif', save_all=True,
                       append_images=frames[1:], duration=durations, loop=0,
                       disposal=2, transparency=0, optimize=False)
        frames[0].save(ASSETS / f'hero-{kind}.webp', lossless=True)
        atlas = Image.new('RGBA', (384, 336))
        # S, SE, E, NE, N, NW, W, SW, na mesma ordem do motor.
        for column, frame in enumerate(frames):
            pose = frame.resize((48, 48), Image.Resampling.NEAREST)
            for row in range(7):
                atlas.paste(pose, (column * 48, row * 48))
        atlas.save(ASSETS / f'hero-{kind}-atlas.png')

if __name__ == '__main__':
    main()
