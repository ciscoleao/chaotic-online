import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# -*- coding: utf-8 -*-
"""Extrai as funções draw* do jogo para o editor de mapa (protótipo).
Uso: python3 build_editor_tex.py -> escreve /tmp/editor_tex.js (+ report de deps).
"""
import io
import re
import sys

GAME = os.path.join(ROOT, 'chaotic-online', 'chaotic_idleworld_v123.html')

WANT = [
    # chão/parede atual do Pátio
    'drawLunarFloor', 'drawLunarWall',
    # piso/parede clássicos do pórtico
    'drawPorticoFloor', 'drawPorticoWall',
    # mobília/deco do Pátio
    'drawPlanter', 'drawPorticoScreen', 'drawPorticoTerminal', 'drawPorticoSeat',
    'drawPorticoRing', 'drawPorticoTable', 'drawPorticoChair', 'drawVendingMachine',
    'drawGlowSoft', 'drawGlowDot',
    # portal
    'drawPortalGlow', 'drawPortalPillar', 'drawPortalCore', 'drawPortalRing',
    # salas + placas + quadro
    'drawRoomDeposit', 'drawRoomAuction', 'drawRoomDrome', 'drawRoomLounge',
    'drawNeonSign', 'drawMissionBoard',
    # npcs/robôs/drones
    'drawNPC', 'drawRobotClerk', 'drawClerkCounter',
    'drawDroneBase', 'drawDroneA', 'drawDroneB', 'drawDroneC',
    # helper usado por algumas draw*
    'drawPixelRect',
    # outros mapas (Drome, Caverna, Ilha)
    'drawDromeFloor', 'drawDromeWall', 'drawDromePortal',
    'drawCaveFloor', 'drawCaveWall',
    'drawExtGrass', 'drawExtPath', 'drawExtWater', 'drawExtHedge',
    'drawExtTree', 'drawExtFountain', 'drawCentralBuilding',
    'drawDromoCrellan', 'drawDromoHotekk', 'drawDromoAmzen', 'drawDromoOron',
    'drawDromoTirasis', 'drawDromoImthor', 'drawDromoChirrul',
    # itens & materiais
    'drawEnergyCell', 'drawMatSucata', 'drawMatGeodo', 'drawMatCircuito',
    'drawMatCristal', 'drawGroundMat', 'drawGMatGema', 'drawGMatCristal',
    'drawGMatFio', 'drawGMatReator',
    # portal mini do pórtico clássico
    'drawPorticoPortal',
    # base dos dromos
    'drawDromoShell',
]

if not os.path.isfile(GAME):
    print('sem clone chaotic-online: texturas nao extraidas (ajuste GAME)')
    raise SystemExit(0)
s = io.open(GAME, encoding='utf-8').read()
lines = s.split('\n')

out = []
for name in WANT:
    # acha "function NAME(" em qualquer indentação
    idx = None
    for i, ln in enumerate(lines):
        if re.match(r'^\s*function ' + name + r'\(', ln):
            idx = i
            break
    if idx is None:
        print('FALTA: ' + name)
        sys.exit(1)
    # casa chaves a partir da linha
    depth = 0
    started = False
    end = idx
    for i in range(idx, len(lines)):
        for ch in lines[i]:
            if ch == '{':
                depth += 1
                started = True
            elif ch == '}':
                depth -= 1
        if started and depth == 0:
            end = i
            break
    block = lines[idx:end + 1]
    # dedenta (remove indentação comum)
    ind = re.match(r'^(\s*)', block[0]).group(1)
    ded = [ln[len(ind):] if ln.startswith(ind) else ln for ln in block]
    out.append('// ---- do jogo: ' + name + ' (extraído de chaotic_idleworld_v123.html)')
    out.append('\n'.join(ded))

bundle = '\n\n'.join(out) + '\n'
io.open('/tmp/editor_tex.js', 'w', encoding='utf-8').write(bundle)
print('extraídas: %d funções -> /tmp/editor_tex.js (%d bytes)' % (len(out) // 2, len(bundle)))

# ---- report de dependências: chamadas "nuas" (não ctx./Math./new) ----
calls = set(re.findall(r'(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(', bundle))
allow = {'function', 'if', 'for', 'while', 'switch', 'catch', 'return',
         'parseInt', 'parseFloat', 'String', 'Number', 'Boolean', 'Array'}
ext = sorted(c for c in calls if c not in allow and c not in WANT)
print('chamadas externas (fora ctx/Math/draw*): %s' % (ext if ext else 'NENHUMA — 100% puro'))
