#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v153 — JANELINHA FUNCIONANDO TAMBÉM QUANDO O JOGO ESTÁ DENTRO DE IFRAME
Chaotic.IdleWorld · patch sobre v151 + v152

O PROBLEMA (reportado com print):
  "Failed to execute 'requestWindow' on 'DocumentPictureInPicture':
   Opening a PiP window is only allowed from a top-level browsing context"
  → o JOGO estava aberto dentro do iframe do site, e o navegador só permite
    janela própria (Document PiP) em página de nível superior.

A SOLUÇÃO (em camadas):
  1. detecta se está em iframe e nem tenta o Document PiP (vai direto pro vídeo);
  2. PiP de vídeo (funciona em iframe se o iframe permitir picture-in-picture);
  3. se tudo falhar, oferece botões na própria engrenagem:
       🪟 "Abrir o jogo em janela própria" (window.open; se o pop-up for
          bloqueado, navega a aba para o jogo em nível superior) e
       🌙 "Ligar modo fora da aba" (aquele que sempre funciona);
  4. a janela aberta com ?pip=1 já se "arma": no primeiro clique ela abre a
     janelinha sozinha e avisa a instância antiga para parar de salvar
     (evita dois saves brigando pelo mesmo localStorage).
"""
import io, sys

ARQ = '/home/user/chaotic_idleworld_v123.html'
d = io.open(ARQ, encoding='utf-8').read()
rel = []

def sub(nome, old, new, qtd=1):
    global d
    n = d.count(old)
    if n != qtd:
        print('!! [%s] encontrou %d (esperado %d)' % (nome, n)); sys.exit(1)
    d = d.replace(old, new); rel.append(nome)

# --------------------------------------------------------------------- P1: HTML
sub('P1-HTML-botoes-alt', """  <div class="opt-note" id="opt-pip-nota152"></div>""",
"""  <div class="opt-note" id="opt-pip-nota152"></div>
  <div id="opt-pip-alt152" style="display:none">
    <button class="opt-mode-btn" id="opt-pip-janela152" style="width:100%">🪟 Abrir o jogo em janela própria</button>
    <button class="opt-mode-btn" id="opt-pip-bg2-152" style="width:100%">🌙 Ligar modo fora da aba</button>
  </div>""")

# ------------------------------------------------------- P2: detecção de iframe
sub('P2-iframe-detect', """function pipCanvas152() { return (game && game.canvas) ? game.canvas : document.querySelector('#game-container canvas'); }
function pipModoSuportado152() {
  try {
    const cv = pipCanvas152();
    if (!cv || !cv.captureStream) return 'off';
    if (window.documentPictureInPicture && documentPictureInPicture.requestWindow) return 'document';
    if (HTMLVideoElement.prototype.requestPictureInPicture) return 'video';
    if (HTMLVideoElement.prototype.webkitSetPresentationMode) return 'safari';
  } catch (e) {}
  return 'off';
}""",
"""function pipCanvas152() { return (game && game.canvas) ? game.canvas : document.querySelector('#game-container canvas'); }
/* v153 — o jogo está dentro de um iframe (site)? O Document PiP é PROIBIDO ali. */
function pipEmIframe152() { try { return window.self !== window.top; } catch (e) { return true; } }
function pipModoSuportado152() {
  try {
    const cv = pipCanvas152();
    if (!cv || !cv.captureStream) return 'off';
    // janela própria (Document PiP) só existe em página de nível superior
    if (!pipEmIframe152() && window.documentPictureInPicture && documentPictureInPicture.requestWindow) return 'document';
    if (HTMLVideoElement.prototype.requestPictureInPicture) return 'video';
    if (HTMLVideoElement.prototype.webkitSetPresentationMode) return 'safari';
  } catch (e) {}
  return 'off';
}""")

# ---------------------------------------- P3: nota explica a situação (iframe)
sub('P3-nota', """function pipAtualizarNota152(extra) {
  const modo = pipModoSuportado152();
  let s = '';
  if (extra) s += '<b>' + extra + '</b><br>';
  if (modo === 'document') s += '✅ Pronto: seu navegador abre a janelinha como uma <b>janela própria</b> — arraste, redimensione e deixe por cima de tudo.';
  else if (modo === 'video' || modo === 'safari') s += '⚠️ Seu navegador usa a janelinha padrão de vídeo (o tamanho e o lugar são decididos por ele).';
  else s += '❌ Este navegador não tem Picture-in-Picture para o canvas. Use <b>Chrome ou Edge 116+</b> no PC. O modo <b>Fora da aba</b> funciona de qualquer forma.';
  s += '<br>💡 A janelinha mostra a tela do jogo ao vivo — deixe o <b>Auto-Move (tecla P)</b> ligado para o Caçador continuar andando e escaneando sozinho.';
  pipNota152(s);
}""",
"""function pipAtualizarNota152(extra) {
  const modo = pipModoSuportado152();
  const iframe = pipEmIframe152();
  let s = '';
  if (extra) s += '<b>' + extra + '</b><br>';
  if (modo === 'document') s += '✅ Pronto: seu navegador abre a janelinha como uma <b>janela própria</b> — arraste, redimensione e deixe por cima de tudo.';
  else if (modo === 'video') s += (iframe
    ? '⚠️ O jogo está aberto <b>dentro do site (iframe)</b>, e ali o navegador usa a janelinha de vídeo — o tamanho e o lugar são decididos por ele. Para a janela própria (arrastável), use 🪟 <b>Abrir o jogo em janela própria</b>.'
    : '⚠️ Seu navegador usa a janelinha padrão de vídeo (o tamanho e o lugar são decididos por ele).');
  else if (modo === 'safari') s += '⚠️ Safari: a janelinha é a de vídeo padrão (tamanho/posição definidos pelo navegador).';
  else s += '❌ Este navegador não tem Picture-in-Picture para o canvas. Use <b>Chrome ou Edge 116+</b> no PC. O modo <b>Fora da aba</b> funciona de qualquer forma.';
  if (iframe) s += '<br>🖼️ Detectei que o jogo está em um <b>iframe</b>: para a janelinha completa, abra o jogo em janela própria (botão acima quando aparecer) — o modo 🌙 funciona aqui mesmo.';
  s += '<br>💡 A janelinha mostra a tela do jogo ao vivo — deixe o <b>Auto-Move (tecla P)</b> ligado para o Caçador continuar andando e escaneando sozinho.';
  pipNota152(s);
}
/* v153 — alternativas quando o navegador recusa a janelinha (ex.: iframe) */
function pipOferecerAlternativas152(erro) {
  const msg = (erro && erro.message) ? String(erro.message) : '';
  const porIframe = /top-level/i.test(msg) || pipEmIframe152();
  PIP152.podeJanelinha = false;
  const alt = document.getElementById('opt-pip-alt152');
  if (alt) alt.style.display = 'block';
  const bJ = document.getElementById('opt-pip-janela152');
  if (bJ) bJ.textContent = porIframe ? '🪟 Abrir o jogo em janela própria (resolve)' : '🪟 Abrir o jogo em janela própria';
  if (!PIP152.jaAvisouErro) {
    PIP152.jaAvisouErro = true;
    showNotif('⚠️ A janelinha não abriu aqui' + (porIframe ? ' (o jogo está dentro do site/iframe)' : '') + ' — use 🪟 “Abrir o jogo em janela própria”. O modo 🌙 Fora da aba continua funcionando.', 'warning');
  }
  pipAtualizarNota152(porIframe
    ? 'O navegador só deixa abrir a janelinha quando o jogo está em <b>página própria</b> (sem iframe). Clique em 🪟 abaixo — vou abrir o jogo fora do site e lá a janelinha funciona.'
    : 'O navegador recusou a janelinha aqui. Tente o botão 🪟 abaixo (abre o jogo em página própria).');
}
/* Abre o jogo em página de nível superior (onde a janelinha funciona).
 * 1º tenta uma janela separada (o jogador fica com o site numa aba e o jogo
 * em outra); se o navegador bloquear pop-up, navega esta aba para o jogo. */
