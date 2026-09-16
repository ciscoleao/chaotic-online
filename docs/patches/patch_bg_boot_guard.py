#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v154b — O CO-PILOTO NÃO PODE DAR PASSO DURANTE O BOOT DO PHASER
Chaotic.IdleWorld

BUG (achado testando o fluxo real, reproduzido 100%):
  Quando o jogo é aberto com ?pip=1 (botão 🪟 "abrir o jogo em janela própria"),
  a arme liga o modo "fora da aba" (bgSet152). O co-piloto desse modo chama
  `game.step(agora, dt)` a cada 50ms quando não vê quadros reais — e no boot
  ainda não existe quadro nenhum. Esse `game.step()` ANTES do Phaser terminar
  de subir consome a fila de cenas: o SceneManager termina a inicialização com
  ZERO cenas e o jogo fica numa tela cinza vazia, para sempre (nenhum erro no
  console).

CORREÇÃO: o co-piloto só pode dar passo quando o jogo ESTIVER DE PÉ:
  `bgPronto152()` = game.isBooted && sceneManager com pelo menos 1 cena
  registrada. Antes disso o passo é ignorado (os quadros reais cuidam de tudo).
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

# 1) helper de "jogo de pé"
sub1('1 helper bgPronto152',
"""function bgTickerStart152() { if (BG152.ticker) return; BG152.ultimoPasso = performance.now(); BG152.ticker = setInterval(bgTick152, BG152.taxa); }""",
"""/* v154b — o jogo JÁ SUBIU? Enquanto o Phaser faz o boot (ou se por algum motivo
 * a cena ainda não foi registrada), o co-piloto NÃO pode chamar game.step():
 * um passo nessa hora consome a fila de cenas e o jogo abre numa tela vazia
 * (bug da janela ?pip=1, reproduzido e corrigido aqui). */
function bgPronto152() {
  try {
    if (!game || game.pendingDestroy) return false;
    if (!game.isBooted) return false;
    const sm = game.scene;
    if (!sm || !sm.isBooted || !sm.scenes || sm.scenes.length < 1) return false;
    return true;
  } catch (e) { return false; }
}
function bgTickerStart152() { if (BG152.ticker) return; BG152.ultimoPasso = performance.now(); BG152.ticker = setInterval(bgTick152, BG152.taxa); }""")

# 2) guarda no próprio ticker
sub1('2 guarda no bgTick152',
"""function bgTick152() {
  try {
    if (!game || game.pendingDestroy) return;
    const agora = performance.now();""",
"""function bgTick152() {
  try {
    if (!game || game.pendingDestroy) return;
    if (!bgPronto152()) return; // v154b — NUNCA dar passo durante o boot do Phaser
    const agora = performance.now();""")

# 3) a arme do ?pip=1 só liga o modo fora da aba quando o jogo estiver de pé
sub1('3 arme espera o jogo subir',
"""    PIP152.arme = true;
    bgSet152(true, true);""",
"""    PIP152.arme = true;
    /* v154b — a arme liga o modo "fora da aba" assim que o jogo estiver de pé
       (antes disso o co-piloto poderia dar passo no meio do boot do Phaser). */
    (function ligaBgQuandoPronto(tentativa) {
      if (bgPronto152()) { bgSet152(true, true); return; }
      if ((tentativa || 0) > 100) return; // ~10s; se não subir, não força nada
      setTimeout(function() { ligaBgQuandoPronto((tentativa || 0) + 1); }, 100);
    })(0);""")

# 4) changelog
sub1('4 changelog',
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21 — CHANGELOG (patch v154)""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.21b — CHANGELOG (patch v154b)
// - TELA CINZA NA JANELA NOVA (?pip=1) RESOLVIDA: ao abrir o jogo pelo botão
//   🪟 (que usa a URL ?pip=1), a arme ligava o modo "fora da aba" e o
//   co-piloto dele chamava game.step() ANTES do Phaser terminar o boot — isso
//   consumia a fila de cenas e o jogo abria vazio (0 cenas, sem erro algum).
//   Agora o co-piloto só dá passo quando o jogo está de pé (bgPronto152) e a
//   arme espera esse momento para ligar o modo fora da aba.
// ============================================================
// CHAOTIC.IDLEWORLD v2.21 — CHANGELOG (patch v154)""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('\nOK — v154b aplicado (%d substituições)' % n)
