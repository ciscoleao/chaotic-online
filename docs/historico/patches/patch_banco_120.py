# -*- coding: utf-8 -*-
"""v2.27 / patch v164 — INTEGRAÇÃO DO BANCO DE 120 CRIATURAS.

Pedido: "pode integrar o banco de 120 criaturas".

O que este patch faz (o banco vira a fonte de verdade do spawn):
- Injeta as 120 criaturas do banco (4 tribos x 30; mapas 1/2/3 do banco) como
  ESPÉCIES DE VERDADE do jogo (ENEMY_TYPES): nomes, HP/ATK/velocidade/XP/Bits,
  arte, elementos, habilidade, Mugic, raridade e agressividade — tudo do banco.
- Cada região do jogo passa a nascer SÓ com as criaturas da sua tribo e do seu
  nível (Bosque Verdejante = OverWorld m1, Cavernas de Brasas = UnderWorld m1,
  ...). A Lagoa Negra M'arrillian (5ª tribo) continua com o pool clássico, porque
  o banco não tem M'arrillians.
- Cria a região que faltava para o 3º mapa dos Mipedians ("Miragens do
  Palmeiral", Lv.20 + 100% do mapa anterior): o banco tem 15 criaturas para ela.
- Spawn ponderado pelo banco: passiva 34 · agressiva 26 · RARA 12 (a rara é rara).
- Velocidade de caminhada POR ESPÉCIE (baseSpeed do banco, teto de 175 px/s para
  o herói de 140 px/s ainda alcançar) — a RARA +20% continua valendo.
- Cartas: elemento/habilidade/Mugic/raridade da espécie aparecem no scan, na
  roleta e no Scanner; a raridade da espécie vira o PISO da carta (Rara nunca sai
  como Comum, muito-forte nunca sai como Comum).
- HUD: o banner do mapa e o Portal mostram quantas espécies vivem no mapa.
"""
import io, sys, os, json

ARQ = 'chaotic_idleworld_v123.html'
BANCO_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'creatures', 'data', 'creatures.json')

TRIBO_GAME = {'OverWorld': 'overworld', 'UnderWorld': 'underworld', 'Danian': 'danian', 'Mipedian': 'mipedian'}

s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot, n=1):
    global s
    q = s.count(velho)
    if q != n:
        print('ABORTADO (%s): esperava %d ocorrencia(s), achei %d' % (rot, n, q)); sys.exit(1)
    s = s.replace(velho, novo, n); print('ok: ' + rot + (' x%d' % n if n > 1 else ''))

# ---------------------------------------------------------------- 1) literal do banco
criaturas = json.load(io.open(BANCO_JSON, encoding='utf-8'))
if len(criaturas) != 120:
    print('ABORTADO: esperava 120 criaturas, achei %d' % len(criaturas)); sys.exit(1)

registros = []
for c in criaturas:
    registros.append({
        'id': c['id'], 'n': c['name'], 't': TRIBO_GAME[c['tribe']], 'm': c['mapLevel'], 'lvl': c['level'],
        'el': list(c['elements']), 'ek': c['elementKind'], 'tint': c['tint'],
        'agg': bool(c['isAggressive']), 'rar': bool(c['isRare']), 'tier': c['powerTier'], 'mug': c['mugicCounters'],
        'hp': c['stats']['courage'], 'atk': c['baseDamage'], 'spd': c['baseSpeed'],
        'xp': c['rewards']['xp'], 'b0': c['rewards']['bits'][0], 'b1': c['rewards']['bits'][1],
        'art': c['art'],
        'ab': {'n': c['ability']['name'], 't': c['ability']['type'], 'mc': c['ability']['manaCost'], 'd': c['ability']['desc']},
        'd': c['desc'], 'w': c['spawnWeight'],
    })

