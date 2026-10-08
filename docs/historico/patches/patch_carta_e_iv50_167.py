#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_carta_e_iv50_167.py — v2.30 (v167)
1) CARTA DE SCAN REFEITA (captura + Scanner) conforme a referência do autor:
   sem textos soltos (tira "OverWorld · Mapa 2 · Passiva", "Água · Mugic: 2" e a
   habilidade inventada); 4 círculos centrais com os ELEMENTOS + símbolo da TRIBO
   no meio + caixinha de Mugic; rodapé com QUALIDADE DO SCAN (%) + STATUS e o
   CÓDIGO na base. Só ficam: Nome, Raridade, números dos Status, Mugic e Código.
2) ESCALA DE IVs: 31 -> 50 pontos, com sorteio por PESOS (generateCreatureScan):
   Fraco/Comum 60% · Medio/Incomum 25% · Bom/Raro 10% · Excelente/Epico 4,9% ·
   Perfeito/Lendario 0,1%.

Uso: python3 patch_carta_e_iv50_167.py [entrada] [saida]
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
# 1) CSS DA CARTA NOVA
# =====================================================================
CSS = """/* ============================================================
   v167 — CARTA DE SCAN (layout novo, conforme a referência do autor):
   Nome + Raridade no topo · arte com Lv. · 4 status (♥ ⚔ 🎯 🛡) ·
   círculos dos ELEMENTOS em volta do símbolo da TRIBO + caixa de Mugic ·
   QUALIDADE DO SCAN (%) + STATUS · CÓDIGO na base. Sem textos soltos.
   ============================================================ */
.scan-card.c167 { width: min(300px, 88vw); background: linear-gradient(160deg, #2b0a14, #11040a); border: 4px solid #ff4444; border-radius: 16px; padding: 14px; }
.c167-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; position: relative; z-index: 2; }
.c167-name { font-size: 15px; font-weight: 800; color: #fff; font-family: monospace; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.6); }
.c167-rar { font-size: 9px; font-weight: 800; letter-spacing: 1px; padding: 3px 8px; border-radius: 9px; border: 1px solid currentColor; background: rgba(0,0,0,0.35); white-space: nowrap; }
.c167-art { position: relative; height: 128px; border: 3px solid #ff5a6e; border-radius: 10px; background: linear-gradient(180deg, #2a1a1a, #120608); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 10px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5); }
".c167-art .card-sprite { position: relative; z-index: 2; font-size: 84px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); animation: spriteFloat 2s ease-in-out infinite; }
.c167-art::before { content: ''; position: absolute; width: 170px; height: 170px; border-radius: 50%; background: radial-gradient(circle, rgba(255,150,175,0.12), transparent 62%); }
.c167-art::after { content: ''; position: absolute; left: 8%; right: 8%; bottom: 12%; height: 16px; border-radius: 50%; background: radial-gradient(ellipse, rgba(255,255,255,0.07), transparent 70%); }
.c167-lvl { position: absolute; top: 5px; left: 5px; font-size: 9px; font-weight: 700; color: #ffd9a0; background: rgba(0,0,0,0.55); border: 1px solid #a8743a; border-radius: 8px; padding: 1px 7px; z-index: 3; }
.c167-body { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; position: relative; z-index: 2; }
.c167-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; flex: 1; }
.c167-box { background: rgba(0,0,0,0.35); border: 2px solid #fff; border-radius: 8px; padding: 7px 4px; text-align: center; }
.c167-box i { display: block; font-size: 13px; font-style: normal; line-height: 1; margin-bottom: 3px; }
.c167-box b { font-size: 15px; color: #fff; font-family: monospace; }
.c167-orbs { position: relative; width: 122px; height: 118px; flex: none; }
.c167-orb { position: absolute; width: 32px; height: 32px; border-radius: 50%; border: 2px solid #ff5a6e; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 15px; }
.c167-orb.full { border-color: #fff; background: rgba(255,255,255,0.08); box-shadow: 0 0 10px rgba(255,120,140,0.55); }
.c167-center { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%); width: 58px; height: 58px; border-radius: 50%; border: 2px solid #ff5a6e; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 27px; box-shadow: 0 0 12px rgba(255,90,110,0.5); }
.c167-mugic { position: absolute; right: 0; bottom: 0; width: 46px; height: 38px; border-radius: 8px; border: 2px solid #b06cff; background: rgba(40,10,60,0.8); color: #e6c8ff; display: flex; align-items: center; justify-content: center; gap: 2px; font-size: 13px; }
.c167-mugic b { font-size: 15px; color: #fff; font-family: monospace; }
.c167-qual { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; position: relative; z-index: 2; }
.c167-qleft { flex: 1; }
.c167-qline { font-size: 8.5px; letter-spacing: 0.3px; color: #ff9aa6; font-weight: 800; margin-bottom: 3px; white-space: nowrap; }
.c167-qbar { height: 9px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.35); background: rgba(0,0,0,0.45); display: flex; gap: 2px; padding: 1px; }
.c167-status { font-size: 9px; font-weight: 800; color: #fff; letter-spacing: 0.3px; white-space: nowrap; }
.c167-code { background: rgba(0,0,0,0.45); border: 2px solid #ffaa44; border-radius: 8px; padding: 6px 10px; text-align: center; font-size: 15px; font-weight: 800; color: #ffd700; font-family: monospace; letter-spacing: 3px; text-shadow: 0 1px 3px rgba(0,0,0,0.6); position: relative; z-index: 2; }
</style>"""
troca('css carta nova', '</style>', CSS)

