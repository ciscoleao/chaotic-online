// Teste funcional v2 — profundidade/colisão/atores do Pátio Central.
// Valida: conectividade, móveis bloqueando, pontos andáveis, 65 oclusores,
// Y-sort, rotas dos drones, robôs, e a fiação (spawns, quarto, comunicacao).
// Uso: node test_lobby_depth.js
const fs = require('fs');
const { execFileSync } = require('child_process');

const path = require('path');
const FIX = path.join(__dirname, '..', 'Chaotic_Online_Lobby_FIX.html');
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
};

global.Image = class { set src(v) { /* noop */ } };
global.window = undefined;

const fix = fs.readFileSync(FIX, 'utf8');
const m = fix.match(/<script data-embedded="central-lobby">([\s\S]*?)<\/script>/);
if (!m) { console.log('❌ bloco central-lobby não achado'); process.exit(1); }
fs.writeFileSync('/tmp/cl_depth.js', m[1]);
try { execFileSync('node', ['--check', '/tmp/cl_depth.js']); }
catch (e) { console.log('❌ node --check falhou'); process.exit(1); }
const L = require('/tmp/cl_depth.js');
console.log('== bloco carregado: GRID ' + L.GRID.cols + 'x' + L.GRID.rows + ' ==');

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const SPAWN = [600, 447];

console.log('== conectividade (spawn -> destino tem rota válida?) ==');
const targets = L.SECTORS.map(z => [z.id, z.point])
  .concat([['saida', L.EXIT.point], ['costura', [200, 500]], ['bebidas', [1020, 252]], ['quarto', [843, 722]], ['punch', [540, 665]], ['dep-door', [388, 652]], ['forge-recess', [350, 460]], ['shop-ramp', [869, 270]]]);
for (const [id, pt] of targets) {
  const path = L.findPath(SPAWN, pt);
  const end = path.length ? path[path.length - 1] : null;
  const good = path.length > 0 && end && dist(end, pt) < 90;
  ok(good, `rota spawn -> ${id}`, `passos=${path.length}` + (end ? ` fim=(${end.map(Math.round)})` : ' SEM ROTA'));
}

console.log('== móveis bloqueiam (centro do móvel = não-andável) ==');
const blocked = [
  ['roleta', [216, 153]], ['shop-counter', [969, 150]], ['shop-table', [898, 220]],
  ['shop-crates', [1041, 220]], ['shop-displays', [973, 175]], ['shop-shelf', [867, 175]],
  ['portal-pillar-l', [557, 150]], ['portal-pillar-r', [645, 150]],
  ['forge', [215, 400]], ['forge-shelves-low', [235, 450]], ['forge-counter', [170, 500]],
  ['leilao-desk', [988, 440]], ['holo', [978, 746]], ['missoes-board', [600, 687]],
  ['bench-seat-nl', [545, 301]], ['bench-seat-nr', [673, 301]],
  ['bench-seat-sl', [535, 617]], ['bench-seat-sr', [665, 617]],
  ['bench-lamp-sl', [503, 614]], ['bench-lamp-sr', [697, 614]],
  ['deposito-craft', [311, 733]], ['comms-desk-l', [895, 708]], ['comms-desk-r', [1069, 708]],
  ['plant-nl', [424, 391]], ['plant-nr', [778, 391]], ['plant-sl', [424, 498]], ['plant-sr', [778, 498]],
  ['tree-nl', [385, 252]], ['tree-nr', [831, 252]], ['tree-sl', [362, 604]], ['tree-sr', [840, 604]],
  ['torch-nl', [466, 326]], ['torch-nr', [737, 306]], ['lamp-sl', [486, 570]], ['lamp-sr', [714, 570]],
  ['leilao-back', [967, 417]], ['missoes-col-w', [523, 719]], ['missoes-col-e', [677, 719]],
  ['banner-pole-w', [492, 688]], ['banner-pole-e', [708, 688]],
  ['mastro-base-w', [392, 362]], ['mastro-base-e', [808, 362]],
  ['door-post', [342, 490]],
  ['vaso-pot-nl', [382, 231]], ['vaso-pot-nr', [818, 231]],
];
for (const [id, pt] of blocked) ok(!L.isWalkable(pt[0], pt[1]), `bloqueado: ${id}`);

