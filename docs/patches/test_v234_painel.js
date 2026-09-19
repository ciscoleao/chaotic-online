// v2.34 (v171) — PAINÉIS MÓVEIS: clique vs. arrasto.
// Teste 100% Node (sem servidor, sem navegador): lê o script dos painéis móveis
// direto do chaotic_idleworld_v123.html, executa num DOM falso e simula o mouse.
//
// Uso (na raiz do repo):
//   node docs/patches/test_v234_painel.js
//   GAME_FILE=/tmp/orig_backup.html node docs/patches/test_v234_painel.js  (testa outro HTML)
const fs = require('fs');
const path = require('path');

const GAME = process.env.GAME_FILE || path.join(__dirname, '..', '..', 'chaotic_idleworld_v123.html');
const html = fs.readFileSync(GAME, 'utf-8');

let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) {
  console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : ''));
  cond ? OK++ : FALHOU++;
}

// ------------------------------------------------------------ mini-DOM
function matchesOne(el, sel) {
  sel = sel.trim();
  if (!sel) return false;
  if (sel[0] === '#') return el.id === sel.slice(1);
  const m = sel.match(/^([a-zA-Z][a-zA-Z0-9]*)?((?:\.[A-Za-z0-9_-]+)*)(?:\[([A-Za-z0-9_-]+)\])?$/);
  if (!m || (!m[1] && !m[2] && !m[3])) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  if (m[2]) for (const c of m[2].split('.').filter(Boolean)) if (!el._cls.has(c)) return false;
  if (m[3] && !el.attrs.has(m[3])) return false;
  return true;
}
function matches(el, group) { return String(group).split(',').some(s => matchesOne(el, s)); }

class El {
  constructor(tag, o) {
    o = o || {};
    this.tagName = String(tag || 'div').toUpperCase();
    this.id = o.id || '';
    this._cls = new Set(String(o.cls || '').split(/\s+/).filter(Boolean));
    this.attrs = new Set(o.attrs || []);
    this.children = []; this.parent = null;
    this.style = {}; this.dataset = {};
    this._lis = {};
    this.offsetWidth = o.w || 0; this.offsetHeight = o.h || 0;
    this._x = o.x || 0; this._y = o.y || 0;
    this.capturedPid = null; this.env = null;
    const self = this;
    this.classList = {
      add(c) { self._cls.add(c); },
      remove(c) { self._cls.delete(c); },
      contains(c) { return self._cls.has(c); },
    };
  }
  appendChild(c) { c.parent = this; c.env = this.env; this.children.push(c); return c; }
  addEventListener(t, f, c) { (this._lis[t] = this._lis[t] || []).push({ f, c: !!c }); }
  removeEventListener(t, f, c) {
    this._lis[t] = (this._lis[t] || []).filter(l => l.f !== f || l.c !== !!c);
  }
  closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parent; } return null; }
  contains(n) { while (n) { if (n === this) return true; n = n.parent; } return false; }
  querySelector(sel) { const r = this.querySelectorAll(sel); return r.length ? r[0] : null; }
  querySelectorAll(sel) {
    const out = [];
    (function dfs(n) { for (const c of n.children) { if (matches(c, sel)) out.push(c); dfs(c); } })(this);
    return out;
  }
  getBoundingClientRect() {
    const l = parseFloat(this.style.left), t = parseFloat(this.style.top);
    return { left: isNaN(l) ? this._x : l, top: isNaN(t) ? this._y : t };
  }
  setPointerCapture(pid) { this.capturedPid = pid; if (this.env) this.env.captureEl = this; }
}

