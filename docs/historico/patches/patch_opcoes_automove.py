# -*- coding: utf-8 -*-
"""v2.26 / patch v161 — OPÇÕES LIMPAS + AUTO-MOVE AUTOMÁTICO (tecla P removida).

Pedido: "Remova o comando P de auto move, pois a pessoa não pode controlar quando
pode estar em auto move; essa função é exclusiva para mapas de criaturas. Remova
também esses textos explicativos, deixando apenas o ícone com o nome dentro de
OPÇÕES."

- A tecla P (e o botão 🤖/⏸ do celular) sai: o auto-move passa a ser AUTOMÁTICO.
- MAPAS DE CRIATURAS (Perim = os 5 mapas de tribo, e a Caverna Secreta): auto-move
  SEMPRE ligado — o Caçador anda e escaneia sozinho, sem o jogador mexer em nada.
- Pátio Central, Ilha dos Dromos e Dromo (arena): NÃO são mapas de criaturas — o
  herói fica parado e o jogador anda com WASD/joystick.
- Painel de Opções: saem os parágrafos explicativos (movimento/atalhos, avisos e
  dicas do PiP). Ficam só os botões com ícone + nome.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        print('ABORTADO (%s): %d ocorrencia(s)' % (rot, s.count(velho))); sys.exit(1)
    s = s.replace(velho, novo, 1); print('ok: ' + rot)

# ---------- 1) HTML: tira os dois blocos de texto explicativo do painel ---------
troca("""  <div class="opt-note" id="opt-mode-note"></div>
""", "", 'HTML: remove a nota do modo PC/Celular')

troca("""  <div class="opt-note" id="opt-pip-nota152"></div>
""", "", 'HTML: remove a nota do PiP')

# ---------- 2) applyUiMode: não escreve mais o texto de ajuda ----------
troca("""  const note = document.getElementById('opt-mode-note');
  if (note) note.textContent = uiMode === 'mobile'
    ? '📱 Joystick 360° no canto esquerdo. O botão 👆 interage com NPCs, salas e o Balconista Robô (craft/upgrade). Depósito guarda 10 slots. Nos mapas de monstros os controles somem (🤖 auto-move). Scanner e mochila no topo.'
    : '🖥️ Movimento: WASD ou setas. Interação: tecla E. Scanner: Q · Mochila: I · Auto-move: P.';
}""",
"""  // v161 — sem textos explicativos no painel: só os botões com ícone + nome
}""", 'applyUiMode sem a nota')

# ---------- 3) pipAtualizarNota152: vira no-op (aviso de erro continua em toast) ----------
troca("""function pipAtualizarNota152(extra) {
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
}""",
"""function pipAtualizarNota152(extra) {
  /* v161 — o painel não tem mais parágrafos explicativos (só ícone + nome).
   * Erros/avisos da janelinha continuam aparecendo como aviso no canto da tela. */
}""", 'pipAtualizarNota152 sem textos')

# ---------- 4) tecla P: sai das 4 cenas; auto-move vira automático ----------
troca("""    this.input.keyboard.on('keydown-P', function() {
      GameState.autoMove = !GameState.autoMove;
      showNotif(GameState.autoMove ? '\\u{1F916} Auto-Move ATIVADO' : '\\u{1F6D1} Auto-Move DESATIVADO', GameState.autoMove ? 'success' : 'warning');
    });
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.stuckTracker = { lastX: this.player.x, lastY: this.player.y, timer: 0, isJumping: false };""",
"""    /* v161 — AUTO-MOVE AUTOMÁTICO (a tecla P saiu de vez). O Pátio Central NÃO é
     * mapa de criaturas: o herói fica parado e você anda com WASD/joystick. */
    GameState.autoMove = false;
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.stuckTracker = { lastX: this.player.x, lastY: this.player.y, timer: 0, isJumping: false };""",
'Portico: P removido (auto-move desligado no Pátio)')

troca("""    this.input.keyboard.on('keydown-P', function() {
      GameState.autoMove = !GameState.autoMove;
      showNotif(GameState.autoMove ? '🤖 Auto-Move ATIVADO' : '🛑 Auto-Move DESATIVADO', GameState.autoMove ? 'success' : 'warning');
      
    });
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.autoState = 'wander'; // 'wander' | 'chase' | 'scan'""",
"""    /* v161 — MAPA DE CRIATURAS: o auto-move liga SOZINHO, sempre. O jogador não
     * liga/desliga nada (a tecla P deixou de existir). */
    GameState.autoMove = true;
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.autoState = 'wander'; // 'wander' | 'chase' | 'scan'""",
'Perim: auto-move sempre ligado')

troca("""    this.input.keyboard.on('keydown-P', function() {
      GameState.autoMove = !GameState.autoMove;
      showNotif(GameState.autoMove ? '🤖 Auto-Move ATIVADO' : '🛑 Auto-Move DESATIVADO', GameState.autoMove ? 'success' : 'warning');
    });
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.autoState = 'wander'; this.autoTarget = null;""",
"""    /* v161 — a Caverna Secreta é mapa de criaturas: auto-move sempre ligado. */
    GameState.autoMove = true;
    this.walkFrame = 0; this.walkTimer = 0; this.playerDir = 's';
    this.autoState = 'wander'; this.autoTarget = null;""",
'Cave: auto-move sempre ligado')

troca("""    this.input.keyboard.on('keydown-P', function() {
      GameState.autoMove = !GameState.autoMove;
      showNotif(GameState.autoMove ? '🤖 Auto-Move ATIVADO' : '🛑 Auto-Move DESATIVADO', GameState.autoMove ? 'success' : 'warning');
      
    });
    const self = this;""",
"""    /* v161 — o Dromo (arena) não é mapa de criaturas: o herói não anda sozinho. */
    GameState.autoMove = false;
    const self = this;""",
'Drome: P removido')

