#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch v157 — Chaotic.IdleWorld v2.23 (complemento)
==================================================
Caso medido no teste da caverna: se a criatura fica COLADA no herói (≤32px), o
toque dela cancela o scan a cada 1,2 s e a carga da Caverna Secreta precisa de
1,5 s (CAVE_SCAN_MULT 0,5) → o scan NUNCA completa (medi: 25 tentativas, 0
concluídas). No mapa aberto isso não acontece porque o recuo do v155 só dispara
quando existe raio de ameaça (agressivo) — e na caverna/safe zone o raio é 0.

Correção: na CAVERNA, o herói recua andando quando o alvo está a menos de 44px
(mesmo sem raio de ameaça), SEM largar o scan — exatamente o comportamento já
documentado ("recua andando, sem largar o scan"). Assim ele sai do alcance do
toque, termina a carga de 1,5 s e volta a escanear se a criatura fugir.

Não muda nada no mapa aberto (PerimScene) nem no balanceamento: a carga continua
3 s no mapa e 1,5 s na caverna, o herói continua PARADO para escanear (só recua
quando o bicho encosta), e a criatura continua podendo escapar e falhar o scan.
"""
import io, sys

ALVO = '/home/user/chaotic_idleworld_v123.html'

ANTIGO = """          if (raioAlvo155 > 0 && dist < raioAlvo155 + 12) { // perigoso e colado: recua andando, sem largar o scan"""

NOVO = """          // v157 — colado: recua andando sem largar o scan. No mapa aberto o
          // limite é o raio de ameaça; na CAVERNA (raio 0) é 44px — assim o toque
          // da criatura (que cancela o scan) não trava a carga de 1,5 s daqui.
          const colado157 = raioAlvo155 > 0 ? (raioAlvo155 + 12) : 44;
          if (dist < colado157) { // colado: recua andando, sem largar o scan"""


def aplicar(caminho=ALVO):
    s = io.open(caminho, encoding='utf-8').read()
    n = s.count(ANTIGO)
    if n != 1:
        return 'esperava 1 ocorrência do recuo no scan, achei %d' % n
    s = s.replace(ANTIGO, NOVO, 1)

    # changelog: acrescenta o caso do bicho colado na caverna
    ancora = """// - PONTE SÓ NO RIO, NUNCA NO LAGO: faixa com água funda é lago e não recebe ponte."""
    add = """// - SCAN NA CAVERNA COM O BICHO COLADO: se a criatura encosta no herói (≤32px) o
//   toque cancela o scan, mas a carga da caverna é de 1,5 s e o toque acontece a
//   cada 1,2 s — o scan nunca fechava (medido: 25 tentativas, 0 concluídas). Agora,
//   na caverna, o herói recua andando quando o alvo chega a menos de 44px, SEM
//   largar o scan: sai do alcance do toque e completa a carga. (No mapa aberto
//   nada mudou: lá o recuo já existia pelo raio de ameaça.)"""
    if ancora in s:
        s = s.replace(ancora, ancora + "\n" + add, 1)
    else:
        return 'changelog não encontrado'

    io.open(caminho, 'w', encoding='utf-8').write(s)
    return 'OK'


if __name__ == '__main__':
    print(aplicar(sys.argv[1] if len(sys.argv) > 1 else ALVO))
