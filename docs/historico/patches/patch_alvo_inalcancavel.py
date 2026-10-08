# -*- coding: utf-8 -*-
"""v2.25 / patch v160 — NÃO PERSEGUIR PARA SEMPRE (2º caminho do "passou reto").

Descoberto ao investigar o mesmo print por outro ângulo: quando o herói entra em
'chase' atrás de uma criatura, esse estado IGNORA todo o resto do mapa — e a
perseguição não tinha desistência. Como as CRIATURAS não colidem com casas/paredes
(só com água funda) e o HERÓI colide, o alvo pode atravessar uma casa e deixar o
herói empurrando a parede para sempre — enquanto uma Aranha Gigante passa a 87px
e ele não faz nada (medido: 0 tentativas de scan na aranha, 0 quadros perseguindo
ela). O caso "alvo disparou para longe" é o mesmo problema.

Correção: em 'chase', o herói larga o alvo quando
  · fica ~2,4s sem sair do lugar e sem chegar perto (empurrando parede), ou
  · o alvo dispara para além de 300px (9+ tiles) sem o herói se aproximar.
Aí volta a 'wander' e a caça normal (≤160px) pega quem estiver por perto.
Vale no mapa aberto e na Caverna Secreta.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        print('ABORTADO (%s): %d ocorrencia(s)' % (rot, s.count(velho))); sys.exit(1)
    s = s.replace(velho, novo, 1); print('ok: ' + rot)

# 1) helper
troca("""function temFugaStalk159(type) { return !!type && aggroRadiusOf(type) > 0; }""",
"""function temFugaStalk159(type) { return !!type && aggroRadiusOf(type) > 0; }
/* v160 — DESISTIR DE ALVO INALCANÇÁVEL (2º caminho do "passou reto pela criatura"):
 * o estado 'chase' IGNORA todo o resto do mapa e não tinha desistência. Como as
 * CRIATURAS não colidem com casas/paredes (só com água funda) e o HERÓI colide, o
 * alvo pode atravessar uma casa e deixar o herói empurrando a parede para sempre —
 * enquanto uma Aranha Gigante passa colada e ele não faz nada. Devolve true quando
 * é hora de largar o alvo: ~2,4s sem sair do lugar sem chegar perto, ou alvo a mais
 * de 300px sem o herói se aproximar. */
function alvoInalcancavel160(sc, alvo, dist, p) {
  if (!sc.__caca160 || sc.__caca160.alvo !== alvo) {
    sc.__caca160 = { alvo: alvo, t: sc.time.now, x: p.x, y: p.y, dist: dist, travado: 0 };
    return false;
  }
  const c = sc.__caca160;
  if (sc.time.now - c.t >= 1200) {
    const andou = Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y);
    if (andou < 14 && dist >= c.dist - 8) c.travado++; else c.travado = 0;
    c.t = sc.time.now; c.x = p.x; c.y = p.y; c.dist = dist;
  }
  const longe = dist > CONFIG.MONSTER_DETECT_RANGE + 140 && dist >= c.dist - 8; // 300px
  return c.travado >= 2 || longe;
}""", 'helper alvoInalcancavel160()')

# 2) Perseguição do mapa aberto (PerimScene)
troca("""      if (!target || target.hp <= 0 || target.scanned) {
        this.autoState = 'wander'; this.autoTarget = null;
      } else {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        if (dist > 48) {""",
"""      if (!target || target.hp <= 0 || target.scanned) {
        this.autoState = 'wander'; this.autoTarget = null; this.__caca160 = null;
      } else {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        if (alvoInalcancavel160(this, target, dist, p)) { // v160 — alvo impossível: solta e volta a caçar
          this.__caca160 = null; this.autoState = 'wander'; this.autoTarget = null;
          showFloatText(p.x, p.y - 40, 'Alvo inalcançável — procurando outro', '#ffd27f');
        } else if (dist > 48) {""", 'PerimScene: desistir do alvo')

# 3) Perseguição da Caverna Secreta
troca("""      if (!target || target.hp <= 0 || target.scanned) { this.autoState = 'wander'; this.autoTarget = null; }
      else {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        const parada155 = Math.max(48, aggroRadiusOf(target.type) + 24); // v155 — agressivo: para na beirada
        if (dist > parada155) {""",
"""      if (!target || target.hp <= 0 || target.scanned) { this.autoState = 'wander'; this.autoTarget = null; this.__caca160 = null; }
      else {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, target.x, target.y);
        const parada155 = Math.max(48, aggroRadiusOf(target.type) + 24); // v155 — agressivo: para na beirada
        if (alvoInalcancavel160(this, target, dist, p)) { // v160 — alvo impossível (parede da caverna): solta e volta a caçar
          this.__caca160 = null; this.autoState = 'wander'; this.autoTarget = null;
          showFloatText(p.x, p.y - 40, 'Alvo inalcançável — procurando outro', '#ffd27f');
        } else if (dist > parada155) {""", 'CaveScene: desistir do alvo')

# 4) changelog
troca("""// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,""",
"""// - 2º CAMINHO DO MESMO BUG (v160): o estado 'chase' IGNORA todo o resto do mapa e
//   não tinha desistência. Como as CRIATURAS não colidem com casas/paredes (só com
//   água funda) e o HERÓI colide, o alvo podia atravessar uma casa e deixar o herói
//   empurrando a parede para sempre — enquanto uma Aranha Gigante passava a 87px
//   sem ser olhada (medido: 0 tentativas de scan nela). Agora o herói larga o alvo
//   quando fica ~2,4s sem sair do lugar sem chegar perto ou quando o alvo dispara
//   para além de 300px sem aproximação — e volta a caçar quem estiver por perto.
//   Vale no mapa aberto e na Caverna Secreta.
// - NÃO MUDOU: fuga/stalk (mapas não-safe), carga do scan (3s), alvo a 96px,""",
'changelog v160')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