console.log('== pontos-chave andáveis ==');
const open = [
  ['spawn', SPAWN], ['forge-approach', [280, 530]], ['costura', [200, 500]],
  ['leilao-door', [875, 447]], ['deposito-entry', [392, 644]], ['comms-entry', [830, 690]],
  ['roleta-front', [260, 240]], ['shop-front', [982, 212]], ['forja-front', [245, 484]],
  ['leilao-front', [977, 505]], ['deposito-front', [280, 772]], ['missoes-front', [600, 756]],
  ['comms-front', [958, 786]], ['portal-front', [600, 203]], ['bebidas', [1020, 252]],
  ['quarto', [843, 722]], ['stairs-s', [615, 540]], ['stairs-n', [608, 255]],
  ['plaza-w', [480, 447]], ['ring-n', [600, 250]], ['exit', [600, 852]],
  ['punch-n', [600, 600]], ['punch-mid', [540, 665]], ['punch-s', [503, 728]],
  ['recess', [350, 460]], ['slot-e', [712, 745]], ['detour-w', [510, 745]], ['comms-s', [810, 660]],
  ['torch-e-road', [812, 318]], ['door-mid', [356, 470]],
];
for (const [id, pt] of open) ok(L.isWalkable(pt[0], pt[1]), `andável: ${id}`);

console.log('== oclusores + Y-sort ==');
ok(Array.isArray(L.OCCLUDERS) && L.OCCLUDERS.length === 65, `65 oclusores (achado: ${L.OCCLUDERS.length})`);
let inBounds = true; const keys = new Set();
for (const [k, x, y, w, h] of L.OCCLUDERS) {
  keys.add(k);
  if (!(x >= 0 && y >= 0 && x + w <= 1200 && y + h <= 900)) { inBounds = false; console.log('    fora:', k); }
  const sx = x / 1200 * 1448, sy = y / 900 * 1086;
  if (!(sx >= 0 && sy >= 0 && sx + w / 1200 * 1448 <= 1448 && sy + h / 900 * 1086 <= 1086)) inBounds = false;
}
ok(inBounds, 'todos dentro de 1200x900 e do webp 1448x1086');
ok(keys.size === L.OCCLUDERS.length, 'chaves únicas');
ok(keys.has('anel-mastro-e') && keys.has('anel-mastro-d') && !keys.has('missoes-sign-w') && !keys.has('missoes-sign-e'), 'tochas novas + letreiro sem oclusor (heroi visivel no patamar)');
const d = L.depthForRefY;
ok(d(0) === 5 && d(900) === 9 && d(100) < d(800), 'depthForRefY: 5 (topo) -> 9 (base)');
ok(fix.includes('p.setDepth(depthForRefY((p.y + sc._lobbyFootOffset) / sc._lobbyScale));'), 'Y-sort do herói no update');
ok(fix.includes("sc.textures.addCanvas(tkey, c)"), 'fatias via addCanvas');
ok(!fix.includes('sc.load.image(TEXTURE'), 'sem Loader (fix original preservado)');

console.log('== drones (waypoints + trajetos sobre chão andável) ==');
ok(Array.isArray(L.DRONE_PATHS) && L.DRONE_PATHS.length === 3, `3 rotas (achado: ${L.DRONE_PATHS.length})`);
L.DRONE_PATHS.forEach((path, i) => {
  let wpOk = true;
  path.forEach(w => { if (!L.isWalkable(w[0], w[1])) { wpOk = false; console.log(`    drone${i} wp fora: ${w}`); } });
  ok(wpOk, `drone${i}: ${path.length} waypoints andáveis`);
  let segOk = true;
  for (let k = 0; k < path.length; k++) {
    const a = path[k], b = path[(k + 1) % path.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= len; t += 25) {
      const x = a[0] + (b[0] - a[0]) * (t / len), y = a[1] + (b[1] - a[1]) * (t / len);
      if (!L.isWalkable(x, y)) { segOk = false; console.log(`    drone${i} trecho fora: (${Math.round(x)},${Math.round(y)})`); }
    }
  }
  ok(segOk, `drone${i}: trajetos 100% andáveis`);
});
ok(fix.includes('updateDrones(sc, time, delta);'), 'updateDrones chamado no update');

