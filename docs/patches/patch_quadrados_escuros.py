#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""v158 — corrige os "quadrados escuros" na grama.

CAUSA: as texturas de grama DECORADA (gdec_0..11, 25% dos tiles de grama) e as
texturas de BARRANCO de margem (bk_MASK_v) também são desenhadas com a paleta
do tema da região (TG147/TD147), mas, diferente de grass_0..2, elas nunca eram
re-assadas quando o jogador trocava de mapa. Resultado: quem bootava o jogo nas
Cavernas de Brasas (tema #4a3230) e ia para o Bosque Verdejante via a grama
verde + ~25% de tiles quase pretos (e os barrancos da margem escuros).

CORREÇÃO: applyRegionTheme147 passa a re-assar TUDO que depende do tema
(gdec_* + invalidação dos bk_*) e o PerimScene reaplica o tema no create() caso
as texturas estejam com a paleta de outra região.
"""
import hashlib
import sys

ARQ = '/home/user/chaotic_idleworld_v123.html'
src = open(ARQ, encoding='utf-8').read()
print('md5 antes: ' + hashlib.md5(src.encode('utf-8')).hexdigest())

# ---------------------------------------------------------------- 1) função de tema
ANTIGO = """function applyRegionTheme147(regionId) {
  try {
    GameState.currentRegion = regionId;
    const boot = game.scene ? game.scene.getScene('BootScene') : null;
    if (!boot) return;
    for (let v = 0; v < 3; v++) {
      const key = 'grass_' + v;
      if (game.textures.exists(key)) game.textures.remove(key);
      createTextureFromCanvas(boot, key, drawGrassTile, 32, 32, v);
    }
  } catch (e) {}
}"""

NOVO = """let __temaAssado158 = null; // v158 — região com que as texturas de tema foram assadas
function applyRegionTheme147(regionId) {
  try {
    GameState.currentRegion = regionId;
    const boot = game.scene ? game.scene.getScene('BootScene') : null;
    if (!boot) return;
    for (let v = 0; v < 3; v++) {
      const key = 'grass_' + v;
      if (game.textures.exists(key)) game.textures.remove(key);
      createTextureFromCanvas(boot, key, drawGrassTile, 32, 32, v);
    }
    /* v158 — os QUADRADOS ESCUROS: a grama decorada (gdec_*) e os barrancos de
     * margem (bk_*) também são desenhados com a paleta do tema (TG147/TD147).
     * Antes só grass_0..2 era re-assada, então quem trocava de mapa ficava com
     * ~25% dos tiles de grama na cor do mapa ANTERIOR. Agora tudo é re-assado. */
    for (let gi = 0; gi < 12; gi++) {
      const kg = 'gdec_' + gi;
      if (game.textures.exists(kg)) game.textures.remove(kg);
      const cvd = document.createElement('canvas'); cvd.width = 32; cvd.height = 32;
      const cdx = cvd.getContext('2d');
      drawGrassTile(cdx, gi % 3);
      drawGrassDecor(cdx, gi);
      boot.textures.addCanvas(kg, cvd);
    }
    // v158 — barrancos: criados sob demanda e cacheados pelo nome (bk_MASK_v);
    // apagar aqui faz bankTex recriar já com o tema novo
    const ks158 = game.textures.getTextureKeys();
    for (let i = 0; i < ks158.length; i++) { if (ks158[i].indexOf('bk_') === 0) game.textures.remove(ks158[i]); }
    __temaAssado158 = regionId;
  } catch (e) {}
}"""

assert src.count(ANTIGO) == 1, 'âncora applyRegionTheme147 nao encontrada (vezes=%d)' % src.count(ANTIGO)
src = src.replace(ANTIGO, NOVO)

# ---------------------------------------------------------------- 2) guarda no create do PerimScene
A2 = """  create() {
    // v154 — semente do mapa: o terreno desta região é sempre o mesmo (e só dela)
    rngSetup154(GameState.currentRegion);"""
N2 = """  create() {
    // v154 — semente do mapa: o terreno desta região é sempre o mesmo (e só dela)
    rngSetup154(GameState.currentRegion);
    // v158 — garante que as texturas de grama/decor/barranco têm a paleta DESTA
    // região antes do bake do chão (evita os "quadrados escuros")
    if (__temaAssado158 !== GameState.currentRegion) applyRegionTheme147(GameState.currentRegion);"""

assert src.count(A2) == 1, 'âncora create() nao encontrada (vezes=%d)' % src.count(A2)
src = src.replace(A2, N2)

# ---------------------------------------------------------------- 3) changelog + título
ANTIGO_T = 'Chaotic.idleWorld v2.23 — Rio de ponta a ponta + 3 pontes (só no rio)'
NOVO_T = 'Chaotic.idleWorld v2.24 — Fim dos quadrados escuros no mapa'
assert src.count(ANTIGO_T) == 1, 'titulo v2.23 nao encontrado'
src = src.replace(ANTIGO_T, NOVO_T)

# ---------------------------------------------------------------- 4) bloco novo no changelog
CH_ANC = '// CHAOTIC.IDLEWORLD v2.23 — CHANGELOG (patch v156 — RIO DE PONTA A PONTA + 3 PONTES)'
CH_NOVO = '''// CHAOTIC.IDLEWORLD v2.24 — CHANGELOG (patch v158 — FIM DOS QUADRADOS ESCUROS NO MAPA)
// - O QUE ERA: 25% dos tiles de grama são tiles DECORADOS (pedra, cogumelo, tufo,
//   flor). As texturas dessa grama decorada (gdec_*) e as dos barrancos de margem
//   (bk_*) também são desenhadas com a paleta da tribo, mas só a grama lisa
//   (grass_*) era re-assada ao trocar de mapa. Resultado: quem estava num mapa
//   escuro (Cavernas de Brasas, #4a3230) e ia para o Bosque Verdejante via a grama
//   verde com manchas quase pretas espalhadas, e os barrancos da margem escuros
//   (medido: gdec_* = #4a3230 no meio de grass_* = #3f9a46).
// - CORREÇÃO: a troca de mapa agora re-assa TUDO o que depende do tema — grama
//   lisa, grama decorada e barrancos — e a cena do mapa confere o tema antes de
//   assar o chão. Nenhuma regra de jogo mudou (scan, pontes, rio e caverna iguais).
''' + CH_ANC
assert src.count(CH_ANC) == 1, 'ancora do changelog v2.23 nao encontrada'
src = src.replace(CH_ANC, CH_NOVO)

open(ARQ, 'w', encoding='utf-8').write(src)
print('md5 depois: ' + hashlib.md5(open(ARQ, 'rb').read()).hexdigest())
print('OK v158 aplicado')