literal = ('/* ============================================================\n'
           ' * v164 — BANCO DE 120 CRIATURAS (4 tribos x 30) — fonte de verdade do spawn.\n'
           ' * Gerado a partir de creatures/data/creatures.json (tools/gerar_banco.js).\n'
           ' * Campos: id · n(ome) · t(ribo) · m(apa 1/2/3) · lvl · el(ementos) · ek · tint ·\n'
           ' * agg · rar · tier · mug(ic) · hp · atk · spd(px/s) · xp · b0/b1(bits) · art ·\n'
           ' * ab(ilidad) · d(escrição) · w(peso de spawn).\n'
           ' * ============================================================ */\n'
           'const BANCO164 = ' + json.dumps(registros, ensure_ascii=False, separators=(',', ':')) + ';\n')
troca('const MAP_POOLS = {', literal + 'const MAP_POOLS = {', 'literal do banco (120 criaturas) antes de MAP_POOLS')

troca('CONFIG.MONSTER_WANDER_SPEED', 'velAndar164(e)', 'velocidade por espécie (banco, teto 175)', n=8)

# ---------------------------------------------------------------- 2) bloco v164
BLOCO = r"""/* ============================================================
 * v164 — INTEGRAÇÃO DO BANCO DE 120 CRIATURAS (4 tribos x 30)
 * Cada criatura do banco é uma espécie do jogo: nasce no mapa da sua tribo e do
 * seu nível, com os atributos/arte/elementos/habilidade/Mugic do banco.
 * ============================================================ */
const TRIBOS164 = { overworld: 'OverWorld', underworld: 'UnderWorld', danian: 'Danian', mipedian: 'Mipedian' };
const MAPA_PARA_REGIAO164 = { // (tribo do banco + mapa do banco) -> região do jogo
  'overworld:1': 'ow_grove', 'overworld:2': 'meadow', 'overworld:3': 'forest',
  'underworld:1': 'uw_ember', 'underworld:2': 'lava_cave', 'underworld:3': 'mountain',
  'danian:1': 'dan_hive', 'danian:2': 'swamp', 'danian:3': 'void_rim',
  'mipedian:1': 'mip_oasis', 'mipedian:2': 'time_ruins', 'mipedian:3': 'mp_mirage',
};
const ELEMENTO_EMOJI164 = { 'Terra': '🌍', 'Água': '💧', 'Fogo': '🔥', 'Ar': '🌪️' };
const ORDEM_RARIDADE164 = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const PESO_PADRAO164 = 34;  // passiva 34 · agressiva 26 · rara 12 (pesos do banco)
const VEL_MAX164 = 175;     // teto de velocidade: o herói (140 px/s) precisa alcançar
const CAVE_MONSTERS164 = 0; // (reservado)

/* 1) As 120 criaturas do banco entram no ENEMY_TYPES como espécies de verdade */
const BANCO_POR_REGIAO164 = {};
BANCO164.forEach(function (b) {
  const regiao = MAPA_PARA_REGIAO164[b.t + ':' + b.m];
  let t = ENEMY_TYPES.find(function (e) { return e.name === b.n; });
  if (!t) { t = { name: b.n, regions: [] }; ENEMY_TYPES.push(t); }
  t.hp = b.hp; t.atk = b.atk; t.xp = b.xp; t.bits = [b.b0, b.b1]; t.level = b.lvl; t.art = b.art;
  t.isAggressive = !!b.agg; t.isRare = !!b.rar; t.regions = t.regions || [];
  t.banco164 = b.id; t.tribo164 = b.t; t.mapa164 = b.m; t.tier164 = b.tier;
  t.elements = b.el.slice(); t.elementKind = b.ek; t.tint = b.tint;
  t.mugic164 = b.mug; t.moveSpeed164 = b.spd; t.ability164 = b.ab; t.desc164 = b.d; t.peso164 = b.w;
  if (regiao) (BANCO_POR_REGIAO164[regiao] = BANCO_POR_REGIAO164[regiao] || []).push(b.n);
});
/* 2) O mapa nasce SÓ com as criaturas do banco da sua tribo/nível */
Object.keys(BANCO_POR_REGIAO164).forEach(function (reg) { MAP_POOLS[reg] = BANCO_POR_REGIAO164[reg].slice(); });
/* 3) A região que faltava: o mapa 3 dos Mipedians (o banco tem 15 criaturas para ele) */
if (!REGIONS.some(function (r) { return r.id === 'mp_mirage'; })) {
  REGIONS.push({
    id: 'mp_mirage', name: 'Miragens do Palmeiral', tribe: 'mipedian', mapLevel: 3, safe: false, level: 20,
    color: 0xc0a86a, desc: 'O palmeiral invertido no espelho do deserto — onde os Mipedians treinam as miragens.',
    landmarks: ['Palmeiral Invertido', 'Espelho de Areia'], width: 3600, height: 2600,
    theme: { grass: '#c2a86a', grassD1: '#ccb376', grassD2: '#b69c5e', sand: '#e8d9a8', fog: 2.0 },
  });
}
/* 4) Recalcula em que mapas cada espécie vive (o pool é a fonte de verdade) */
(function () {
  ENEMY_TYPES.forEach(function (t) { t.regions = []; });
  Object.keys(MAP_POOLS).forEach(function (rid) {
    (MAP_POOLS[rid] || []).forEach(function (n) {
      const t = ENEMY_TYPES.find(function (e) { return e.name === n; });
      if (t && t.regions.indexOf(rid) < 0) t.regions.push(rid);
    });
  });
})();
/* 5) Sorteio ponderado do banco (a rara sai bem menos que a passiva) */
function sorteiaEspecie164(pool) {
  if (!pool || !pool.length) return null;
  let total = 0;
  for (let i = 0; i < pool.length; i++) total += (pool[i].peso164 || PESO_PADRAO164);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= (pool[i].peso164 || PESO_PADRAO164); if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}
/* 6) Velocidade de caminhada da espécie (banco) com teto de perseguição */
function velAndar164(e) {
  const v = (e && e.type && e.type.moveSpeed164) || CONFIG.MONSTER_WANDER_SPEED;
  return Math.min(VEL_MAX164, v);
}
/* 7) Rótulo do mapa: ✷ marca a espécie RARA; ☮️ marca a passiva (não persegue) */
function rotulo164(et, nivel) {
  return et.name + ' Lv.' + nivel + (et.isRare ? ' ★' : '') + (et.isAggressive ? '' : ' ☮️');
}
function tipoDaEspecie164(type) {
  if (type.isRare) return '★ Rara' + (type.isAggressive ? ' e agressiva' : '');
  return type.isAggressive ? '⚔️ Agressiva' : '☮️ Passiva';
}
/* 8) Cartas: elementos do banco + piso de raridade da espécie */
function elementosDaCarta164(type, ivs) {
  const chips = (type.elements || []).map(function (el) { return ELEMENTO_EMOJI164[el] || '✨'; });
  const avg = ivs ? ((ivs.str + ivs.dex + ivs.vit + ivs.int) / 4) : 0;
  if (avg >= 20) chips.push('⭐');
  if (avg >= 28) chips.push('👑');
  while (chips.length < 4) chips.push('✨');
  return chips.slice(0, 4);
}
function raridadeDoGrade164(grade) {
  return grade === 'Perfeito' ? 'legendary' : grade === 'Excelente' ? 'epic' : grade === 'Bom' ? 'rare' : grade === 'Medio' ? 'uncommon' : 'common';
}
function pisoRaridade164(type, raridade) {
  const piso = (type && type.isRare) ? 'rare' : (type && type.tier164 === 'muito-forte') ? 'uncommon' : null;
  if (!piso) return raridade || 'common';
  return ORDEM_RARIDADE164.indexOf(raridade || 'common') < ORDEM_RARIDADE164.indexOf(piso) ? piso : (raridade || 'common');
}
function fichaBanco164(type) {
  if (!type || !type.banco164) return '';
  const els = (type.elements || []).map(function (el) { return (ELEMENTO_EMOJI164[el] || '✨') + ' ' + el; }).join(' · ');
  return '<div style="margin-top:6px;font-size:10px;line-height:1.5;color:#cfe8a0;">' +
    (TRIBOS164[type.tribo164] || '') + ' · Mapa ' + type.mapa164 + ' · ' + tipoDaEspecie164(type) + '<br>' +
    els + ' · 🎵 Mugic: ' + (type.mugic164 || 0) + '<br>' +
    '🔮 ' + (type.ability164 ? type.ability164.n : '—') + '</div>';
}
"""
troca('const AGGRO_BASE148 = 150;', BLOCO + 'const AGGRO_BASE148 = 150;', 'bloco v164 (banco integrado)')

