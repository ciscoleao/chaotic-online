// E2E do editor: executa initEditor() com DOM falso e simula o usuário.
// Uso: node test_editor_e2e.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'editor-mapa-patio.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);

function fakeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; },
  });
}
function fakeEl(tag, id) {
  const el = {
    tag, id: id || '', children: [], style: {}, dataset: {},
    textContent: '', value: '', width: 300, height: 150,
    _cls: {}, _lis: {},
    classList: null, files: [],
    appendChild(c) { el.children.push(c); return c; },
    addEventListener(t, f) { (el._lis[t] = el._lis[t] || []).push(f); },
    removeEventListener() {},
    querySelectorAll(sel) {
      const out = [];
      const walk = n => { for (const c of n.children) { const cn = (c.className || '').split(' '); if (sel === '.tile' && (cn.includes('tile') || (c._cls && c._cls.tile))) out.push(c); walk(c); } };
      walk(el); return out;
    },
    querySelector(sel) { return el.querySelectorAll(sel)[0] || fakeEl('b'); },
    getContext: () => fakeCtx(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: el.width, height: el.height }),
    click() {},
    set innerHTML(v) { el._html = v; el.children = []; },
    get innerHTML() { return el._html || ''; },
  };
  el.classList = {
    add: c => { el._cls[c] = 1; }, remove: c => { delete el._cls[c]; },
    toggle: (c, f) => { if (typeof f === 'undefined') f = !el._cls[c]; f ? el._cls[c] = 1 : delete el._cls[c]; },
    contains: c => !!el._cls[c],
  };
  return el;
}

const byId = {};
const neededIds = ['mapa', 'status', 'mid', 'pal', 'secs', 'gate', 'zoom', 'modal', 'mtext', 'm-input', 'mtitle',
  't-brush', 't-fill', 't-erase', 'l-ground', 'l-wall', 'b-new', 'b-save', 'b-copy', 'b-load', 'b-png', 'b-grid',
  'm-ok', 'm-file', 'm-close'];
for (const id of neededIds) byId[id] = fakeEl('div', id);
byId.mapa = fakeEl('canvas', 'mapa');
byId.mid.clientWidth = 800; byId.mid.clientHeight = 600;
byId.zoom.value = '16';