# =====================================================================
# 2) NÚCLEO v167 (escala de 50 + construtor da carta)
# =====================================================================
NUCLEO = """/* ============================================================
 * v167 — CARTA DE SCAN (componente visual novo) + ESCALA DE IVs DE 50 PONTOS
 * A carta da captura e a carta do Scanner usam o MESMO construtor
 * (cardScanHTML167): Nome · Raridade · 4 status · círculos dos elementos em
 * volta do símbolo da tribo · Mugic · QUALIDADE DO SCAN (%) · STATUS · Código.
 * Sem textos explicativos soltos (tribo/mapa/passiva, elementos em texto e a
 * habilidade saíram da carta).
 * ============================================================ */
const IV_MAX167 = 50; // teto de cada atributo extra (antes: 31)
const FAIXAS167 = [
  { peso: 0.600, min: 0,  max: 12, label: 'Fraco',     raridade: 'common'    }, // FRACO / Comum
  { peso: 0.250, min: 13, max: 22, label: 'Medio',     raridade: 'uncommon'  }, // MEDIO / Incomum
  { peso: 0.100, min: 23, max: 35, label: 'Bom',       raridade: 'rare'      }, // BOM / Raro
  { peso: 0.049, min: 36, max: 45, label: 'Excelente', raridade: 'epic'      }, // EXCELENTE / Epico
  { peso: 0.001, min: 46, max: 50, label: 'Perfeito',  raridade: 'legendary' }, // PERFEITO / Lendario
];
const GRADE_COR167 = { 'Fraco': '#9aa7b8', 'Medio': '#7ec8d8', 'Bom': '#a78bfa', 'Excelente': '#ff8fa3', 'Perfeito': '#ffd54f' };
const TRIBO_EMOJI167 = { overworld: '🌲', underworld: '🌋', danian: '🐝', mipedian: '🏜️', marrillian: '🌊' };
function corDoGrade167(label) { return GRADE_COR167[label] || '#9aa7b8'; }
/* 1) Sorteio por PESOS da faixa de qualidade (Weighted Random) */
function rolarFaixa167() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < FAIXAS167.length; i++) { acc += FAIXAS167[i].peso; if (r < acc) return FAIXAS167[i]; }
  return FAIXAS167[FAIXAS167.length - 1];
}
/* 2) 4 IVs de 0..50 cuja MÉDIA cai dentro da faixa sorteada */
function gerarIVsNaFaixa167(faixa) {
  const v = [0, 0, 0, 0];
  const base = faixa.min + Math.random() * (faixa.max - faixa.min);
  for (let i = 0; i < 4; i++) v[i] = Math.max(0, Math.min(IV_MAX167, Math.round(base + (Math.random() * 2 - 1) * 11)));
  for (let guard = 0; guard < 80; guard++) {
    const avg = (v[0] + v[1] + v[2] + v[3]) / 4;
    if (avg >= faixa.min - 0.001 && avg <= faixa.max + 0.001) break;
    const sobe = avg < faixa.min;
    let feito = false;
    const k0 = Math.floor(Math.random() * 4);
    for (let i = 0; i < 4; i++) {
      const k = (i + k0) % 4;
      if (sobe && v[k] < IV_MAX167) { v[k]++; feito = true; break; }
      if (!sobe && v[k] > 0) { v[k]--; feito = true; break; }
    }
    if (!feito) break;
  }
  return { str: v[0], dex: v[1], vit: v[2], int: v[3] };
}
/* 3) generateCreatureScan() — a função do scan: faixa por peso + IVs + grade */
function generateCreatureScan() {
  const faixa = rolarFaixa167();
  const ivs = gerarIVsNaFaixa167(faixa);
  const avg = (ivs.str + ivs.dex + ivs.vit + ivs.int) / 4;
  return { ivs: ivs, faixa: faixa, grade: faixa.label, rarity: faixa.raridade, avg: avg, pct: Math.round((avg / IV_MAX167) * 100) };
}
/* 4) Elementos e tribo para a carta */
function emojiElemento167(el) {
  if (el === 'Fogo') return '🔥'; if (el === 'Água') return '💧'; if (el === 'Terra') return '🌍'; if (el === 'Ar') return '🌪️';
  return el || '';
}
function elementosCard167(card, type) {
  const limpa = function (arr) {
    return (arr || []).filter(function (e) { return e && e !== '✨' && e !== '❓' && e !== '⭐' && e !== '👑'; }).slice(0, 4);
  };
  if (type && type.banco164) return limpa((type.elements || []).map(emojiElemento167));
  if (card && Array.isArray(card.elements) && card.elements.length) return limpa(card.elements);
  if (type && type.elements && type.elements.length) return limpa(type.elements.map(emojiElemento167));
  return [];
}
/* 5) O componente: uma função, duas telas (captura e Scanner) */
function cardScanHTML167(o) {
  const rr = RARITIES[o.rarity] || RARITIES.common;
  const gl = o.grade || 'Fraco';
  const gc = corDoGrade167(gl);
  const pct = Math.max(0, Math.min(100, Math.round(o.pct || 0)));
  const cheios = Math.round(pct / 10);
  let barra = '';
  for (let i = 0; i < 10; i++) {
    let bg = 'rgba(255,255,255,0.10)';
    if (i < cheios) bg = 'linear-gradient(180deg,#b7ff6b,#59b32c)';
    if (i === cheios - 1) bg = 'linear-gradient(180deg,#ffe066,#f0a92a)';
    barra += '<i style="flex:1;border-radius:2px;background:' + bg + '"></i>';
  }
  const els = (o.elems || []).slice(0, 3);
  const posicoes = ['left:0;top:0;', 'right:0;top:0;', 'left:0;bottom:16px;'];
  let orbs = '';
  for (let i = 0; i < 3; i++) {
    orbs += '<div class="c167-orb' + (els[i] ? ' full' : '') + '" style="' + posicoes[i] + '">' + (els[i] || '') + '</div>';
  }
  const tribo = TRIBO_EMOJI167[o.tribe] || '🌀';
  return '<div class="scan-card c167" style="border-color:' + rr.color + ';">' +
      '<div class="card-rarity-glow" style="color:' + rr.color + ';"></div>' +
      '<div class="c167-head">' +
        '<div class="c167-name">' + o.name + '</div>' +
        '<div class="c167-rar" style="color:' + rr.color + ';">' + rr.name.toUpperCase() + '</div>' +
      '</div>' +
      '<div class="c167-art">' +
        '<div class="c167-lvl">Lv.' + o.level + '</div>' +
        getCardSpriteHTML(o.spriteName || o.name, o.spriteSize || 84) +
      '</div>' +
      '<div class="c167-body">' +
        '<div class="c167-stats">' +
          '<div class="c167-box"><i>❤️</i><b>' + o.hp + '</b></div>' +
          '<div class="c167-box"><i>⚔️</i><b>' + o.atk + '</b></div>' +
          '<div class="c167-box"><i>🎯</i><b>' + o.dex + '</b></div>' +
          '<div class="c167-box"><i>🛡️</i><b>' + o.vit + '</b></div>' +
        '</div>' +
        '<div class="c167-orbs">' + orbs +
          '<div class="c167-center">' + tribo + '</div>' +
          '<div class="c167-mugic">🎵<b>' + (o.mugic || 0) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="c167-qual">' +
        '<div class="c167-qleft">' +
          '<div class="c167-qline">QUALIDADE DO SCAN: ' + pct + '%</div>' +
          '<div class="c167-qbar">' + barra + '</div>' +
        '</div>' +
        '<div class="c167-status" style="color:' + gc + ';">STATUS: ' + gl.toUpperCase() + '</div>' +
      '</div>' +
      '<div class="c167-code">' + o.code + '</div>' +
    '</div>';
}
"""
troca('nucleo v167',
      "/* ============================================================\n * v165 — A FICHA DO BANCO VALE NA BATALHA",
      NUCLEO + "/* ============================================================\n * v165 — A FICHA DO BANCO VALE NA BATALHA")