# ---------------------------------------------------------------- 3) spawn: ponderado
troca('const et = this.regionEnemies[Math.floor(Math.random() * this.regionEnemies.length)];',
      'const et = sorteiaEspecie164(this.regionEnemies); // v164 — sorteio ponderado do banco (rara é rara)', 'sorteio ponderado (Perim + Caverna)', n=2)

# ---------------------------------------------------------------- 4) velocidade por espécie

# ---------------------------------------------------------------- 5) rótulos com ✷ (rara)
troca(", et.name + ' Lv.' + enemy.level + ' ☮️', { fontSize: '9px', color: '#aaffaa'",
      ", rotulo164(et, enemy.level), { fontSize: '9px', color: '#aaffaa'", 'rótulo passivo (Perim + Caverna)', n=2)
troca(", et.name + ' Lv.' + enemy.level, { fontSize: '9px', color: '#ffaaaa'",
      ", rotulo164(et, enemy.level), { fontSize: '9px', color: '#ffaaaa'", 'rótulo agressivo (Perim + Caverna + arena)', n=3)

# ---------------------------------------------------------------- 6) carta da roleta
troca('  const rarityData = RARITIES[rarity];',
      '  if (enemyType.banco164) rarity = pisoRaridade164(enemyType, rarity); // v164 — raridade da espécie = piso da carta\n  const rarityData = RARITIES[rarity];',
      'roleta: piso de raridade')
