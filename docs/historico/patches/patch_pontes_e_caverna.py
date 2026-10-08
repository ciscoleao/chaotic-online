#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v155 — PONTES COM COMEÇO/MEIO/FIM + SCAN NA CAVERNA SECRETA
Chaotic.IdleWorld (relatado pelo jogador, com prints)

PROBLEMA 1 — "pontes soltas no lago sem sentido"
  A geração do mapa fazia duas coisas erradas:
   a) depois de gerar o rio, havia uma passagem que transformava em PONTE
      qualquer tile de estrada (path) que tivesse água ao lado — isso criava
      tábuas soltas em terra firme;
   b) os lagos eram desenhados DEPOIS e pulavam tiles de 'path'/'bridge' ao
      preencher água — resultado: pedaços de ponte/estrada ficavam ilhados no
      meio do lago (o que se vê nas capturas).
  Correção: as pontes agora são calculadas POR ÚLTIMO, já com toda a água
  definitiva: para cada coluna de travessia, o jogo acha a FAIXA CONTÍNUA de
  água e só constrói a ponte se ela tiver terra firme nas duas pontas — ou
  seja, toda ponte tem começo (terra), meio (água) e fim (terra).

PROBLEMA 2 — "na caverna o personagem não escaneou a criatura do lado"
  A Caverna Secreta usava a regra "espécies agressivas não são caçadas" sem
  ter a lógica de beirada do Perim: a Aranha Gigante (espécie agressiva) era
  simplesmente IGNORADA — o herói podia estar colado nela que não fazia nada,
  e a caverna existe justamente para captura fácil (scan 2x mais rápido).
  Correção: na caverna o herói também escaneia agressivos, aproximando-se só
  até a beirada do raio de ameaça (e recuando se o bicho chegar perto), no
  mesmo espírito do que já acontece nos mapas abertos.
"""
import io, sys

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

# =====================================================================
# 1) remove as "travessias garantidas" feitas ANTES dos lagos
# =====================================================================
sub1('1 remove travessias antigas',
"""      // travessias garantidas (pontes de madeira cruzando o rio)
      const cross = [0.22, 0.52, 0.8].map(function(f) { return Math.floor(tilesX * f); });
      for (let ci = 0; ci < cross.length; ci++) {
        const cx2 = cross[ci];
        let yMin = -1, yMax = -1;
        for (let y = 0; y < tilesY; y++) if (this.mapData[y][cx2] === 'water') { if (yMin < 0) yMin = y; yMax = y; }
        if (yMin < 0) continue;
        for (let y = Math.max(0, yMin - 1); y <= Math.min(tilesY - 1, yMax + 1); y++) {
          for (let x = Math.max(0, cx2 - 1); x <= Math.min(tilesX - 1, cx2 + 1); x++) {
            if (this.mapData[y][x] === 'water') this.mapData[y][x] = 'bridge';
          }
        }
      }
""",
"""      // v155 — as pontes passaram a ser construídas no FIM da geração
      // (depois dos lagos), com começo, meio e fim. Ver bloco "PONTES" abaixo.
""")

# =====================================================================
# 2) remove a passagem que virava ponte qualquer estrada ao lado da água
# =====================================================================
sub1('2 remove estrada-vira-ponte',
"""    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        if (this.mapData[y][x] === 'path') {
          let hasWater = false;
          if (y > 0 && this.mapData[y-1][x] === 'water') hasWater = true;
          if (y < tilesY-1 && this.mapData[y+1][x] === 'water') hasWater = true;
          if (x > 0 && this.mapData[y][x-1] === 'water') hasWater = true;
          if (x < tilesX-1 && this.mapData[y][x+1] === 'water') hasWater = true;
          if (hasWater && this.mapData[y][x] === 'path') { this.mapData[y][x] = 'bridge'; }
        }
      }
    }
""",
"""    /* v155 — REMOVIDO: aqui toda estrada (path) com água ao lado virava 'bridge',
     * o que criava tábuas soltas em terra firme (e, quando um lago nascia por
     * cima, pedaços de ponte ilhados no meio da água). Ponte agora é só o que
     * o bloco "PONTES" constrói: travessia de terra a terra. */
""")

# =====================================================================
# 3) o lago pode cobrir estradas (nada de estrada debaixo d'água)
# =====================================================================
sub1('3 lago cobre estrada',
"""          if (this.mapData[yy][xx] === 'bridge' || this.mapData[yy][xx] === 'path') continue;""",
"""          if (this.mapData[yy][xx] === 'bridge') continue; // v155 — o lago pode cobrir estradas""")

