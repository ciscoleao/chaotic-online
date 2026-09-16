#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch v156 — Chaotic.IdleWorld v2.23
====================================
Bugs do jogador (prints): "criou pontes mal feitas agora, quebrou o RIO. O rio é um
percurso de ponta a ponta, ele não deve ser interrompido por terreno. Só deve existir
3 pontes no lago (?!): uma na esquerda, outra no meio e outra na direita — nada de
ponte em lagos, apenas no rio."

O que o despejo do mapa (63x47, ow_grove) mostrou:
  · a PRAIA DE CHEGADA (tile 18,24) convertia a água do rio em 'path' → rio CORTADO;
  · o bloco de pontes da v155 acrescentava "toda coluna onde uma estrada encosta na
    água" → as colunas 12-15 e 26-33 (8 colunas seguidas!) viraram travessia e as
    pontes se fundiram em DECKS de 4x5 e 8x7 tiles, cobrindo o rio;
  · uma dessas colunas passava por cima de um LAGO (colunas 22-23 x linhas 32-36,
    com água funda) → ponte em lago (proibido).

Correções deste patch:
  1) RIO DE PONTA A PONTA: cada tile de água do rio é marcado (this._rioCells) e um
     passe final reimpõe 'water' onde algum terreno tentou cortar o rio. O rio também
     DESVIA da praia de chegada (deslocamento suave de 1 tile por coluna), em vez de a
     praia cortá-lo.
  2) EXATAMENTE 3 PONTES: apenas nas colunas 0,22 / 0,52 / 0,80 da largura (esquerda,
     meio, direita). Sai a regra "coluna onde a estrada encosta na água" (era ela que
     criava os decks).
  3) PONTE SÓ NO RIO: uma faixa com água funda ('deep') é LAGO e nunca recebe ponte;
     a faixa tem de conter água marcada como rio.
  4) Cada ponte continua com começo, meio e fim: terra firme nas duas pontas e no
     mínimo 3 tiles de água no meio.