# ---------- 5) Ilha dos Dromos (Exterior): não é mapa de criaturas ----------
troca("""class ExteriorScene extends Phaser.Scene {
  constructor() { super('ExteriorScene'); }
  preload() {""",
"""class ExteriorScene extends Phaser.Scene {
  constructor() { super('ExteriorScene'); }
  create() { /* v161 — a Ilha dos Dromos NÃO é mapa de criaturas: nada de auto-move */
    GameState.autoMove = false;
    return this.createOriginal161.apply(this, arguments);
  }
  createOriginal161() {
  preload() {""", 'Exterior: auto-move desligado (wrapper)')

# ---------- 6) botão de ação do celular: sem o 🤖/⏸ ----------
troca("""  const canAuto = (key === 'PerimScene' || key === 'CaveScene');
  btn.classList.remove('ready', 'on');
  if (nearest) {
    mobileActionState = 'interact';
    btn.textContent = '👆';
    btn.classList.add('ready');
  } else if (canAuto) {
    mobileActionState = 'auto';
    btn.textContent = GameState.autoMove ? '⏸' : '🤖';
    if (GameState.autoMove) btn.classList.add('on');
  } else {
    mobileActionState = 'idle';
    btn.textContent = '👆';
  }""",
"""  // v161 — o auto-move é automático: o botão só serve para INTERAGIR (👆)
  btn.classList.remove('ready', 'on');
  if (nearest) {
    mobileActionState = 'interact';
    btn.textContent = '👆';
    btn.classList.add('ready');
  } else {
    mobileActionState = 'idle';
    btn.textContent = '👆';
  }""", 'celular: botão sem o toggle de auto-move')

troca("""function mobileActionTap() {
  if (mobileActionState === 'interact' && mobileNearestAction) { mobileNearestAction.action(); return; }
  if (mobileActionState === 'auto') {
    GameState.autoMove = !GameState.autoMove;
    showNotif(GameState.autoMove ? '🤖 Auto-Move ATIVADO' : '🛑 Auto-Move DESATIVADO', GameState.autoMove ? 'success' : 'warning');
    updateMobileActionButton();
  }
}""",
"""function mobileActionTap() {
  // v161 — só interage: o auto-move liga sozinho nos mapas de criaturas
  if (mobileActionState === 'interact' && mobileNearestAction) { mobileNearestAction.action(); return; }
}""", 'celular: toque sem toggle')

# ---------- 7) avisos que citavam a tecla P ----------
troca("""  if (!GameState.autoMove) showNotif('🤖 Dica: aperte P (Auto-Move) para o Caçador farmar sozinho enquanto você olha a janelinha.', 'info');""",
"""  // v161 — a dica da tecla P morreu junto com a tecla: o auto-move é automático""",
'dica da tecla P removida')

troca("""      if (info) info.textContent = 'Lv.' + GameState.player.lvl + ' · 🔋 ' + Math.floor(GameState.player.battery) + '% · ' + (GameState.autoMove ? '🤖 farmando' : '💤 auto-move off') + (BG152.ligado ? ' · 🌙 2º plano' : '');""",
"""      if (info) info.textContent = 'Lv.' + GameState.player.lvl + ' · 🔋 ' + Math.floor(GameState.player.battery) + '%' + (GameState.autoMove ? ' · 🤖 farmando' : '') + (BG152.ligado ? ' · 🌙 2º plano' : ''); // v161""",
'linha de status sem "auto-move off"')

# ---------- 8) título + changelog ----------
troca("""<title>Chaotic.idleWorld v2.25 — O herói vai atrás de qualquer criatura</title>""",
"""<title>Chaotic.idleWorld v2.26 — Opções limpas, Auto-Move automático e o MASTER dos Dromos</title>""",
'titulo v2.26')

troca("""// CHAOTIC.IDLEWORLD v2.25 — CHANGELOG (patch v159 — O HERÓI VAI ATRÁS E ESCANEIA QUALQUER CRIATURA)""",
"""// CHAOTIC.IDLEWORLD v2.26 — CHANGELOG (v161 Opções limpas + Auto-Move automático · v162 itens raros · v163 MASTER dos Dromos)
// - v161 — AUTO-MOVE AUTOMÁTICO: a tecla P deixou de existir (e com ela o botão
//   🤖/⏸ do celular e a dica "aperte P"). O jogador não controla mais quando está
//   em auto-move: nos MAPAS DE CRIATURAS (os 5 mapas de tribo e a Caverna Secreta)
//   ele liga SOZINHO, sempre — o Caçador anda e escaneia sem ninguém mexer em nada.
//   O Pátio Central, a Ilha dos Dromos e o Dromo (arena) NÃO são mapas de
//   criaturas: lá o herói fica parado e o jogador anda com WASD/joystick.
// - v161 — PAINEL DE OPÇÕES LIMPO: saíram os parágrafos explicativos (linha de
//   movimento/atalhos, avisos e dicas do Picture-in-Picture). Ficaram apenas os
//   botões com ícone + nome: PC/Celular, código de resgate, janelinha/PiP,
//   fora da aba, teleportar ao Pátio, modo foto e deslogar. Erros do PiP que antes
//   apareciam como texto continuam aparecendo como aviso no canto da tela.

// CHAOTIC.IDLEWORLD v2.25 — CHANGELOG (patch v159 — O HERÓI VAI ATRÁS E ESCANEIA QUALQUER CRIATURA)""",
'changelog v2.26')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