const rafQueue = [];
const sandbox = {
  console,
  document: {
    createElement: tag => fakeEl(tag),
    getElementById: id => byId[id] || null,
  },
  window: { _lis: {}, addEventListener(t, f) { (this._lis[t] = this._lis[t] || []).push(f); }, devicePixelRatio: 1 },
  requestAnimationFrame: fn => { rafQueue.push(fn); return 1; },
  setTimeout: () => 0, clearTimeout: () => {},
  confirm: () => true,
  navigator: {},
  Blob: function () {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  MouseEvent: function () {},
};
// localStorage que EXPLODE ao ser tocado (como iframe sandboxed sem allow-same-origin)
Object.defineProperty(sandbox, 'localStorage', { get() { throw new Error('SecurityError: localStorage bloqueado'); } });
vm.createContext(sandbox);

function flushRaf(n) { for (let i = 0; i < (n || 10) && rafQueue.length; i++) rafQueue.shift()(); }

let ok = 0, fail = 0;
function check(nome, cond, extra) {
  if (cond) { ok++; console.log('✅ ' + nome); }
  else { fail++; console.log('❌ ' + nome + (extra ? ' — ' + extra : '')); }
}

// 1) init roda sem explodir?
try {
  vm.runInContext(m[1], sandbox);
  const mounted = byId.mapa.width === 1600 && byId.pal.children.length > 50 && typeof byId['t-brush'].onclick === 'function';
  check('initEditor() executa sem erro', true);
  check('init montou de verdade (canvas+paleta+botões)', mounted, 'w=' + byId.mapa.width + ' pal=' + byId.pal.children.length);
} catch (e) {
  check('initEditor() executa sem erro', false, e.stack.split('\n').slice(0, 4).join(' | '));
  console.log('\n' + ok + ' ✅  ' + fail + ' ❌');
  process.exit(1);
}
flushRaf(20);

// 2) paleta montada? (54 tiles + categorias)
const tiles = byId.pal.querySelectorAll('.tile');
check('paleta com 107 tiles', tiles.length === 107, 'achados: ' + tiles.length);

// 3) clicar num tile seleciona (classe sel)
try {
  tiles[9].onclick();
  const sel = byId.pal.querySelectorAll('.tile').filter(t => t.classList.contains('sel'));
  check('clique no tile seleciona (1 sel)', sel.length === 1, 'sel=' + sel.length);
} catch (e) { check('clique no tile seleciona', false, e.message); }

// 4) pintar no canvas via mousedown/mousemove/mouseup
try {
  const cv = byId.mapa;
  const down = cv._lis.mousedown[0], move = cv._lis.mousemove[0];
  const up = sandbox.window._lis && sandbox.window._lis.mouseup;
  const ev = (x, y, button) => ({ button: button || 0, clientX: x, clientY: y, preventDefault() {} });
  down(ev(100, 100, 0)); move(ev(140, 100)); move(ev(180, 140));
  flushRaf(20);
  if (up) up.forEach(f => f({}));
  check('pintar com o mouse não explode', true);
} catch (e) { check('pintar com o mouse não explode', false, e.stack.split('\n').slice(1, 3).join(' | ')); }

// 5) ferramentas + camada + zoom + grade
try {
  byId['t-fill'].onclick(); byId['t-erase'].onclick(); byId['t-brush'].onclick();
  byId['l-wall'].onclick(); byId['l-ground'].onclick();
  byId['b-grid'].onclick(); byId.zoom.onchange({ target: { value: '32' } });
  flushRaf(20);
  check('botões ferramenta/camada/zoom/grade', true);
} catch (e) { check('botões ferramenta/camada/zoom/grade', false, e.message); }

// 6) exportar JSON (download stub) + copiar (modal) + PNG
try {
  byId['b-save'].onclick();
  byId['b-copy'].onclick(); // sem clipboard -> abre modal
  check('exportar/copiar JSON', true);
} catch (e) { check('exportar/copiar JSON', false, e.message); }
try {
  byId.mapa.toBlob = undefined;
  // PNG usa offscreen canvas: createElement retorna fake sem toBlob -> stub aqui:
  const origCreate = sandbox.document.createElement;
  sandbox.document.createElement = tag => { const e = origCreate(tag); e.toBlob = fn => fn({}); return e; };
  byId['b-png'].onclick();
  check('exportar PNG', true);
} catch (e) { check('exportar PNG', false, e.message); }

// 7) importar JSON válido pelo modal
try {
  const st = { app: 'chaotic-mapa-patio', v: 1, tile: 32, w: 100, h: 75,
    tileset: ['lunar0'], ground: [[1]], wall: [[0]], stamps: [],
    sectors: [{ id: 'roleta', x: 600, y: 400 }], gate: { x: 1, y: 2 }, spawn: { x: 3, y: 4 } };
  // completa dimensões
  st.ground = []; st.wall = [];
  for (let y = 0; y < 75; y++) { st.ground.push(new Array(100).fill(1)); st.wall.push(new Array(100).fill(0)); }
  byId.mtext.value = JSON.stringify(st);
  byId['m-ok'].onclick();
  flushRaf(20);
  check('importar JSON válido', true);
} catch (e) { check('importar JSON válido', false, e.message); }

// 8) importar JSON inválido mostra erro (não explode)
try {
  byId.mtext.value = '{lixo';
  byId['m-ok'].onclick();
  check('importar JSON inválido não explode', /❌|Unexpected|invalid/i.test(byId.status.innerHTML), byId.status.innerHTML.slice(0, 80));
} catch (e) { check('importar JSON inválido não explode', false, e.message); }

// 9) novo mapa (confirm=true)
try {
  byId['b-new'].onclick();
  flushRaf(20);
  check('botão novo mapa', true);
} catch (e) { check('botão novo mapa', false, e.message); }

console.log('\n' + ok + ' ✅  ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
