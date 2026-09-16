# -*- coding: utf-8 -*-
"""v2.25 / patch v159b — NÃO ENCOSTAR: o herói recua andando sem largar o scan.

Fechamento do bug do print: depois de fazer o herói ir atrás da criatura agressiva
em SAFE ZONE (v159), faltava o caso do toque. A criatura a ≤32px cancela o scan a
cada 1,2s (regra de contato) — e em SAFE ZONE ela não causa dano, mas o cancelamento
continua valendo. Resultado: o herói ficava literalmente encostado na Aranha, a
carga reiniciava para sempre e a criatura nunca era escaneada (laço infinito).

Solução: a MESMA que a caverna já usa desde o v157 — se o alvo está a menos de
44px, o herói recua andando SEM largar o scan (a carga NÃO é zerada). Fora desse
caso continua valendo a regra canônica: o herói fica PARADO enquanto escaneia.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

velho = """          // Carregando scan
          p.setVelocity(0, 0);
          GameState.scanCharge += delta;"""
novo = """          // Carregando scan
          /* v159b — NÃO ENCOSTAR: a criatura a ≤32px cancela o scan a cada 1,2s
           * (mesmo em SAFE ZONE, onde ela não causa dano). Se o herói ficar colado,
           * a carga reinicia para sempre e a criatura nunca é escaneada. Saída igual
           * à da caverna (v157): recua andando SEM largar o scan. Fora desse caso o
           * herói continua PARADO enquanto escaneia (regra canônica). */
          const dCol159 = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
          if (dCol159 < 44) {
            const fuga159 = Phaser.Math.Angle.Between(target.x, target.y, p.x, p.y);
            p.setVelocity(Math.cos(fuga159) * CONFIG.PLAYER_SPEED * 0.9 * spdMult, Math.sin(fuga159) * CONFIG.PLAYER_SPEED * 0.9 * spdMult);
          } else p.setVelocity(0, 0); // design: parado enquanto escaneia
          GameState.scanCharge += delta;"""

if s.count(velho) != 1:
    print('ABORTADO: bloco de carga do scan — %d ocorrencia(s)' % s.count(velho)); sys.exit(1)
s = s.replace(velho, novo, 1)
print('ok: bloco de carga do scan (PerimScene)')

velho2 = """// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,"""
novo2 = """// - E O TOQUE (v159b): a criatura a ≤32px cancela o scan a cada 1,2s. Em SAFE
//   ZONE ela não causa dano, mas o cancelamento continuava valendo — o herói
//   ficava encostado, a carga reiniciava para sempre e o bicho nunca era
//   escaneado. Agora, colado (alvo a <44px), o herói RECUA ANDANDO SEM LARGAR O
//   SCAN — a mesma saída da caverna (v157). Fora disso ele fica PARADO.
// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,"""
if s.count(velho2) != 1:
    print('ABORTADO: changelog'); sys.exit(1)
s = s.replace(velho2, novo2, 1)
print('ok: changelog v159b')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
