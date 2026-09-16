#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v153c — SITE: aviso de "o jogo abriu em outra janela"
Chaotic.IdleWorld

Antes: ao clicar em 🪟 JANELA PRÓPRIA e a janela abrir com sucesso, o site ficava
numa tela escura e vazia (barra de navegação escondida pelo `in-game`) — sem nada
para clicar se a janela nova ficasse escondida atrás.

Agora: aparece um cartão amigável com
  · "🪟 O jogo abriu em outra janela"
  · botão ▶ JOGAR NESTA ABA  (openGame(nick,false))
  · botão ↩ VOLTAR AO SITE   (volta para a lista de personagens, nav de volta)
"""
import io, sys

ARQ = '/home/user/uploads/index.html'
d = io.open(ARQ, encoding='utf-8').read()
mudou = 0

# ---------------------------------------------------------------- 1) CSS
css_anchor = "#game-frame-holder iframe{width:100%;height:100%;border:0;display:block}\n"
css_novo = css_anchor + """/* v153c — cartão mostrado quando o jogo foi para uma janela separada */
.pop-janela{position:fixed;inset:0;z-index:31;display:none;align-items:center;justify-content:center;background:#04070d;padding:24px}
.pop-janela.show{display:flex}
.pop-janela .box{max-width:470px;text-align:center;background:linear-gradient(180deg,rgba(20,27,45,.96),rgba(10,14,24,.96));border:1px solid rgba(139,226,255,.28);border-radius:18px;padding:30px 28px;box-shadow:0 24px 60px rgba(0,0,0,.55)}
.pop-janela .ico{font-size:44px;line-height:1;margin-bottom:8px}
.pop-janela h3{margin:6px 0 10px;font-size:19px;letter-spacing:.5px}
.pop-janela p{margin:0 0 20px;font-size:13px;line-height:1.6;color:var(--txt-dim)}
.pop-janela .btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.pop-janela .btns .btn{padding:13px 22px;font-size:13.5px;border-radius:12px}
"""
if css_anchor in d:
    d = d.replace(css_anchor, css_novo, 1); mudou += 1
else:
    print('!! CSS: âncora não encontrada'); sys.exit(1)

# ---------------------------------------------------------------- 2) HTML do cartão
html_anchor = '  <div id="game-frame-holder"></div>\n'
html_novo = html_anchor + """  <div class="pop-janela" id="pop-janela">
    <div class="box">
      <div class="ico">🪟</div>
      <h3>O jogo abriu em outra janela</h3>
      <p>Se a janela nova não apareceu (às vezes ela abre atrás desta), use os botões abaixo.
         O som e o progresso ficam todos na janela do jogo.</p>
      <div class="btns">
        <button class="btn btn-gold" id="pop-jogar">▶ JOGAR NESTA ABA</button>
        <button class="btn btn-ghost" id="pop-voltar">↩ VOLTAR AO SITE</button>
      </div>
    </div>
  </div>
"""
if html_anchor in d:
    d = d.replace(html_anchor, html_novo, 1); mudou += 1
else:
    print('!! HTML: âncora não encontrada'); sys.exit(1)

# ---------------------------------------------------------------- 3) openGame
og_anchor = """      if (w && !w.closed) { try { w.focus(); } catch (e) {} $('game-load').style.display = 'none'; return; }"""
og_novo = """      if (w && !w.closed) {
        try { w.focus(); } catch (e) {}
        $('game-load').style.display = 'none';
        window.__nickJanela = nick;                     // v153c — o cartão usa este nick
        document.body.classList.remove('in-game');      // devolve o menu do site
        $('pop-janela').classList.add('show');
        return;
      }"""
if og_anchor in d:
    d = d.replace(og_anchor, og_novo, 1); mudou += 1
else:
    print('!! openGame: âncora não encontrada'); sys.exit(1)

# ---------------------------------------------------------------- 4) fiação dos botões
fio_anchor = """/* =========================================================
   NAV / CTA / BOOT
   ========================================================= */"""
fio_novo = """/* =========================================================
   v153c — cartão "o jogo abriu em outra janela"
   ========================================================= */
$('pop-jogar').addEventListener('click', function() {
  const nick = window.__nickJanela;
  $('pop-janela').classList.remove('show');
  if (nick) openGame(nick, false); else location.reload();
});
$('pop-voltar').addEventListener('click', function() {
  $('pop-janela').classList.remove('show');
  try { fillChars(); showScreen('screen-select'); } catch (e) { location.reload(); }
});

""" + fio_anchor
if fio_anchor in d:
    d = d.replace(fio_anchor, fio_novo, 1); mudou += 1
else:
    print('!! fiação: âncora não encontrada'); sys.exit(1)

assert mudou == 4, mudou
io.open(ARQ, 'w', encoding='utf-8').write(d)
print('OK — site v153c aplicado (4/4)')
