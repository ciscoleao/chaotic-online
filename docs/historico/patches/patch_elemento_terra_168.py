#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_elemento_terra_168.py — v2.31 (v168)
Troca o ícone do elemento TERRA: 🌍 (planeta) -> ⛰️ (montanha), na carta de scan,
no painel do Scanner, na Coleção e em qualquer lugar que use a ficha do banco.
Cartas ANTIGAS que guardaram o '🌍' no save são convertidas na hora de exibir.

Uso: python3 patch_elemento_terra_168.py [entrada] [saida]
"""
import sys, io, os

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'chaotic_idleworld_v123.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else ENTRADA

s = io.open(ENTRADA, encoding='utf-8').read()
antes = len(s)
trocas = []

def troca(nome, velho, novo, vezes=1):
    global s
    n = s.count(velho)
    if n != vezes:
        raise SystemExit('✗ [%s] esperava %d ocorrência(s), achei %d' % (nome, vezes, n))
    s = s.replace(velho, novo, vezes)
    trocas.append(nome)

# 1) o mapa geral do banco (carta, Scanner, Coleção, fichas)
troca('ELEMENTO_EMOJI164',
      "const ELEMENTO_EMOJI164 = { 'Terra': '🌍', 'Água': '💧', 'Fogo': '🔥', 'Ar': '🌪️' };",
      "const ELEMENTO_EMOJI164 = { 'Terra': '⛰️', 'Água': '💧', 'Fogo': '🔥', 'Ar': '🌪️' }; // v168 — Terra = MONTANHA (era 🌍)")

# 2) o tradutor usado pela carta nova
troca('emojiElemento167',
      "  if (el === 'Fogo') return '🔥'; if (el === 'Água') return '💧'; if (el === 'Terra') return '🌍'; if (el === 'Ar') return '🌪️';",
      "  if (el === 'Fogo') return '🔥'; if (el === 'Água') return '💧'; if (el === 'Terra') return '⛰️'; if (el === 'Ar') return '🌪️'; // v168 — Terra = MONTANHA")

# 3) as cartas clássicas (Lagoa Negra etc.) sorteiam de uma lista fixa de emojis
troca('getCardElements',
      "  const elements = ['🔥', '💧', '⚡', '🌪️', '🌍', '❄️', '💀', '✨'];",
      "  const elements = ['🔥', '💧', '⚡', '🌪️', '⛰️', '❄️', '💀', '✨']; // v168 — Terra = MONTANHA")

# 4) compatibilidade: carta antiga que guardou 🌍 no save é convertida ao exibir
troca('conversao de cartas antigas',
      "function elementosCard167(card, type) {\n  const limpa = function (arr) {",
      """/* v168 — cartas antigas guardaram o 🌍 no save: converte para a montanha na hora de exibir */
function emojiElementoLegado168(e) { return e === '🌍' ? '⛰️' : e; }
function elementosCard167(card, type) {
  const limpa = function (arr) {""")

troca('normalizacao no limpa',
      "    return (arr || []).filter(function (e) { return e && e !== '✨' && e !== '❓' && e !== '⭐' && e !== '👑'; }).slice(0, 4);",
      "    return (arr || []).map(emojiElementoLegado168).filter(function (e) { return e && e !== '✨' && e !== '❓' && e !== '⭐' && e !== '👑'; }).slice(0, 4); // v168")

# 5) também no painel do Scanner / fichas antigas (elementos guardados em texto no save)
troca('fichaBanco164 legado',
      "  const els = (type.elements || []).map(function (el) { return (ELEMENTO_EMOJI164[el] || '✨') + ' ' + el; }).join(' · ');",
      "  const els = (type.elements || []).map(function (el) { return (ELEMENTO_EMOJI164[el] || '✨') + ' ' + el; }).join(' · '); // v168 — via mapa (Terra = ⛰️)")

# 6) título + changelog
troca('titulo',
      "<title>Chaotic.idleWorld v2.30 — Carta de scan nova + qualidade em 50 pontos</title>",
      "<title>Chaotic.idleWorld v2.31 — Ícone de TERRA virou montanha ⛰️</title>")

CHANGELOG = """// ============================================================
// CHAOTIC.IDLEWORLD v2.31 — CHANGELOG (v168 Terra = montanha ⛰️)
// - v168 — O ELEMENTO TERRA TROCOU DE ÍCONE: 🌍 (planeta) -> ⛰️ (montanha),
//   na carta de scan, no painel do Scanner, na Coleção e nas fichas do banco.
//   Cartas antigas que guardaram o 🌍 no save são convertidas ao abrir.
//   Os outros elementos seguem iguais: 🔥 Fogo · 💧 Água · 🌪️ Ar.
"""
troca('changelog',
      "// ============================================================\n// CHAOTIC.IDLEWORLD v2.30 — CHANGELOG",
      CHANGELOG + "// ============================================================\n// CHAOTIC.IDLEWORLD v2.30 — CHANGELOG")

io.open(SAIDA, 'w', encoding='utf-8').write(s)
print('✅ v2.31 aplicado em %s (%d B -> %d B)' % (os.path.basename(SAIDA), antes, len(s)))
for t in trocas:
    print('   ·', t)