# =====================================================================
# 3) ESCALA 50: generateIVs + ivGrade
# =====================================================================
troca('generateIVs',
      "function generateIVs() { return { str: Math.floor(Math.random() * 32), dex: Math.floor(Math.random() * 32), vit: Math.floor(Math.random() * 32), int: Math.floor(Math.random() * 32) }; }",
      "function generateIVs() { return generateCreatureScan().ivs; } // v167 — IVs de 0..50 com os pesos do autor (antes: 0..31 uniforme)")

troca('ivGrade',
      """function ivGrade(ivs) {
  const avg = (ivs.str + ivs.dex + ivs.vit + ivs.int) / 4;
  if (avg >= 28) return { label: 'Perfeito', color: '#ffd54f' }; if (avg >= 22) return { label: 'Excelente', color: '#ff8fa3' };
  if (avg >= 15) return { label: 'Bom', color: '#a78bfa' }; if (avg >= 8) return { label: 'Medio', color: '#7ec8d8' };
  return { label: 'Fraco', color: '#888' };
}""",
      """function ivGrade(ivs) {
  // v167 — escala de 50 pontos: as faixas são as MESMAS do sorteio por peso
  const avg = (ivs.str + ivs.dex + ivs.vit + ivs.int) / 4;
  if (avg >= 46) return { label: 'Perfeito', color: corDoGrade167('Perfeito') };
  if (avg >= 36) return { label: 'Excelente', color: corDoGrade167('Excelente') };
  if (avg >= 23) return { label: 'Bom', color: corDoGrade167('Bom') };
  if (avg >= 13) return { label: 'Medio', color: corDoGrade167('Medio') };
  return { label: 'Fraco', color: corDoGrade167('Fraco') };
}""")

