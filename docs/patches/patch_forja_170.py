#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_forja_170.py — v2.33 (v170): a FORJA-7 (craft da Drome Key) no layout novo
================================================================================
1) A RECEITA DA CHAVE passa a ser os 3 FRAGMENTOS da referência do autor:
   🧭 Fragmento da Exploração ×1 · ⚔️ Fragmento de Batalha ×5 · ⚙️ Fragmento do
   Tempo ×7 + 💠 400 bits.
   - Exploração: 1 por mapa que chega a 100% de escaneamento (na primeira vez);
   - Batalha: 1 por vitória (Dromo de mestre, PVP e Arena do Chefe);
   - Tempo: 1 a cada 10 min de jogo (o tempo com o jogo fechado conta até 3).
2) PAINEL DA FORJA repaginado no estilo da referência: a CHAVE no centro com
   brilho, os 3 fragmentos em cartões (contador x/y), o custo de 400 bits, o
   botão "Forjar Drome Key" e os cantos/circuitos da bancada holográfica.
3) O caminho antigo (🧩 5 fragmentos do scan) continua, como botão secundário.

Uso: python3 patch_forja_170.py [entrada] [saida]
"""
import sys, io, os

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'chaotic_idleworld_v123.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else ENTRADA

s = io.open(ENTRADA, encoding='utf-8').read()
antes = len(s)
trocas = []

def troca(nome, velho, novo, vezes=1):
    global s
    n = s.count(velho)
    if n != vezes:
        raise SystemExit('✗ [%s] esperava %d ocorrência(s), achei %d' % (nome, vezes, n))
    s = s.replace(velho, novo, vezes)
    trocas.append(nome)

# =====================================================================
# 1) ESTADO: os 3 contadores de fragmento + o relógio do tempo
# =====================================================================
troca('estado do jogador',
      "fragments: 0, dromeKeys: 0, totalKills: 0, scannedEnemies: 0, visitedRegions: [], backpackLvl: 0, storage: [] },",
      "fragments: 0, dromeKeys: 0, fragExp169: 0, fragBat169: 0, fragTempo169: 0, playMs169: 0, lastSeen169: 0, totalKills: 0, scannedEnemies: 0, visitedRegions: [], backpackLvl: 0, storage: [] },")

troca('numDefaults',
      "pilhas: CONFIG.START_PILHAS, fragments: 0, dromeKeys: 0, totalKills: 0, scannedEnemies: 0 };",
      "pilhas: CONFIG.START_PILHAS, fragments: 0, dromeKeys: 0, fragExp169: 0, fragBat169: 0, fragTempo169: 0, playMs169: 0, lastSeen169: 0, totalKills: 0, scannedEnemies: 0 };")

troca('clamps do save',
      "    p.fragments = Math.max(0, Math.floor(p.fragments));\n    p.dromeKeys = Math.max(0, Math.floor(p.dromeKeys));",
      "    p.fragments = Math.max(0, Math.floor(p.fragments));\n    p.dromeKeys = Math.max(0, Math.floor(p.dromeKeys));\n    p.fragExp169 = Math.max(0, Math.floor(p.fragExp169 || 0)); // v170 — os 3 fragmentos da FORJA\n    p.fragBat169 = Math.max(0, Math.floor(p.fragBat169 || 0));\n    p.fragTempo169 = Math.max(0, Math.floor(p.fragTempo169 || 0));\n    p.playMs169 = Math.max(0, Math.floor(p.playMs169 || 0));\n    p.lastSeen169 = Math.max(0, Math.floor(p.lastSeen169 || 0));")

# mapas 100% (para o Fragmento da Exploração) — vive no GameState e vai pro save
troca('save: mapas 100%',
      "bossArenaWins: GameState.bossArenaWins || {} };",
      "bossArenaWins: GameState.bossArenaWins || {}, map100169: GameState.map100169 || {} }; // v170 — mapas já 100%")

troca('load: mapas 100%',
      "GameState.mapPenalty = (data.mapPenalty && typeof data.mapPenalty === 'object') ? data.mapPenalty : {}; // v148 — penalidades do auto-port",
      "GameState.mapPenalty = (data.mapPenalty && typeof data.mapPenalty === 'object') ? data.mapPenalty : {}; // v148 — penalidades do auto-port\n    GameState.map100169 = (data.map100169 && typeof data.map100169 === 'object') ? data.map100169 : {}; // v170 — mapas já 100%")

# =====================================================================
# 2) OS 3 FRAGMENTOS + O CRAFT (substitui o craftKeyClerk antigo)
# =====================================================================
VELHO_CRAFT = """function craftKeyClerk() {
  const p = GameState.player;
  if (p.bits < 400) { showNotif('💠 Bits insuficientes (400)!', 'warning'); return; }
  if (!removeMats(KEY_RECIPE)) { showNotif('Materiais insuficientes!', 'warning'); clerkRender(); return; }
  p.bits -= 400;
  p.dromeKeys++;
  showNotif('🔨 Drome Key forjada! Você tem ' + p.dromeKeys + ' 🔑', 'success');
  updateTopBar(); clerkRender(); saveGame(true);
}"""

NOVO_CRAFT = """/* ===== v170 — OS 3 FRAGMENTOS DA DROME KEY (painel novo da FORJA-7) =====
 * A receita da chave passou a ser: 🧭 Exploração ×1 + ⚔️ Batalha ×5 +
 * ⚙️ Tempo ×7 + 💠 400 bits. Cada um vem de um lugar diferente do jogo. */
