#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v2.21 (patch v154) — MAPAS DE VERDADE + SCAN FUNCIONANDO
Chaotic.IdleWorld

O que estava errado (relatado pelo jogador):
 1) Jogadores em mapas DIFERENTES se viam (e o chat "PERTO" misturava os
    mapas). Causa: o online usava `GameState.location`, que vale 'perim' para
    TODAS as regiões — o servidor não tinha como separar.
 2) O herói do Auto-Move mirava pontos fora do mapa: as metas eram sorteadas
    com CONFIG.WORLD_W/H (3200×2400, tamanho do Pórtico) enquanto as regiões
    têm o seu próprio tamanho (Bosque = 2000×1500). Ele andava contra a borda
    e nunca encontrava criaturas.
 3) Quase não havia criaturas para escanear: 2 por mapa (escala por área) com
    vida de 20 s. E, ao começar o scan, a criatura continuava andando (50% da
    velocidade) e saía do alcance (96 px) antes dos 3 s — o scan era cancelado
    ("Alvo fugiu!").
 4) Os terrenos eram sorteados do zero a cada viagem (Math.random sem
    semente): dois mapas diferentes pareciam o "mesmo lugar com outra cor".

O que este patch faz:
 A) PRESENÇA POR MAPA: helper `mapaAtual154()` manda o id da REGIÃO
    ('ow_grove', 'uw_ember', ...) em vez de 'perim'; o filtro dos outros
    jogadores usa esse id, e os sprites são limpos ao trocar de mapa.
    (O chat "PERTO" do servidor já filtra por esse mesmo campo → vira por mapa.)
 B) AUTO-MOVE DENTRO DO MAPA: metas sorteadas com `this.worldW/this.worldH`
    (+ recuperação quando a meta está fora do mapa).
 C) CRIATURAS: densidade por área com piso (`monsterMax154`), vida 45 s e
    alcance de detecção 200 px.
 D) SCAN CONFIÁVEL: a criatura PARA enquanto é escaneada; alcance do scan 130.
 E) TERRENO PRÓPRIO DE CADA MAPA: geração determinística semeada pelo id da
    região (cada mapa sempre igual a si mesmo e diferente dos outros).
"""
import io, sys, re

ARQ = '/home/user/chaotic_idleworld_v123.html'
d = io.open(ARQ, encoding='utf-8').read()
n = 0

def sub1(rotulo, old, new):
    global d, n
    c = d.count(old)
    if c != 1:
        print('!! %s: âncora encontrada %d vez(es)' % (rotulo, c)); sys.exit(1)
    d = d.replace(old, new, 1); n += 1
    print('   ok %s' % rotulo)

# ---------------------------------------------------------------- A) presença por mapa
sub1('A1 helper mapaAtual154',
"""const gcOn = !!window.CHAOS_ONLINE;
let gcRoster = [], gcRosterKey = '', gcPlEls = {};""",
"""const gcOn = !!window.CHAOS_ONLINE;
/* v154 — CADA MAPA É UM MAPA: o online usa o id da REGIÃO, não GameState.location
 * (que vale 'perim' para todas as regiões e por isso mostrava jogadores de mapas
 * diferentes como se estivessem no mesmo lugar). Valores possíveis:
 *   'portico' | 'exterior' | 'drome' | 'cave' | id da região ('ow_grove', ...) */
