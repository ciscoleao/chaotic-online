# -*- coding: utf-8 -*-
"""v2.25 / patch v159 — BUG "herói passa reto pela criatura" (Safe Zone).

Relato (print do jogador): no Bosque Verdejante (mapa 1, SAFE ZONE) o auto-move
passou quase colado na "Aranha Gigante Lv.6" (espécie agressiva) e o herói não
foi atrás dela nem escaneou.

Causa raiz: em SAFE ZONE o raio de ameaça é 0 POR DESIGN (não existe IA de
fuga/stalk no mapa 1). Mas o auto-move usava ESSE MESMO 0 para descartar os
agressivos da caça passiva, então em mapas 1 eles nunca eram perseguidos nem
escaneados. Correção: o 0 só desliga a fuga/stalk; a caça (perseguir a ≤160px e
PARAR para escanear a ≤96px, 3s) vale para toda criatura em QUALQUER mapa.
"""
import io, sys

ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()
orig = s

def troca(velho, novo, rotulo):
    global s
    if s.count(velho) != 1:
        print('ABORTADO: %s — %d ocorrencia(s)' % (rotulo, s.count(velho)))
        sys.exit(1)
    s = s.replace(velho, novo, 1)
    print('ok: ' + rotulo)

# --- 1) helper: agressivo só tem fuga/stalk quando o raio de ameaça existe -----
troca(
"""function mapPenalty147() { return !!(GameState.mapPenalty && GameState.mapPenalty[GameState.currentRegion] > 0); }""",
"""/* v159 — BUG "herói passa reto pela criatura" (print do jogador): em SAFE ZONE
 * o raio de ameaça é 0 POR DESIGN (não existe IA de fuga/stalk no mapa 1), mas
 * o auto-move usava esse MESMO 0 para descartar os agressivos da caça passiva —
 * a Aranha Gigante passava do lado e o herói nem ia atrás nem escaneava.
 * Agora o 0 só desliga a fuga/stalk: a caça (perseguir a ≤160px e PARAR para
 * escanear a ≤96px por 3s) vale para toda criatura, em QUALQUER mapa. */
function temFugaStalk159(type) { return !!type && aggroRadiusOf(type) > 0; }
function mapPenalty147() { return !!(GameState.mapPenalty && GameState.mapPenalty[GameState.currentRegion] > 0); }""",
'helper temFugaStalk159()')

# --- 2) caça passiva: não descartar mais os agressivos de SAFE ZONE -------------
troca(
"""        if (e.type && e.type.isAggressive) continue; // v148 — agressivos: só via fuga/stalk""",
"""        if (temFugaStalk159(e.type)) continue; // v159 — só quem tem fuga/stalk (mapa com raio de ameaça); em SAFE ZONE o agressivo entra na caça e é escaneado igual aos passivos""",
'caça passiva L7847')

# --- 3) beirada do scan: em SAFE ZONE vale os 3 tiles canônicos (96px) ----------
troca(
"""        if (dist > (GameState.scanTarget && GameState.scanTarget.type && GameState.scanTarget.type.isAggressive ? aggroRadiusOf(GameState.scanTarget.type) + 80 : CONFIG.SCAN_RANGE)) { // v148 — beirada: alcance estendido p/ agressivos""",
"""        if (dist > (temFugaStalk159(GameState.scanTarget && GameState.scanTarget.type) ? aggroRadiusOf(GameState.scanTarget.type) + 80 : CONFIG.SCAN_RANGE)) { // v159 — beirada estendida só p/ agressivo COM raio; em SAFE ZONE valem os 3 tiles (96px) canônicos""",
'beirada do scan L7888')

# --- 4) versão ----------------------------------------------------------------
troca(
"""<title>Chaotic.idleWorld v2.24 — Fim dos quadrados escuros no mapa</title>""",
"""<title>Chaotic.idleWorld v2.25 — O herói vai atrás de qualquer criatura</title>""",
'titulo v2.25')

troca(
"""// CHAOTIC.IDLEWORLD v2.24 — CHANGELOG (patch v158 — FIM DOS QUADRADOS ESCUROS NO MAPA)""",
"""// CHAOTIC.IDLEWORLD v2.25 — CHANGELOG (patch v159 — O HERÓI VAI ATRÁS E ESCANEIA QUALQUER CRIATURA)
// - O BUG (relato com print): no Bosque Verdejante (mapa 1, SAFE ZONE) o
//   auto-move passou quase colado numa "Aranha Gigante Lv.6" (espécie
//   AGRESSIVA) e o herói não foi atrás dela nem escaneou nada.
// - A CAUSA: em SAFE ZONE o raio de ameaça é 0 POR DESIGN (não existe IA de
//   fuga/stalk no mapa 1 — o herói não precisa fugir de nada ali). Só que o
//   auto-move usava esse MESMO 0 para DESCARTAR os agressivos da caça passiva:
//     · bloco de fuga/stalk: `if (aggroRadiusOf(m.type) <= 0) continue;`
//     · caça passiva:        `if (e.type && e.type.isAggressive) continue;`
//   Resultado: em TODOS os 4 mapas 1 (mapas SAFE ZONE) nenhuma criatura
//   agressiva era perseguida ou escaneada — ela era literalmente invisível
//   para o auto-move, mesmo passando a 58px do herói.
// - A CORREÇÃO: o raio 0 passa a desligar APENAS a fuga/stalk. A caça vale para
//   toda criatura no campo de visão, agressiva ou não, em QUALQUER mapa:
//   a ≤160px (5 tiles) o herói vai atrás; a ≤96px (3 tiles) ele PARA e escaneia
//   por 3s. Em SAFE ZONE o agressivo não persegue o herói, então não há motivo
//   para ignorá-lo. A beirada estendida do scan (raio + 80) continua valendo só
//   onde o raio existe; em SAFE ZONE valem os 96px canônicos.
// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,
//   detecção a 160px, 50% de velocidade da criatura RARA ao ser escaneada, o
//   herói PARA para escanear, caverna 2x (patch v155/v157) e o re-scan só sob
//   penalidade (v148).

// CHAOTIC.IDLEWORLD v2.24 — CHANGELOG (patch v158 — FIM DOS QUADRADOS ESCUROS NO MAPA)""",
'changelog v2.25')

# --- 5) cabeçalho do CONFIG (documenta a regra canônica do scan) ---------------
troca(
"""   *   · se uma criatura passa a até 5 tiles = 160px (MONSTER_DETECT_RANGE),""",
"""   *   · v159: a regra vale em TODOS os mapas, inclusive nos 4 mapas 1 SAFE ZONE
   *     (lá a criatura agressiva não persegue o herói, mas é escaneada igual);
   *   · se uma criatura passa a até 5 tiles = 160px (MONSTER_DETECT_RANGE),""",
'comentario do CONFIG')

if s == orig:
    print('NADA MUDOU'); sys.exit(1)
io.open(ARQ, 'w', encoding='utf-8').write(s)
print('\nescrito: ' + ARQ)