# =====================================================================
# 4) ROLETA / LEILÃO: mesma escala (e a carta passa a guardar o grade)
# =====================================================================
troca('roleta ivs',
      """  const ivs = { hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32), def: Math.floor(Math.random() * 32), spd: Math.floor(Math.random() * 32) };
  const ivAvg = Math.round((ivs.hp + ivs.atk + ivs.def + ivs.spd) / 4);
  const ivPercent = Math.round((ivAvg / 31) * 100);
  let rarity = 'common';
  if (ivAvg >= 28) rarity = 'legendary'; else if (ivAvg >= 23) rarity = 'epic'; else if (ivAvg >= 18) rarity = 'rare'; else if (ivAvg >= 12) rarity = 'uncommon';""",
      """  const _rol167 = generateCreatureScan(); // v167 — a Roleta usa a MESMA escala de 50 pontos do scan
  const ivs = { str: _rol167.ivs.str, dex: _rol167.ivs.dex, vit: _rol167.ivs.vit, int: _rol167.ivs.int };
  const ivAvg = Math.round(_rol167.avg);
  const ivPercent = _rol167.pct;
  let rarity = _rol167.rarity;""")

troca('roleta retorno',
      "ivs: ivs, ivAvg: ivAvg, ivPercent: ivPercent, rarity: rarity, rarityName:",
      "ivs: ivs, grade: _rol167.grade, ivAvg: ivAvg, ivPercent: ivPercent, rarity: rarity, rarityName:")