troca('  const elements = getCardElements({ str: ivs.hp, dex: ivs.atk, vit: ivs.def, int: ivs.spd }); // v128 — ivs corretos (antes: string → NaN, sem estrelas/coroas)',
      '  const _ivsElem164 = { str: ivs.hp, dex: ivs.atk, vit: ivs.def, int: ivs.spd };\n'
      '  const elements = enemyType.banco164 ? elementosDaCarta164(enemyType, _ivsElem164) : getCardElements(_ivsElem164); // v164 — criatura do banco usa os elementos dela',
      'roleta: elementos do banco')
troca("elements: elements, code: code, scannedAt: Date.now(), source: 'roleta' };",
      "elements: elements, code: code, scannedAt: Date.now(), source: 'roleta',\n"
      "    banco: enemyType.banco164 || null, tribe: enemyType.tribo164 || null, rare: !!enemyType.isRare,\n"
      "    tier: enemyType.tier164 || null, ability: enemyType.ability164 || null, mugicCounters: enemyType.mugic164 || 0,\n"
      "    moveSpeed: enemyType.moveSpeed164 || null, desc: enemyType.desc164 || null }; // v164 — ficha do banco na carta",
      'roleta: ficha do banco na carta')

# ---------------------------------------------------------------- 7) carta do scan no mapa
troca('  const elements = getCardElements(enemy.ivs);',
      '  const elements = (enemy.type && enemy.type.banco164) ? elementosDaCarta164(enemy.type, enemy.ivs) : getCardElements(enemy.ivs); // v164 — elementos do banco',
      'scan: elementos do banco')
troca("      '<div class=\"card-code\">' + code + '</div>' +",
      "      fichaBanco164(enemy.type) +\n      '<div class=\"card-code\">' + code + '</div>' +",
      'scan: ficha do banco na carta')
