#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v152 — JANELA FLUTUANTE (PICTURE-IN-PICTURE) + JOGO FORA DA ABA
Chaotic.IdleWorld · patch aplicado sobre o arquivo já corrigido (v151)

O QUE ENTRA
  A) Botão "📺 Janelinha flutuante (PiP)" no painel da engrenagem (⚙️ Opções).
     - Chrome/Edge 116+: Document Picture-in-Picture (janela própria, arrastável).
     - Outros navegadores: PiP de vídeo com espelho do canvas (captureStream).
  B) Botão "🌙 Fora da aba" que mantém a simulação rodando quando a aba perde
     o foco (o navegador para o requestAnimationFrame; sem isso o jogo congela).
     - passa a "empurrar" o loop do Phaser por setInterval (game.step) somente
       quando não há frames reais (auto-regulado, sem passo duplo);
     - áudio inaudível (gain ~0) para o navegador não aplicar throttling agressivo;
     - ao voltar para a aba, o resumo do tempo fora aparece numa notificação.
"""
import io, sys

ARQ = '/home/user/chaotic_idleworld_v123.html'
d = io.open(ARQ, encoding='utf-8').read()
rel = []

def sub(nome, old, new, qtd=1):
    global d
    n = d.count(old)
    if n != qtd:
        print('!! [%s] encontrou %d (esperado %d)' % (nome, n, qtd)); sys.exit(1)
    d = d.replace(old, new); rel.append((nome, n))

# ------------------------------------------------------------------ 1) HTML
sub('HTML-botoes', """  <div style="margin-top:10px;border-top:1px solid #33415c;padding-top:10px">
    <button class="opt-mode-btn" id="opt-teleport" style="width:100%">🏠 Teleportar ao Pátio Central</button>""",
"""  <div class="opt-label" style="margin-top:10px">📺 Janela flutuante (Picture-in-Picture)</div>
  <button class="opt-mode-btn" id="opt-pip152" style="width:100%">📺 Janelinha flutuante (PiP): DESLIGADA</button>
  <button class="opt-mode-btn" id="opt-bg152" style="width:100%">🌙 Fora da aba: ligar modo segundo plano</button>
  <div class="opt-note" id="opt-pip-nota152"></div>
  <div style="margin-top:10px;border-top:1px solid #33415c;padding-top:10px">
    <button class="opt-mode-btn" id="opt-teleport" style="width:100%">🏠 Teleportar ao Pátio Central</button>""")

# ------------------------------------------------------------------ 2) JS
bloco = r"""
/* ==========================================================================
 * v152 — JANELA FLUTUANTE (PICTURE-IN-PICTURE) + JOGO RODANDO FORA DA ABA
 * --------------------------------------------------------------------------
 * POR QUE O JOGO "PARA" QUANDO VOCÊ SAI DA ABA:
 *   o navegador suspende o requestAnimationFrame e o Phaser (que dirige o
 *   mundo pelo rAF) simplesmente deixa de receber quadros. Aqui a gente
 *   assume o volante: um setInterval empurra o loop do Phaser
 *   (game.step) SÓ quando não há quadros reais — auto-regulado, sem passo
 *   duplo quando a aba está visível.
 *
 * JANELINHA:
 *   - Chrome/Edge 116+ → Document PiP: janela própria, sempre na frente,
 *     arrastável/redimensionável, com cabeçalho mostrando o mapa atual.
 *   - Demais navegadores  → PiP de vídeo: o canvas é espelhado via
 *     captureStream() num <video> e mandado para o PiP do navegador.
 * ========================================================================== */
const PIP152_KEY = 'chaos_pip_v152', BG152_KEY = 'chaos_bg_v152';
const PIP152 = { quer: false, modo: 'off', janela: null, stream: null, video: null, relogio: null, ctxAudio: null, osc: null, ganho: null, bgForcado: false }; // v152b
const BG152 = { ligado: false, ticker: null, ultimoFrame: -1e9, ultimoPasso: 0, passos: 0, taxa: 50, forcando: false, escondidoEm: 0 };