function mapaAtual154() {
  const loc = (typeof GameState !== 'undefined' && GameState.location) || 'portico';
  if (loc === 'perim') return (typeof GameState !== 'undefined' && GameState.currentRegion) || 'ow_grove';
  return loc;
}
let gcRoster = [], gcRosterKey = '', gcPlEls = {}, gcSpriteMapa154 = null;""")

sub1('A2 heartbeat envia a região',
"""body: JSON.stringify({ map: GameState.location || 'portico', x: Math.round(GameState.player.x || 0), y: Math.round(GameState.player.y || 0), nick: window.CHAOS_ONLINE.nick, sex: (window.CHAOS_ONLINE && CHAOS_ONLINE.sex) || 'm' })""",
"""body: JSON.stringify({ map: mapaAtual154(), x: Math.round(GameState.player.x || 0), y: Math.round(GameState.player.y || 0), nick: window.CHAOS_ONLINE.nick, sex: (window.CHAOS_ONLINE && CHAOS_ONLINE.sex) || 'm' })""")

sub1('A3 filtro dos outros jogadores por mapa',
"""  const myMap = GameState.location || 'portico';
  const alive = {};""",
"""  const myMap = mapaAtual154();
  if (gcSpriteMapa154 !== myMap) { // v154 — trocou de mapa: limpa quem era do mapa antigo
    for (const k in gcPlEls) { try { gcPlEls[k].sp.destroy(); gcPlEls[k].txt.destroy(); } catch (e) {} }
    gcPlEls = {}; gcSpriteMapa154 = myMap;
  }
  const alive = {};""")

# ---------------------------------------------------------------- B) auto-move dentro do mapa
sub1('B1 meta do wander no tamanho da região',
"""      if (!this.autoTarget || Phaser.Math.Distance.Between(p.x, p.y, this.autoTarget.x, this.autoTarget.y) < 20) {
        this.autoTarget = { x: 100 + Math.random() * (CONFIG.WORLD_W - 200), y: 100 + Math.random() * (CONFIG.WORLD_H - 200) };
      }""",
"""      // v154 — a meta tem de caber NO MAPA ATUAL (antes usava CONFIG.WORLD_W/H,
      // o tamanho do Pórtico: em mapas menores o herói andava contra a borda)
      if (!this.autoTarget || Phaser.Math.Distance.Between(p.x, p.y, this.autoTarget.x, this.autoTarget.y) < 20
          || this.autoTarget.x > this.worldW - 60 || this.autoTarget.y > this.worldH - 60) {
        this.autoTarget = { x: 80 + Math.random() * Math.max(60, this.worldW - 160), y: 80 + Math.random() * Math.max(60, this.worldH - 160) };
      }""")

sub1('B2 changeDirection no tamanho da região',
"""    if (this.autoTarget && this.autoTarget.x !== undefined) {
      const dx = this.autoTarget.x - this.player.x;
      const dy = this.autoTarget.y - this.player.y;
      this.autoTarget = {
        x: Math.max(100, Math.min(CONFIG.WORLD_W - 100, this.player.x - dx)),
        y: Math.max(100, Math.min(CONFIG.WORLD_H - 100, this.player.y - dy))
      };
    } else {
      this.autoTarget = {
        x: 100 + Math.random() * (CONFIG.WORLD_W - 200),
        y: 100 + Math.random() * (CONFIG.WORLD_H - 200)
      };
    }""",
"""    if (this.autoTarget && this.autoTarget.x !== undefined) { // v154 — limites do MAPA (não do Pórtico)
      const dx = this.autoTarget.x - this.player.x;
      const dy = this.autoTarget.y - this.player.y;
      this.autoTarget = {
        x: Math.max(80, Math.min(this.worldW - 80, this.player.x - dx)),
        y: Math.max(80, Math.min(this.worldH - 80, this.player.y - dy))
      };
    } else {
      this.autoTarget = {
        x: 80 + Math.random() * Math.max(60, this.worldW - 160),
        y: 80 + Math.random() * Math.max(60, this.worldH - 160)
      };
    }""")

sub1('B3 quadrante pelo tamanho da região',
"""  updateQuadrant() { const qw = CONFIG.WORLD_W / 4; const qh = CONFIG.WORLD_H / 4; const qx = Math.floor(this.player.x / qw); const qy = Math.floor(this.player.y / qh); GameState.currentQuadrant = { qx: Math.min(3, qx), qy: Math.min(3, qy) }; }""",
"""  updateQuadrant() { const qw = (this.worldW || CONFIG.WORLD_W) / 4; const qh = (this.worldH || CONFIG.WORLD_H) / 4; const qx = Math.floor(this.player.x / qw); const qy = Math.floor(this.player.y / qh); GameState.currentQuadrant = { qx: Math.min(3, qx), qy: Math.min(3, qy) }; }""")

# ---------------------------------------------------------------- C) criaturas por mapa
sub1('C1 helper de densidade',
"""// v0.9.8 — Helper para obter dimensões da região atual""",
"""/* v154 — QUANTAS CRIATURAS CABEM NO MAPA: densidade por área com piso e teto.
 * Antes o mapa 1 (2000×1500) ficava com 2 criaturas (e cada uma vivia 20 s),
 * então quase nunca havia o que escanear. */
function monsterMax154(regionId) {
  const d = getRegionDimensions(regionId);
  const base = Math.round((d.w * d.h) / 300000); // ~1 criatura a cada 300 mil px²
  return Math.max(6, Math.min(22, base));
}

// v0.9.8 — Helper para obter dimensões da região atual""")