troca('roleta elementos',
      "  const _ivsElem164 = { str: ivs.hp, dex: ivs.atk, vit: ivs.def, int: ivs.spd };\n"
      "  const elements = enemyType.banco164 ? elementosDaCarta164(enemyType, _ivsElem164) : getCardElements(_ivsElem164); // v164 — criatura do banco usa os elementos dela",
      "  const elements = enemyType.banco164 ? elementosCard167(null, enemyType) : getCardElements(ivs); // v167 — elementos reais (sem enchimento)")

# =====================================================================
# 5) A CARTA DA CAPTURA
# =====================================================================
CARD_CAPTURA_VELHO = """function showScanCard(enemy) {
  // Remove carta anterior se existir
  const existing = document.getElementById('scan-card-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'scan-card-overlay';
  overlay.id = 'scan-card-overlay';
  const elements = (enemy.type && enemy.type.banco164) ? elementosDaCarta164(enemy.type, enemy.ivs) : getCardElements(enemy.ivs); // v164 — elementos do banco
  const code = generateCardCode();
  const grade = ivGrade(enemy.ivs);
  const hp = enemy.maxHp;
  const atk = enemy.type.atk + Math.max(0, (enemy.level - enemy.type.level));
  const ivAvg = Math.floor((enemy.ivs.str + enemy.ivs.dex + enemy.ivs.vit + enemy.ivs.int) / 4);

  overlay.innerHTML =
    '<div class="scan-card" style="border-color: ' + grade.color + ';">' +
      '<div class="card-rarity-glow" style="color: ' + grade.color + ';"></div>' +
      '<div class="scan-card-header">' +
        '<div class="scan-card-name">' + enemy.type.name + '</div>' +
        '<div class="scan-card-level">Lv.' + enemy.level + '</div>' +
      '</div>' +
      '<div class="scan-card-image">' +
        getCardSpriteHTML(enemy.type.name, 72) +
        '<div style="position:absolute;bottom:4px;right:6px;font-size:10px;color:' + grade.color + ';font-weight:700;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:4px;border:1px solid ' + grade.color + ';">' + grade.label + '</div>' +
        '<div class="card-iv-bar"><div class="card-iv-fill" style="width:' + Math.min(100, (ivAvg / 31) * 100) + '%"></div></div>' +
      '</div>' +
      '<div class="scan-card-stats">' +
        '<div class="card-stat-box"><span class="card-stat-icon">❤️</span><span class="card-stat-val">' + hp + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">⚔️</span><span class="card-stat-val">' + atk + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">🎯</span><span class="card-stat-val">' + enemy.ivs.dex + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">🛡️</span><span class="card-stat-val">' + enemy.ivs.vit + '</span></div>' +
      '</div>' +
      '<div class="card-elements">' +
        '<div class="card-element">' + elements[0] + '</div>' +
        '<div class="card-element">' + elements[1] + '</div>' +
        '<div class="card-element">' + elements[2] + '</div>' +
        '<div class="card-element">' + elements[3] + '</div>' +
      '</div>' +
      fichaBanco164(enemy.type) +
      '<div class="card-code">' + code + '</div>' +
    '</div>';
  document.getElementById('ui-layer').appendChild(overlay);

  overlay.onclick = function() { overlay.remove(); };
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 6000);

  if (!GameState.player.scannedCards) GameState.player.scannedCards = [];
  GameState.player.scannedCards.push(normalizeScanCard({
    name: enemy.type.name, level: enemy.level, hp: hp, atk: atk,
    ivs: enemy.ivs, grade: grade.label, code: code, elements: elements, timestamp: Date.now(),
    rarity: pisoRaridade164(enemy.type, raridadeDoGrade164(grade.label)), // v164 — raridade da espécie vira o piso
    banco: enemy.type.banco164 || null, tribe: enemy.type.tribo164 || null, rare: !!enemy.type.isRare,
    tier: enemy.type.tier164 || null, ability: enemy.type.ability164 || null,
    mugicCounters: enemy.type.mugic164 || 0, moveSpeed: enemy.type.moveSpeed164 || null,
    desc: enemy.type.desc164 || null
  }));
}"""