"""
import io, sys, re

ALVO = '/home/user/chaotic_idleworld_v123.html'

def aplicar(caminho):
    s = io.open(caminho, encoding='utf-8').read()
    orig = s

    # ---------------------------------------------------------------- SUB 1
    # Bloco do rio: marca os tiles + desvia da praia + praia não mexe no rio
    antigo1 = """    { // v130 — rio LARGO com curvas: caminho serpenteante + carimbo de elipses
      let ry = Math.floor(tilesY / 2) + Math.floor(rng154() * 4 - 2);
      let vel = 0;
      for (let rx = 0; rx < tilesX; rx++) {
        vel += (rng154() - 0.5) * 0.9;
        vel = Phaser.Math.Clamp(vel + (Math.floor(tilesY / 2) - ry) * 0.02, -1.1, 1.1);
        ry = Phaser.Math.Clamp(Math.round(ry + vel), 3, tilesY - 4);
        const rad = 2.1 + rng154() * 0.7; // v138 — carimbo CIRCULAR: margens arredondadas (sem colunas retas)
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx * dx + dy * dy * 1.25 <= rad * rad) {
              this.mapData[Phaser.Math.Clamp(ry + dy, 0, tilesY - 1)][Phaser.Math.Clamp(rx + dx, 0, tilesX - 1)] = 'water';
            }
          }
        }
      }
      // v155 — as pontes passaram a ser construídas no FIM da geração
      // (depois dos lagos), com começo, meio e fim. Ver bloco "PONTES" abaixo.
      // clareira do spawn (600,780 = tile 18,24 — praia de chegada)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        const yy = Phaser.Math.Clamp(24 + dy, 0, tilesY - 1), xx = Phaser.Math.Clamp(18 + dx, 0, tilesX - 1);
        if (this.mapData[yy][xx] === 'water' || this.mapData[yy][xx] === 'deep') this.mapData[yy][xx] = 'path';
      }
    }"""
    novo1 = """    { // v130 — rio LARGO com curvas: caminho serpenteante + carimbo de elipses
      /* v156 — O RIO É UM PERCURSO DE PONTA A PONTA. Cada tile de água do rio é
       * marcado aqui (this._rioCells) e no fim da geração um passe reimpõe a água:
       * nenhum terreno (praia, lago, estrada) pode cortar o rio. */
      const rioCells156 = this._rioCells = {};
      let ry = Math.floor(tilesY / 2) + Math.floor(rng154() * 4 - 2);
      let vel = 0;
      for (let rx = 0; rx < tilesX; rx++) {
        vel += (rng154() - 0.5) * 0.9;
        vel = Phaser.Math.Clamp(vel + (Math.floor(tilesY / 2) - ry) * 0.02, -1.1, 1.1);
        ry = Phaser.Math.Clamp(Math.round(ry + vel), 3, tilesY - 4);
        // v156 — o rio DESVIA da praia de chegada (tile 18,24): deslocamento suave de
        // 1 tile por coluna (em vez de a praia cortar o rio, o rio se afasta dela).
        if (Math.abs(ry - 24) < 5) ry += (ry < 24) ? -1 : 1;
        ry = Phaser.Math.Clamp(ry, 3, tilesY - 4);
        const rad = 2.1 + rng154() * 0.7; // v138 — carimbo CIRCULAR: margens arredondadas (sem colunas retas)
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx * dx + dy * dy * 1.25 <= rad * rad) {
              const yy156 = Phaser.Math.Clamp(ry + dy, 0, tilesY - 1), xx156 = Phaser.Math.Clamp(rx + dx, 0, tilesX - 1);
              this.mapData[yy156][xx156] = 'water';
              rioCells156[xx156 + ',' + yy156] = 1; // v156 — marca a água do rio
            }
          }
        }
      }
      // v155 — as pontes passaram a ser construídas no FIM da geração
      // (depois dos lagos), com começo, meio e fim. Ver bloco "PONTES" abaixo.
      // clareira do spawn (600,780 = tile 18,24 — praia de chegada)
      // v156 — a praia de chegada NUNCA toca na água do rio.
      for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        const yy = Phaser.Math.Clamp(24 + dy, 0, tilesY - 1), xx = Phaser.Math.Clamp(18 + dx, 0, tilesX - 1);
        if (rioCells156[xx + ',' + yy]) continue;
        if (this.mapData[yy][xx] === 'water' || this.mapData[yy][xx] === 'deep') this.mapData[yy][xx] = 'path';
      }
    }"""
    if antigo1 not in s:
        return 'SUB1 não encontrada (bloco do rio)'
    s = s.replace(antigo1, novo1, 1)

    # ---------------------------------------------------------------- SUB 2 + 3
    # Troca TODO o bloco de pontes da v155 pelo da v2.23 (3 pontes, só no rio)
    ini = s.find("    /* v155 — PONTES COM COMEÇO, MEIO E FIM.")
    if ini < 0:
        return 'SUB2 não encontrada (início do bloco de pontes)'
    fim_ancora = """                if (this.mapData[yy][xx] === 'water' || this.mapData[yy][xx] === 'deep') this.mapData[yy][xx] = 'bridge';
              }
            }
          }
        }
      }
    }
