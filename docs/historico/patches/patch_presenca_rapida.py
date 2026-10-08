# -*- coding: utf-8 -*-
"""v2.35 / patch v172 — PRESENÇA RÁPIDA: menos delay vendo gente online.

PROBLEMA (reportado): ver as pessoas online tem MUITO delay. Causas, todas no
cliente (o servidor não tem rate limit em /api/presence nem no GET /api/chat,
então dá para acelerar sem mexer nele):
  1. gcBeat a cada 2000ms → cada jogador envia sua posição 1x a cada 2s;
     todo mundo se vê "pulando" de 2 em 2 segundos;
  2. gcPoll (chat+roster) a cada 2500ms → dados de até ~2.5s de idade;
  3. render: lerp 0.16 @110ms rumo a um alvo PARADO (última amostra) → o remoto
     congela ~2s e depois desliza até o ponto — sensação de lag gigante;
  4. troca de mapa: até 2.5s para aparecer/sair do mapa dos outros;
  5. sem velocidade no protocolo, não há extrapolação entre updates.

CORREÇÃO (só cliente, zero mudança no servidor):
  1. BEAT ADAPTATIVO: andando/trocou de mapa = 650ms · parado = 2400ms
     (economiza bateria/dados) · erro de rede = 2500ms (backoff);
  2. POLL 2500ms → 1500ms (chat + roster);
  3. travas anti-sobreposição (gcBeatFly172/gcPollFly): com intervalo menor,
     request lento não empilha;
  4. PREDIÇÃO (dead reckoning client-side): estima a velocidade pelas últimas
     amostras e projeta onde o remoto está AGORA; o sprite persegue a previsão
     (perto: 0.28 · longe: 0.45 por tick de 110ms) em vez da amostra velha;
  5. SNAP em teleporte (>550px amostra→sprite ou >1100 manhattan): gruda em vez
     de deslizar o mapa todo;
  6. BEAT IMEDIATO (gcBeatSoon): ao trocar de mapa (hook no travelTo) e ao
     voltar para a aba (visibilitychange) — aparece na hora.
"""
import io
import sys

ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

if 'predPos172' in s or 'gcBeatLoop172' in s:
    print('AVISO: v172 já aplicada — nada a fazer')
    sys.exit(0)

# ------------------------------------------------- 1) amostras no sync
VELHO_SAMP = "    o.tx = r.x; o.ty = r.y;\n  }"
NOVO_SAMP = """    o.tx = r.x; o.ty = r.y;
    const t172 = Date.now(); // v172 — amostra p/ predição (+ snap em teleporte)
    o.samp = o.samp || [];
    const ps172 = o.samp[o.samp.length - 1];
    if (!ps172 || ps172.x !== r.x || ps172.y !== r.y || t172 - ps172.t > 900) {
      o.samp.push({ x: r.x, y: r.y, t: t172 });
      if (o.samp.length > 3) o.samp.shift();
    }
    if (o.sp && Math.abs(r.x - o.sp.x) + Math.abs(r.y - o.sp.y) > 1100) {
      o.sp.x = r.x; o.sp.y = r.y; // teleporte real: gruda, não desliza o mapa todo
      o.samp = [{ x: r.x, y: r.y, t: t172 }];
    }
  }"""
if s.count(VELHO_SAMP) != 1:
    print('ABORTADO: âncora do gcSyncSprites (o.tx) não encontrada')
    sys.exit(1)
s = s.replace(VELHO_SAMP, NOVO_SAMP, 1)
print('ok: gcSyncSprites guarda amostras + snap')

VELHO_NEW = "      o = gcPlEls[r.nick] = { sp: sp, txt: txt, tx: r.x, ty: r.y, dir: 's', f: 0, ft: 0 };"
NOVO_NEW = "      o = gcPlEls[r.nick] = { sp: sp, txt: txt, tx: r.x, ty: r.y, dir: 's', f: 0, ft: 0, samp: [{ x: r.x, y: r.y, t: Date.now() }] }; // v172 — 1ª amostra"
if s.count(VELHO_NEW) != 1:
    print('ABORTADO: âncora de criação do sprite remoto não encontrada')
    sys.exit(1)