CARD_CAPTURA_NOVO = """function showScanCard(enemy) {
  // v167 — carta nova (só Nome, Raridade, Status, Mugic e Código)
  const existing = document.getElementById('scan-card-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'scan-card-overlay';
  overlay.id = 'scan-card-overlay';
  const code = generateCardCode();
  const grade = ivGrade(enemy.ivs);
  const hp = enemy.maxHp;
  const atk = enemy.type.atk + Math.max(0, (enemy.level - enemy.type.level));
  const ivAvg = (enemy.ivs.str + enemy.ivs.dex + enemy.ivs.vit + enemy.ivs.int) / 4;
  const elements = (enemy.type && enemy.type.banco164) ? elementosCard167(null, enemy.type) : getCardElements(enemy.ivs);
  const rarity = pisoRaridade164(enemy.type, raridadeDoGrade164(grade.label)); // v164 — raridade da espécie vira o piso

  overlay.innerHTML = cardScanHTML167({
    name: enemy.type.name, level: enemy.level, hp: hp, atk: atk,
    dex: enemy.ivs.dex, vit: enemy.ivs.vit, grade: grade.label, pct: Math.round((ivAvg / IV_MAX167) * 100),
    rarity: rarity, code: code, elems: elements,
    tribe: (enemy.type && enemy.type.tribo164) || null,
    mugic: (enemy.type && enemy.type.mugic164) || 0, spriteName: enemy.type.name, spriteSize: 84
  });
  document.getElementById('ui-layer').appendChild(overlay);

  overlay.onclick = function() { overlay.remove(); };
  setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 8000);

  if (!GameState.player.scannedCards) GameState.player.scannedCards = [];
  GameState.player.scannedCards.push(normalizeScanCard({
    name: enemy.type.name, level: enemy.level, hp: hp, atk: atk,
    ivs: enemy.ivs, grade: grade.label, code: code, elements: elements, timestamp: Date.now(),
    rarity: rarity,
    banco: enemy.type.banco164 || null, tribe: enemy.type.tribo164 || null, rare: !!enemy.type.isRare,
    tier: enemy.type.tier164 || null, ability: enemy.type.ability164 || null,
    mugicCounters: enemy.type.mugic164 || 0, moveSpeed: enemy.type.moveSpeed164 || null,
    desc: enemy.type.desc164 || null
  }));
}"""
troca('carta da captura', CARD_CAPTURA_VELHO, CARD_CAPTURA_NOVO)