troca("""  GameState.player.scannedCards.push(normalizeScanCard({
    name: enemy.type.name, level: enemy.level, hp: hp, atk: atk,
    ivs: enemy.ivs, grade: grade.label, code: code, elements: elements, timestamp: Date.now()
  }));""",
      """  GameState.player.scannedCards.push(normalizeScanCard({
    name: enemy.type.name, level: enemy.level, hp: hp, atk: atk,
    ivs: enemy.ivs, grade: grade.label, code: code, elements: elements, timestamp: Date.now(),
    rarity: pisoRaridade164(enemy.type, raridadeDoGrade164(grade.label)), // v164 — raridade da espécie vira o piso
    banco: enemy.type.banco164 || null, tribe: enemy.type.tribo164 || null, rare: !!enemy.type.isRare,
    tier: enemy.type.tier164 || null, ability: enemy.type.ability164 || null,
    mugicCounters: enemy.type.mugic164 || 0, moveSpeed: enemy.type.moveSpeed164 || null,
    desc: enemy.type.desc164 || null
  }));""",
      'scan: carta guarda a ficha do banco')

# ---------------------------------------------------------------- 8) save: mantém a ficha
troca("    elements: (Array.isArray(c.elements) && c.elements.length >= 4) ? c.elements.slice(0, 4) : ['\u2753', '\u2753', '\u2753', '\u2753'],\n    timestamp: num(c.timestamp, Date.now())",
      "    elements: (Array.isArray(c.elements) && c.elements.length >= 4) ? c.elements.slice(0, 4) : ['\u2753', '\u2753', '\u2753', '\u2753'],\n"
      "    banco: typeof c.banco === 'string' ? c.banco : null, tribe: typeof c.tribe === 'string' ? c.tribe : null, rare: !!c.rare, // v164 — ficha do banco\n"
      "    tier: typeof c.tier === 'string' ? c.tier : null, mugicCounters: num(c.mugicCounters, 0), moveSpeed: num(c.moveSpeed, 0),\n"
      "    ability: (c.ability && typeof c.ability === 'object') ? { n: c.ability.n || '', t: c.ability.t || '', mc: c.ability.mc || 0 } : null,\n"
      "    desc: typeof c.desc === 'string' ? c.desc : null,\n"
      "    timestamp: num(c.timestamp, Date.now())",
      'save: ficha do banco sobrevive ao reload')

# ---------------------------------------------------------------- 9) painel do Scanner
troca("""    '<div class="scan-row"><span class="scan-label">IV Grade</span><span class="scan-val" style="color:' + grade.color + '">' + grade.label + '</span></div>' +""",
      """    '<div class="scan-row"><span class="scan-label">IV Grade</span><span class="scan-val" style="color:' + grade.color + '">' + grade.label + '</span></div>' +
    (enemy.type && enemy.type.banco164 ? // v164 — ficha do banco no painel do Scanner
      '<div class="scan-row"><span class="scan-label">Tipo</span><span class="scan-val">' + tipoDaEspecie164(enemy.type) + '</span></div>' +
      '<div class="scan-row"><span class="scan-label">Elementos</span><span class="scan-val">' + (enemy.type.elements || []).map(function (el) { return (ELEMENTO_EMOJI164[el] || '') + ' ' + el; }).join(' · ') + '</span></div>' +
      '<div class="scan-row"><span class="scan-label">Habilidade</span><span class="scan-val">' + (enemy.type.ability164 ? enemy.type.ability164.n : '—') + '</span></div>' +
      '<div class="scan-row"><span class="scan-label">Mugic</span><span class="scan-val">🎵 ' + (enemy.type.mugic164 || 0) + '</span></div>' +
      '<div class="scan-row"><span class="scan-label">Mapa</span><span class="scan-val">' + (TRIBOS164[enemy.type.tribo164] || '') + ' · M' + enemy.type.mapa164 + '</span></div>' : '') +""",
      'painel do Scanner: ficha do banco')