# =====================================================================
# 4) PONTES: construídas por último, com começo (terra), meio (água) e fim (terra)
# =====================================================================
sub1('4 bloco PONTES',
"""    this.events.once('shutdown', function() { // v130 — sem corpos fantasmas entre viagens""",
"""    /* v155 — PONTES COM COMEÇO, MEIO E FIM.
     * Roda DEPOIS de toda a água (rio + lagos). Para cada coluna de travessia
     * (as 3 garantidas + as colunas onde uma estrada encosta na água), o jogo
     * procura FAIXAS CONTÍNUAS de água; só constrói a ponte se a faixa tiver
     * terra firme nas DUAS pontas e pelo menos 3 tiles de água — assim a ponte
     * sempre começa em terra, atravessa a água e termina em terra. Nada de
     * tábuas soltas (e nada de ponte no meio do lago sem saída). */
    {
      const cols155 = [0.22, 0.52, 0.8].map(function(f) { return Math.floor(tilesX * f); });
      for (let y = 0; y < tilesY; y++) {
        for (let x = 1; x < tilesX - 1; x++) {
          if (this.mapData[y][x] !== 'path') continue;
          const aguaAcima = y > 0 && this.mapData[y - 1][x] === 'water';
          const aguaAbaixo = y < tilesY - 1 && this.mapData[y + 1][x] === 'water';
          if (aguaAcima || aguaAbaixo) cols155.push(x); // estrada cruzando água: vira travessia
        }
      }
      const unicas155 = cols155.filter(function(c, i) { return cols155.indexOf(c) === i; });
      const ehTerra155 = function(t) { return t === 'grass' || t === 'path'; };
      for (let ci = 0; ci < unicas155.length; ci++) {
        const cx155 = Phaser.Math.Clamp(unicas155[ci], 1, tilesX - 2);
        let y155 = 0;
        while (y155 < tilesY) {
          const t155 = this.mapData[y155][cx155];
          if (t155 !== 'water' && t155 !== 'deep') { y155++; continue; }
          const y0 = y155;                                  // início da faixa de água
          while (y155 < tilesY && (this.mapData[y155][cx155] === 'water' || this.mapData[y155][cx155] === 'deep')) y155++;
          const y1 = y155 - 1;                              // fim da faixa de água
          const comprimento = y1 - y0 + 1;
          const terraAcima = (y0 - 1 >= 0) && ehTerra155(this.mapData[y0 - 1][cx155]) && !(y0 - 2 >= 0 && (this.mapData[y0 - 2][cx155] === 'water' || this.mapData[y0 - 2][cx155] === 'deep'));
          const terraAbaixo = (y1 + 1 < tilesY) && ehTerra155(this.mapData[y1 + 1][cx155]) && !(y1 + 2 < tilesY && (this.mapData[y1 + 2][cx155] === 'water' || this.mapData[y1 + 2][cx155] === 'deep'));
          if (comprimento >= 3 && terraAcima && terraAbaixo) { // começo e fim em terra
            for (let yy = y0; yy <= y1; yy++) {
              for (let xx = Math.max(0, cx155 - 1); xx <= Math.min(tilesX - 1, cx155 + 1); xx++) {
                if (this.mapData[yy][xx] === 'water' || this.mapData[yy][xx] === 'deep') this.mapData[yy][xx] = 'bridge';
              }
            }
          }
        }
      }
    }
    this.events.once('shutdown', function() { // v130 — sem corpos fantasmas entre viagens""")

# =====================================================================
# 5) CAVERNA: o herói também escaneia agressivos (aproximando da beirada)
# =====================================================================
sub1('5a caverna: alvos incluem agressivos',
"""      let closest = null, closestDist = CONFIG.SCAN_RANGE + 60;
      const ens = this.enemies.getChildren();
      for (let i = 0; i < ens.length; i++) {
        const e = ens[i];
        if (e.hp <= 0 || !e.active) continue;
        if (e.type && e.type.isAggressive) continue; // v148 — agressivos não são caçados
        if (e.scanned && !mapPenalty147()) continue; // v148 — re-scan só com penalidade ativa
        const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
        if (d < closestDist) { closest = e; closestDist = d; }
      }
      if (closest) { this.autoState = 'chase'; this.autoTarget = closest; }""",
"""      /* v155 — A CAVERNA TAMBÉM CAÇA AGRESSIVOS. Antes a regra "agressivos não
       * são caçados" deixava a Aranha Gigante (espécie agressiva) literalmente
       * invisível para o herói: ela podia estar colada nele e nada acontecia.
       * A caverna existe para captura fácil (scan 2x), então aqui o herói vai
       * atrás de qualquer criatura — mas nunca entra no raio de ameaça: para na
       * beirada (raio + 16) e só escaneia de fora dele. */
      let closest = null, closestDist = 1e9;
      const ens = this.enemies.getChildren();
      for (let i = 0; i < ens.length; i++) {
        const e = ens[i];
        if (e.hp <= 0 || !e.active) continue;
        if (e.scanned && !mapPenalty147()) continue; // v148 — re-scan só com penalidade ativa
        const raio155 = aggroRadiusOf(e.type);
        const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
        if (raio155 > 0 && d < raio155 + 16) continue; // já dentro do perigo: não caça agora
        const alcance155 = raio155 > 0 ? raio155 + 60 : CONFIG.SCAN_RANGE + 60;
        if (d <= alcance155 && d < closestDist) { closest = e; closestDist = d; }
      }
      if (closest) { this.autoState = 'chase'; this.autoTarget = closest; }""")