const KEY_FRAGS170 = [
  { id: 'exp', qty: 1, icon: '🧭', tag: 'Exploração', nome: 'Fragmento da Exploração', de: 'Mapa com 100% de escaneamento' },
  { id: 'bat', qty: 5, icon: '⚔️', tag: 'Batalha', nome: 'Fragmento de Batalha', de: '1 por vitória (Dromo, PVP, Arena do Chefe)' },
  { id: 'tempo', qty: 7, icon: '⚙️', tag: 'Tempo', nome: 'Fragmento do Tempo', de: '1 a cada 10 minutos de jogo' },
];
function fragCampo170(id) { return id === 'exp' ? 'fragExp169' : id === 'bat' ? 'fragBat169' : 'fragTempo169'; }
function fragCount170(id) { const p = GameState.player; return Math.max(0, Math.floor(p[fragCampo170(id)] || 0)); }
function fragsOk170() { return KEY_FRAGS170.every(function(f) { return fragCount170(f.id) >= f.qty; }); }
function addFrag170(id, n, silencioso) {
  const p = GameState.player; const campo = fragCampo170(id);
  const q = (n || 1);
  p[campo] = fragCount170(id) + q;
  const def = KEY_FRAGS170.find(function(f) { return f.id === id; });
  if (!silencioso && def) showNotif(def.icon + ' ' + def.nome + ' +' + q + ' (' + p[campo] + '/' + def.qty + ')', 'success');
  updateTopBar();
  return p[campo];
}
// ⚙️ TEMPO: 1 fragmento a cada 10 minutos; com o jogo fechado conta até 3 por ausência
const TEMPO_MS170 = 10 * 60 * 1000, TEMPO_OFFLINE_MAX170 = 3;
function tickTempo170() {
  const p = GameState.player; if (!p) return;
  const agora = Date.now();
  const ultimo = p.lastSeen169 || agora;
  const delta = agora - ultimo;
  p.lastSeen169 = agora;
  if (delta > 60000) { // ausência de verdade (fechou/recarregou)
    const off = Math.min(TEMPO_OFFLINE_MAX170, Math.floor(delta / TEMPO_MS170));
    if (off > 0) { addFrag170('tempo', off); showNotif('⚙️ Tempo com o jogo fechado: +' + off + ' Fragmento(s) do Tempo', 'info'); }
    return;
  }
  p.playMs169 = Math.max(0, Math.floor(p.playMs169 || 0)) + Math.min(Math.max(delta, 0), 5000);
  while (p.playMs169 >= TEMPO_MS170) { p.playMs169 -= TEMPO_MS170; addFrag170('tempo', 1); }
}
setInterval(tickTempo170, 3000);