"""
    fim = s.find(fim_ancora, ini)
    if fim < 0:
        return 'SUB2 não encontrada (fim do bloco de pontes)'
    fim += len(fim_ancora)

    novo_bloco = """    /* v156 — O RIO É CONTÍNUO E SÓ EXISTEM 3 PONTES (esquerda, meio, direita).
     * Passe de conserto: se algum terreno (praia de chegada, lago, estrada) tiver
     * tapado a água do rio, a água VOLTA — o rio atravessa o mapa de ponta a ponta. */
    {
      const marcados156 = this._rioCells || {};
      const chaves156 = Object.keys(marcados156);
      for (let i = 0; i < chaves156.length; i++) {
        const par156 = chaves156[i].split(',');
        const x156 = parseInt(par156[0], 10), y156 = parseInt(par156[1], 10);
        if (x156 < 0 || y156 < 0 || x156 >= tilesX || y156 >= tilesY) continue;
        const t156 = this.mapData[y156][x156];
        if (t156 === 'grass' || t156 === 'path') this.mapData[y156][x156] = 'water'; // o rio não pode ser cortado
      }
    }
    /* v156 — PONTES: exatamente 3 (0,22 · 0,52 · 0,80 da largura), SEMPRE sobre o rio,
     * NUNCA sobre lago. Cada uma atravessa a faixa contínua de água do rio com terra
     * firme nas duas pontas: começo, meio e fim. Nada de tábua solta e nada de deck. */
    {
      const cols156 = [0.22, 0.52, 0.8].map(function(f) { return Math.floor(tilesX * f); });
      const ehTerra156 = function(t) { return t === 'grass' || t === 'path'; };
      const rio156 = this._rioCells || {};
      for (let ci = 0; ci < cols156.length; ci++) {
        const cx156 = Phaser.Math.Clamp(cols156[ci], 1, tilesX - 2);
        let y156 = 0;
        while (y156 < tilesY) {
          const t156 = this.mapData[y156][cx156];
          if (t156 !== 'water' && t156 !== 'deep') { y156++; continue; }
          const y0 = y156;
          let temFundo156 = (t156 === 'deep'), temRio156 = !!rio156[cx156 + ',' + y156];
          while (y156 < tilesY && (this.mapData[y156][cx156] === 'water' || this.mapData[y156][cx156] === 'deep')) {
            if (this.mapData[y156][cx156] === 'deep') temFundo156 = true;
            if (rio156[cx156 + ',' + y156]) temRio156 = true;
            y156++;
          }
          const y1 = y156 - 1;
          const comprimento156 = y1 - y0 + 1;
          if (comprimento156 < 3) continue;              // ponte precisa de água no meio
          if (temFundo156) continue;                     // v156 — água funda = LAGO: nada de ponte em lago
          if (!temRio156) continue;                      // v156 — só o rio ganha ponte
          const terraAcima156 = (y0 - 1 >= 0) && ehTerra156(this.mapData[y0 - 1][cx156]);
          const terraAbaixo156 = (y1 + 1 < tilesY) && ehTerra156(this.mapData[y1 + 1][cx156]);
          if (!terraAcima156 || !terraAbaixo156) continue; // começo e fim têm de ser em terra firme
          for (let yy = y0; yy <= y1; yy++) {
            for (let xx = Math.max(0, cx156 - 1); xx <= Math.min(tilesX - 1, cx156 + 1); xx++) {
              if (this.mapData[yy][xx] === 'water' || this.mapData[yy][xx] === 'deep') this.mapData[yy][xx] = 'bridge';
            }
          }
        }
      }
    }
"""
    s = s[:ini] + novo_bloco + s[fim:]

    # ---------------------------------------------------------------- SUB 4
    # Changelog
    antigo4 = """// CHAOTIC.IDLEWORLD v2.22 — CHANGELOG (patch v155)"""
    novo4 = """// CHAOTIC.IDLEWORLD v2.23 — CHANGELOG (patch v156 — RIO DE PONTA A PONTA + 3 PONTES)
// - O RIO NÃO É MAIS CORTADO: a praia de chegada (tile 18,24) convertia a água do
//   rio em estrada e o rio ficava interrompido no meio do mapa. Agora a praia não
//   toca na água do rio (o rio desvia dela com um deslocamento suave de 1 tile por
//   coluna) e um passe final reimpõe a água em todo tile do rio que algum terreno
//   tenha tapado — o rio atravessa o mapa de PONTA A PONTA.
// - SÓ 3 PONTES (esquerda, meio e direita): a v2.22 também transformava em travessia
//   TODA coluna em que uma estrada encostava na água. Com dezenas de estradas perto
//   da água isso criava pontes coladas uma na outra, que apareciam como DECKS largos
//   cobrindo o rio. Agora a travessia só existe nas 3 colunas fixas (0,22 · 0,52 ·
//   0,80 da largura) — e cada uma tem começo, meio e fim em terra firme.
// - PONTE SÓ NO RIO, NUNCA NO LAGO: faixa com água funda é lago e não recebe ponte.
// CHAOTIC.IDLEWORLD v2.22 — CHANGELOG (patch v155)"""
    if antigo4 not in s:
        return 'SUB4 não encontrada (changelog v2.22)'
    s = s.replace(antigo4, novo4, 1)

    # ---------------------------------------------------------------- SUB 5
    # Título
    antigo5 = "<title>Chaotic.idleWorld v2.22 — Pontes com sentido + scan na Caverna Secreta</title>"
    novo5 = "<title>Chaotic.idleWorld v2.23 — Rio de ponta a ponta + 3 pontes (só no rio)</title>"
    if antigo5 not in s:
        return 'SUB5 não encontrada (título)'
    s = s.replace(antigo5, novo5, 1)

    if s == orig:
        return 'nada mudou'
    io.open(caminho, 'w', encoding='utf-8').write(s)
    return 'OK'


if __name__ == '__main__':
    print(aplicar(sys.argv[1] if len(sys.argv) > 1 else ALVO))