/* ---------- suporte do navegador ---------- */
function pipCanvas152() { return (game && game.canvas) ? game.canvas : document.querySelector('#game-container canvas'); }
function pipModoSuportado152() {
  try {
    const cv = pipCanvas152();
    if (!cv || !cv.captureStream) return 'off';
    if (window.documentPictureInPicture && documentPictureInPicture.requestWindow) return 'document';
    if (HTMLVideoElement.prototype.requestPictureInPicture) return 'video';
    if (HTMLVideoElement.prototype.webkitSetPresentationMode) return 'safari';
  } catch (e) {}
  return 'off';
}
/* ---------- textos da engrenagem ---------- */
function pipNota152(txt) { const el = document.getElementById('opt-pip-nota152'); if (el) el.innerHTML = txt; }
function pipRotulos152() {
  const bp = document.getElementById('opt-pip152'), bb = document.getElementById('opt-bg152');
  if (bp) bp.textContent = (PIP152.modo !== 'off') ? '📺 Janelinha flutuante: LIGADA (toque p/ fechar)' : (PIP152.quer ? '📺 Janelinha flutuante: reabrir' : '📺 Janelinha flutuante (PiP): DESLIGADA');
  if (bb) bb.textContent = BG152.ligado ? '🌙 Fora da aba: SEMPRE RODANDO' : '🌙 Fora da aba: ligar modo segundo plano';
}
function pipAtualizarNota152(extra) {
  const modo = pipModoSuportado152();
  let s = '';
  if (extra) s += '<b>' + extra + '</b><br>';
  if (modo === 'document') s += '✅ Pronto: seu navegador abre a janelinha como uma <b>janela própria</b> — arraste, redimensione e deixe por cima de tudo.';
  else if (modo === 'video' || modo === 'safari') s += '⚠️ Seu navegador usa a janelinha padrão de vídeo (o tamanho e o lugar são decididos por ele).';
  else s += '❌ Este navegador não tem Picture-in-Picture para o canvas. Use <b>Chrome ou Edge 116+</b> no PC. O modo <b>Fora da aba</b> funciona de qualquer forma.';
  s += '<br>💡 A janelinha mostra a tela do jogo ao vivo — deixe o <b>Auto-Move (tecla P)</b> ligado para o Caçador continuar andando e escaneando sozinho.';
  pipNota152(s);
}
function pipSalvar152() { try { localStorage.setItem(PIP152_KEY, PIP152.quer ? '1' : '0'); } catch (e) {} }