function craftKeyClerk() {
  const p = GameState.player;
  if (p.bits < 400) { showNotif('💠 Bits insuficientes (400)!', 'warning'); return; }
  if (!fragsOk170()) {
    showNotif('Fragmentos insuficientes! Falta: ' + KEY_FRAGS170.filter(function(f) { return fragCount170(f.id) < f.qty; })
      .map(function(f) { return f.icon + ' ' + (f.qty - fragCount170(f.id)); }).join(' · '), 'warning');
    clerkRender(); return;
  }
  KEY_FRAGS170.forEach(function(f) { p[fragCampo170(f.id)] = fragCount170(f.id) - f.qty; });
  p.bits -= 400;
  p.dromeKeys++;
  showNotif('🔨 Drome Key forjada! Você tem ' + p.dromeKeys + ' 🔑', 'success');
  updateTopBar(); clerkRender(); saveGame(true);
}"""
troca('craft dos 3 fragmentos', VELHO_CRAFT, NOVO_CRAFT)

# --- FONTES -----------------------------------------------------------------
# (a) 🧭 Exploração: primeiro 100% de um mapa
troca('fonte: exploração (mapa 100%)',
      "      if (pct147 >= 100) showNotif('🗺️ ESCANEAMENTO 100% em ' + (reg147 ? reg147.name : 'mapa') + '! O próximo mapa da tribo libera ao atingir o nível.', 'success');",
      "      if (pct147 >= 100) {\n        showNotif('🗺️ ESCANEAMENTO 100% em ' + (reg147 ? reg147.name : 'mapa') + '! O próximo mapa da tribo libera ao atingir o nível.', 'success');\n        if (!GameState.map100169) GameState.map100169 = {};\n        if (!GameState.map100169[GameState.currentRegion]) { GameState.map100169[GameState.currentRegion] = 1; addFrag170('exp', 1); } // v170 — 1º 100% do mapa dá o Fragmento da Exploração\n      }")

# (b) ⚔️ Batalha: vitória no PVP
troca('fonte: vitória PVP',
      "        showNotif('⚔️ VITÓRIA PVP! +💠' + fmtBits(bits) + ' · +' + xp + ' XP · Vitórias PVP: ' + GameState.pvpWins, 'success');",
      "        addFrag170('bat', 1, true); // v170 — vitória no PVP dá Fragmento de Batalha\n        showNotif('⚔️ VITÓRIA PVP! +💠' + fmtBits(bits) + ' · +' + xp + ' XP · ⚔️ Fragmento de Batalha +1 · Vitórias PVP: ' + GameState.pvpWins, 'success');")

# (c) ⚔️ Batalha: vitória na Arena do Chefe
troca('fonte: vitória na arena do chefe (contador)',
      "        pB150.bits += bitsB150; pB150.xp += xpB150; pB150.fragments++;",
      "        pB150.bits += bitsB150; pB150.xp += xpB150; pB150.fragments++; addFrag170('bat', 1, true); // v170 — Fragmento de Batalha")

troca('fonte: vitória na arena do chefe (mensagem)',
      "+ xpB150 + ' XP · 🧩 Fragmento!', 'success');",
      "+ xpB150 + ' XP · 🧩 Fragmento · ⚔️ Fragmento de Batalha!', 'success');")

# (d) ⚔️ Batalha: vitória contra um Mestre do Dromo
troca('fonte: vitória no dromo',
      "      checkLevelUp(); updateTopBar(); saveGame(true);\n      showNotif(msg, 'success');\n    } else if (m) {",
      "      checkLevelUp(); updateTopBar(); saveGame(true);\n      addFrag170('bat', 1, true); // v170 — vitória no Dromo dá Fragmento de Batalha\n      showNotif(msg + ' · ⚔️ Fragmento de Batalha +1', 'success');\n    } else if (m) {")

# =====================================================================
# 3) O PAINEL NOVO DA FORJA (substitui o render antigo do modo craft)
# =====================================================================
VELHO_RENDER = """  } else {
    const canKeyMats = KEY_RECIPE.every(function(r) { return countMat(r.matId) >= r.qty; }) && p.bits >= 400;
    const canKeyFrag = p.fragments >= CONFIG.FRAGMENTS_PER_KEY;
    let recipeHtml = '';
    for (let i = 0; i < KEY_RECIPE.length; i++) {
      const r = KEY_RECIPE[i];
      const gm = getGroundMat(r.matId);
      recipeHtml += '<div class="ck-row ' + (countMat(r.matId) >= r.qty ? 'ok' : 'no') + '"><span>' + gm.icon + '</span><span style="flex:1">' + gm.name + ' <span class="ck-tier169">' + (gm.tier === 1 ? 'MAPAS 1' : gm.tier === 2 ? 'MAPAS 2' : 'MAPAS 3') + '</span></span><b style="color:' + (countMat(r.matId) >= r.qty ? '#7ec850' : '#ff8fa3') + '">' + countMat(r.matId) + '/' + r.qty + '</b></div>';
    }
    head = '<div class="dp-head"><div class="dp-avatar" style="color:#7ec850">🤖</div>'
      + '<div><div class="dp-name" style="color:#7ec850">Robô FORJA-7</div><div class="dp-title">Unidade de Artesanato do Pátio — Craft de Drome Key</div></div>'
      + '<button class="ah-close" style="margin-left:auto;" onclick="closeClerkPanel()">✕</button></div>'
      + '<div class="dp-lore">“Bip-bop. Forjo chaves do Drome com materiais de Perim. Aceito da sua mochila OU do Depósito.”</div>'
      + '<div class="dp-sec">🔑 CRAFT: DROME KEY (você tem ' + p.dromeKeys + ')</div>'
      + recipeHtml
      + '<div class="ah-sub" style="margin:6px 0;">Custo adicional: 💠 400 bits</div>'
      + '<button class="ck-go key" ' + (canKeyMats ? '' : 'disabled') + ' onclick="craftKeyClerk()">🔨 Forjar Drome Key (materiais + 400 bits)</button>'
      + '<button class="ck-go key" style="margin-top:6px;" ' + (canKeyFrag ? '' : 'disabled') + ' onclick="tryAssembleDromeKey()">🧩 Montar chave com ' + CONFIG.FRAGMENTS_PER_KEY + ' fragmentos (' + p.fragments + '/' + CONFIG.FRAGMENTS_PER_KEY + ')</button>'
      + '<div class="dp-sec">🌀 CÂMARA DO DROME</div>'
      + '<button class="ck-go drome" ' + (p.dromeKeys > 0 ? '' : 'disabled') + ' onclick="closeClerkPanel(); enterDrome();">⚔️ Entrar na Drome (1 🔑)</button>';
  }"""

NOVO_RENDER = """  } else {
    /* v170 — PAINEL NOVO DA FORJA-7 (a chave no centro + os 3 fragmentos) */
    el.classList.add('ck170');
    const canKeyFrag = p.fragments >= CONFIG.FRAGMENTS_PER_KEY;
    const terminou = fragsOk170();
    const podeForjar = terminou && p.bits >= 400;
    const chaveSvg = '<svg class="ck170-key" viewBox="0 0 340 180" aria-label="Drome Key">'
      + '<defs>'
      +   '<linearGradient id="kAco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f0f6"/><stop offset="0.55" stop-color="#9aa8b8"/><stop offset="1" stop-color="#4c5866"/></linearGradient>'
      +   '<linearGradient id="kRosa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ec8"/><stop offset="0.5" stop-color="#e0526a"/><stop offset="1" stop-color="#7d1f3a"/></linearGradient>'
      +   '<linearGradient id="kOuro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9ac"/><stop offset="0.45" stop-color="#e6b757"/><stop offset="1" stop-color="#8a5a1e"/></linearGradient>'
      +   '<linearGradient id="kCristal" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#cdf0ff"/><stop offset="1" stop-color="#63b7d6"/></linearGradient>'
      +   '<filter id="kGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '</defs>'
      + '<g filter="url(#kGlow)">'
      +   '<path d="M20 84 q0 -6 6 -7 l28 -3 v32 l-28 -3 q-6 -1 -6 -7 z" fill="#3b2a1c" stroke="#20150d" stroke-width="1.2"/>'
      +   '<path d="M52 50 q-30 40 0 80 q18 -9 30 -22 v-36 q-12 -13 -30 -22 z" fill="url(#kAco)" stroke="#2f3a46" stroke-width="1.2"/>'
      +   '<path d="M94 56 q-26 34 0 68 q16 -8 26 -19 v-30 q-10 -11 -26 -19 z" fill="url(#kRosa)" stroke="#6d1d33" stroke-width="1.2"/>'
      +   '<circle cx="120" cy="90" r="9" fill="#d8ad4e" stroke="#7a5518" stroke-width="1.2"/>'
      +   '<circle cx="120" cy="90" r="3.4" fill="#3a2c10"/>'
      +   '<rect x="118" y="79" width="104" height="22" rx="9" fill="#c9a24a" stroke="#7a5518" stroke-width="1.2"/>'
      +   '<rect x="118" y="83" width="104" height="6" rx="3" fill="rgba(255,255,255,0.35)"/>'
      +   '<g fill="#d8ad4e" stroke="#7a5518" stroke-width="1">'
      +     '<rect x="152" y="52" width="12" height="18" rx="3"/><rect x="152" y="110" width="12" height="18" rx="3"/>'
      +     '<rect x="128" y="66" width="12" height="16" rx="3" transform="rotate(-52 134 74)"/><rect x="176" y="98" width="12" height="16" rx="3" transform="rotate(-52 182 106)"/>'
      +   '</g>'
      +   '<circle cx="170" cy="90" r="30" fill="#e0b757" stroke="#8a5a1e" stroke-width="1.4"/>'
      +   '<circle cx="170" cy="90" r="19" fill="#f6d98a"/>'
      +   '<circle cx="170" cy="90" r="8" fill="#0d1a14"/>'
      +   '<g fill="#ef6f8e" stroke="#7d1f3a" stroke-width="1">'
      +     '<rect x="228" y="60" width="10" height="16" rx="3" transform="rotate(18 233 68)"/><rect x="228" y="104" width="10" height="16" rx="3" transform="rotate(-18 233 112)"/>'
      +     '<rect x="248" y="52" width="10" height="16" rx="3" transform="rotate(34 253 60)"/><rect x="248" y="112" width="10" height="16" rx="3" transform="rotate(-34 253 120)"/>'
      +   '</g>'
      +   '<circle cx="248" cy="90" r="22" fill="#ef6f8e" stroke="#7d1f3a" stroke-width="1.4"/>'
      +   '<circle cx="248" cy="90" r="11" fill="#0d1a14" opacity="0.75"/>'
      +   '<path d="M272 52 l34 -8 l34 22 l-10 46 l-36 10 l-24 -26 z" fill="url(#kCristal)" stroke="rgba(255,255,255,0.75)" stroke-width="1.4"/>'
      +   '<path d="M272 52 l34 30 l-10 40 M306 82 l34 -16 M296 122 l34 -16" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/>'
      +   '<path d="M282 60 l22 22 l-6 26" fill="none" stroke="rgba(126,240,180,0.75)" stroke-width="1.6"/>'
      +   '<circle cx="60" cy="46" r="3" fill="#bffcf0"/><circle cx="120" cy="132" r="2.6" fill="#bffcf0"/><circle cx="316" cy="44" r="2.8" fill="#bffcf0"/>'
      + '</g>'
      + '</svg>';
    const tiles = KEY_FRAGS170.map(function(f) {
      const tem = fragCount170(f.id);
      return '<div class="ck170-tile ' + (tem >= f.qty ? 'ok' : '') + '" title="' + f.nome + ' — ' + f.de + '">' + f.icon + '<span>' + tem + '/' + f.qty + '</span></div>';
    }).join('');
    const cartoes = KEY_FRAGS170.map(function(f) {
      const tem = fragCount170(f.id), pct = Math.max(0, Math.min(100, Math.round((tem / f.qty) * 100)));
      return '<div class="ck170-row ' + (tem >= f.qty ? 'ok' : 'no') + '">'
        + '<div class="ck170-ico">' + f.icon + '</div>'
        + '<div class="ck170-mid"><div class="ck170-tag">' + f.tag + ' · ' + f.de + '</div>'
        + '<div class="ck170-name">' + f.nome + '</div>'
        + '<div class="ck170-bar"><i style="width:' + pct + '%"></i></div></div>'
        + '<div class="ck170-num">' + tem + '/' + f.qty + '</div></div>';
    }).join('');
    body = '<div class="ck170-shell">'
      + '<div class="ck169-cir c1"></div><div class="ck169-cir c2"></div><div class="ck169-cir c3"></div><div class="ck169-cir c4"></div>'
      + '<div class="ck170-top">'
      +   '<div class="ck170-av">🤖</div>'
      +   '<div style="flex:1">'
      +     '<div class="ck170-title">Robô FORJA-7 <span>v.3</span></div>'
      +     '<div class="ck170-sub">🔨 UNIDADE DE ARTESANATO DO PÁTIO — CRAFT DE DROME KEY · você tem ' + p.dromeKeys + ' 🔑</div>'
      +     '<div class="ck170-note">“Bip-bop, Forjo chaves do Drome com materiais de Perim. Aceito da sua mochila OU do Depósito.”</div>'
      +   '</div>'
      +   '<button class="ck169-x" onclick="closeClerkPanel()">✕</button>'
      + '</div>'
      + '<div class="ck170-stage">'
      +   '<div class="ck170-left">' + tiles + '</div>'
      +   '<div class="ck170-art"><div class="ck170-halo"></div>' + chaveSvg + '<div class="ck170-art-cap">DROME KEY</div></div>'
      +   '<div class="ck170-right">' + cartoes + '</div>'
      + '</div>'
      + '<div class="ck170-cost">Custo adicional: <b>💠 400 bits</b> · você tem <b>💠 ' + fmtBits(p.bits) + '</b></div>'
      + '<div class="ck170-desk">'
      +   '<button class="ck170-go" ' + (podeForjar ? '' : 'disabled') + ' onclick="craftKeyClerk()">🛠 Forjar Drome Key</button>'
      +   '<div class="ck170-tip">' + (podeForjar ? 'Tudo pronto, Caçador! É só apertar.' : (!terminou ? 'Faltam fragmentos — os cartões em vermelho mostram quanto.' : 'Faltam 💠 ' + fmtBits(400 - p.bits) + ' bits.')) + '</div>'
      +   '<div class="ck170-alt">'
      +     '<button class="ck170-go2" ' + (canKeyFrag ? '' : 'disabled') + ' onclick="tryAssembleDromeKey()">🧩 Montar com ' + CONFIG.FRAGMENTS_PER_KEY + ' fragmentos do scan (' + p.fragments + '/' + CONFIG.FRAGMENTS_PER_KEY + ')</button>'
      +     '<button class="ck170-go2 drome" ' + (p.dromeKeys > 0 ? '' : 'disabled') + ' onclick="closeClerkPanel(); enterDrome();">🌀 Entrar na Drome (1 🔑)</button>'
      +   '</div>'
      + '</div>'
      + '<div class="ck169-bench"><span class="ck169-plate">ROBÔ FORJA-7 · v.3</span><span class="ck169-bench-led"></span></div>'
      + '</div>';
    head = '';
  }"""
troca('render do painel da forja', VELHO_RENDER, NOVO_RENDER)

# a classe ck170 só vale no modo craft (igual ao ck169 do COSTURA)
troca('classe condicional ck170',
      "  if (clerkMode !== 'upgrade') el.classList.remove('ck169'); // v169 — só o painel do COSTURA usa o layout holográfico",
      "  if (clerkMode !== 'upgrade') el.classList.remove('ck169'); // v169 — só o painel do COSTURA usa o layout holográfico\n  if (clerkMode !== 'craft') el.classList.remove('ck170'); // v170 — só o painel da FORJA usa o layout da chave")

# =====================================================================
# 4) CÂMARA DO DROME (sala): mostra os 3 fragmentos junto
# =====================================================================
troca('sala do dromo mostra os 3 fragmentos',
      "html += '</div><div class=\"drome-status\">' + p.fragments + '/' + CONFIG.FRAGMENTS_PER_KEY + ' fragmentos | ' + p.dromeKeys + ' chave(s)</div>';",
      "html += '</div><div class=\"drome-status\">' + p.fragments + '/' + CONFIG.FRAGMENTS_PER_KEY + ' fragmentos | ' + p.dromeKeys + ' chave(s)</div>';\n  html += '<div class=\"drome-status\" style=\"font-size:9.5px;\">🧭 ' + fragCount170('exp') + '/1 · ⚔️ ' + fragCount170('bat') + '/5 · ⚙️ ' + fragCount170('tempo') + '/7 (FORJA-7)</div>'; // v170")

# =====================================================================
# 5) CSS DO PAINEL (bancada verde da FORJA)
# =====================================================================
CSS = """.ck170-shell { position: relative; overflow: auto; max-height: 92vh; padding: 16px 18px 0; background: radial-gradient(120% 100% at 50% 0%, #13261d 0%, #0a1410 45%, #060d0b 100%); border: 2px solid rgba(126,200,80,0.55); border-radius: 16px; box-shadow: 0 0 44px rgba(0,0,0,0.65), inset 0 0 60px rgba(126,200,80,0.06); }
.ck170-shell::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(180deg, rgba(158,240,122,0.04) 0 1px, transparent 1px 4px); mix-blend-mode: screen; }
.ck170-shell::before { content: ''; position: absolute; inset: 3px; border-radius: 13px; border: 1px solid rgba(126,200,80,0.18); pointer-events: none; }
#clerk-panel.ck170 { background: transparent; border: none; box-shadow: none; width: min(940px, 97vw); max-height: 94vh; overflow: visible; padding: 0; }
.ck170-top { display: flex; align-items: center; gap: 14px; padding-top: 4px; }
.ck170-av { width: 62px; height: 62px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; font-size: 30px; border: 2px solid rgba(126,200,80,0.85); background: radial-gradient(circle at 50% 30%, #1b3326, #0a1610); box-shadow: 0 0 18px rgba(126,200,80,0.45); }
.ck170-title { font-size: 19px; font-weight: 900; color: #eaf9e2; letter-spacing: .5px; }
.ck170-title span { font-size: 10px; color: #9ef07a; font-weight: 700; margin-left: 4px; }
.ck170-sub { font-size: 10px; color: #cfe8c0; letter-spacing: 1px; margin-top: 2px; }
.ck170-note { font-size: 10.5px; color: #b6d8c4; font-style: italic; line-height: 1.5; margin-top: 5px; max-width: 620px; }
.ck170-stage { display: grid; grid-template-columns: 88px 1fr 320px; gap: 12px; align-items: center; margin: 12px 0 6px; position: relative; z-index: 3; }
.ck170-left { display: flex; flex-direction: column; gap: 8px; }
.ck170-tile { position: relative; width: 74px; height: 74px; border-radius: 12px; display: grid; place-items: center; font-size: 25px; background: linear-gradient(180deg, #16302a, #0c1a15); border: 1px solid rgba(126,200,80,0.32); }
.ck170-tile span { position: absolute; bottom: 3px; right: 6px; font-size: 9px; color: #9ef07a; font-weight: 700; }
.ck170-tile.ok { border-color: #9ef07a; box-shadow: 0 0 14px rgba(158,240,122,0.35); }
.ck170-art { position: relative; display: grid; place-items: center; min-height: 200px; }
.ck170-key { width: min(100%, 340px); filter: drop-shadow(0 0 12px rgba(126,200,80,0.35)); animation: ck170float 4.5s ease-in-out infinite; }
@keyframes ck170float { 50% { transform: translateY(-5px); } }
.ck170-halo { position: absolute; width: 250px; height: 250px; border-radius: 50%; background: radial-gradient(circle, rgba(126,200,80,0.20), transparent 65%); }
.ck170-art-cap { position: absolute; bottom: 4px; font-size: 9px; letter-spacing: 3px; color: rgba(158,240,122,0.75); font-weight: 800; }
.ck170-right { display: flex; flex-direction: column; gap: 7px; }
.ck170-row { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 10px; background: linear-gradient(180deg, #14231b, #0b1310); border: 1px solid rgba(126,200,80,0.3); }
.ck170-row.no { border-color: rgba(224,92,92,0.5); }
.ck170-row.ok { border-color: rgba(158,240,122,0.8); }
.ck170-ico { width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; display: grid; place-items: center; font-size: 15px; background: #0d1a14; border: 1px solid rgba(126,200,80,0.3); }
.ck170-mid { flex: 1; min-width: 0; }
.ck170-tag { font-size: 8.5px; color: #8fbf9f; letter-spacing: .4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ck170-name { font-size: 10.5px; color: #e6f5e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ck170-bar { height: 5px; border-radius: 3px; background: #0a1410; margin-top: 4px; overflow: hidden; }
.ck170-bar i { display: block; height: 100%; background: linear-gradient(90deg, #4fae4a, #9ef07a); }
.ck170-row.no .ck170-bar i { background: linear-gradient(90deg, #2a6a8a, #53c8e8); }
.ck170-num { font-size: 11px; font-weight: 800; color: #ff9aa8; min-width: 42px; text-align: right; }
.ck170-row.ok .ck170-num { color: #9ef07a; }
.ck170-cost { text-align: center; font-size: 10.5px; color: #cfe8c0; margin: 6px 0 2px; position: relative; z-index: 3; }
.ck170-cost b { color: #f0d98a; }
.ck170-desk { position: sticky; bottom: 0; z-index: 6; margin: 8px -18px 0; padding: 10px 18px 12px; background: linear-gradient(180deg, #14291f, #07130e); border-top: 2px solid rgba(126,200,80,0.4); text-align: center; }
.ck170-go { width: min(430px, 100%); padding: 11px 16px; border-radius: 10px; border: 1px solid rgba(158,240,122,0.85); background: linear-gradient(180deg, #33783a, #1a4a22); color: #eafff0; font-size: 13px; font-weight: 800; letter-spacing: .5px; cursor: pointer; box-shadow: 0 0 16px rgba(126,200,80,0.25); }
.ck170-go:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
.ck170-tip { font-size: 10px; color: #a9c8b4; margin-top: 5px; }
.ck170-alt { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 9px; }
.ck170-go2 { padding: 7px 11px; border-radius: 9px; border: 1px solid rgba(126,200,80,0.35); background: #0d1a14; color: #cfe8c0; font-size: 10px; cursor: pointer; }
.ck170-go2:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 760px) {
  .ck170-stage { grid-template-columns: 1fr; }
  .ck170-left { flex-direction: row; justify-content: center; }
  .ck170-tile { width: 58px; height: 58px; font-size: 21px; }
  .ck170-art { min-height: 150px; }
  .ck170-title { font-size: 16px; }
}
"""
troca('css da forja', '</style>', CSS + '</style>')

# =====================================================================
# 6) TÍTULO + CHANGELOG
# =====================================================================
troca('titulo',
      "<title>Chaotic.idleWorld v2.32 — Materiais por nível + COSTURA-11 holográfica</title>",
      "<title>Chaotic.idleWorld v2.33 — FORJA-7 nova: os 3 fragmentos da Drome Key 🔑</title>")

CHANGELOG = """// ============================================================
// CHAOTIC.IDLEWORLD v2.33 — CHANGELOG (v170 FORJA-7 nova)
// - v170 — A DROME KEY PASSOU A SER FORJADA COM OS 3 FRAGMENTOS:
//   🧭 Fragmento da Exploração ×1 + ⚔️ Fragmento de Batalha ×5 +
//   ⚙️ Fragmento do Tempo ×7 + 💠 400 bits.
//   · 🧭 Exploração — 1 por mapa que chega a 100% de escaneamento (na 1ª vez);
//   · ⚔️ Batalha — 1 por vitória (Dromo de mestre, PVP ou Arena do Chefe);
//   · ⚙️ Tempo — 1 a cada 10 minutos de jogo (com o jogo fechado conta até 3).
// - v170 — PAINEL DA FORJA-7 REPAGINADO (estilo da referência do autor): a CHAVE
//   no centro brilhando, os 3 fragmentos em cartões com contador x/y, o custo de
//   400 bits, o botão "Forjar Drome Key" e a bancada holográfica verde.
//   O caminho antigo (🧩 5 fragmentos do scan) continua como botão secundário.
"""
troca('changelog',
      "// ============================================================\n// CHAOTIC.IDLEWORLD v2.32 — CHANGELOG",
      CHANGELOG + "// ============================================================\n// CHAOTIC.IDLEWORLD v2.32 — CHANGELOG")

io.open(SAIDA, 'w', encoding='utf-8').write(s)
print('✅ v2.33 aplicado em %s (%d B -> %d B)' % (os.path.basename(SAIDA), antes, len(s)))
for t in trocas:
    print('   ·', t)