function makeEnv() {
  const env = {
    store: {}, winLis: {}, captureEl: null,
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(env.store, k) ? env.store[k] : null; },
      setItem(k, v) { env.store[k] = String(v); },
      removeItem(k) { delete env.store[k]; },
    },
  };
  const body = new El('body'); body.env = env;
  const win = {
    innerWidth: 1280, innerHeight: 800,
    addEventListener(t, f, c) { (env.winLis[t] = env.winLis[t] || []).push({ f, c: !!c }); },
    removeEventListener(t, f, c) { env.winLis[t] = (env.winLis[t] || []).filter(l => l.f !== f || l.c !== !!c); },
  };
  const doc = {
    body,
    querySelectorAll(sel) { return body.querySelectorAll(sel); },
    querySelector(sel) { return body.querySelector(sel); },
  };
  env.body = body; env.win = win; env.doc = doc;

  function fireList(list, cap, e) {
    for (const l of (list || []).slice()) { if (l.c === cap) { l.f(e); if (e._stop) return; } }
  }
  // Despacha com captura/borbulhação simplificada + semântica REAL de pointer capture:
  // (a) com capture ativo, pointermove/pointerup vão para o elemento capturador;
  // (b) o navegador solta a captura no pointerup (implicit release);
  // (c) o click derivado daquele up é retargetado ao capturador (Chrome/Firefox) —
  //     é exatamente isso que matava o travelTo() na v2.31.
  env._dispatchInner = function (target, type, p) {
    let tgt = target;
    if ((type === 'pointermove' || type === 'pointerup') && env.captureEl) tgt = env.captureEl;
    if (type === 'click' && env._redirect) { tgt = env._redirect; env._redirect = null; }
    const e = {
      type, target: tgt,
      clientX: p.x || 0, clientY: p.y || 0,
      button: p.button, pointerType: p.pointerType || 'mouse',
      pointerId: p.pid !== undefined ? p.pid : 1,
      cancelable: true, defaultPrevented: false, _stop: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this._stop = true; },
    };
    const pathp = []; let n = tgt;
    while (n) { pathp.push(n); n = n.parent; }
    fireList(env.winLis[type], true, e); if (e._stop) return e;
    for (let k = pathp.length - 1; k >= 1; k--) { fireList(pathp[k]._lis[type], true, e); if (e._stop) return e; }
    fireList(tgt._lis[type], true, e); if (e._stop) return e;
    fireList(tgt._lis[type], false, e); if (e._stop) return e;
    for (let k = 1; k < pathp.length; k++) { fireList(pathp[k]._lis[type], false, e); if (e._stop) return e; }
    fireList(env.winLis[type], false, e);
    return e;
  };
  env.dispatch = function (target, type, p) {
    const e = env._dispatchInner(target, type, p || {});
    // implicit release: navegador solta a captura no pointerup, mas o click
    // derivado ainda é retargetado ao capturador (guardado em _redirect)
    if (type === 'pointerup' && env.captureEl) { env._redirect = env.captureEl; env.captureEl = null; }
    return e;
  };
  return env;
}

// monta um #room-menu fiel ao jogo: header + botão fechar + card de mapa (DIV com onclick)
function montaRoom(env, sufixo) {
  const room = new El('div', { id: 'room-menu' + (sufixo || ''), cls: 'panel', w: 460, h: 400, x: 390, y: 200 });
  room.env = env; env.body.appendChild(room);
  const header = new El('div', { cls: 'room-panel-header' }); room.appendChild(header);
  const title = new El('span', { cls: 'room-panel-title' }); header.appendChild(title);
  const btnX = new El('button', { cls: 'hub-back-btn' }); header.appendChild(btnX);
  const content = new El('div', { id: 'room-content' }); room.appendChild(content);
  const tab = new El('button', { cls: 'ptab on' }); content.appendChild(tab);
  const card = new El('div', { cls: 'region-card', attrs: ['onclick'] }); content.appendChild(card);
  const h5 = new El('h5'); card.appendChild(h5);
  const pp = new El('p'); card.appendChild(pp);
  const lm = new El('span', { cls: 'lm-tag' }); card.appendChild(lm);
  return { room, header, title, btnX, content, tab, card, h5, pp, lm };
}

function carregaScript(env, src) {
  const MutationObserver = function () { this.observe = function () {}; };
  const fn = new Function('window', 'document', 'localStorage', 'MutationObserver', 'innerWidth', 'innerHeight', 'location', 'setTimeout',
    '"use strict";' + src);
  fn(env.win, env.doc, env.localStorage, MutationObserver, 1280, 800, { reload() {} }, setTimeout);
}

function extraiScript(htmlSrc) {
  const marcadores = ['/* v2.34 (v171)', '/* v2.31 — painéis móveis'];
  for (const m of marcadores) {
    const k = htmlSrc.indexOf(m);
    if (k !== -1) {
      const ini = htmlSrc.lastIndexOf('<script>', k) + '<script>'.length;
      const fim = htmlSrc.indexOf('</script>', k);
      return { src: htmlSrc.slice(ini, fim), qual: m.includes('v2.34') ? 'v2.34/v171 (corrigido)' : 'v2.31 (original)' };
    }
  }
  throw new Error('script dos painéis móveis não encontrado no HTML');
}

// ---------------------------------------------------------- verificações
console.log('\n[0] MARCADORES NO HTML — ' + GAME);
checa('CSS: touch-action foi para a alça (.panel-drag-handle)',
  html.includes('.movable-panel .panel-drag-handle{cursor:grab;touch-action:none}'));
checa('CSS: painel inteiro NÃO tem mais touch-action:none',
  !html.includes('.movable-panel{touch-action:none'));
checa('JS v2.34/v171 presente', html.includes('v2.34 (v171)'));
checa('título v2.34', html.includes('Chaotic.idleWorld v2.34'));

const { src, qual } = extraiScript(html);
console.log('\n[1] SCRIPT DETECTADO: ' + qual);