function pipUrlPropria152() {
  let u = location.href;
  try { u = u.replace(/([?&])pip=1(?=&|$)/, '$1').replace(/[?&]$/, ''); } catch (e) {}
  return u + (u.indexOf('?') >= 0 ? '&' : '?') + 'pip=1';
}
function pipAbrirEmJanelaPropria152() {
  const url = pipUrlPropria152();
  let w = null;
  try {
    const h = Math.round(Math.min(760, Math.max(360, (window.screen && window.screen.availHeight) ? window.screen.availHeight - 160 : 480)));
    w = window.open(url, 'chaos_janelinha152', 'width=640,height=' + h + ',menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no');
  } catch (e) { w = null; }
  if (w && !w.closed) {
    showNotif('🪟 Abri o jogo numa janela própria — lá o botão 📺 já vai funcionar. Seu progresso é o mesmo.', 'success');
    try { w.focus(); } catch (e) {}
    return true;
  }
  // pop-up bloqueado (ou sandbox): tenta levar ESTA aba/cima para o jogo
  try {
    if (window.top && window.top !== window) { window.top.location.href = url; return true; }
  } catch (e) {}
  try { if (window.top === window) { location.href = url; return true; } } catch (e) {}
  showNotif('⛔ O navegador bloqueou a janela nova. Libere pop-ups para este site (ou abra o endereço do jogo direto numa aba) — o modo 🌙 Fora da aba funciona aqui mesmo.', 'warning');
  return false;
}""")

# --------------------------------------------- P4: cadeia de tentativas (abrir)
sub('P4-abrir', """async function pipAbrir152() {
  if (PIP152.modo !== 'off') return true;
  const cv = pipCanvas152();
  if (!cv) { showNotif('⛔ Não encontrei o canvas do jogo.', 'warning'); return false; }
  try { PIP152.stream = cv.captureStream(30); } catch (e) { PIP152.stream = null; }
  if (!PIP152.stream) { showNotif('⛔ Este navegador não deixa espelhar o canvas.', 'warning'); return false; }
  try {
    if (pipModoSuportado152() === 'document') await pipAbrirDocumento152();
    else await pipAbrirVideo152();
  } catch (e) {
    try { if (PIP152.stream) PIP152.stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e2) {}
    PIP152.stream = null; PIP152.modo = 'off';
    showNotif('⚠️ Não consegui abrir a janelinha: ' + (e && e.message ? e.message : 'erro') + ' — o modo 🌙 Fora da aba continua funcionando.', 'warning');
    return false;
  }
  return true;
}""",
"""async function pipAbrir152() {
  if (PIP152.modo !== 'off') return true;
  const cv = pipCanvas152();
  if (!cv) { showNotif('⛔ Não encontrei o canvas do jogo.', 'warning'); return false; }
  try { PIP152.stream = cv.captureStream(30); } catch (e) { PIP152.stream = null; }
  if (!PIP152.stream) { showNotif('⛔ Este navegador não deixa espelhar o canvas.', 'warning'); return false; }
  // v153 — cadeia de tentativas: janela própria (se for nível superior) → PiP de vídeo
  const tentativas = [];
  if (pipModoSuportado152() === 'document') tentativas.push(pipAbrirDocumento152);
  tentativas.push(pipAbrirVideo152);
  let ultimoErro = null;
  for (let i = 0; i < tentativas.length; i++) {
    try {
      await tentativas[i]();
      if (PIP152.modo !== 'off') { PIP152.podeJanelinha = true; const a = document.getElementById('opt-pip-alt152'); if (a) a.style.display = 'none'; return true; }
    } catch (e) { ultimoErro = e; }
  }
  try { if (PIP152.stream) PIP152.stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e2) {}
  PIP152.stream = null; PIP152.modo = 'off';
  pipOferecerAlternativas152(ultimoErro);
  return false;
}""")

# --------------------------------- P5: transferência entre instâncias (anti-zebra de save)
sub('P5-transferir', """/* ---------- MODO SEGUNDO PLANO ---------- */""",
"""/* v153 — TRANSFERÊNCIA: quando o jogo abre em janela própria, a instância antiga
 * (o iframe do site) para de simular e de salvar, para não existirem dois saves
 * brigando pelo mesmo localStorage. A janela nova chama esta função. */