/* ---------- abrir / fechar ---------- */
async function pipAbrirDocumento152() {
  const cv0 = pipCanvas152(); // v152b — abre a janelinha já com a PROPORÇÃO da tela do jogo (sem barras pretas)
  const largura = 480;
  const proporcao = (cv0 && cv0.width) ? (cv0.height / cv0.width) : 0.5625;
  const w = await documentPictureInPicture.requestWindow({ width: largura, height: Math.round(largura * proporcao) + 30 });
  PIP152.janela = w;
  const doc = w.document;
  doc.title = 'Chaotic.idleWorld';
  const st = doc.createElement('style');
  st.textContent = 'html,body{margin:0;height:100%;background:#070c16;overflow:hidden;font-family:Segoe UI,system-ui,sans-serif}'
    + '#pip152-video{width:100%;height:100%;display:block;object-fit:contain;image-rendering:pixelated;background:#070c16}'
    + '.pip152-head{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:5px 8px;background:linear-gradient(180deg,rgba(4,8,16,.92),rgba(4,8,16,.45));color:#eaf3ff;font-size:11px;z-index:9}'
    + '.pip152-head b{font-size:12px;color:#ffd54f;letter-spacing:.5px}'
    + '.pip152-head span{color:#8be2ff;font-weight:700}'
    + '.pip152-x{margin-left:auto;background:#2a1a1a;border:1px solid #6a3a3a;color:#ffb9b9;border-radius:6px;cursor:pointer;font-size:11px;padding:2px 7px;font-family:inherit}';
  doc.head.appendChild(st);
  const head = doc.createElement('div'); head.className = 'pip152-head';
  const nome = doc.createElement('b'); nome.id = 'pip152-nome'; nome.textContent = placeName151();
  const info = doc.createElement('span'); info.id = 'pip152-info';
  const fechar = doc.createElement('button'); fechar.className = 'pip152-x'; fechar.textContent = '✕ fechar';
  head.appendChild(nome); head.appendChild(info); head.appendChild(fechar);
  const v = doc.createElement('video'); v.id = 'pip152-video';
  v.autoplay = true; v.muted = true; v.playsInline = true; v.setAttribute('playsinline', '');
  v.srcObject = PIP152.stream;
  doc.body.appendChild(head); doc.body.appendChild(v);
  fechar.addEventListener('click', function() { pipFechar152(); });
  w.addEventListener('pagehide', function() { if (PIP152.janela === w) pipFechar152(true, 'Janelinha fechada.'); });
  try { await v.play(); } catch (e) {}
  PIP152.modo = 'document';
  pipRelogio152();
}
async function pipAbrirVideo152() {
  if (!PIP152.video) {
    const v = document.createElement('video');
    v.id = 'pip152-video-raiz'; v.muted = true; v.autoplay = true; v.playsInline = true;
    v.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
    document.body.appendChild(v);
    v.addEventListener('leavepictureinpicture', function() { if (PIP152.modo === 'video') pipFechar152(true, 'Janelinha fechada.'); });
    v.addEventListener('webkitpresentationmodechanged', function() { if (v.webkitPresentationMode !== 'picture-in-picture' && PIP152.modo === 'safari') pipFechar152(true, 'Janelinha fechada.'); });
    PIP152.video = v;
  }
  PIP152.video.srcObject = PIP152.stream;
  try { await PIP152.video.play(); } catch (e) {}
  if (typeof PIP152.video.requestPictureInPicture === 'function') await PIP152.video.requestPictureInPicture();
  else if (typeof PIP152.video.webkitSetPresentationMode === 'function') PIP152.video.webkitSetPresentationMode('picture-in-picture');
  else throw new Error('Picture-in-Picture indisponível neste navegador');
  PIP152.modo = (typeof PIP152.video.webkitSetPresentationMode === 'function' && !PIP152.video.requestPictureInPicture) ? 'safari' : 'video';
}
async function pipAbrir152() {
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
}
function pipFechar152(silencioso, motivo) {
  try { if (PIP152.relogio) { clearInterval(PIP152.relogio); PIP152.relogio = null; } } catch (e) {}
  try { if (PIP152.modo === 'document' && PIP152.janela) PIP152.janela.close(); } catch (e) {}
  try { if (document.pictureInPictureElement) document.exitPictureInPicture(); } catch (e) {}
  try { if (PIP152.video) { PIP152.video.pause(); PIP152.video.srcObject = null; } } catch (e) {}
  try { if (PIP152.stream) PIP152.stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {}
  PIP152.stream = null; PIP152.janela = null; PIP152.modo = 'off'; PIP152.quer = false;
  const euLigueiBG = PIP152.bgForcado; PIP152.bgForcado = false; // v152b — desfaz só o que a janelinha tinha ligado
  if (euLigueiBG) bgSet152(false, true);
  pipSalvar152(); pipRotulos152();
  if (!silencioso) { showNotif('📺 Janelinha fechada.', 'info'); pipAtualizarNota152('Janelinha fechada.'); }
  else pipAtualizarNota152(motivo || 'Janelinha fechada.');
}
async function pipToggle152() {
  if (PIP152.modo !== 'off') { pipFechar152(); return; }
  const ok = await pipAbrir152();
  if (!ok) { pipAtualizarNota152('Não deu para abrir a janelinha agora.'); return; }
  PIP152.quer = true; pipSalvar152(); pipRotulos152();
  PIP152.bgForcado = !BG152.ligado; // lembra se fui EU que liguei o segundo plano (para devolver depois)
  bgSet152(true, true);             // a janelinha só faz sentido com o jogo rodando: liga o segundo plano junto
  showNotif('📺 Janelinha ligada — ela fica por cima das outras janelas! Modo fora da aba LIGADO.', 'success');
  if (!GameState.autoMove) showNotif('🤖 Dica: aperte P (Auto-Move) para o Caçador farmar sozinho enquanto você olha a janelinha.', 'info');
  pipAtualizarNota152('Janelinha aberta. Pode trocar de janela/app: a tela continua rodando aqui dentro.');
}
/* cabeçalho da janelinha: mapa + status do Caçador (1x por segundo) */
function pipRelogio152() {
  if (PIP152.relogio) clearInterval(PIP152.relogio);
  PIP152.relogio = setInterval(function() {
    try {
      if (PIP152.modo !== 'document' || !PIP152.janela) return;
      const doc = PIP152.janela.document;
      const nome = doc.getElementById('pip152-nome'), info = doc.getElementById('pip152-info');
      if (nome) nome.textContent = placeName151();
      if (info) info.textContent = 'Lv.' + GameState.player.lvl + ' · 🔋 ' + Math.floor(GameState.player.battery) + '% · ' + (GameState.autoMove ? '🤖 farmando' : '💤 auto-move off') + (BG152.ligado ? ' · 🌙 2º plano' : '');
    } catch (e) {}
  }, 1000);
}

/* ---------- MODO SEGUNDO PLANO ---------- */
function bgSalvar152() { try { localStorage.setItem(BG152_KEY, BG152.ligado ? '1' : '0'); } catch (e) {} }
function bgSet152(on, silencioso) {
  BG152.ligado = !!on;
  bgSalvar152();
  if (BG152.ligado) { bgTickerStart152(); bgSomKeepAlive152(true); }
  else { bgTickerStop152(); bgSomKeepAlive152(false); }
  pipRotulos152();
  if (!silencioso) {
    showNotif(BG152.ligado ? '🌙 Segundo plano LIGADO — pode trocar de aba/app que o Caçador continua farmando.' : '🌙 Segundo plano desligado — o navegador volta a pausar o jogo fora da aba.', BG152.ligado ? 'success' : 'info');
    pipAtualizarNota152(BG152.ligado ? 'Modo fora da aba LIGADO (~20 quadros/s).' : 'Modo fora da aba desligado.');
  }
}
function bgTickerStart152() { if (BG152.ticker) return; BG152.ultimoPasso = performance.now(); BG152.ticker = setInterval(bgTick152, BG152.taxa); }
function bgTickerStop152() { if (BG152.ticker) { clearInterval(BG152.ticker); BG152.ticker = null; } }
/* Um passo de mundo SÓ quando os quadros reais pararam (aba escondida, janela
 * coberta, rAF suspenso). O delta é travado em 140ms para nada teleportar. */
function bgTick152() {
  try {
    if (!game || game.pendingDestroy) return;
    const agora = performance.now();
    if (agora - BG152.ultimoFrame < 120) return; // o rAF está rodando: não dar passo duplo
    let dt = Math.round(agora - (BG152.ultimoPasso || (agora - BG152.taxa)));
    if (!(dt > 0)) dt = BG152.taxa;
    if (dt > 140) dt = 140;
    BG152.ultimoPasso = agora; BG152.passos++;
    BG152.forcando = true;
    try { game.step(agora, dt); } catch (e) { bgTickerStop152(); }
    BG152.forcando = false;
  } catch (e) { try { bgTickerStop152(); } catch (e2) {} }
}
/* Áudio inaudível (gain ~0): navegadores NÃO aplicam throttling pesado em páginas
 * "tocando áudio" — é o que impede o timer de cair para 1x por minuto. */
function bgSomKeepAlive152(on) {
  try {
    if (!on) {
      if (BG152.osc) { try { BG152.osc.stop(); } catch (e) {} BG152.osc = null; }
      if (BG152.ctxAudio && BG152.ctxAudio.state === 'running') { try { BG152.ctxAudio.suspend(); } catch (e) {} }
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!BG152.ctxAudio) {
      BG152.ctxAudio = new AC();
      BG152.ganho = BG152.ctxAudio.createGain();
      BG152.ganho.gain.value = 0.0002;
      BG152.ganho.connect(BG152.ctxAudio.destination);
    }
    if (BG152.ctxAudio.state === 'suspended') { try { BG152.ctxAudio.resume(); } catch (e) {} }
    if (!BG152.osc) {
      BG152.osc = BG152.ctxAudio.createOscillator();
      BG152.osc.type = 'sine'; BG152.osc.frequency.value = 40;
      BG152.osc.connect(BG152.ganho); BG152.osc.start();
    }
  } catch (e) {}
}
/* ---------- inicialização ---------- */
function initPip152() {
  let pipQ = false, bgQ = false;
  try { pipQ = localStorage.getItem(PIP152_KEY) === '1'; bgQ = localStorage.getItem(BG152_KEY) === '1'; } catch (e) {}
  PIP152.quer = pipQ;
  bindImmediateButton('opt-pip152', function() { pipToggle152(); });
  bindImmediateButton('opt-bg152', function() { bgSet152(!BG152.ligado); });
  if (bgQ) bgSet152(true, true); // preferência salva: religa o segundo plano (não precisa de toque)
  pipRotulos152();
  pipAtualizarNota152(pipQ ? '📺 A janelinha estava ligada da última vez — toque no botão para reabrir (o navegador exige um toque).' : '');
  // marca os quadros REAIS do rAF (poststep do Phaser) para o ticker se auto-regular
  try { game.events.on('poststep', function() { if (!BG152.forcando) BG152.ultimoFrame = performance.now(); }); } catch (e) {}
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) { BG152.escondidoEm = Date.now(); BG152.ultimoPasso = performance.now(); }
    else {
      BG152.ultimoPasso = performance.now();
      if (BG152.ligado && BG152.escondidoEm) {
        const min = Math.floor((Date.now() - BG152.escondidoEm) / 60000);
        if (min >= 1) showNotif('🌙 Você ficou ~' + min + ' min fora — o Caçador continuou farmando sozinho' + (PIP152.modo !== 'off' ? ' (e a janelinha mostrou tudo).' : '.'), 'info');
      }
      BG152.escondidoEm = 0;
    }
  });
}
initPip152();
"""
sub('JS-bloco', """initMobileMode();
ensureMarket();""", """initMobileMode();
""" + bloco + """
ensureMarket();""")

# ------------------------------------------------------------------ 3) changelog
sub('changelog', """// ============================================================
// CHAOTIC.IDLEWORLD v2.18 — CHANGELOG""",
"""// ============================================================
// CHAOTIC.IDLEWORLD v2.19 — CHANGELOG
// - JANELINHA FLUTUANTE (Picture-in-Picture) na engrenagem (⚙️ Opções):
//   o canvas do jogo é espelhado numa janela que fica SEMPRE na frente das
//   outras janelas/apps — no Chrome/Edge 116+ é janela própria (arrastável,
//   redimensionável), com cabeçalho mostrando o mapa atual, o nível, a
//   bateria e se o Auto-Move está farmando. Nos outros navegadores cai no
//   PiP de vídeo padrão (canvas → captureStream → <video>).
// - MODO FORA DA ABA: quando a aba perde o foco o navegador suspende o
//   requestAnimationFrame e o jogo congelava. Agora um co-piloto assume o
//   loop (game.step a ~20 fps, delta travado em 140ms) apenas enquanto não
//   houver quadros reais — sem passo duplo ao voltar. Um áudio inaudível
//   (gain ~0) evita o throttling agressivo de timers em aba oculta.
//   Ligar a janelinha liga esse modo junto; ao voltar, o jogo avisa quanto
//   tempo você ficou fora farmando. Fechar a janelinha desfaz o que ela
//   mesma tinha ligado (o ajuste manual do jogador é preservado).
// ============================================================
// CHAOTIC.IDLEWORLD v2.18 — CHANGELOG""")

sub('titulo', """<title>Chaotic.idleWorld v2.18 — Nomes de mapa corrigidos</title>""",
              """<title>Chaotic.idleWorld v2.19 — Janelinha (PiP) + jogo fora da aba</title>""")

io.open(ARQ, 'w', encoding='utf-8').write(d)
print('OK — v152 aplicado em', ARQ)
for n, c in rel: print('   [%s] %d' % (n, c))
