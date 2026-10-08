#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v153b — BLINDAGEM DA ARME (?pip=1)
Chaotic.IdleWorld

O `pipArme152()` roda no fim do script do jogo (durante o carregamento). Ele é
um RECURSO OPCIONAL: se qualquer coisa der errado ali, o jogo tem que subir
normalmente. Então nesta versão:
  · todo o corpo fica dentro de try/catch;
  · o aviso "clique para abrir a janelinha" só entra no DOM depois de
    DOMContentLoaded (nunca durante o parse — não atrapalha o boot);
  · o aviso para a instância antiga (site/iframe) só acontece 900ms depois,
    quando o jogo novo já está de pé.
"""
import io, sys

ARQ = '/home/user/chaotic_idleworld_v123.html'
d = io.open(ARQ, encoding='utf-8').read()

old = r"""function pipArme152() {
  if (!/[?&]pip=1/.test(location.search)) return;
  try { if (window.opener && !window.opener.closed && typeof window.opener.chaosTransferirParaPiP152 === 'function') window.opener.chaosTransferirParaPiP152(); } catch (e) {}
  try { if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'CHAOS_PIP_ASSUMIR' }, '*'); } catch (e) {}
  bgSet152(true, true);
  PIP152.arme = true;
  const aviso = document.createElement('div');
  aviso.id = 'pip-arme152';
  aviso.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99998;background:linear-gradient(180deg,rgba(6,12,24,.95),rgba(6,12,24,.75));'
    + 'border:1px solid rgba(139,226,255,.5);border-radius:11px;padding:9px 18px;color:#eaf3ff;font:700 12px/1.5 Segoe UI,system-ui,sans-serif;text-align:center;box-shadow:0 8px 26px rgba(0,0,0,.6);cursor:pointer';
  aviso.innerHTML = '📺 <b>Clique em qualquer lugar</b> para abrir a janelinha flutuante<div style="font-size:10px;color:#8be2ff;font-weight:600">(o navegador exige um clique para liberar a janelinha)</div>';
  document.body.appendChild(aviso);
  const abrirArmado = function() {
    document.removeEventListener('pointerdown', abrirArmado, true);
    const a = document.getElementById('pip-arme152'); if (a) a.remove();
    PIP152.arme = false;
    pipToggle152();
  };
  document.addEventListener('pointerdown', abrirArmado, true);
  aviso.addEventListener('click', function(ev) { ev.stopPropagation(); abrirArmado(); });
  showNotif('🖼️ Jogo em janela própria! Clique em qualquer lugar para ligar a janelinha flutuante.', 'info');
}"""

new = r"""function pipArme152() {
  if (!/[?&]pip=1/.test(location.search)) return;
  /* v153b — tudo aqui é OPCIONAL: se qualquer coisa falhar, o jogo segue normal.
     O aviso só entra no DOM depois que o documento está pronto, e o aviso para a
     outra instância só acontece depois do boot terminar. */
  try {
    PIP152.arme = true;
    bgSet152(true, true);
    setTimeout(function() { // 1) avisa a instância antiga (site/iframe) para parar de simular e salvar
      try { if (window.opener && !window.opener.closed && typeof window.opener.chaosTransferirParaPiP152 === 'function') window.opener.chaosTransferirParaPiP152(); } catch (e) {}
      try { if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'CHAOS_PIP_ASSUMIR' }, '*'); } catch (e) {}
    }, 900);
    const montarAviso = function() { // 2) banner "clique para abrir a janelinha"
      try {
        if (document.getElementById('pip-arme152')) return;
        const aviso = document.createElement('div');
        aviso.id = 'pip-arme152';
        aviso.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99998;background:linear-gradient(180deg,rgba(6,12,24,.95),rgba(6,12,24,.75));'
          + 'border:1px solid rgba(139,226,255,.5);border-radius:11px;padding:9px 18px;color:#eaf3ff;font:700 12px/1.5 Segoe UI,system-ui,sans-serif;text-align:center;box-shadow:0 8px 26px rgba(0,0,0,.6);cursor:pointer';
        aviso.innerHTML = '📺 <b>Clique em qualquer lugar</b> para abrir a janelinha flutuante<div style="font-size:10px;color:#8be2ff;font-weight:600">(o navegador exige um clique para liberar a janelinha)</div>';
        (document.body || document.documentElement).appendChild(aviso);
        const abrirArmado = function() {
          document.removeEventListener('pointerdown', abrirArmado, true);
          const a = document.getElementById('pip-arme152'); if (a) a.remove();
          PIP152.arme = false;
          pipToggle152();
        };
        document.addEventListener('pointerdown', abrirArmado, true);
        aviso.addEventListener('click', function(ev) { ev.stopPropagation(); abrirArmado(); });
      } catch (e) {}
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarAviso);
    else montarAviso();
    try { showNotif('🖼️ Jogo em janela própria! Clique em qualquer lugar para ligar a janelinha flutuante.', 'info'); } catch (e) {}
  } catch (e) { try { console.warn('[pip152] arme ignorada:', e && e.message); } catch (e2) {} }
}"""

if d.count(old) != 1:
    print('!! não achei o bloco antigo (encontrou %d)' % d.count(old)); sys.exit(1)
d = d.replace(old, new)
io.open(ARQ, 'w', encoding='utf-8').write(d)
print('OK — arme blindada (v153b)')