sub1('5b caverna: para na beirada do raio de ameaça',
"""        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        if (dist > 48) {
          const angle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
          vx = Math.cos(angle) * CONFIG.PLAYER_SPEED * 0.7 * spdMult; vy = Math.sin(angle) * CONFIG.PLAYER_SPEED * 0.7 * spdMult;
        } else if (this.time.now - GameState.lastScanTime >= CONFIG.SCAN_COOLDOWN) {""",
"""        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        const parada155 = Math.max(48, aggroRadiusOf(target.type) + 24); // v155 — agressivo: para na beirada
        if (dist > parada155) {
          const angle = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
          vx = Math.cos(angle) * CONFIG.PLAYER_SPEED * 0.7 * spdMult; vy = Math.sin(angle) * CONFIG.PLAYER_SPEED * 0.7 * spdMult;
        } else if (this.time.now - GameState.lastScanTime >= CONFIG.SCAN_COOLDOWN) {""")

sub1('5c caverna: scan não cancela cedo + recua se o bicho chegar perto',
"""        if (dist > (GameState.scanTarget && GameState.scanTarget.type && GameState.scanTarget.type.isAggressive ? aggroRadiusOf(GameState.scanTarget.type) + 80 : CONFIG.SCAN_RANGE)) { this.cancelScan(); showFloatText(p.x, p.y - 40, 'Alvo fugiu!', '#ff8fa3'); this.autoState = 'wander'; this.autoTarget = null; } // v148 — alcance estendido
        else {
          p.setVelocity(0, 0);
          GameState.scanCharge += delta;
          this.updateScanBar(target);
          if (GameState.scanCharge >= CONFIG.SCAN_CHARGE_TIME * CONFIG.CAVE_SCAN_MULT) this.completeScan(target);
        }""",
"""        const raioAlvo155 = aggroRadiusOf(GameState.scanTarget.type); // v155 — raio de ameaça do alvo (0 = passivo)
        if (dist > Math.max(CONFIG.SCAN_RANGE, raioAlvo155 + 40)) { this.cancelScan(); showFloatText(p.x, p.y - 40, 'Alvo fugiu!', '#ff8fa3'); this.autoState = 'wander'; this.autoTarget = null; }
        else {
          if (raioAlvo155 > 0 && dist < raioAlvo155 + 12) { // perigoso e colado: recua andando, sem largar o scan
            const fuga155 = Phaser.Math.Angle.Between(target.x, target.y, p.x, p.y);
            p.setVelocity(Math.cos(fuga155) * CONFIG.PLAYER_SPEED * 0.9 * spdMult, Math.sin(fuga155) * CONFIG.PLAYER_SPEED * 0.9 * spdMult);
          } else p.setVelocity(0, 0); // design: parado enquanto escaneia
          GameState.scanCharge += delta;
          this.updateScanBar(target);
          if (GameState.scanCharge >= CONFIG.SCAN_CHARGE_TIME * CONFIG.CAVE_SCAN_MULT) this.completeScan(target);
        }""")

# =====================================================================
# 6) versão + changelog
# =====================================================================
sub1('6 título',
"<title>Chaotic.idleWorld v2.21 — Mapas separados de verdade + scan consertado</title>",
"<title>Chaotic.idleWorld v2.22 — Pontes com sentido + scan na Caverna Secreta</title>")

sub1('7 changelog',
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21c — CHANGELOG (patch v154c — BALANCEAMENTO DO AUTOR)""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.22 — CHANGELOG (patch v155)
// - PONTES COM COMEÇO, MEIO E FIM: a geração do mapa criava tábuas soltas —
//   (a) toda estrada com água ao lado virava 'bridge' (mesmo em terra firme) e
//   (b) os lagos, desenhados depois, pulavam esses tiles e deixavam pedaços de
//   ponte/estrada ilhados no meio da água. Agora as pontes são construídas no
//   FIM, já com a água definitiva: para cada coluna de travessia o jogo acha a
//   faixa contínua de água e só constrói a ponte se houver terra firme nas duas
//   pontas (mínimo 3 tiles de água). Toda ponte começa na terra, atravessa e
//   termina na terra; se não houver travessia válida, não existe ponte.
// - SCAN NA CAVERNA SECRETA: a regra "agressivos não são caçados" deixava a
//   Aranha Gigante invisível para o herói na caverna (ele ficava do lado dela e
//   não escaneava nada). Agora a caverna também caça agressivos: aproxima-se só
//   até a beirada do raio de ameaça, para e escaneia (recurando se o bicho
//   colar), mantendo o scan 2x mais rápido da caverna.
// ============================================================
// CHAOTIC.IDLEWORLD v2.21c — CHANGELOG (patch v154c — BALANCEAMENTO DO AUTOR)""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('\nOK — v2.22 aplicado (%d substituições)' % n)