function pipOverlayTransferido152() {
  try {
    if (document.getElementById('pip-transferido152')) return;
    const el = document.createElement('div');
    el.id = 'pip-transferido152';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;'
      + 'background:linear-gradient(180deg,rgba(4,8,16,.96),rgba(4,8,16,.99));color:#eaf3ff;font-family:Segoe UI,system-ui,sans-serif;text-align:center;padding:30px';
    el.innerHTML = '<div style="font-size:40px">📺</div>'
      + '<div style="font-size:17px;font-weight:800;letter-spacing:.5px">O jogo está rodando na janela própria</div>'
      + '<div style="font-size:12px;color:#93a4c7;max-width:420px;line-height:1.6">Esta aba ficou em pausa para os dois lugares não salvarem por cima um do outro. '
      + 'Pode fechar esta aba com tranquilidade — seu progresso continua na janelinha.</div>'
      + '<button id="pip-transferido-fechar152" style="margin-top:8px;background:#16223a;color:#eaf3ff;border:1px solid #33415c;border-radius:9px;padding:8px 16px;font:inherit;cursor:pointer">Entendi</button>';
    document.body.appendChild(el);
    const b = document.getElementById('pip-transferido-fechar152');
    if (b) b.addEventListener('click', function() { try { window.close(); } catch (e) {} el.remove(); });
  } catch (e) {}
}
window.chaosTransferirParaPiP152 = function() {
  if (window.__chaosTransferido152) return true;
  window.__chaosTransferido152 = true;
  try { saveGame = function() {}; } catch (e) {}                       // não escreve mais o save
  try { if (BG152.ligado) bgSet152(false, true); } catch (e) {}         // nem o ticker do 2º plano
  try { if (typeof game !== 'undefined' && game.loop && game.loop.sleep) game.loop.sleep(); } catch (e) {} // para o jogo
  pipOverlayTransferido152();
  return true;
};
/* A janela nova pede a transferência pelo postMessage (caso o opener não seja acessível). */
window.addEventListener('message', function(ev) {
  try { if (ev && ev.data && ev.data.type === 'CHAOS_PIP_ASSUMIR' && typeof window.chaosTransferirParaPiP152 === 'function') window.chaosTransferirParaPiP152(); } catch (e) {}
});
/* v153 — ARME (?pip=1): o jogo foi aberto em janela própria para usar a janelinha.
 * No primeiro clique (gesto do usuário exigido pelo navegador) ela abre sozinha. */