sub1('C2 spawn inicial',
"""    const scaledMonsterCount = getScaledSpawnCount(GameState.currentRegion, 3);""",
"""    const scaledMonsterCount = Math.max(2, Math.round(monsterMax154(GameState.currentRegion) * 0.5)); // v154""")

sub1('C3 limite de criaturas vivas',
"""      const scaledMaxMonsters = getScaledSpawnCount(GameState.currentRegion, CONFIG.MONSTER_MAX_COUNT);""",
"""      const scaledMaxMonsters = monsterMax154(GameState.currentRegion); // v154 — densidade por mapa""")

sub1('C4 config: vida, detecção',
"""  MONSTER_SPAWN_INTERVAL: 10000, MONSTER_MAX_COUNT: 4, MONSTER_LIFETIME: 20000,
  MONSTER_DETECT_RANGE: 160, MONSTER_WANDER_SPEED: 155,""",
"""  MONSTER_SPAWN_INTERVAL: 10000, MONSTER_MAX_COUNT: 4, MONSTER_LIFETIME: 45000, // v154 — 45s de vida
  MONSTER_DETECT_RANGE: 200, MONSTER_WANDER_SPEED: 155, // v154 — 200px: o herói percebe a criatura antes""")

# ---------------------------------------------------------------- D) scan confiável
sub1('D1 alcance do scan',
"""  SCAN_RANGE: 96, SCAN_COOLDOWN: 2000, SCAN_CHARGE_TIME: 3000, AUTO_MOVE_INTERVAL: 2000,""",
"""  SCAN_RANGE: 130, SCAN_COOLDOWN: 2000, SCAN_CHARGE_TIME: 3000, AUTO_MOVE_INTERVAL: 2000, // v154 — 130px""")

sub1('D2a criatura para durante o scan (Perim)',
"""      // Se estiver sendo escaneado, move a 50% da velocidade (não para)
      if (isBeingScanned) { evx *= 0.5; evy *= 0.5; }""",
"""      // v154 — a criatura PARA enquanto é escaneada (antes andava a 50% e saía do
      // alcance antes dos 3s de carga, cancelando o scan com "Alvo fugiu!")
      if (isBeingScanned) { evx = 0; evy = 0; }""")

sub1('D3 criatura sendo escaneada nao expira',
"""      // Lifetime: desaparece após 20 segundos
      if (now - e.spawnTime > CONFIG.MONSTER_LIFETIME) {""",
"""      // Lifetime: desaparece após o tempo de vida (v154 — 45s)
      // v154 — EXCEÇÃO: quem está sendo escaneado agora NÃO desaparece
      // (antes a criatura podia sumir no meio do scan e cancelar tudo)
      if (now - e.spawnTime > CONFIG.MONSTER_LIFETIME && !(this.autoState === 'scan' && GameState.scanTarget === e)) {""")

sub1('D2b criatura para durante o scan (Caverna)',
"""      if (isBeingScanned) { evx *= 0.5; evy *= 0.5; }
      if (tileIsWaterAt(this.mapData, e.x, e.y)) { evx *= 0.8; evy *= 0.8; } // v129 — 20% lento na água
      e.setVelocity(evx, evy);
    }
    // máquina autônoma: wander / chase / scan (SCAN 2x MAIS RÁPIDO na caverna)""",
"""      if (isBeingScanned) { evx = 0; evy = 0; } // v154 — idem: alvo do scan não foge
      if (tileIsWaterAt(this.mapData, e.x, e.y)) { evx *= 0.8; evy *= 0.8; } // v129 — 20% lento na água
      e.setVelocity(evx, evy);
    }
    // máquina autônoma: wander / chase / scan (SCAN 2x MAIS RÁPIDO na caverna)""")

