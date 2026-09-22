import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# -*- coding: utf-8 -*-
"""Monta demo_clique_vs_arrasto.html: ANTES (v2.31 real, do git HEAD) x DEPOIS
(v2.34 real, do arquivo corrigido) — cada um isolado num iframe srcdoc."""
import html as htmllib
import subprocess

REPO = os.path.join(ROOT, 'chaotic-online')
ARQ = REPO + '/chaotic_idleworld_v123.html'

if not os.path.isfile(ARQ):
    print('sem clone chaotic-online: demo nao gerada (ajuste REPO)')
    raise SystemExit(0)
novo = open(ARQ, encoding='utf-8').read()
velho = subprocess.run(['git', 'show', 'HEAD:chaotic_idleworld_v123.html'],
                       cwd=REPO, capture_output=True, text=True).stdout
assert velho and 'v2.31 — painéis móveis' in velho, 'HTML original não veio do git'


def extrai(html, marcador):
    k = html.index(marcador)
    ini = html.rindex('<script>', 0, k) + len('<script>')
    fim = html.index('</script>', k)
    return html[ini:fim]


def extrai_css(html):
    ini = html.index('<style id="movable-panels-style">')
    fim = html.index('</style>', ini) + len('</style>')
    return html[ini:fim]


JS_VELHO = extrai(velho, '/* v2.31 — painéis móveis')
JS_NOVO = extrai(novo, '/* v2.34 (v171)')
CSS_VELHO = extrai_css(velho)
CSS_NOVO = extrai_css(novo)
assert 'touch-action:none;user-select:none' in CSS_VELHO
assert 'touch-action:none' in CSS_NOVO and '.panel-drag-handle{cursor:grab;touch-action:none}' in CSS_NOVO

TEMPLATE = """<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<style>
body{margin:0;background:#0b1120;font-family:monospace;color:#e8eefc;padding:12px}
#room-menu{position:absolute;top:52px;left:16px;width:290px;background:#141b12;border:2px solid #7ec850;border-radius:10px;padding:10px;z-index:5}
.room-panel-header{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #3a4a2f;padding-bottom:6px;margin-bottom:8px;font-weight:800;color:#7ec850;font-size:12px}
.room-panel-header button{background:#3a1020;color:#ffb3c0;border:1px solid #7a2540;border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer}
.region-card{background:#222b1c;border:1px solid #3a4a2f;border-radius:6px;padding:7px;margin-bottom:6px;cursor:pointer;font-size:11px}
.region-card:hover{border-color:#7ec850;background:#2a3520}
.region-card h5{margin:0 0 2px;font-size:11px;color:#d4cfa8}
.region-card div{font-size:10px;color:#8a9a70}
#log{background:#000;border:1px solid #33415c;border-radius:6px;padding:6px;font-size:10px;min-height:64px;margin-top:250px;white-space:pre-wrap;color:#9fe870}
.tag{display:inline-block;background:%(cor)s;color:#0b1120;font-weight:800;border-radius:4px;padding:2px 8px;font-size:11px}
.hint{font-size:10px;color:#93a4c7;margin-top:4px}
</style>
%(css)s
</head><body>
<div class="tag">%(rotulo)s</div>
<div class="hint">1) Clique num mapa &nbsp;•&nbsp; 2) Arraste o painel pelo cabeçalho verde</div>
<div id="room-menu" class="panel">
  <div class="room-panel-header"><span class="room-panel-title">🌀 Portal de Viagem</span><button onclick="fechar()">✕ Fechar</button></div>
  <div id="room-content">
    <div class="region-card" onclick="travelTo('ow_grove')"><h5>Bosque Verdejante 🛡</h5><div>Mapa 1 · Acesso livre · 🐾 5 espécies</div></div>
    <div class="region-card" onclick="travelTo('meadow')"><h5>Prado Verde</h5><div>Mapa 2 · Requer Lv.10 · 🐾 10 espécies</div></div>
    <div class="region-card" onclick="travelTo('forest')"><h5>Floresta Sombria</h5><div>Mapa 3 · Requer Lv.20 · 🐾 15 espécies</div></div>
  </div>
</div>
<div id="log">aguardando clique…</div>
<script>
function travelTo(id){document.getElementById('log').textContent='🧭 travelTo(\\''+id+'\\') — VIAJOU! ✅';}
function fechar(){document.getElementById('log').textContent='✕ fechar (botão ok)';}
</script>
<script>%(js)s</script>
</body></html>"""

antes = TEMPLATE % {'rotulo': 'ANTES — v2.31 (com o bug)', 'cor': '#ff8fa3', 'css': CSS_VELHO, 'js': JS_VELHO}
depois = TEMPLATE % {'rotulo': 'DEPOIS — v2.34 (corrigido)', 'cor': '#7ec850', 'css': CSS_NOVO, 'js': JS_NOVO}

demo = """<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo — Clique vs. arrasto (v2.34)</title>
<style>
body{margin:0;background:#070c16;color:#eaf3ff;font-family:Segoe UI,system-ui,sans-serif;padding:18px}
h1{font-size:18px;margin:0 0 4px;color:#ffd54f}
p{font-size:13px;color:#9fb0cc;max-width:900px;line-height:1.5}
.cols{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}
.col{flex:1 1 360px;min-width:320px}
.col h2{font-size:13px;margin:0 0 6px}
.col.antes h2{color:#ff8fa3}.col.depois h2{color:#7ec850}
iframe{width:100%;height:480px;border:2px solid #33415c;border-radius:10px;background:#0b1120}
.col.antes iframe{border-color:#7a2540}.col.depois iframe{border-color:#3f9a46}
code{background:#16203a;padding:1px 6px;border-radius:4px;color:#8be2ff;font-size:12px}
</style></head><body>
<h1>🖱️ Portal de Viagem — clique vs. arrasto (código REAL do jogo)</h1>
<p><b>Como testar:</b> em cada painel abaixo, <b>clique num mapa</b> (Bosque/Prado/Floresta) e depois
<b>arraste o painel pelo cabeçalho verde</b>. No <b>ANTES (v2.31)</b> o clique no mapa morre (o painel só
"quer puxar" — <code>travelTo()</code> nunca roda). No <b>DEPOIS (v2.34)</b> o clique viaja e o arrasto
continua funcionando — só que <b>só pelo cabeçalho</b>. Cada lado roda o script <b>byte-idêntico</b>
ao do jogo (ANTES extraído do git, DEPOIS do arquivo corrigido).</p>
<div class="cols">
<div class="col antes"><h2>❌ ANTES — v2.31 (painel inteiro = alça)</h2><iframe sandbox="allow-scripts" srcdoc="__ANTES__"></iframe></div>
<div class="col depois"><h2>✅ DEPOIS — v2.34 (só cabeçalho + 7px)</h2><iframe sandbox="allow-scripts" srcdoc="__DEPOIS__"></iframe></div>
</div>
</body></html>"""
demo = demo.replace('__ANTES__', htmllib.escape(antes, quote=True)).replace('__DEPOIS__', htmllib.escape(depois, quote=True))

open(os.path.join(HERE, 'demo_clique_vs_arrasto.html'), 'w', encoding='utf-8').write(demo)
print('ok: demo_clique_vs_arrasto.html (%d bytes)' % len(demo))
print('JS velho: %d chars · JS novo: %d chars' % (len(JS_VELHO), len(JS_NOVO)))
