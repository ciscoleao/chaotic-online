// Teste da lógica pura: pixel-art RLE, anúncios, scans e quarto.
// Uso: node test_lobby_meta.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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
fs.writeFileSync('/tmp/cl_meta.js', m[1]);
try { execFileSync('node', ['--check', '/tmp/cl_meta.js']); }
catch (e) { console.log('❌ node --check falhou'); process.exit(1); }
const L = require('/tmp/cl_meta.js');

const memStore = () => {
  const o = {};
  return { getItem: k => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: k => { delete o[k]; } };
};
// decodificador espelho do lobbySpriteCanvas
function decode(def) {
  const re = /(\d+)(\.|[a-z])/g;
  let m2, x = 0, y = 0, count = 0;
  while ((m2 = re.exec(def.data)) !== null) {
    let n = parseInt(m2[1], 10);
    const ch = m2[2];
    if (ch !== '.') {
      const idx = ch.charCodeAt(0) - 97;
      if (idx < 0 || idx >= def.palette.length) return { badLetter: ch };
    }
    while (n-- > 0) {
      if (y >= def.h) return { overflow: true };
      if (ch !== '.') count++;
      x++; if (x >= def.w) { x = 0; y++; }
    }
  }
  return { count, filled: y === def.h, total: def.w * def.h };
}

console.log('== pixel-art RLE ==');
const spriteKeys = Object.keys(L.LOBBY_SPRITES);
ok(spriteKeys.length === 12, `12 sprites (achado: ${spriteKeys.length})`);
ok(spriteKeys.includes('lobby_bot') && spriteKeys.includes('lobby_drone') && spriteKeys.includes('lobby_drone_side') && spriteKeys.includes('lobby_drone_back'), 'robô + 3 drones presentes');
let artOk = true;
for (const k of spriteKeys) {
  const r = decode(L.LOBBY_SPRITES[k]);
  if (r.badLetter || r.overflow || !r.filled || !(r.count > 80) || !(r.count < r.total)) {
    artOk = false; console.log('    sprite ruim:', k, JSON.stringify(r));
  }
}
ok(artOk, 'todos decodificam, preenchem o canvas e têm fundo transparente');
ok(L.LOBBY_SPRITES.lobby_bot.w === 48 && L.LOBBY_SPRITES.lobby_bot.h === 56, 'robô HD 48x56');
ok(L.LOBBY_SPRITES.lobby_drone.w === 48 && L.LOBBY_SPRITES.lobby_drone.h === 60, 'drone cartoon 48x60');
ok(fix.includes('BOT_SCALE = 1.4') && fix.includes('DRONE_SCALE = 1.1'), 'escalas HD (mesmo tamanho, 4x texels)');
ok(fix.includes("fontSize: '26px'") && !fix.includes("'🤖 ' + r.name"), 'etiquetas 26px sem emoji');

console.log('== anúncios ==');
ok(L.ANNOUNCE_COST === 25, 'custo 25 BITS');
let s = memStore();
ok(L.adsList(s).length === 2, 'loja vazia -> 2 sementes');
let r = L.adsPublish(s, 'Zé', 'Vendo poção rara!', 100);
ok(r.ok && r.bits === 75 && r.entry.text === 'Vendo poção rara!', 'publica e desconta (100->75)');
ok(L.adsList(s).length === 3 && L.adsList(s)[0].name === 'Zé', 'anúncio no topo da lista');
ok(!L.adsPublish(s, 'Zé', 'Oi', 10).ok, 'sem BITS -> rejeita');
ok(!L.adsPublish(s, 'Zé', 'x', 100).ok, 'curto demais -> rejeita');
ok(!L.adsPublish(s, 'Zé', 'a'.repeat(91), 100).ok, 'longo demais -> rejeita');
ok(L.adsPublish(s, 'Zé', 'a'.repeat(90), 100).ok, '90 chars -> aceita');
ok(L.adsPublish(memStore(), undefined, 'sem nome', 100).entry.name === 'Caçador', 'nome padrão Caçador');
s = memStore();
for (let i = 0; i < 25; i++) L.adsPublish(s, 'S', 'msg ' + i, 99999);
ok(L.adsList(s).length === 20, 'teto de 20 anúncios');
s = memStore(); s.setItem('chaotic_ads_v1', '{{{corrompido');
ok(L.adsList(s).length === 2, 'dado corrompido -> volta às sementes');

console.log('== scans ==');
ok(L.SCAN_SECTORS.length === 8, '8 setores escaneáveis');
s = memStore();
ok(Object.keys(L.scansGet(s)).length === 0, 'começa vazio');
r = L.scansCollect(s, 'roleta');
ok(r.isNew && r.count === 1, 'primeira coleta conta');
ok(!L.scansCollect(s, 'roleta').isNew, 'repetida não conta');
ok(!L.scansCollect(s, 'xyz').isNew, 'id inválido ignorado');
L.SCAN_SECTORS.forEach(id => L.scansCollect(s, id));
ok(L.scansCollect(s, 'shop').count === 8, 'álbum completa 8/8');
ok(Object.keys(L.scansGet(s)).length === 8, 'persiste no store');

console.log('== quarto ==');
ok(L.ROOM_DEFAULTS.length === 8, '8 móveis padrão');
ok(new Set(L.ROOM_DEFAULTS.map(o => o.id)).size === 8, 'ids únicos');
ok(L.ROOM_DEFAULTS.every(o => L.ROOM_ITEMS[o.id]), 'todos com definição');
ok(L.ROOM_BOUNDS.x0 < L.ROOM_BOUNDS.x1 && L.ROOM_BOUNDS.y0 < L.ROOM_BOUNDS.y1, 'limites sãos');
s = memStore();
ok(L.roomLoad(s).length === 8, 'loja vazia -> layout padrão');
const dirty = L.roomSanitize([{ id: 'cama', x: -999, y: 9999 }, { id: 'invalido', x: 1, y: 1 }, { id: 'bau', x: NaN, y: NaN }]);
ok(dirty.length === 8 && !dirty.find(o => o.id === 'invalido'), 'remove id inválido e completa 8');
const cama = dirty.find(o => o.id === 'cama');
ok(cama.x === L.ROOM_BOUNDS.x0 + L.ROOM_ITEMS.cama.foot[0] / 2 && cama.y === L.ROOM_BOUNDS.y1, 'fora da sala -> prende nos limites');
ok(dirty.every(o => isFinite(o.x) && isFinite(o.y)), 'NaN -> vira número finito');
s = memStore();
L.roomSave(s, [{ id: 'cama', x: 500, y: 500 }]);
const back = L.roomLoad(s).find(o => o.id === 'cama');
ok(back && back.x === 500 && back.y === 500, 'salva e recarrega posição');
ok(typeof L.quartoSceneClass === 'function', 'fábrica da cena do quarto exportada');

console.log('== fiação quarto/letreiro ==');
ok(fix.includes('room-controls') && fix.includes('Arrumar quarto'), 'botões do quarto');
ok(fix.includes('lobby-ticker') && fix.includes('lobbyTick'), 'letreiro marquee');
ok(fix.includes('Álbum de scans'), 'painel de scans');
ok(fix.includes('quartoRegistered'), 'registro único da cena');

console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
