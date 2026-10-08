#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v153 (site) — o jogo abre em PÁGINA PRÓPRIA, não mais dentro de iframe.
Chaotic.IdleWorld · site/index.html

POR QUÊ: o navegador só libera a janela própria (Document Picture-in-Picture)
em página de nível superior. Com o jogo dentro do iframe do site, o botão da
janelinha falhava com "Opening a PiP window is only allowed from a top-level
browsing context". Abrindo o jogo na própria aba/janela:
  · a janelinha flutuante funciona plenamente (janela arrastável);
  · o jogo ganha teclado, tela cheia, desempenho e não sofre partição de
    armazenamento de iframe (save mais confiável);
  · o jogador escolhe: mesma aba (padrão) ou janela própria (botão novo).
"""
import io, sys

ARQ = '/home/user/uploads/index.html'
d = io.open(ARQ, encoding='utf-8').read()
rel = []

def sub(nome, old, new, qtd=1):
    global d
    n = d.count(old)
    if n != qtd:
        print('!! [%s] encontrou %d (esperado %d)' % (nome, n, qtd)); sys.exit(1)
    d = d.replace(old, new); rel.append(nome)

# ---------------------------------------------------------------- openGame
sub('openGame', """function openGame(nick) {
  document.body.classList.add('in-game');
  $('game-load').style.display = 'flex';
  showScreen('screen-game');
  setTimeout(() => {
    const holder = $('game-frame-holder');
    holder.innerHTML = '';
    const fr = document.createElement('iframe');
    fr.setAttribute('allow', 'autoplay; fullscreen');
    fr.src = '/game?char=' + encodeURIComponent(nick) + (window.SESSION_TOKEN ? '&sess=' + encodeURIComponent(window.SESSION_TOKEN) : '');
    holder.appendChild(fr);
    setTimeout(() => { $('game-load').style.display = 'none'; }, 1600);
  }, 700);
}""",
"""function gameUrl(nick) {
  return '/game?char=' + encodeURIComponent(nick) + (window.SESSION_TOKEN ? '&sess=' + encodeURIComponent(window.SESSION_TOKEN) : '');
}
/* v153 — o jogo abre em PÁGINA PRÓPRIA (fora do iframe).
   Motivo: o navegador só permite a janelinha flutuante (Picture-in-Picture)
   quando o jogo é a página principal; dentro de iframe ele recusa. De brinde:
   teclado/tela cheia funcionam melhor e o save não sofre com a partição de
   armazenamento de iframes. `janelaNova` abre o jogo numa janela separada. */
function openGame(nick, janelaNova) {
  const url = gameUrl(nick);
  document.body.classList.add('in-game');
  $('game-load').style.display = 'flex';
  showScreen('screen-game');
  setTimeout(function() {
    if (janelaNova) {
      let w = null;
      try { w = window.open(url, 'chaos_jogo_' + encodeURIComponent(nick), 'width=1040,height=700,menubar=no,toolbar=no,location=no,status=no'); } catch (e) { w = null; }
      if (w && !w.closed) { try { w.focus(); } catch (e) {} $('game-load').style.display = 'none'; return; }
      toast('O navegador bloqueou a janela nova — abrindo o jogo nesta aba.');
    }
    location.href = url;
  }, 450);
}""")

# ------------------------------------------------- botões extras no personagem
sub('botoes-card', """    const b = document.createElement('button'); b.className = 'btn btn-gold'; b.textContent = '▶ JOGAR';
    b.addEventListener('click', () => openGame(c.nick));
    card.appendChild(b);""",
"""    const b = document.createElement('button'); b.className = 'btn btn-gold'; b.textContent = '▶ JOGAR';
    b.addEventListener('click', () => openGame(c.nick));
    const bj = document.createElement('button'); bj.className = 'btn btn-ghost'; bj.textContent = '🪟 JANELA PRÓPRIA';
    bj.title = 'Abre o jogo numa janela separada';
    bj.style.cssText = 'font-size:12px;padding:10px 16px';
    bj.addEventListener('click', () => openGame(c.nick, true));
    const bcol = document.createElement('div');
    bcol.style.cssText = 'display:flex;flex-direction:column;gap:10px';
    bcol.appendChild(b); bcol.appendChild(bj);
    card.appendChild(bcol);""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('OK — site atualizado')
for n in rel: print('   ·', n)
