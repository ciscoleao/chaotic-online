#!/usr/bin/env python3
"""Monta Testar_Musicas.html: o motor (lobby_music_snippet.js) + pagina de teste.

Uso: python3 build_music_lab.py  (gera Testar_Musicas.html na raiz do pacote)
Funciona no workspace (/home/user) e em lobby/tools/.
"""
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'tools' else HERE
CANDIDATES = [os.path.join(ROOT, 'tools', 'lobby_music_snippet.js'),
              os.path.join(ROOT, 'lobby_music_snippet.js')]
SNIPPET = next((p for p in CANDIDATES if os.path.exists(p)), CANDIDATES[-1])
OUT = os.path.join(ROOT, 'Testar_Musicas.html')

TRACKS = [
    ('patio', '🛸', 'Pátio Central + Ilha dos Dromos', 'Dark sci-fi ambient em Ré menor'),
    ('battle', '⚔️', 'Sala de Batalha', 'Épica em Mi menor, 120bpm com bateria'),
    ('tribe_overworld', '🌲', 'OverWorld — Bosque', 'Pastoral aérea do Bosque Verdejante'),
    ('tribe_underworld', '🌋', 'UnderWorld — Brasas', 'Doom vulcânico com tambores tribais'),
    ('tribe_danian', '🐜', 'Danian — Colmeia', 'Alien oco com zumbido de colmeia'),
    ('tribe_mipedian', '🏜️', 'Mipedian — Deserto', 'Frígio árabe com vento do deserto'),
    ('tribe_marrillian', '🌊', "M'arrillian — Lagoa Negra", 'Aquático profundo com sussurros'),
]

stub = """<script>
/* stubs do lab (no jogo existem de verdade) */
function showNotif(t, ty) {
  const el = document.getElementById('lab-status');
  if (el) el.textContent = t;
}
function bindImmediateButton(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}
function mapaAtual154() { return 'portico'; }
</script>"""

wiring = """<script>
LobbyMusic.manual = true; // lab: troca manual, sem sonda de mapa
(function() {
  const nowEl = document.getElementById('lab-now');
  function refresh() {
    const cfg = MUSIC_TRACKS[LobbyMusic.trackId];
    if (nowEl && cfg) nowEl.textContent = '▶ ' + cfg.name;
    document.querySelectorAll('[data-track]').forEach(function(b) {
      b.classList.toggle('on', b.getAttribute('data-track') === LobbyMusic.trackId);
    });
  }
  document.querySelectorAll('[data-track]').forEach(function(b) {
    b.addEventListener('click', function() {
      try { LobbyMusic.start(); } catch (e) {}
      LobbyMusic.switchTrack(b.getAttribute('data-track'));
      refresh();
    });
  });
  setInterval(refresh, 500);
  refresh();
})();
</script>"""

cards = []
for tid, emoji, name, desc in TRACKS:
    cards.append(
        f'    <button class="track" data-track="{tid}">'
        f'<span class="t-emoji">{emoji}</span>'
        f'<span class="t-name">{name}</span>'
        f'<span class="t-desc">{desc}</span></button>')
cards_html = '\n'.join(cards)

html = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🎵 Testar Músicas — Chaotic Online</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0b0f1a; color: #e8eefc; font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px 16px 60px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 22px; letter-spacing: 1px; margin-bottom: 4px; }
  .sub { color: #93a4c7; font-size: 13px; margin-bottom: 16px; }
  #lab-now { background: #16203a; border: 1px solid #2c3d63; border-radius: 10px; padding: 10px 14px; font-size: 15px; font-weight: 700; color: #9af8ff; margin-bottom: 6px; }
  #lab-status { font-size: 12px; color: #93a4c7; min-height: 18px; margin-bottom: 14px; }
  .vol-row { display: flex; gap: 8px; align-items: center; background: #10182e; border: 1px solid #2c3d63; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; }
  .vol-row button { background: #1d2b4d; color: #fff; border: 1px solid #33415c; border-radius: 8px; font-size: 16px; padding: 6px 10px; cursor: pointer; }
  #opt-music-vol { flex: 1; accent-color: #3fe3ea; }
  #opt-music-pct { color: #9af8ff; font-size: 13px; min-width: 40px; text-align: right; }
  .grid { display: flex; flex-direction: column; gap: 10px; }
  .track { display: grid; grid-template-columns: 44px 1fr; grid-template-rows: auto auto; column-gap: 10px; text-align: left; background: #131c33; color: #e8eefc; border: 2px solid #2c3d63; border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: border-color .15s, transform .12s; font-family: inherit; }
  .track:hover { transform: translateY(-1px); }
  .track.on { border-color: #3fe3ea; background: #16263f; }
  .t-emoji { grid-row: 1 / 3; font-size: 30px; align-self: center; }
  .t-name { font-size: 15px; font-weight: 800; }
  .t-desc { font-size: 12px; color: #93a4c7; }
  .hint { margin-top: 16px; font-size: 12px; color: #93a4c7; line-height: 1.6; }
</style>
</head>
<body>
<div class="wrap">
  <h1>🎵 Testar Músicas</h1>
  <div class="sub">As 7 faixas do jogo, geradas na hora — clique numa faixa para ouvir (o navegador exige 1 clique para liberar o som).</div>
  <div id="lab-now">▶ …</div>
  <div id="lab-status"></div>
  <div class="vol-row">
    <button id="opt-music-mute">🔊</button>
    <input id="opt-music-vol" type="range" min="0" max="100" value="40">
    <span id="opt-music-pct">40%</span>
  </div>
  <div class="grid">
__CARDS__
  </div>
  <div class="hint">🔉 O volume começa em 40 e fica salvo. No jogo, a troca é automática: Pátio/Ilha → sci-fi · sala de preparação/batalha → épica · cada região → música da sua tribo.</div>
</div>
__STUB__
<script>
__SNIPPET__
</script>
__WIRING__
</body>
</html>
"""

snippet = open(SNIPPET).read()
for tid, _, _, _ in TRACKS:
    assert tid in snippet, f'faixa ausente no motor: {tid}'
html = (html.replace('__CARDS__', cards_html)
            .replace('__STUB__', stub)
            .replace('__SNIPPET__', snippet.rstrip('\n'))
            .replace('__WIRING__', wiring))
with open(OUT, 'w') as f:
    f.write(html)

# auto-verificação: sintaxe dos 3 blocos <script>
blocks = re.findall(r'<script>([\s\S]*?)</script>', html)
assert len(blocks) == 3, f'esperava 3 scripts, achei {len(blocks)}'
for i, b in enumerate(blocks):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as t:
        t.write(b)
        tmp = t.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode != 0:
        print(f'ERRO de sintaxe no bloco {i}:\n{r.stderr[:500]}')
        sys.exit(1)
print(f'OK: {OUT} ({len(html)} bytes, 3 scripts válidos)')