// Caso A — CLIQUE no card do mapa (o bug reportado)
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let clicouCard = false;
  r.card.addEventListener('click', () => { clicouCard = true; }); // = travelTo()
  const antes = r.room.getBoundingClientRect();
  const d = env.dispatch(r.h5, 'pointerdown', { x: 500, y: 300, button: 0 });
  env.dispatch(r.h5, 'pointerup', { x: 500, y: 300, button: 0 });
  env.dispatch(r.card, 'click', { x: 500, y: 300 });
  const depois = r.room.getBoundingClientRect();
  console.log('\n[2] CLIQUE SIMPLES NO MAPA (coração do bug)');
  checa('travelTo disparou (click chegou no card)', clicouCard);
  checa('painel NÃO se moveu', antes.left === depois.left && antes.top === depois.top);
  checa('pointerdown NÃO deu preventDefault', !d.defaultPrevented);
  checa('pointerdown NÃO capturou o ponteiro', r.room.capturedPid === null && env.captureEl === null);
})();

// Caso A2 — clique no selo do card (.lm-tag)
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let clicou = false;
  r.card.addEventListener('click', () => { clicou = true; });
  env.dispatch(r.lm, 'pointerdown', { x: 510, y: 320, button: 0 });
  env.dispatch(r.lm, 'pointerup', { x: 510, y: 320, button: 0 });
  env.dispatch(r.card, 'click', { x: 510, y: 320 });
  console.log('\n[3] CLIQUE NO SELO DO CARD (.lm-tag)');
  checa('click chegou no card', clicou);
})();

// Caso B — ARRASTO de verdade pelo cabeçalho (solta SOBRE o card)
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let viajou = false;
  r.card.addEventListener('click', () => { viajou = true; }); // = travelTo()
  env.dispatch(r.title, 'pointerdown', { x: 400, y: 210, button: 0 });
  env.dispatch(r.title, 'pointermove', { x: 400, y: 210, button: 0 });
  env.dispatch(r.title, 'pointermove', { x: 450, y: 240, button: 0 }); // +50/+30
  env.dispatch(r.title, 'pointerup', { x: 450, y: 240, button: 0 });
  const pos = r.room.getBoundingClientRect();
  env.dispatch(r.card, 'click', { x: 450, y: 240 }); // click fantasma pós-arrasto
  console.log('\n[4] ARRASTO PELO CABEÇALHO (mover 50px)');
  checa('painel moveu junto (+50/+30)', pos.left === 440 && pos.top === 230, 'left=' + pos.left + ' top=' + pos.top);
  checa('posição foi salva (localStorage)', (env.store.chaotic_panel_positions_v231 || '').includes('440'));
  checa('sem viagem acidental (fantasma engolido)', !viajou);
})();

// Caso B2 — navegador SEM pointer capture: a trava de click precisa segurar sozinha
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  r.room.setPointerCapture = function () {}; // Safari antigo: capture não existe
  carregaScript(env, src);
  let viajou = false;
  r.card.addEventListener('click', () => { viajou = true; }); // = travelTo()
  env.dispatch(r.title, 'pointerdown', { x: 400, y: 210, button: 0 });
  env.dispatch(r.title, 'pointermove', { x: 500, y: 300, button: 0 }); // +100/+90 = arrasto
  env.dispatch(r.card, 'pointerup', { x: 500, y: 300, button: 0 }); // soltou SOBRE o card
  const pos = r.room.getBoundingClientRect();
  env.dispatch(r.card, 'click', { x: 500, y: 300 }); // fantasma cairia no card
  console.log('\n[4b] ARRASTO SEM CAPTURE (trava de click sozinha)');
  checa('painel moveu (+100/+90)', pos.left === 490 && pos.top === 290, 'left=' + pos.left + ' top=' + pos.top);
  checa('sem viagem acidental (trava segurou)', !viajou);
})();

// Caso C — mexeu 3px (< 7): ainda é CLIQUE
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let clicou = false;
  r.header.addEventListener('click', () => { clicou = true; });
  const antes = r.room.getBoundingClientRect();
  env.dispatch(r.title, 'pointerdown', { x: 400, y: 210, button: 0 });
  env.dispatch(r.title, 'pointermove', { x: 402, y: 212, button: 0 });
  env.dispatch(r.title, 'pointerup', { x: 402, y: 212, button: 0 });
  const depois = r.room.getBoundingClientRect();
  env.dispatch(r.header, 'click', { x: 402, y: 212 });
  console.log('\n[5] MEXEU SÓ 3px NO CABEÇALHO (tremida de mão)');
  checa('painel NÃO se moveu', antes.left === depois.left && antes.top === depois.top);
  checa('click passou normal', clicou);
})();

