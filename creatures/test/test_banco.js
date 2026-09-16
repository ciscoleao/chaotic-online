#!/usr/bin/env node
/* ============================================================
 * Chaotic.IdleWorld — VALIDAÇÃO DO BANCO + SPAWN MANAGER
 * test/test_banco.js  →  node test/test_banco.js
 * ------------------------------------------------------------
 * Cobra exatamente o que foi especificado:
 *   · 30 criaturas por tribo (5 + 10 + 15)
 *   · mapa 1 = 5 passivas / mapa 2 = 6+4 com 1 rara / mapa 3 = 7+8 com 2 raras
 *   · rara = +20% em baseSpeed e baseDamage
 *   · mugicCounters INVERSAMENTE proporcional à força bruta
 *   · afinidade elemental de lore (maioria principal, minoria exceção)
 * ============================================================ */
'use strict';

const path = require('path');
const C = require(path.join(__dirname, '..', 'src', 'creature.js'));
const DB = require(path.join(__dirname, '..', 'src', 'creature_db.js'));
const SPAWN = require(path.join(__dirname, '..', 'src', 'spawn_manager.js'));
const { MAPS, TRIBE_META, ELEMENTS } = C;

let ok = 0, falhas = 0;
function checa(desc, cond, extra) {
  if (cond) { ok++; console.log('  OK    ' + desc + (extra ? '  (' + extra + ')' : '')); }
  else { falhas++; console.log('  FALHA ' + desc + (extra ? '  (' + extra + ')' : '')); }
}
const titulo = (t) => console.log('\n== ' + t + ' ==');

const banco = DB.all;

// ------------------------------------------------------------
titulo('[1] Volume do banco');
checa('120 criaturas no total', banco.length === 120, banco.length + ' criaturas');
Object.keys(TRIBE_META).forEach((t) => {
  const n = DB.byTribe(t).length;
  checa(t + ' tem 30 criaturas exclusivas', n === 30, n + '');
});

// ------------------------------------------------------------
titulo('[2] Matemática de cada mapa (a regra exata)');
Object.keys(MAPS).map(Number).forEach((m) => {
  const regra = MAPS[m];
  Object.keys(TRIBE_META).forEach((t) => {
    const pool = DB.byMap(t, m);
    const pas = pool.filter((c) => !c.isAggressive).length;
    const agr = pool.filter((c) => c.isAggressive).length;
    const rar = pool.filter((c) => c.isRare).length;
    const rotulo = t + ' mapa ' + m;
    checa(rotulo + ': ' + regra.slots + ' criaturas', pool.length === regra.slots, pool.length + '');
    checa(rotulo + ': ' + regra.passive + ' passivas', pas === regra.passive, pas + '');
    checa(rotulo + ': ' + regra.aggressive + ' agressivas', agr === regra.aggressive, agr + '');
    checa(rotulo + ': ' + regra.rare + ' rara(s)', rar === regra.rare, rar + '');
  });
});
checa('mapa 1 é 100% passivo (nenhuma agressiva em nenhuma tribo)',
  banco.filter((c) => c.mapLevel === 1 && c.isAggressive).length === 0);
checa('toda rara é agressiva', banco.filter((c) => c.isRare && !c.isAggressive).length === 0);
checa('nenhuma rara fora dos mapas 2 e 3', banco.filter((c) => c.isRare && c.mapLevel === 1).length === 0);

// ------------------------------------------------------------
titulo('[3] Criatura rara = +20% em baseSpeed e baseDamage');
const raras = banco.filter((c) => c.isRare);
checa('existem 12 raras no banco (1+2 por tribo)', raras.length === 12, raras.length + '');
raras.forEach((c) => {
  const velSemRaridade = Math.round(C.rawSpeed(c.stats, c.mapLevel));
  const danoSemRaridade = Math.round(C.rawDamage(c.stats, c.tribe));
  const velEsperada = Math.round(C.rawSpeed(c.stats, c.mapLevel) * 1.2);
  const danoEsperado = Math.round(C.rawDamage(c.stats, c.tribe) * 1.2);
  checa('RARA ' + c.name + ' (' + c.tribe + ' m' + c.mapLevel + '): velocidade +20%',
    c.baseSpeed === velEsperada && c.rarityMult === 1.2, velSemRaridade + ' → ' + c.baseSpeed + ' px/s');
  checa('RARA ' + c.name + ': dano +20%',
    c.baseDamage === danoEsperado, danoSemRaridade + ' → ' + c.baseDamage);
});
const naoRaras = banco.filter((c) => !c.isRare);
checa('criatura comum NÃO leva o bônus de raridade',
  naoRaras.every((c) => c.rarityMult === 1 && c.baseSpeed === C.baseSpeedFrom(c.stats, c.mapLevel, false)));

