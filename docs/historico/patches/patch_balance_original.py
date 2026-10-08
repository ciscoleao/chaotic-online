#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v154c — BALANCEAMENTO ORIGINAL RESTAURADO (a pedido do autor)
Chaotic.IdleWorld

O autor definiu: o jogo é para ser DIFÍCIL e as criaturas RARAS — a pessoa
deixa o personagem horas no mapa para conseguir um Scan bom. Então:

  · criaturas RARAS de novo ....... volta ao cálculo original do jogo
                                    (getScaledSpawnCount: ~2 no mapa 1) — eu
                                    havia aumentado para 6–22, o que massifica
  · vida útil de 20 SEGUNDOS ...... volta ao original (eu havia posto 45s)
  · ao ser escaneada, a criatura perde 50% DA VELOCIDADE (volta ao original)
                                    — ela PODE escapar e o scan pode falhar
  · o herói PARA para escanear .... (já era assim na lógica de scan)
  · sem "proteção" de vida ........ o alvo pode desaparecer no meio do scan
                                    (era uma invenção minha; removida)

O que NÃO é balanceamento e continua: metas do Auto-Move dentro do mapa
(bug que prendia o herói na borda), teto de perseguição de 5 tiles (160px),
alcance de scan de 3 tiles (96px), carga de 3s, mapas separados no online e
terreno próprio por região.

REGRA FINAL DO SCAN (design do autor):
  3s de carga · alvo a ≤3 tiles (96px) · persegue quem passa a ≤5 tiles (160px)
  criatura a 50% da velocidade durante o scan · o herói fica parado enquanto escaneia
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

# ---------------------------------------------------------- 1) criaturas raras: remove o helper
sub1('1 remove monsterMax154',
"""/* v154 — QUANTAS CRIATURAS CABEM NO MAPA: densidade por área com piso e teto.
 * Antes o mapa 1 (2000×1500) ficava com 2 criaturas (e cada uma vivia 20 s),
 * então quase nunca havia o que escanear. */
function monsterMax154(regionId) {
  const d = getRegionDimensions(regionId);
  const base = Math.round((d.w * d.h) / 300000); // ~1 criatura a cada 300 mil px²
  return Math.max(6, Math.min(22, base));
}

""", "")

# ---------------------------------------------------------- 2) spawn inicial (original)
sub1('2 spawn inicial original',
"""    const scaledMonsterCount = Math.max(2, Math.round(monsterMax154(GameState.currentRegion) * 0.5)); // v154""",
"""    const scaledMonsterCount = getScaledSpawnCount(GameState.currentRegion, 3); // design: criaturas RARAS""")

# ---------------------------------------------------------- 3) teto de criaturas (original)
sub1('3 teto de criaturas original',
"""      const scaledMaxMonsters = monsterMax154(GameState.currentRegion); // v154 — densidade por mapa""",
"""      const scaledMaxMonsters = getScaledSpawnCount(GameState.currentRegion, CONFIG.MONSTER_MAX_COUNT); // design: raras""")

# ---------------------------------------------------------- 4) vida de 20s
sub1('4 vida de 20s',
"""  MONSTER_SPAWN_INTERVAL: 10000, MONSTER_MAX_COUNT: 4, MONSTER_LIFETIME: 45000, // v154 — 45s de vida""",
"""  MONSTER_SPAWN_INTERVAL: 10000, MONSTER_MAX_COUNT: 4, MONSTER_LIFETIME: 20000, // design: 20s (raras)""")

# ---------------------------------------------------------- 5) 50% de velocidade durante o scan
sub1('5a Perim: 50% de velocidade ao ser escaneada',
"""      // v154 — a criatura PARA enquanto é escaneada (antes andava a 50% e saía do
      // alcance antes dos 3s de carga, cancelando o scan com "Alvo fugiu!")
      if (isBeingScanned) { evx = 0; evy = 0; }""",
"""      // design: ao ser escaneada a criatura perde 50% da velocidade — ela PODE
      // escapar dos 3 tiles antes dos 3s e o scan falhar (o jogo é difícil de propósito)
      if (isBeingScanned) { evx *= 0.5; evy *= 0.5; }""")

sub1('5b Caverna: 50% de velocidade ao ser escaneada',
"""      if (isBeingScanned) { evx = 0; evy = 0; } // v154 — idem: alvo do scan não foge""",
"""      if (isBeingScanned) { evx *= 0.5; evy *= 0.5; } // design: o alvo pode escapar""")

# ---------------------------------------------------------- 6) vida útil sem "proteção"
sub1('6 vida útil sem proteção',
"""      // Lifetime: desaparece após o tempo de vida (v154 — 45s)
      // v154 — EXCEÇÃO: quem está sendo escaneado agora NÃO desaparece
      // (antes a criatura podia sumir no meio do scan e cancelar tudo)
      if (now - e.spawnTime > CONFIG.MONSTER_LIFETIME && !(this.autoState === 'scan' && GameState.scanTarget === e)) {""",
"""      // Lifetime: desaparece após 20 segundos (criaturas raras — pode sumir no
      // meio de um scan; faz parte da dificuldade do idle)
      if (now - e.spawnTime > CONFIG.MONSTER_LIFETIME) {""")

# ---------------------------------------------------------- 7) changelog
sub1('7 changelog',
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21b — CHANGELOG (patch v154b)""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21c — CHANGELOG (patch v154c — BALANCEAMENTO DO AUTOR)
// - CRIATURAS RARAS DE NOVO: volta a contagem original do jogo (o cálculo por
//   área do próprio mapa, ~2 no mapa 1) e a vida de 20 SEGUNDOS. O jogo é para
//   ser difícil: deixar o Caçador horas no mapa farmando para achar e escanear
//   as criaturas é o objetivo. (Eu havia aumentado a densidade e a vida — voltei.)
// - SCAN COMO NO DESIGN ORIGINAL: a criatura perde 50% DA VELOCIDADE enquanto é
//   escaneada (pode escapar dos 3 tiles e o scan falhar) e o herói PARA para
//   escanear. Sem "proteções" extras: o alvo também pode desaparecer no fim da
//   vida dele no meio do scan.
// - CONTINUAM APENAS OS CONSERTOS DE BUG (não mexem no balanceamento):
//   · o herói do Auto-Move mira metas DENTRO do mapa atual (antes usava o
//     tamanho do Pórtico e ficava preso na borda de mapas menores);
//   · persegue quem passa a até 5 tiles (160px) · escaneia a até 3 tiles (96px)
//     · carga de 3 segundos;
//   · cada mapa é uma sala própria no online (chat PERTO separado) e tem o seu
//     terreno/relevo semeados pelo id da região.
// ============================================================
// CHAOTIC.IDLEWORLD v2.21b — CHANGELOG (patch v154b)""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('\nOK — v154c aplicado (%d substituições): balanceamento original do autor' % n)
