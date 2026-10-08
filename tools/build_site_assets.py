#!/usr/bin/env python3
"""Exporta as artes atuais do jogo para o site. Requer somente Pillow."""
import base64
import hashlib
import io
import json
import re
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / "game/index.html"
ASSETS = ROOT / "site/assets"
HTML = ROOT / "site/index.html"


def image(data):
    return Image.open(io.BytesIO(base64.b64decode(data.split(",", 1)[1]))).convert("RGBA")


def constant(source, name, json_value=False):
    pattern = (r"const\s+" + name + r"\s*=\s*(\[.*?\]|\{.*?\});" if json_value else
               r"const\s+" + name + r"\s*=\s*(['\"])(data:image/[^'\"]+)\1;")
    matches = list(re.finditer(pattern, source, re.S))
    if not matches:
        raise ValueError(f"Arte não encontrada no jogo: {name}")
    match = matches[-1]
    return json.loads(match.group(1)) if json_value else match.group(2)


def assemble(regions):
    width = max(r["bounds"][2] for r in regions)
    height = max(r["bounds"][3] for r in regions)
    overlap_x = (min(r["bounds"][0] for r in regions if r["bounds"][0]),
                 max(r["bounds"][2] for r in regions if r["bounds"][2] < width))
    overlap_y = (min(r["bounds"][1] for r in regions if r["bounds"][1]),
                 max(r["bounds"][3] for r in regions if r["bounds"][3] < height))
    result = Image.new("RGB", (width, height))
    for region in regions:
        left, top, right, bottom = region["bounds"]
        w, h = right - left, bottom - top
        tile = image(region["data"]).convert("RGB").resize((w, h), Image.Resampling.LANCZOS)
        def weight(value, limits, before, after):
            ramp = min(1, max(0, (value - limits[0]) / (limits[1] - limits[0])))
            return ramp if before else (1 - ramp if after else 1)
        xs = [weight(left + x + .5, overlap_x, left > 0, right < width) for x in range(w)]
        ys = [weight(top + y + .5, overlap_y, top > 0, bottom < height) for y in range(h)]
        mask = Image.new("L", (w, h))
        mask.putdata([round(255 * x * y) for y in ys for x in xs])
        tile = ImageChops.multiply(tile, mask.convert("RGB"))
        layer = Image.new("RGB", result.size)
        layer.paste(tile, (left, top))
        result = ImageChops.add(result, layer)
    return result.convert("RGBA")


def bridge(lobby, data):
    patch = image(data).resize((600, 450), Image.Resampling.LANCZOS)
    mask = Image.new("L", patch.size)
    def ramp(value, low, high):
        return min(1, max(0, (value - low) / (high - low)))
    mask.putdata([round(255 * ramp(x + .5, 194, 208) * (1 - ramp(x + .5, 392, 406)) *
                        ramp(y + .5, 240, 254) * (1 - ramp(y + .5, 406, 420)))
                  for y in range(450) for x in range(600)])
    patch.putalpha(ImageChops.multiply(patch.getchannel("A"), mask))
    scale = lobby.width / 2772
    patch = patch.resize((round(600 * scale), round(450 * scale)), Image.Resampling.LANCZOS)
    lobby.alpha_composite(patch, (round(1086 * scale), round(790 * scale)))
    return lobby


def export(name, art, sprite=False):
    if not sprite:
        art.thumbnail((1280, 960), Image.Resampling.LANCZOS)
    art.save(ASSETS / (name + ".webp"), "WEBP", lossless=sprite, quality=86, method=6)


def main():
    source = GAME.read_text()
    ASSETS.mkdir(parents=True, exist_ok=True)
    from build_character_assets import main as build_characters
    build_characters()
    lobby = assemble(constant(source, r"LOBBY_ART_REGIONS_V\d+", True))
    lobby = bridge(lobby, constant(source, r"LOBBY_BRIDGE_PATCH_V\d+", True)["data"])
    export("patio", lobby)
    export("dromos", assemble(constant(source, r"ISLAND_ART_REGIONS_V\d+", True)))
    export("floresta", assemble(constant(source, r"GARDEN_ART_REGIONS_V\d+", True)))
    export("submundo", image(constant(source, r"UW_EMBER_ART_DATA_V\d+")))
    cave = re.search(r"class CaveScene.*?const data=['\"](data:image/[^'\"]+)['\"]", source, re.S)
    if not cave:
        raise ValueError("Arte da Caverna não encontrada")
    export("caverna", image(cave.group(1)))
    export("quarto", image(constant(source, r"ROOM\d+_ART_DATA")))
    creatures = json.loads((ROOT / "creatures/data/creatures.json").read_text())
    masters_block = re.search(r"const DROMO_MASTERS = \[(.*?)\n\];", source, re.S).group(1)
    masters = re.findall(r"id: '([^']+)', nome: '([^']+)'", masters_block)
    content = {"assetVersion": hashlib.sha256(source.encode()).hexdigest()[:12],
               "creatures": len(creatures),
               "tribes": {tribe: sum(c["tribe"] == tribe for c in creatures)
                          for tribe in dict.fromkeys(c["tribe"] for c in creatures)},
               "masters": [{"id": id_, "name": name} for id_, name in masters],
               "caveSeconds": int(re.search(r"this.collapseLeft = (\d+)", source).group(1)) // 1000}
    # O site carrega os mesmos nomes e números do banco atual, sem copiar estatísticas antigas.
    (ASSETS / "manifest.json").write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n")
    html = HTML.read_text()
    start = html.index('<!-- ============ NAV ============ -->')
    end = html.index('<!-- ============ AUTH ============ -->')
    html = html[:start] + (ROOT / 'site/landing.fragment.html').read_text() + '\n\n' + html[end:]
    tag = '<script type="application/json" id="site-content">' + json.dumps(content, ensure_ascii=False) + '</script>'
    html, count = re.subn(r'<script type="application/json" id="site-content">.*?</script>', tag, html, flags=re.S)
    if count != 1:
        raise ValueError("Marcador site-content ausente ou duplicado; o HTML não foi alterado")
    HTML.write_text(html)
    print(f"Site atualizado: {len(creatures)} criaturas, {len(masters)} Mestres, caverna de {content['caveSeconds']}s.")
    print("Artes exportadas: " + ", ".join(p.name for p in sorted(ASSETS.glob("*.webp"))))


if __name__ == "__main__":
    main()
