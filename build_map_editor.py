import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# -*- coding: utf-8 -*-
"""Monta o editor de mapa: template + texturas extraídas do jogo.
Uso: python3 build_map_editor.py -> lobby/tools/editor-mapa-patio.html
"""
import io
import subprocess
import sys

subprocess.check_call([sys.executable, os.path.join(HERE, 'build_editor_tex.py')])
tex = io.open('/tmp/editor_tex.js', encoding='utf-8').read()
tpl = io.open(os.path.join(HERE, 'editor-mapa-template.html'), encoding='utf-8').read()
PH = '//__GAME_TEX_FUNCS__'
assert tpl.count(PH) == 1, 'placeholder ausente/duplicado'
final = tpl.replace(PH, tex.rstrip('\n'))
io.open(os.path.join(HERE, 'editor-mapa-patio.html'), 'w', encoding='utf-8').write(final)
print('OK: lobby/tools/editor-mapa-patio.html (%d bytes)' % len(final))