// ------------------------------------------------------------
titulo('[4] Contadores de Mugic (inversamente proporcional à força bruta)');
Object.keys(MAPS).map(Number).forEach((m) => {
  Object.keys(TRIBE_META).forEach((t) => {
    const pool = DB.byMap(t, m);
    const porMugic = { 0: [], 1: [], 2: [] };
    pool.forEach((c) => porMugic[c.mugicCounters].push(c.totalStats));
    const maiorFraco = Math.max(...porMugic[2]);
    const menorMedio = Math.min(...porMugic[1]);
    const maiorMedio = Math.max(...porMugic[1]);
    const menorForte = Math.min(...porMugic[0]);
    checa(t + ' mapa ' + m + ': total(mugic 2) < total(mugic 1) < total(mugic 0)',
      maiorFraco < menorMedio && maiorMedio < menorForte,
      'mugic2 máx ' + maiorFraco + ' | mugic1 ' + menorMedio + '–' + maiorMedio + ' | mugic0 mín ' + menorForte);
  });
});
const media = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
[0, 1, 2].forEach((mc) => {
  const tot = banco.filter((c) => c.mugicCounters === mc).map((c) => c.totalStats);
  console.log('     mugic ' + mc + ': ' + tot.length + ' criaturas · média de status totais ' + Math.round(media(tot)));
});
checa('média de status cai conforme o mugic sobe',
  media(banco.filter((c) => c.mugicCounters === 0).map((c) => c.totalStats))
  > media(banco.filter((c) => c.mugicCounters === 1).map((c) => c.totalStats))
  && media(banco.filter((c) => c.mugicCounters === 1).map((c) => c.totalStats))
  > media(banco.filter((c) => c.mugicCounters === 2).map((c) => c.totalStats)));
checa('quem tem mugic 2 é o mais sábio (suporte/mágica)',
  media(banco.filter((c) => c.mugicCounters === 2).map((c) => c.stats.wisdom))
  > media(banco.filter((c) => c.mugicCounters === 0).map((c) => c.stats.wisdom)),
  'sabedoria média: mugic2 ' + Math.round(media(banco.filter((c) => c.mugicCounters === 2).map((c) => c.stats.wisdom)))
  + ' vs mugic0 ' + Math.round(media(banco.filter((c) => c.mugicCounters === 0).map((c) => c.stats.wisdom))));

// ------------------------------------------------------------
titulo('[5] Afinidade elemental (lore)');
checa('toda criatura tem 1 ou 2 elementos',
  banco.every((c) => c.elements.length >= 1 && c.elements.length <= 2));
checa('elementos só da lista canônica',
  banco.every((c) => c.elements.every((e) => ELEMENTS.indexOf(e) !== -1)));
checa('sem elemento repetido na mesma carta',
  banco.every((c) => c.elements.length < 2 || c.elements[0] !== c.elements[1]));

Object.keys(TRIBE_META).forEach((t) => {
  const meta = TRIBE_META[t];
  const pool = DB.byTribe(t);
  const excecoes = pool.filter((c) => c.elementKind === 'excecao');
  const principais = pool.length - excecoes.length;
  checa(t + ': minoria fora da afinidade (' + meta.principal.join('/') + ')',
    excecoes.length < principais, principais + ' principais × ' + excecoes.length + ' exceções');
  checa(t + ': toda exceção tem elemento de exceção (' + meta.excecao.join('/') + ')',
    excecoes.every((c) => c.elements.some((e) => meta.excecao.indexOf(e) !== -1)));
  checa(t + ': nenhuma criatura "principal" usa elemento de exceção',
    pool.filter((c) => c.elementKind === 'principal').every((c) => c.elements.every((e) => meta.principal.indexOf(e) !== -1)));
  const contagem = {};
  pool.forEach((c) => c.elements.forEach((e) => { contagem[e] = (contagem[e] || 0) + 1; }));
  const top2 = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a]).slice(0, 2);
  console.log('     ' + t.padEnd(11) + ' elementos: ' + JSON.stringify(contagem) + ' · exceções: ' + excecoes.length + ' · top2: ' + top2.join('/'));
});
const uw2 = DB.byMap('UnderWorld', 2);
const uwPrincipal = uw2.filter((c) => c.elements.some((e) => e === 'Fogo' || e === 'Terra')).length;
checa('UnderWorld mapa 2: maioria Fogo/Terra (amostra pedida)', uwPrincipal >= 8, uwPrincipal + ' de ' + uw2.length);
checa('amostra UnderWorld mapa 2 tem 10 criaturas', uw2.length === 10);

// ------------------------------------------------------------
titulo('[6] Integridade carta a carta (via Creature.validate)');
let problemas = [];
banco.forEach((raw) => { C.Creature.fromJSON(raw).validate().forEach((p) => problemas.push(raw.id + ': ' + p)); });
checa('todas as 120 cartas passam na validação do modelo', problemas.length === 0,
  problemas.slice(0, 3).join(' | ') || 'sem problemas');