# ---------------------------------------------------------------- 10) lista da roleta
troca("'</div><div style=\"color:#d4cfa8; font-weight:700;\">' + enemy.name + '</div><div>Lv.' + enemy.level + '</div></div>';",
      "'</div><div style=\"color:#d4cfa8; font-weight:700;\">' + enemy.name + '</div><div>Lv.' + enemy.level + '</div>' + (enemy.banco164 ? '<div style=\"color:#7ec850;\">' + (TRIBOS164[enemy.tribo164] || '') + ' · M' + enemy.mapa164 + (enemy.isRare ? ' · ★' : '') + '</div>' : '') + '</div>';",
      'lista da roleta: tribo/mapa de cada espécie')

# ---------------------------------------------------------------- 11) HUD: quantas espécies
troca("""  const parts = [];
  if (tb) parts.push(tb.icon + ' ' + tb.name);""",
      """  const parts = [];
  if (tb) parts.push(tb.icon + ' ' + tb.name);
  const pool164 = (MAP_POOLS[r.id] || []).length; if (pool164) parts.push('🐾 ' + pool164 + ' espécies'); // v164 — espécies do banco no mapa""",
      'banner do mapa: nº de espécies')
troca("      + '<p style=\"margin-top:3px;color:' + (corTribe147[r.tribe] || '#7ec850') + ';font-size:9px;\">Mapa ' + r.mapLevel + ' da tribo · ' + (r.level > 0 ? 'Requer Lv.' + r.level : 'Acesso livre') + (aberto ? '' : ' · 🔒 bloqueado') + '</p>'",
      "      + '<p style=\"margin-top:3px;color:' + (corTribe147[r.tribe] || '#7ec850') + ';font-size:9px;\">Mapa ' + r.mapLevel + ' da tribo · ' + (r.level > 0 ? 'Requer Lv.' + r.level : 'Acesso livre') + (aberto ? '' : ' · 🔒 bloqueado') + ' · 🐾 ' + (MAP_POOLS[r.id] || []).length + ' espécies</p>'",
      'portal: nº de espécies por mapa')

# ---------------------------------------------------------------- 12) versão + changelog
troca('<title>Chaotic.idleWorld v2.26 \u2014 Op\u00e7\u00f5es limpas, Auto-Move autom\u00e1tico e o MASTER dos Dromos</title>',
      '<title>Chaotic.idleWorld v2.27 \u2014 Banco de 120 criaturas integrado (4 tribos, mapa 3 dos Mipedians e o MASTER)</title>',
      'título v2.27')
troca('// CHAOTIC.IDLEWORLD v2.26 \u2014 CHANGELOG (v161 Op\u00e7\u00f5es limpas + Auto-Move autom\u00e1tico · v162 itens raros · v163 MASTER dos Dromos)',
      '// CHAOTIC.IDLEWORLD v2.27 \u2014 CHANGELOG (v164 Banco de 120 criaturas integrado)\n'
      '// - v164 — BANCO DE 120 CRIATURAS INTEGRADO: as 4 tribos x 30 criaturas do banco\n'
      '//   viram espécies do jogo. Cada mapa nasce só com as criaturas da sua tribo e do\n'
      '//   seu nível (m1/m2/m3), com HP/ATK/velocidade/XP/Bits/arte/elementos/habilidade/\n'
      '//   Mugic do banco. Nova região "Miragens do Palmeiral" (Mipedian mapa 3, Lv.20) para\n'
      '//   as 15 criaturas mipedianas. Spawn ponderado (passiva 34 · agressiva 26 · rara 12),\n'
      '//   velocidade por espécie (teto 175 px/s), ✷ no rótulo da rara, ficha do banco nas\n'
      '//   cartas (scan, roleta e Scanner) e a raridade da espécie como piso da carta.\n'
      '// CHAOTIC.IDLEWORLD v2.26 \u2014 CHANGELOG (v161 Op\u00e7\u00f5es limpas + Auto-Move autom\u00e1tico · v162 itens raros · v163 MASTER dos Dromos)',
      'changelog v2.27')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('patch aplicado: %d bytes' % len(s.encode('utf-8')))