# =====================================================================
# 6) A CARTA DO SCANNER (acervo)
# =====================================================================
CARD_SCANNER_VELHO = """function showScanCardFromInventory(card) {
  const overlay = document.createElement('div');
  overlay.className = 'scan-card-overlay';
  overlay.id = 'scan-card-overlay';
  const civs = card.ivs || { str: 0, dex: 0, vit: 0, int: 0 };
  const cels = (Array.isArray(card.elements) && card.elements.length >= 4) ? card.elements : ['❓', '❓', '❓', '❓'];
  card.ivs = civs; card.elements = cels;
  const ivAvg = Math.floor((civs.str + civs.dex + civs.vit + civs.int) / 4);
  const gradeColor = card.grade === 'Perfeito' ? '#ffd54f' : card.grade === 'Excelente' ? '#ff8fa3' : card.grade === 'Bom' ? '#a78bfa' : card.grade === 'Medio' ? '#7ec8d8' : '#888';
  overlay.innerHTML =
    '<div class="scan-card" style="border-color: ' + gradeColor + ';">' +
      '<div class="card-rarity-glow" style="color: ' + gradeColor + ';"></div>' +
      '<div class="scan-card-header">' +
        '<div class="scan-card-name">' + card.name + '</div>' +
        '<div class="scan-card-level">Lv.' + card.level + '</div>' +
      '</div>' +
      '<div class="scan-card-image">' +
        getCardSpriteHTML(card.name, 72) +
        '<div style="position:absolute;bottom:4px;right:6px;font-size:10px;color:' + gradeColor + ';font-weight:700;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:4px;border:1px solid ' + gradeColor + ';">' + card.grade + '</div>' +
        '<div class="card-iv-bar"><div class="card-iv-fill" style="width:' + Math.min(100, (ivAvg / 31) * 100) + '%"></div></div>' +
      '</div>' +
      '<div class="scan-card-stats">' +
        '<div class="card-stat-box"><span class="card-stat-icon">❤️</span><span class="card-stat-val">' + card.hp + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">⚔️</span><span class="card-stat-val">' + card.atk + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">🎯</span><span class="card-stat-val">' + card.ivs.dex + '</span></div>' +
        '<div class="card-stat-box"><span class="card-stat-icon">🛡️</span><span class="card-stat-val">' + card.ivs.vit + '</span></div>' +
      '</div>' +
      '<div class="card-elements">' +
        '<div class="card-element">' + card.elements[0] + '</div>' +
        '<div class="card-element">' + card.elements[1] + '</div>' +
        '<div class="card-element">' + card.elements[2] + '</div>' +
        '<div class="card-element">' + card.elements[3] + '</div>' +
      '</div>' +
      '<div class="card-code">' + card.code + '</div>' +
    '</div>';
  document.getElementById('ui-layer').appendChild(overlay);
  overlay.onclick = function() { overlay.remove(); };
}"""

CARD_SCANNER_NOVO = """function showScanCardFromInventory(card) {
  // v167 — MESMO componente da captura (nome, raridade, status, elementos/tribo, mugic, qualidade e código)
  const velha = document.getElementById('scan-card-overlay');
  if (velha) velha.remove();
  const overlay = document.createElement('div');
  overlay.className = 'scan-card-overlay';
  overlay.id = 'scan-card-overlay';
  const civs = card.ivs || { str: 0, dex: 0, vit: 0, int: 0 };
  card.ivs = civs;
  const grade = ivGrade(civs);
  const gl = card.grade || grade.label;
  const ivAvg = (civs.str + civs.dex + civs.vit + civs.int) / 4;
  const tipo = (typeof especieDaCarta165 === 'function') ? especieDaCarta165(card) : null;
  overlay.innerHTML = cardScanHTML167({
    name: card.name, level: card.level, hp: card.hp, atk: card.atk,
    dex: civs.dex, vit: civs.vit, grade: gl, pct: Math.round((ivAvg / IV_MAX167) * 100),
    rarity: card.rarity || raridadeDoGrade164(gl), code: card.code,
    elems: elementosCard167(card, tipo),
    tribe: card.tribe || (tipo && tipo.tribo164) || null,
    mugic: card.mugicCounters || (tipo && tipo.mugic164) || 0,
    spriteName: card.name, spriteSize: 84
  });
  document.getElementById('ui-layer').appendChild(overlay);
  overlay.onclick = function() { overlay.remove(); };
}"""
troca('carta do scanner', CARD_SCANNER_VELHO, CARD_SCANNER_NOVO)

# =====================================================================
# 7) PAINEL DO SCANNER: barras de IV na escala 50 (e sem a linha da habilidade)
# =====================================================================
troca('painel ivBar',
      "  const ivBar = function(val) { const pct = (val / 31) * 100; const cls = val >= 25 ? 'iv-high' : val >= 15 ? 'iv-mid' : 'iv-low'; return '<span class=\"iv-bar\"><span class=\"iv-fill ' + cls + '\" style=\"width:' + pct + '%\"></span></span>'; };",
      "  const ivBar = function(val) { const pct = (val / IV_MAX167) * 100; const cls = val >= 36 ? 'iv-high' : val >= 20 ? 'iv-mid' : 'iv-low'; return '<span class=\"iv-bar\"><span class=\"iv-fill ' + cls + '\" style=\"width:' + pct + '%\"></span></span>'; }; // v167 — escala de 50")