console.log('== robôs + fiação ==');
ok(Array.isArray(L.ROBOTS) && L.ROBOTS.length === 13, `13 robôs (achado: ${L.ROBOTS.length})`);
const rids = new Set(L.ROBOTS.map(r => r.id));
ok(rids.size === 13, 'robôs com ids únicos');
let rbOk = true;
const validServices = ['roleta', 'portal', 'shop', 'forja', 'leilao', 'deposito', 'missoes', 'comunicacao', 'quarto'];
for (const r of L.ROBOTS) {
  if (!(r.x > 0 && r.y > 0 && r.x < 1200 && r.y < 900 && r.name && validServices.includes(r.service))) {
    rbOk = false; console.log('    robô inválido:', JSON.stringify(r));
  }
}
ok(rbOk, 'robôs dentro do mapa com nome + serviço válido');
const cover = { caixa: [978, 178], croupier: [220, 126], vip: [313, 144], leiloeiro: [982, 450], forja: [312, 438] };
let coverOk = true;
for (const [id, pt] of Object.entries(cover)) {
  const r = L.ROBOTS.find(r => r.id === (id === 'forja' ? 'forja' : id));
  if (!r || r.x !== pt[0] || r.y !== pt[1]) { coverOk = false; console.log('    cobertura ruim:', id); }
}
ok(coverOk, '5 robôs de cobertura sobre as áreas apagadas');
ok(fix.includes("id: 'quarto'") && fix.includes("teleportRoom(sc)"), 'interagível + teleporte do quarto');
ok(fix.includes('spawnRobots(sc, wx, wy);') && fix.includes('spawnDrones(sc, wx, wy);'), 'spawns no create');
ok(fix.includes('buildTicker();'), 'letreiro criado no create');
ok(fix.includes("else if (id === 'comunicacao') openCommsMenu(sc);"), 'comunicação abre o menu');
ok(fix.includes('collectScanFor(id);'), 'coleta de scan no openService');
ok(fix.includes("'comms-menu', 'ads-panel', 'scans-panel'"), 'paineis bloqueiam movimento');
ok(fix.includes('QuartoScene') && fix.includes("scene.start('PorticoScene')"), 'cena do quarto + volta');

console.log('== passagens (faixas + setas + farois) ==');
ok(Array.isArray(L.PASSAGE_STRIPS) && L.PASSAGE_STRIPS.length === 22, `22 faixas (achado: ${L.PASSAGE_STRIPS.length})`);
let stripOk = true;
for (const [x1, y1, x2, y2, w] of L.PASSAGE_STRIPS) {
  if (!(x1 >= 0 && y1 >= 0 && x2 >= 0 && y2 >= 0 && x1 <= 1200 && x2 <= 1200 && y1 <= 900 && y2 <= 900 && w > 0)) {
    stripOk = false; console.log('    faixa ruim:', JSON.stringify([x1, y1, x2, y2, w]));
  }
}
ok(stripOk, 'faixas dentro do mapa com largura > 0');
ok(Array.isArray(L.CHEVRON_RUNS) && L.CHEVRON_RUNS.length === 9, `9 corridas de setas (achado: ${L.CHEVRON_RUNS.length})`);
let chevOk = true, chevEnd = true;
for (const [x1, y1, x2, y2, color] of L.CHEVRON_RUNS) {
  const len = Math.hypot(x2 - x1, y2 - y1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  if (!(len >= 30 && L.isWalkable(mx, my) && typeof color === 'number')) { chevOk = false; console.log('    setas ruins:', x1, y1, x2, y2); }
  if (!(L.isWalkable(x1, y1) && L.isWalkable(x2, y2))) { chevEnd = false; console.log('    ponta fora:', x1, y1, x2, y2); }
}
ok(chevOk, 'setas em segmentos >= 30px com meio andavel');
ok(chevEnd, 'pontas das setas em chao andavel');
ok(Array.isArray(L.BEACONS) && L.BEACONS.length === 11, `11 farois (achado: ${L.BEACONS.length})`);
const dests = L.SECTORS.map(z => z.point).concat([L.EXIT.point, [843, 722], [388, 652], [340, 447]]);
let becOk = true, becNear = true;
for (const [bx, by, br] of L.BEACONS) {
  if (!L.isWalkable(bx, by)) { becOk = false; console.log('    farol em chao bloqueado:', bx, by); }
  if (!dests.some(pt => Math.hypot(pt[0] - bx, pt[1] - by) <= 40)) { becNear = false; console.log('    farol longe do destino:', bx, by); }
  if (!(br >= 10 && br <= 20)) { becOk = false; console.log('    farol com raio estranho:', bx, by, br); }
}
ok(becOk, 'farois em chao andavel com raio 10-20');
ok(becNear, 'cada farol a <=40px de um destino');
ok(fix.includes('spawnPassages(sc, wx, wy);'), 'spawnPassages no create');
ok(fix.includes('updatePassages(sc, time);'), 'updatePassages no update');
ok(fix.includes('sc._passChev'), 'camada de setas animadas');
let depOk = [[382, 710], [382, 740], [382, 770]].every(([x, y]) => L.isWalkable(x, y));
ok(depOk, 'corredor leste do deposito continuo (sinalizado pela faixa fina)');

console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
