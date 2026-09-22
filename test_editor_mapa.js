// Teste do editor de mapa (núcleo puro executado em Node com stubs de canvas/DOM).
// Uso: node test_editor_mapa.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'editor-mapa-patio.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.log('❌ sem bloco <script>'); process.exit(1); }

function fakeCtx() {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (typeof p === 'string') return () => undefined;
      return undefined;
    },
    set() { return true; },
  });
}
const fakeDoc = {
  createElement(tag) {
    if (tag !== 'canvas') throw new Error('createElement(' + tag + ') inesperado');
    return { width: 0, height: 0, getContext: () => fakeCtx() };
  },
  getElementById: () => null, // editor visual NÃO inicia em Node
};
const sandbox = { document: fakeDoc, console };
vm.createContext(sandbox);
const driver = `
;var __RESULTS__ = (function() {
  const R = {};
  const TEX = buildTextures(document);
  R.ntex = Object.keys(TEX).length;
  R.ndefs = TILE_DEFS.length;
  R.sf = ['sf_parede','sf_parede_topo','sf_pilar','sf_porta','sf_janela','sf_piso','sf_piso_borda','sf_grade','sf_canto_tl','sf_canto_tr','sf_canto_bl','sf_canto_br','sf_porta_aberta','sf_vidro','sf_tapete_roxo','sf_tapete_azul','sf_xadrez','sf_luz_piso','sf_console','sf_caixa','sf_prateleira','sf_planta','sf_podio','sf_poste','sf_banner_c','sf_banner_m','sf_antena','sf_fornalha','sf_roleta','sf_teleporte'].every(k => !!TEX[k]);
  R.xx = ['piso_drome','parede_drome','portal_drome','piso_caverna','parede_caverna','grama_ilha','caminho_ilha','agua_ilha','cerca_ilha','arvore_ilha','fonte_ilha','predio_central','dromo_crellan','dromo_hotekk','dromo_amzen','dromo_oron','dromo_tirasis','dromo_imthor','dromo_chirrul','celula','sucata','geodo','circuito','cristal','gema','cristal_roxo','fio','reator','brilhinho','portal_mini0','portal_mini1'].every(k => !!TEX[k]);
  const D = buildDefaultMap();
  R.dims = [D.ground.length, D.ground[0].length, D.wall.length, D.wall[0].length];
  const AV = keyToIdx('avenida'), WL = keyToIdx('parede_lunar');
  let avOk = true;
  for (let y = 5; y <= 70; y++) if (D.ground[y][50] !== AV) avOk = false;
  for (let x = 5; x <= 94; x++) if (D.ground[37][x] !== AV) avOk = false;
  for (let x = 9; x <= 90; x++) if (D.ground[11][x] !== AV || D.ground[63][x] !== AV) avOk = false;
  for (let y = 6; y <= 68; y++) if (D.ground[y][17] !== AV || D.ground[y][82] !== AV) avOk = false;
  R.avenues = avOk;
  let wallOk = true;
  for (let x = 0; x < 100; x++) if (D.wall[0][x] !== WL || D.wall[74][x] !== WL) wallOk = false;
  for (let y = 0; y < 75; y++) if (D.wall[y][0] !== WL || D.wall[y][99] !== WL) wallOk = false;
  R.border = wallOk;
  R.stamps = D.stamps.length;
  R.stampsKnown = D.stamps.every(s => keyToIdx(s.t) > 0);
  R.sectors = D.sectors.map(s => s.id + ':' + s.x + ',' + s.y).join(' ');
  R.gate = D.gate.x + ',' + D.gate.y; R.spawn = D.spawn.x + ',' + D.spawn.y;
  const rt = deserializeMap(JSON.parse(JSON.stringify(serializeMap(D))));
  R.roundtrip = JSON.stringify(serializeMap(rt)) === JSON.stringify(serializeMap(D));
  let threw = false;
  try { deserializeMap({ app: 'x' }); } catch (e) { threw = true; }
  R.rejects = threw;
  R.idxRoundtrip = TILE_DEFS.every((d, i) => keyToIdx(d[0]) === i + 1);
  return R;
})();
`;
vm.runInContext(m[1] + driver, sandbox);
const R = sandbox.__RESULTS__;
let ok = 0, fail = 0;
function check(nome, cond, extra) {
  if (cond) { ok++; console.log('✅ ' + nome); }
  else { fail++; console.log('❌ ' + nome + (extra ? ' — ' + extra : '')); }
}
check('todas as texturas geradas (' + R.ntex + ')', R.ntex === R.ndefs && R.ntex > 40, R.ntex + '/' + R.ndefs);
check('30 tiles SCI-FI renderizam', R.sf);
check('32 extras do jogo renderizam', R.xx);
check('mapa padrão 100×75', R.dims.join(',') === '75,100,75,100', R.dims.join(','));
check('avenidas no lugar (cruz + grade)', R.avenues);
check('borda de parede lunar', R.border);
check('carimbos padrão (' + R.stamps + ', todos conhecidos)', R.stamps > 10 && R.stampsKnown, R.stamps);
// confere setores contra o SECTORS174 REAL do jogo
const idlePath = path.join(__dirname, '..', 'chaotic-online', 'chaotic_idleworld_v123.html');
if (fs.existsSync(idlePath)) {
const game = fs.readFileSync(idlePath, 'utf8');
const gi = game.indexOf('const SECTORS174 = [');
const gf = game.indexOf('\n    ];', gi);
const real = new Function('return [' + game.slice(game.indexOf('[', gi) + 1, gf) + '];')();
const want = real.map(s => s.id + ':' + s.x + ',' + s.y).join(' ');
check('setores = SECTORS174 do jogo', R.sectors === want, '\n  ed: ' + R.sectors + '\n  jg: ' + want);
} else { console.log('⏭ setores SECTORS174: pulado (sem clone chaotic-online)'); }
check('portão (1600,2290) + spawn (1600,1240)', R.gate === '1600,2290' && R.spawn === '1600,1240', R.gate + ' / ' + R.spawn);
check('serialize→deserialize idêntico', R.roundtrip);
check('rejeita JSON inválido', R.rejects);
check('keyToIdx bijetivo', R.idxRoundtrip);
console.log('\n' + ok + ' ✅  ' + fail + ' ❌');
process.exit(fail ? 1 : 0);