// Caso D — botão fechar: nem com movimento arrasta
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let clicouX = false;
  r.btnX.addEventListener('click', () => { clicouX = true; });
  const antes = r.room.getBoundingClientRect();
  env.dispatch(r.btnX, 'pointerdown', { x: 700, y: 210, button: 0 });
  env.dispatch(r.btnX, 'pointermove', { x: 750, y: 260, button: 0 });
  env.dispatch(r.btnX, 'pointerup', { x: 750, y: 260, button: 0 });
  const depois = r.room.getBoundingClientRect();
  env.dispatch(r.btnX, 'click', { x: 750, y: 260 });
  console.log('\n[6] BOTÃO FECHAR (arrastar a partir dele)');
  checa('painel NÃO se moveu', antes.left === depois.left && antes.top === depois.top);
  checa('click do botão passou', clicouX);
})();

// Caso E — painel sem alça: fixo, sem exceção
(function () {
  const env = makeEnv();
  const p = new El('div', { id: 'codex-panel', w: 300, h: 200, x: 50, y: 50 });
  p.env = env; env.body.appendChild(p);
  const corpo = new El('div', { cls: 'corpo' }); p.appendChild(corpo);
  let erro = null;
  try {
    carregaScript(env, src);
    env.dispatch(corpo, 'pointerdown', { x: 60, y: 60, button: 0 });
    env.dispatch(corpo, 'pointermove', { x: 200, y: 200, button: 0 });
    env.dispatch(corpo, 'pointerup', { x: 200, y: 200, button: 0 });
  } catch (e) { erro = e; }
  const pos = p.getBoundingClientRect();
  console.log('\n[7] PAINEL SEM CABEÇALHO (fallback seguro)');
  checa('sem exceção', !erro, erro && erro.message);
  checa('painel ficou fixo (sem alça = sem arrasto)', pos.left === 50 && pos.top === 50);
})();

// Caso F — alça criada DEPOIS (painel dinâmico tipo o clerk)
(function () {
  const env = makeEnv();
  const clerk = new El('div', { id: 'clerk-panel', w: 900, h: 500, x: 190, y: 150 });
  clerk.env = env; env.body.appendChild(clerk);
  carregaScript(env, src); // clerk ainda vazio aqui, como no boot do jogo
  const top = new El('div', { cls: 'ck169-top' }); clerk.appendChild(top);
  const tit = new El('div', { cls: 'ck169-title' }); top.appendChild(tit);
  env.dispatch(tit, 'pointerdown', { x: 300, y: 170, button: 0 });
  env.dispatch(tit, 'pointermove', { x: 330, y: 170, button: 0 });
  env.dispatch(tit, 'pointerup', { x: 330, y: 170, button: 0 });
  const pos = clerk.getBoundingClientRect();
  console.log('\n[8] ALÇA DINÂMICA (clerk renderizado depois)');
  checa('arrasto funcionou após o render (+30)', pos.left === 220 && pos.top === 150, 'left=' + pos.left);
})();

// Caso G — toque (celular): tap no card + arrasto no header
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  let clicou = false;
  r.card.addEventListener('click', () => { clicou = true; });
  env.dispatch(r.pp, 'pointerdown', { x: 500, y: 310, pointerType: 'touch' });
  env.dispatch(r.pp, 'pointerup', { x: 500, y: 310, pointerType: 'touch' });
  env.dispatch(r.card, 'click', { x: 500, y: 310 });
  env.dispatch(r.title, 'pointerdown', { x: 400, y: 210, pointerType: 'touch' });
  env.dispatch(r.title, 'pointermove', { x: 400, y: 260, pointerType: 'touch' });
  env.dispatch(r.title, 'pointerup', { x: 400, y: 260, pointerType: 'touch' });
  const pos = r.room.getBoundingClientRect();
  console.log('\n[9] CELULAR (toque)');
  checa('tap no card chegou (travelTo)', clicou);
  checa('arrasto por toque moveu (+50y)', pos.top === 250, 'top=' + pos.top);
})();

// Caso H — botão direito não arrasta
(function () {
  const env = makeEnv();
  const r = montaRoom(env);
  carregaScript(env, src);
  env.dispatch(r.title, 'pointerdown', { x: 400, y: 210, button: 2 });
  env.dispatch(r.title, 'pointermove', { x: 500, y: 300, button: 2 });
  env.dispatch(r.title, 'pointerup', { x: 500, y: 300, button: 2 });
  const pos = r.room.getBoundingClientRect();
  console.log('\n[10] BOTÃO DIREITO NO CABEÇALHO');
  checa('painel NÃO se moveu', pos.left === 390 && pos.top === 200);
})();

console.log('\n==== RESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌ ====\n');
process.exit(FALHOU ? 1 : 0);