s = s.replace(VELHO_NEW, NOVO_NEW, 1)
print('ok: sprite remoto nasce com 1ª amostra')

# --------------------------------- 2) predição + loop de render novo
INI_LOOP = "setInterval(function() {\n  const s = getActiveGameScene();"
FIM_LOOP = "}, 110);\nasync function gcPoll() {"
i = s.find(INI_LOOP)
j = s.find(FIM_LOOP, i) if i != -1 else -1
if i == -1 or j == -1 or s.count(INI_LOOP) != 1:
    print('ABORTADO: loop de render dos remotos não encontrado')
    sys.exit(1)
NOVO_LOOP = """/* v172 — PREDIÇÃO client-side (dead reckoning): com amostras a cada ~0.7s o
 * remoto "andaria" aos solavancos; aqui estimamos a velocidade pelas últimas
 * amostras e projetamos onde ele está AGORA. Pura e testável (test_v235). */
function predPos172(samp, now) {
  const n = (samp && samp.length) || 0;
  if (!n) return { x: 0, y: 0, vx: 0, vy: 0, moving: false };
  const last = samp[n - 1];
  if (n < 2) return { x: last.x, y: last.y, vx: 0, vy: 0, moving: false };
  const prev = samp[n - 2];
  const dt = Math.max(0.05, (last.t - prev.t) / 1000);
  let vx = (last.x - prev.x) / dt, vy = (last.y - prev.y) / dt;
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp < 12) return { x: last.x, y: last.y, vx: 0, vy: 0, moving: false }; // parado
  const VMAX = 420; // px/s — herói corre ~140-300; acima disso é ruído/teleporte
  if (sp > VMAX) { vx = vx / sp * VMAX; vy = vy / sp * VMAX; }
  let ahead = (now - last.t) / 1000; // tempo sem notícia
  if (!(ahead > 0)) ahead = 0;
  if (ahead > 1.2) ahead = 1.2; // nunca projeta mais que 1.2s no futuro
  return { x: last.x + vx * ahead, y: last.y + vy * ahead, vx: vx, vy: vy, moving: true };
}
setInterval(function() {
  const s = getActiveGameScene();
  if (!s) return;
  if (s !== gcSpriteScene) {
    for (const k in gcPlEls) { try { gcPlEls[k].sp.destroy(); gcPlEls[k].txt.destroy(); } catch (e) {} }
    gcPlEls = {}; gcSpriteScene = null;
    gcSyncSprites();
    return;
  }
  const now172 = Date.now(); // v172 — mira na posição PREVISTA, não na amostra velha
  for (const k in gcPlEls) {
    const o = gcPlEls[k];
    if (!o.sp || !o.sp.scene) continue;
    const p172 = predPos172(o.samp && o.samp.length ? o.samp : [{ x: o.tx, y: o.ty, t: now172 }], now172);
    let dx = p172.x - o.sp.x, dy = p172.y - o.sp.y;
    const dist172 = Math.sqrt(dx * dx + dy * dy);
    if (dist172 > 550) { o.sp.x = p172.x; o.sp.y = p172.y; dx = 0; dy = 0; }
    const moving = p172.moving || dist172 > 4;
    if (moving && dist172 > 0.5) {
      const k172 = dist172 > 220 ? 0.45 : 0.28; // longe: corre atrás · perto: desliza
      o.sp.x += dx * k172; o.sp.y += dy * k172;
      if (p172.moving) o.dir = Math.abs(p172.vx) > Math.abs(p172.vy) ? (p172.vx > 0 ? 'e' : 'w') : (p172.vy > 0 ? 's' : 'n');
      else o.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      if ((o.ft = o.ft + 1) % 3 === 0) o.f = o.f ? 0 : 1;
    } else { o.f = 0; }
    const base = (o.sp.texture && o.sp.texture.key || '').indexOf('heroF_') === 0 ? 'heroF_' : 'hero_';
    const want = base + o.dir + '_' + (o.f ? 1 : 0);
    if (o.sp.texture.key !== want && game.textures.exists(want)) o.sp.setTexture(want);
    o.txt.x = o.sp.x; o.txt.y = o.sp.y - 46;
  }
}, 110);
async function gcPoll() {"""
s = s[:i] + NOVO_LOOP + s[j + len("}, 110);\nasync function gcPoll() {"):]
print('ok: predPos172 + loop mira na previsão')

