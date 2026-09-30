#!/usr/bin/env python3
"""Embed the readable Dromo battle document in every standalone lobby build.

Run from the repository root after editing docs/dromo/Dromo_Battle_Rework.html:
    python3 docs/patches/build_dromo_battle.py

The v238 export is also kept at the repository root so the exact current
attached build is reviewable from GitHub.  The uploaded file is updated while
it is available, so the reviewed build cannot silently drift from the readable
battle source.
"""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[2]
BATTLE = ROOT / "docs" / "dromo" / "Dromo_Battle_Rework.html"
TARGETS = [ROOT / "Chaotic_Online_Lobby_FIX.html", ROOT / "index.html"]
REPO_V238 = ROOT / "Chaotic-Online-v238.html"
if REPO_V238.exists():
    TARGETS.append(REPO_V238)
LATEST_V238 = ROOT.parent / "upload" / "Chaotic-Online-v238(1).html"
if LATEST_V238.exists():
    TARGETS.append(LATEST_V238)
encoded = base64.b64encode(BATTLE.read_bytes()).decode("ascii")
pattern = re.compile(r'window\.BATTLE_GAME_B64="[^"]+"')
hero_prop = "hero: { kind: GameState.player.avatar || 'male', sprite: (typeof getHeroAvatarURL === 'function' ? getHeroAvatarURL() : null) },"
for target in TARGETS:
    text = target.read_text(encoding="utf-8")
    # Payloads created by the lobby carry the real player sprite into the
    # iframe; the transformation screen can then show the current character.
    if hero_prop not in text:
        text = text.replace(
            "    playerEquips: playerEquips,\n  };",
            "    playerEquips: playerEquips,\n    " + hero_prop + "\n  };",
            1,
        )
        text = text.replace(
            "  return { playerScans: playerScans, playerEquips: playerEquips };",
            "  return { playerScans: playerScans, playerEquips: playerEquips, " + hero_prop + " };",
            1,
        )
    text = text.replace(
        "playerScans: se.playerScans, playerEquips: se.playerEquips };",
        "playerScans: se.playerScans, playerEquips: se.playerEquips, hero: se.hero };",
        1,
    )
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"BATTLE_GAME_B64 não encontrado em {target}")
    target.write_text(text[:match.start()] + f'window.BATTLE_GAME_B64="{encoded}"' + text[match.end():], encoding="utf-8")
    try:
        shown = target.relative_to(ROOT)
    except ValueError:
        shown = target.relative_to(ROOT.parent)
    print(f"atualizado: {shown}")
print(f"fonte: {BATTLE.relative_to(ROOT)} ({len(encoded)} caracteres base64)")
