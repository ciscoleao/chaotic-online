# -*- coding: utf-8 -*-
"""v2.25 / patch v159c — BLINDAGEM: nunca deixar o update da cena explodir.

Achado durante os testes: se uma criatura for DESTRUÍDA (não apenas morta) enquanto
está sendo escaneada/removida, `e.body` passa a ser null e a linha
`target.body.enable = false` lança TypeError DENTRO do update da cena. Numa exceção
assim, tudo o que vem depois daquela linha no mesmo quadro não roda — num jogo idle
que fica horas no automático, é congelamento. Guarda simples: só mexe no corpo se
ele existir. Zero mudança de comportamento no jogo normal.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

ALVOS = [
    # (original, novo, rotulo)
    ("""        e.hp = 0; e.setVisible(false); e.body.enable = false; if (e.label) e.label.destroy(); // v145 — sem corpo fantasma""",
     """        e.hp = 0; e.setVisible(false); if (e.body) e.body.enable = false; if (e.label) e.label.destroy(); // v145 — sem corpo fantasma // v159c — corpo pode já ter sido destruído""",
     'expiração de criatura (PerimScene)'),
    ("""    target.hp = 0; target.setVisible(false); target.body.enable = false; if (target.label) target.label.destroy();""",
     """    target.hp = 0; target.setVisible(false); if (target.body) target.body.enable = false; if (target.label) target.label.destroy(); // v159c — alvo pode ter sido destruído no meio do scan""",
     'completeScan'),
    ("""      if (now - e.spawnTime > 45000) { e.hp = 0; e.setVisible(false); e.body.enable = false; if (e.label) e.label.destroy(); continue; }""",
     """      if (now - e.spawnTime > 45000) { e.hp = 0; e.setVisible(false); if (e.body) e.body.enable = false; if (e.label) e.label.destroy(); continue; }""",
     'expiração de criatura (CaveScene)'),
    ("""    enemy.hp = 0; enemy.setVisible(false); enemy.body.enable = false; if (enemy.label) enemy.label.destroy();""",
     """    enemy.hp = 0; enemy.setVisible(false); if (enemy.body) enemy.body.enable = false; if (enemy.label) enemy.label.destroy();""",
     'killEnemy (Exterior)'),
]
for velho, novo, rot in ALVOS:
    if s.count(velho) >= 1:
        # pode haver variantes com/sem o comentário v145 — trata as duas
        if s.count(velho) > 1:
            print('aviso: %s aparece %d vezes' % (rot, s.count(velho)))
        s = s.replace(velho, novo)
        print('ok: ' + rot)
    else:
        print('AVISO: não encontrei: ' + rot)

# variante sem o comentário v145 (caso exista)
v2 = """        e.hp = 0; e.setVisible(false); e.body.enable = false; if (e.label) e.label.destroy();
        const poof = this.add.circle(e.x, e.y, 15, 0xaaffaa, 0.6);"""
n2 = """        e.hp = 0; e.setVisible(false); if (e.body) e.body.enable = false; if (e.label) e.label.destroy();
        const poof = this.add.circle(e.x, e.y, 15, 0xaaffaa, 0.6);"""
if s.count(v2) == 1:
    s = s.replace(v2, n2); print('ok: expiração de criatura (variante sem comentário)')

sobrou = s.count('.body.enable = false') - s.count('if (e.body) e.body.enable = false') - s.count('if (target.body) target.body.enable = false') - s.count('if (enemy.body) enemy.body.enable = false')
print('acessos .body.enable sem guarda restantes: %d' % sobrou)

# changelog
velho = """// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,"""
novo = """// - BLINDAGEM (v159c): quatro pontos do jogo faziam `corpo.enable = false` sem
//   conferir se o corpo ainda existia. Se a criatura fosse DESTRUÍDA no meio de um
//   scan (e não apenas morta), a linha explodia com TypeError DENTRO do update da
//   cena — e tudo o que vinha depois dela naquele quadro não rodava. Num idle que
//   fica horas no automático, é congelamento. Agora esses pontos só mexem no corpo
//   se ele existir (comportamento normal do jogo: idêntico).
// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,"""
if s.count(velho) != 1:
    print('ABORTADO: changelog'); sys.exit(1)
s = s.replace(velho, novo, 1); print('ok: changelog v159c')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