checa('ids únicos', new Set(banco.map((c) => c.id)).size === banco.length);
checa('nomes únicos', new Set(banco.map((c) => c.name)).size === banco.length);
checa('nível dentro da faixa do mapa',
  banco.every((c) => { const b = MAPS[c.mapLevel].band; return c.level >= b[0] && c.level <= b[1]; }));
checa('toda carta tem habilidade com custo de mana',
  banco.every((c) => c.ability && c.ability.name && c.ability.manaCost > 0));
checa('toda carta tem recompensa (xp + bits)',
  banco.every((c) => c.rewards.xp > 0 && c.rewards.bits.length === 2));
checa('toda carta aponta para um sprite do jogo', banco.every((c) => !!c.art));

// ------------------------------------------------------------
titulo('[7] SpawnManager / getMapSpawns');
const sm = new SPAWN.SpawnManager(DB, (() => { let s = 42; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; })());
Object.keys(TRIBE_META).forEach((t) => {
  [1, 2, 3].forEach((m) => {
    const lista = SPAWN.getMapSpawns(t, m);
    checa('getMapSpawns("' + t + '", ' + m + ') devolve ' + MAPS[m].slots + ' criaturas', lista.length === MAPS[m].slots);
  });
});
checa('aceita id curto da tribo ("uw")', SPAWN.getMapSpawns('uw', 2).length === 10);
checa('aceita mapa como texto ("m2")', SPAWN.getMapSpawns('UnderWorld', 'm2').length === 10);
checa('lista só de passivas no mapa 1', SPAWN.getMapSpawns('ow', 1, { only: 'passivas' }).length === 5);
checa('lista só de agressivas no mapa 2 (4)', SPAWN.getMapSpawns('UnderWorld', 2, { only: 'agressivas' }).length === 4);
checa('lista só de raras no mapa 3 (2)', SPAWN.getMapSpawns('Mipedian', 3, { only: 'raras' }).length === 2);
checa('filtro por elemento funciona', SPAWN.getMapSpawns('UnderWorld', 2, { element: 'Fogo' }).every((c) => c.elements.indexOf('Fogo') !== -1));
checa('tribo inválida dá erro claro', (() => { try { SPAWN.getMapSpawns('Temporian', 2); return false; } catch (e) { return /tribo inválida/.test(e.message); } })());
checa('mapa inválido dá erro claro', (() => { try { SPAWN.getMapSpawns('UnderWorld', 9); return false; } catch (e) { return /mapa inválido/.test(e.message); } })());

const st2 = SPAWN.getPoolSettings('UnderWorld', 2);
checa('settings do mapa 2: 6 passivas / 4 agressivas / 1 rara',
  st2.passive === 6 && st2.aggressive === 4 && st2.rare === 1, JSON.stringify({ p: st2.passive, a: st2.aggressive, r: st2.rare, maxLive: st2.maxLive }));
checa('nível exigido do mapa 2 é 10 e do mapa 3 é 20',
  SPAWN.getPoolSettings('ow', 2).requiredLevel === 10 && SPAWN.getPoolSettings('ow', 3).requiredLevel === 20);

const sorteios = [];
for (let i = 0; i < 400; i++) sorteios.push(sm.rollSpawn('UnderWorld', 2, { aggressive: true }));
checa('rollSpawn com aggressive:true só devolve agressivas', sorteios.every((c) => c.isAggressive));
const semRara = [];
for (let i = 0; i < 400; i++) semRara.push(sm.rollSpawn('UnderWorld', 2, { aggressive: true, allowRare: false }));
checa('rollSpawn com allowRare:false nunca devolve rara', semRara.every((c) => !c.isRare));
const rarosSorteados = sorteios.filter((c) => c.isRare).length;
checa('rara aparece bem menos que as comuns (peso 12 vs 26)',
  rarosSorteados > 0 && rarosSorteados < sorteios.length * 0.25, rarosSorteados + ' raras em 400 sorteios');
const wave = sm.rollWave('UnderWorld', 3, st2.maxLive);
checa('rollWave devolve leva sem criatura repetida',
  wave.length === new Set(wave.map((c) => c.id)).size, wave.length + ' criaturas únicas');

// ------------------------------------------------------------
titulo('[8] Amostra pedida: UnderWorld · Mapa 2');
console.log(SPAWN.describe('UnderWorld', 2));

// ------------------------------------------------------------
console.log('\n══════════════════════════════════════════════');
console.log((falhas === 0 ? '✅ TUDO OK' : '❌ ' + falhas + ' FALHA(S)') + ' — ' + ok + ' verificações passaram');
console.log('══════════════════════════════════════════════');
process.exit(falhas === 0 ? 0 : 1);