# --------------------------------- 3) beat adaptativo + poll rápido
INI_NET = "async function gcPoll() {"
FIM_NET = """  gcPoll(); gcBeat();
  setInterval(gcPoll, 2500);
  setInterval(gcBeat, 2000);
})();"""
i = s.find(INI_NET)
j = s.find(FIM_NET, i) if i != -1 else -1
if i == -1 or j == -1:
    print('ABORTADO: bloco gcPoll/gcBeat/gcBoot não encontrado')
    sys.exit(1)
# preserva o miolo do gcPoll e do gcSend: recorta do original
miolo_poll = s[s.find('{', i) + 1:s.find('async function gcBeat()', i)]
miolo_poll = miolo_poll[:miolo_poll.rfind('}')]
# o miolo traz o próprio "if (!gcOn) return;" — fora dele, pois o novo cabeçalho
# já testa (e um return ali dentro vazaria com a trava gcPollFly172 ligada)
if miolo_poll.count('if (!gcOn) return;') != 1:
    print('ABORTADO: guarda gcOn do gcPoll fora do esperado')
    sys.exit(1)
miolo_poll = miolo_poll.replace('if (!gcOn) return;', '', 1)
NOVO_NET_HEAD = """let gcPollFly172 = false; // v172 — trava: com intervalo menor, request lento não empilha
async function gcPoll() {
  if (!gcOn || gcPollFly172) return;
  gcPollFly172 = true;
  try {""" + miolo_poll + """
  } catch (e) {}
  gcPollFly172 = false;
}
/* v172 — BEAT ADAPTATIVO: andando/trocou de mapa = 650ms (todo mundo te vê quase
 * ao vivo); parado = 2400ms (economiza bateria/dados); erro de rede = 2500ms.
 * Retorna quantos ms esperar até o próximo beat. Servidor intacto: ele aceita
 * qualquer ritmo em /api/presence (sem rate limit). */
let gcBeatFly172 = false, gcBeatTO172 = null;
let gcLastBeatPos172 = { x: 0, y: 0, map: '' };
async function gcBeat() {
  if (!gcOn || !window.CHAOS_ONLINE || typeof GameState === 'undefined' || !GameState.player) return 2400;
  if (gcBeatFly172) return 500;
  gcBeatFly172 = true;
  let wait = 800;
  try {
    const px172 = Math.round(GameState.player.x || 0), py172 = Math.round(GameState.player.y || 0), mp172 = mapaAtual154();
    const moved172 = Math.abs(px172 - gcLastBeatPos172.x) + Math.abs(py172 - gcLastBeatPos172.y);
    const mapChanged172 = mp172 !== gcLastBeatPos172.map;
    const r = await fetch('/api/presence', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ map: mp172, x: px172, y: py172, nick: window.CHAOS_ONLINE.nick, sex: (window.CHAOS_ONLINE && CHAOS_ONLINE.sex) || 'm' }) });
    const j = await r.json().catch(function() { return {}; });
    if (j.roster) gcApplyRoster(j.roster);
    gcLastBeatPos172 = { x: px172, y: py172, map: mp172 };
    wait = (moved172 > 30 || mapChanged172) ? 650 : 2400;
  } catch (e) { wait = 2500; }
  gcBeatFly172 = false;
  return wait;
}
function gcBeatLoop172() {
  try {
    gcBeat().then(function(w) {
      gcBeatTO172 = setTimeout(gcBeatLoop172, Math.max(400, Math.min(3000, w || 800)));
    }).catch(function() { gcBeatTO172 = setTimeout(gcBeatLoop172, 2500); });
  } catch (e) { gcBeatTO172 = setTimeout(gcBeatLoop172, 2500); }
}
function gcBeatSoon() { // v172 — beat IMEDIATO (trocou de mapa, voltou pra aba)
  if (!gcOn || gcBeatFly172) return;
  try { if (gcBeatTO172) { clearTimeout(gcBeatTO172); gcBeatTO172 = null; } } catch (e) {}
  gcBeatLoop172();
}
"""
# o bloco vai de gcPoll até o fim do gcBoot; mantém gcSend intacto no meio:
# localiza o gcSend original e o gcBoot original
k_send = s.find('async function gcSend(text) {', i)
k_boot = s.find('(function gcBoot() {', i)
if k_send == -1 or k_boot == -1 or not (i < k_send < k_boot < j):
    print('ABORTADO: gcSend/gcBoot fora do esperado')
    sys.exit(1)