# ---------------------------------------------------------------- E) terreno próprio de cada mapa
sub1('E1 gerador semeado por região',
"""/* v147 — aplica o TEMA VISUAL da região: redesenha as texturas de grama""",
"""/* v154 — TERRENO PRÓPRIO E SEMPRE IGUAL: gerador determinístico semeado pelo
 * id da região. Usado só na construção do mapa (PerimScene.create), então:
 *   · o Bosque Verdejante é sempre o MESMO bosque (você reconhece o lugar);
 *   · Cavernas de Brasas tem outro relevo (não é "o mesmo lugar com outra cor");
 *   · rio, lagos, pedras e árvores saem da mesma semente a cada viagem. */
function seedDoMapa154(id) {
  let h = 2166136261;
  const s = 'chaos:' + String(id || 'perim');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
let __rng154 = Math.random;
function rngSetup154(id) {
  let a = seedDoMapa154(id);
  __rng154 = function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rng154() { return __rng154(); }

/* v147 — aplica o TEMA VISUAL da região: redesenha as texturas de grama""")

# E2 — dentro de PerimScene.create: sorteio da região + troca de Math.random() por rng154()
ini_classe = d.index("class PerimScene extends Phaser.Scene {")
ini_create = d.index("\n  create() {", ini_classe) + len("\n  create() {")
fim_create = d.index("\n  spawnSecretHole() {", ini_create)
corpo = d[ini_create:fim_create]
qtd = corpo.count('Math.random()')
if qtd < 20:
    print('!! E2: só %d Math.random() no create() do PerimScene' % qtd); sys.exit(1)
corpo2 = corpo.replace('Math.random()', 'rng154()')
corpo2 = "\n    // v154 — semente do mapa: o terreno desta região é sempre o mesmo (e só dela)\n    rngSetup154(GameState.currentRegion);" + corpo2
d = d[:ini_create] + corpo2 + d[fim_create:]
n += 1
print('   ok E2 terreno determinístico (%d sorteios trocados)' % qtd)

# ---------------------------------------------------------------- F) versão + changelog
sub1('F1 título',
"<title>Chaotic.idleWorld v2.20 — Janelinha (PiP) + jogo fora da aba</title>",
"<title>Chaotic.idleWorld v2.21 — Mapas separados de verdade + scan consertado</title>")

sub1('F2 changelog',
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.20 — CHANGELOG""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21 — CHANGELOG (patch v154)
// - MAPAS SEPARADOS DE VERDADE: jogadores em regiões diferentes não se viam
//   mais (e o chat PERTO misturava os mapas). O online passou a identificar a
//   sala pelo id da região (mapaAtual154): 'ow_grove', 'uw_ember', etc. —
//   antes tudo era 'perim'. Ao trocar de mapa os sprites de quem ficou no
//   mapa antigo são removidos na hora.
// - CRIATURAS POR MAPA: densidade calculada pela área (mínimo 6, máximo 22),
//   vida de 45s (era 20s) e percepção de 200px (era 160px). Antes o mapa 1
//   ficava com 2 criaturas que sumiam antes de você chegar perto.
// - SCAN CONSERTADO: a criatura-alvo PARA enquanto é escaneada (antes andava a
//   50% da velocidade e escapava do alcance de 96px em menos de 1 segundo, e o
//   scan era cancelado com "Alvo fugiu!"). Alcance do scan: 130px. O herói do
//   Auto-Move também voltou a caçar: as metas de caminhada eram sorteadas com
//   o tamanho do Pórtico (3200×2400) e, em mapas menores, ele andava contra a
//   borda sem nunca encontrar criatura.
// - TERRENO PRÓPRIO DE CADA MAPA: a geração do relevo usa uma semente derivada
//   do id da região. Cada mapa tem o seu formato (e é sempre igual quando você
//   volta) — antes o terreno era sorteado do zero a cada viagem e dois mapas
//   diferentes pareciam o mesmo lugar com outra cor.
// ============================================================
// CHAOTIC.IDLEWORLD v2.20 — CHANGELOG""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('\nOK — v2.21 aplicado (%d substituições + terreno semeado)' % n)
