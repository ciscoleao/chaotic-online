#!/usr/bin/env python3
"""Build lossless 64px movement atlases; never resize individual poses.

Usage: python tools/build_movement_assets.py [--check]
Requires Pillow. Sources are the supplied GIFs in tools/assets/movement.
Columns: S SE E NE N NW W SW. Rows: neutral pose, six walk poses.
"""
import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIRECTIONS = ('south', 'south-east', 'east', 'north-east', 'north',
              'north-west', 'west', 'south-west')
CELL = 64


def alpha_sum(frame):
    return sum(value * count for value, count in enumerate(frame.getchannel('A').histogram()))


def decode(path):
    source = Image.open(path)
    frames = []
    durations = []
    for index in range(source.n_frames):
        source.seek(index)
        frame = source.convert('RGBA')
        # Also support the green screen used by older source exports.
        frame.putdata([(r, g, b, 0 if g > 240 and r < 20 and b < 20 else a)
                       for r, g, b, a in frame.getdata()])
        if frame.size != (CELL, CELL):
            # 84px south GIF has a ten-pixel empty border, not a larger person.
            dx, dy = (frame.width - CELL) // 2, (frame.height - CELL) // 2
            crop = frame.crop((dx, dy, dx + CELL, dy + CELL))
            assert alpha_sum(frame) == alpha_sum(crop), path
            frame = crop
        frames.append(frame)
        durations.append(source.info.get('duration', 200))
    assert len(frames) == 6, f'{path}: expected six walking frames'
    assert durations == [200] * 6, f'{path}: unexpected timing'
    return frames


def align(frame):
    """Lock the head anchor using integer translations, preserving the gait.

    Bottom-edge alignment per frame would cancel natural leg movement. The
    head (upper 16px) is the stable reference, so feet remain free to animate.
    """
    bbox = frame.getbbox()
    assert bbox, 'Empty frame'
    head = frame.crop((0, bbox[1], CELL, bbox[1] + 16)).getbbox()
    dx = CELL // 2 - (head[0] + head[2]) // 2
    dy = 3 - bbox[1]
    result = Image.new('RGBA', (CELL, CELL))
    result.paste(frame, (dx, dy))
    assert alpha_sum(result) == alpha_sum(frame), 'Clipped sprite'
    return result


def build(kind):
    prefix = 'Idle_walking_' if kind == 'm' else 'Idle_walk_'
    atlas = Image.new('RGBA', (CELL * 8, CELL * 7))
    for column, direction in enumerate(DIRECTIONS):
        frames = [align(f) for f in decode(ROOT / f'tools/assets/movement/{prefix}{direction}.gif')]
        assert len({f.tobytes() for f in frames}) == 6, f'{kind}/{direction}: repeated walk pose'
        # First walking pose is neutral. Use the same art for idle and walk
        # instead of jumping to the differently proportioned rotation export.
        for row, frame in enumerate([frames[0], *frames]):
            atlas.paste(frame, (column * CELL, row * CELL))
    return atlas


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for kind in ('m', 'f'):
        atlas = build(kind)
        path = ROOT / f'site/assets/hero-{kind}-atlas.png'
        if args.check:
            current = Image.open(path).convert('RGBA')
            assert current.size == atlas.size and current.tobytes() == atlas.tobytes(), path
        else:
            atlas.save(path)
        print(f'{kind}: 8 directions, 48 distinct walking frames, native 64px, transparent, no clipping')


if __name__ == '__main__':
    main()