orig_send_boot = s[k_send:j + len(FIM_NET)]  # gcSend + gcBoot originais (inclui o rabo)
novo_boot_tail = """  gcPoll(); gcBeatLoop172();
  setInterval(gcPoll, 1500); // v172 — era 2500ms (chat + roster chegam antes)
  try { // v172 — voltou pra aba: atualiza presença e chat na hora
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) { try { gcBeatSoon(); } catch (e) {} try { gcPoll(); } catch (e2) {} }
    });
  } catch (e) {}
})();"""
VELHO_BOOT_TAIL = """  gcPoll(); gcBeat();
  setInterval(gcPoll, 2500);
  setInterval(gcBeat, 2000);
})();"""
if orig_send_boot.count(VELHO_BOOT_TAIL) != 1:
    print('ABORTADO: rabo do gcBoot não bate')
    sys.exit(1)
orig_send_boot = orig_send_boot.replace(VELHO_BOOT_TAIL, novo_boot_tail, 1)
s = s[:i] + NOVO_NET_HEAD + orig_send_boot + s[j + len(FIM_NET):]
print('ok: beat adaptativo + poll 1500ms + travas + visibility')

# ------------------------------------------------- 4) hook no travelTo
VELHO_TP = """  if (active.length) { GameState.location = 'perim'; applyRegionTheme147(regionId); active[0].scene.start('PerimScene'); } // v147 — tema da tribo aplicado antes do bake
  saveGame();
}"""
NOVO_TP = """  if (active.length) { GameState.location = 'perim'; applyRegionTheme147(regionId); active[0].scene.start('PerimScene'); } // v147 — tema da tribo aplicado antes do bake
  saveGame();
  try { if (typeof gcBeatSoon === 'function') gcBeatSoon(); } catch (e) {} // v172 — aparece no mapa novo na hora
}"""
if s.count(VELHO_TP) != 1:
    print('ABORTADO: âncora do travelTo não encontrada')
    sys.exit(1)
s = s.replace(VELHO_TP, NOVO_TP, 1)
print('ok: travelTo dispara beat imediato')

# --------------------------------------------------------------- título
VELHO_T = '<title>Chaotic.idleWorld v2.34 — Clique vs. arrasto nos painéis (Portal de Viagem) 🖱️</title>'
NOVO_T = '<title>Chaotic.idleWorld v2.35 — Presença rápida: menos delay vendo gente online ⚡</title>'
if s.count(VELHO_T) == 1:
    s = s.replace(VELHO_T, NOVO_T, 1)
    print('ok: título v2.34 → v2.35')
else:
    print('AVISO: título não encontrado — pulando')

# ------------------------------------------------------------- changelog
VELHO_C = '// CHAOTIC.IDLEWORLD v2.34 — CHANGELOG (v171'
NOVO_C = ('''// ============================================================
// CHAOTIC.IDLEWORLD v2.35 — CHANGELOG (v172 Presença rápida)
// - v172 — MENOS DELAY VENDO GENTE ONLINE (só cliente, servidor intacto):
//   beat adaptativo (andando = 650ms · parado = 2400ms · erro = 2500ms),
//   poll de chat+roster 2500ms → 1500ms, travas anti-sobreposição, PREDIÇÃO
//   (dead reckoning: projeta onde o remoto está entre updates), snap em
//   teleporte (>550px) e beat imediato ao trocar de mapa / voltar à aba.
// ============================================================
// CHAOTIC.IDLEWORLD v2.34 — CHANGELOG (v171''')
if s.count(VELHO_C) == 1 and 'v2.35 — CHANGELOG (v172' not in s:
    s = s.replace(VELHO_C, NOVO_C, 1)
    print('ok: changelog v172')
else:
    print('AVISO: changelog já aplicado ou âncora ausente — pulando')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