troca('painel sem habilidade',
      "      '<div class=\"scan-row\"><span class=\"scan-label\">Habilidade</span><span class=\"scan-val\">' + (enemy.type.ability164 ? enemy.type.ability164.n : '—') + '</span></div>' +\n",
      "")

# =====================================================================
# 8) ELEMENTOS: sem marcadores de qualidade e sem enchimento
# =====================================================================
troca('getCardElements',
      "  const e3 = avg >= 20 ? '⭐' : elements[Math.floor(Math.random() * elements.length)];\n  const e4 = avg >= 28 ? '👑' : elements[Math.floor(Math.random() * elements.length)];",
      "  const e3 = avg >= 30 ? '⭐' : elements[Math.floor(Math.random() * elements.length)]; // v167 — escala de 50\n  const e4 = avg >= 42 ? '👑' : elements[Math.floor(Math.random() * elements.length)];")

troca('elementosDaCarta164',
      "  if (avg >= 20) chips.push('⭐');\n  if (avg >= 28) chips.push('👑');",
      "  if (avg >= 30) chips.push('⭐'); // v167 — escala de 50\n  if (avg >= 42) chips.push('👑');")

# =====================================================================
# 9) sanitizeCard: guardar os elementos reais (1..4) em vez de exigir 4
# =====================================================================
troca('sanitizeCard elementos',
      "    elements: (Array.isArray(c.elements) && c.elements.length >= 4) ? c.elements.slice(0, 4) : ['❓', '❓', '❓', '❓'],",
      "    elements: (Array.isArray(c.elements) && c.elements.length) ? c.elements.slice(0, 4) : ['❓'], // v167 — 1 a 4 elementos reais")

# =====================================================================
# 10) TÍTULO + CHANGELOG
# =====================================================================
troca('titulo',
      "<title>Chaotic.idleWorld v2.29 — O banco de 120 no jogo inteiro (Roleta, Leilão, Drome, Mestres)</title>",
      "<title>Chaotic.idleWorld v2.30 — Carta de scan nova + qualidade em 50 pontos</title>")

CHANGELOG = """// ============================================================
// CHAOTIC.IDLEWORLD v2.30 — CHANGELOG (v167 Carta nova + escala de 50 pontos)
// - v167 — CARTA DE SCAN REFEITA (captura e Scanner, um só componente): saíram
//   os textos soltos ("OverWorld · Mapa 2 · Passiva", "Água · Mugic: 2") e a
//   habilidade; ficaram Nome, Raridade, os 4 status, o Mugic e o Código. Os
//   círculos centrais agora mostram os ELEMENTOS (1 ou 2) em volta do símbolo
//   da TRIBO, e o rodapé traz QUALIDADE DO SCAN (%), STATUS e o código.
// - v167 — QUALIDADE EM 50 PONTOS COM PESOS: cada atributo extra (Coragem,
//   Poder, Sabedoria, Velocidade) vai de 0 a 50 (antes 31). generateCreatureScan()
//   sorteia a faixa por peso: FRACO/Comum 60% (média 0-12) · MEDIO/Incomum 25%
//   (13-22) · BOM/Raro 10% (23-35) · EXCELENTE/Epico 4,9% (36-45) ·
//   PERFEITO/Lendario 0,1% (46-50). Roleta e Leilão usam a mesma escala.
"""
troca('changelog',
      "// ============================================================\n// CHAOTIC.IDLEWORLD v2.29 — CHANGELOG",
      CHANGELOG + "// ============================================================\n// CHAOTIC.IDLEWORLD v2.29 — CHANGELOG")

io.open(SAIDA, 'w', encoding='utf-8').write(s)
print('✅ v2.30 aplicado em %s (%d B -> %d B)' % (os.path.basename(SAIDA), antes, len(s)))
for t in trocas:
    print('   ·', t)