function pipArme152() {
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
}

/* ---------- MODO SEGUNDO PLANO ---------- */""")

# --------------------------------------------------- P6: botões novos + init
sub('P6-init', """  bindImmediateButton('opt-pip152', function() { pipToggle152(); });
  bindImmediateButton('opt-bg152', function() { bgSet152(!BG152.ligado); });""",
"""  bindImmediateButton('opt-pip152', function() { pipToggle152(); });
  bindImmediateButton('opt-bg152', function() { bgSet152(!BG152.ligado); });
  bindImmediateButton('opt-pip-janela152', function() { pipAbrirEmJanelaPropria152(); }); // v153
  bindImmediateButton('opt-pip-bg2-152', function() { bgSet152(true); });                  // v153""")

sub('P6-init2', """initPip152();
""", """initPip152();
pipArme152(); // v153 — se abriu com ?pip=1, arma a janelinha no primeiro clique
""")

# ------------------------------------------------------------- P7: changelog
sub('P7-changelog', """// ============================================================
// CHAOTIC.IDLEWORLD v2.19 — CHANGELOG""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.20 — CHANGELOG
// - JANELINHA DENTRO DO SITE: o jogo aberto no iframe do site estourava
//   "Opening a PiP window is only allowed from a top-level browsing context"
//   (o navegador só permite a janela própria em página de nível superior).
//   Agora o jogo: (1) detecta o iframe e vai direto para o PiP de vídeo;
//   (2) se nem isso o navegador aceitar, mostra na engrenagem os botões
//   🪟 "Abrir o jogo em janela própria" (janela nova; se o pop-up for
//   bloqueado, leva a aba para o jogo) e 🌙 "Ligar modo fora da aba";
//   (3) a janela aberta com ?pip=1 se "arma": no primeiro clique abre a
//   janelinha e avisa a instância antiga para parar de salvar (sem dois
//   saves brigando pelo mesmo localStorage — a aba antiga mostra um aviso).
// ============================================================
// CHAOTIC.IDLEWORLD v2.19 — CHANGELOG""")

sub('P7-titulo', """<title>Chaotic.idleWorld v2.19 — Janelinha (PiP) + jogo fora da aba</title>""",
                 """<title>Chaotic.idleWorld v2.20 — Janelinha (PiP) + jogo fora da aba</title>""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('OK — v153 aplicado no jogo')
for n in rel: print('   ·', n)
