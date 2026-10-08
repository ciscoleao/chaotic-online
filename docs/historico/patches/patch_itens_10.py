# -*- coding: utf-8 -*-
"""v2.26 / patch v162 — ITENS NO MAPA: 10% DA QUANTIDADE.

Pedido: "a quantidade de itens no mapa reduza para 10%, esses itens não são
recolhidos com tanta facilidade justamente pra eles terem mercado no leilão".

O que muda (tudo 10% do que era):
  · itens que já nascem com o mapa: 20 -> 2
  · teto de itens no mapa (spawn contínuo): 60 -> 6
  · Caverna Secreta: teto 3 -> 1 e itens iniciais 2-3 -> 1 (10% arredondado para
    cima, mínimo 1 — a caverna não fica vazia).

Nada mais muda: os itens continuam valendo o mesmo no Leilão do Pórtico, o peso
dos tipos (sucata/circuito/cristal) e a chance de drop do scan são os mesmos.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        print('ABORTADO (%s): %d ocorrencia(s)' % (rot, s.count(velho))); sys.exit(1)
    s = s.replace(velho, novo, 1); print('ok: ' + rot)

troca("""  MATERIAL_SPAWN_INTERVAL: 8000, MATERIAL_MAX_COUNT: 60,""",
"""  MATERIAL_SPAWN_INTERVAL: 8000, MATERIAL_MAX_COUNT: 6, // v162 — 10% de 60 (itens raros: é o que dá mercado no Leilão)""",
'teto de itens no mapa: 60 -> 6')

troca("""? """, """? """, 'noop-skip') if False else None

troca("""    const scaledMaterialCount = getScaledSpawnCount(GameState.currentRegion, 20); // v2.9 — 10x mais itens no chão""",
"""    const scaledMaterialCount = getScaledSpawnCount(GameState.currentRegion, 2); // v162 — 10% de 20 (itens raros para terem mercado no Leilão)""",
'itens iniciais do mapa: 20 -> 2')

troca("""  CAVE_W: 480, CAVE_H: 384, CAVE_MONSTER_MAX: 2, CAVE_MATERIAL_MAX: 3,""",
"""  CAVE_W: 480, CAVE_H: 384, CAVE_MONSTER_MAX: 2, CAVE_MATERIAL_MAX: 1, // v162 — 10% de 3 (mínimo 1: a caverna não fica vazia)""",
'caverna: teto de itens 3 -> 1')

troca("""    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) this.spawnCaveMaterial();""",
"""    for (let i = 0; i < 1; i++) this.spawnCaveMaterial(); // v162 — 10% (antes 2-3 itens logo na entrada)""",
'caverna: itens iniciais 2-3 -> 1')

troca("""// - v161 — AUTO-MOVE AUTOMÁTICO: a tecla P deixou de existir""",
"""// - v162 — ITENS NO MAPA A 10%: a quantidade de itens largados pelo chão caiu para
//   um décimo (nascem 2 por mapa em vez de 20; o teto do spawn contínuo caiu de 60
//   para 6; na Caverna Secreta, de 3 para 1). O objetivo é o mercado: com item
//   sobrando em toda esquina ninguém compra no LEILÃO DO PÓRTICO — agora cada
//   material vale de verdade. Preços, tipos e drops do scan continuam iguais.
// - v161 — AUTO-MOVE AUTOMÁTICO: a tecla P deixou de existir""",
'changelog v162')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
