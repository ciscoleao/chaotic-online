// Teste de regressão: tela branca do Pátio Central (lobby webp via Loader).
// Causa raiz: Phaser 3.60 recusa data: URI no Loader ("Local data URIs are
// not supported") e TRAVA a fila — create() nunca roda, canvas fica só com
// o backgroundColor (#e0e0e0) = tela branca. O fix carrega o webp via <img>
// do DOM + textures.addImage(), sem tocar no Loader.
// Uso: node test_lobby_fix.js
const fs = require('fs');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const path = require('path');
const ORIG = path.join(__dirname, '..', 'uploads', 'Chaotic_Online_Lobby_Teste.html');
const FIX = path.join(__dirname, '..', 'Chaotic_Online_Lobby_FIX.html');
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
};

const orig = fs.readFileSync(ORIG, 'utf8');
const fix = fs.readFileSync(FIX, 'utf8');
console.log('== bug reproduzido no original? ==');
ok(orig.includes('sc.load.image(TEXTURE, "data:image/webp;base64,'),
  'original usa sc.load.image(TEXTURE, data-URI) — o bug');

console.log('== fix aplicado? ==');
// 1. nenhuma chamada ao Loader fora do phaser minificado (1a linha gigante)
const lines = fix.split('\n');
const loaderCalls = [];
lines.forEach((ln, idx) => {
  if (idx === 29) return; // linha 30 = phaser minificado
  if (/\.load\.\w+\(/.test(ln)) loaderCalls.push(idx + 1);
});
ok(loaderCalls.length === 0, 'nenhum .load.* fora do Phaser', loaderCalls.slice(0, 5).join(','));
ok(!fix.includes('sc.load.image(TEXTURE'), 'sc.load.image(TEXTURE) removido');
// 2. mecanismo novo presente
ok(fix.includes('const BG_DATA_URI = "data:image/webp;base64,'), 'BG_DATA_URI presente');
ok(fix.includes('new Image()'), 'decodificação via new Image()');
ok(fix.includes('img.src = BG_DATA_URI'), 'img.src = BG_DATA_URI');
ok(fix.includes('textures.addImage(TEXTURE, img)'), 'registro via textures.addImage');
ok(fix.includes('lobbyBgReady.then(paintLobbyBg)'), 'pintura assíncrona no create');
ok(!fix.includes('if (!sc.scene.isActive()) return;'), 'sem guarda isActive (falsa durante create)') &&
  fix.includes('status da\n      // cena ainda eh CREATING'), 'comentario anti-regressao';
// 3. API pública intacta
ok(fix.includes('preload, create, update, drawMinimap'), 'api CentralLobby intacta');
ok(fix.includes('CentralLobby.preload(this)') && fix.includes('CentralLobby.create(this)') &&
  fix.includes('CentralLobby.update(this'), 'PorticoScene delega p/ CentralLobby');
// 4. fallback preservado
ok(fix.includes('O cenário não carregou. Recarregue a página'), 'fallback sem-cenário preservado');
// 5. arte byte-idêntica (só mudou o mecanismo, não a imagem)
const grab = (s) => (s.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/) || [])[1] || '';
const uOrig = grab(orig), uFix = grab(fix);
ok(uFix.length > 500000, 'data URI presente no fix', String(uFix.length));
const h = (s) => crypto.createHash('sha256').update(s).digest('hex');
ok(uFix !== uOrig && uOrig.length > 0 && uFix.length > 0, 'webp v2 (NPCs apagados via cirurgia)');
ok(h(uFix) === 'bfd466d69196bc96e57c8078b33c280637e8b0a2f10f2c0aae01559da668068b', 'hash do webp v2');
const bin = Buffer.from(uFix, 'base64');
ok(bin.slice(0, 4).toString() === 'RIFF' && bin.slice(8, 12).toString() === 'WEBP', 'magic RIFF/WEBP válido');
// 6. sintaxe do script central-lobby
const m = fix.match(/<script data-embedded="central-lobby">([\s\S]*?)<\/script>/);
ok(!!m, 'bloco central-lobby extraível');
if (m) {
  fs.writeFileSync('/tmp/cl_fix.js', m[1]);
  try { execFileSync('node', ['--check', '/tmp/cl_fix.js']); ok(true, 'node --check central-lobby OK'); }
  catch (e) { ok(false, 'node --check central-lobby OK', String(e.message).split('\n')[0]); }
}
// 7. fix continua sendo 1 arquivo único offline (sem <script src>)
const srcTags = (fix.match(/<script[^>]+src=/g) || []).length;
ok(srcTags === 0, 'nenhum <script src> (ainda 100% offline)', String(srcTags));

// 8. música do pátio (engine generativa + UI de volume)
ok(fix.includes('const LobbyMusic = {'), 'engine LobbyMusic presente');
ok(fix.includes('id="opt-music-vol"') && fix.includes('id="opt-music-mute"') && fix.includes('id="opt-music-pct"'), 'slider + mute + label no Opções');
ok(fix.includes('chaotic_music_vol') && fix.includes('chaotic_music_mute'), 'volume/mute persistidos');
ok(fix.includes("document.addEventListener('pointerdown', lobbyMusicKick)"), 'inicia no primeiro gesto (autoplay policy)');
ok(fix.includes('initLobbyMusic();'), 'initLobbyMusic chamado');
ok(fix.includes('startDrone'), 'drone contínuo (sem vai-e-vem)');
ok(fix.includes('melody: ['), 'frases melódicas (config)');
ok(fix.includes("t1: 'sawtooth'"), 'timbres saw analógicos (config)');
ok(fix.includes('MUSIC_TRACKS'), 'motor multi-faixa');
ok(fix.includes('time: 0.65'), 'eco vasto 0.65s (config)');
ok(['battle','tribe_overworld','tribe_underworld','tribe_danian','tribe_mipedian','tribe_marrillian'].every(id => fix.includes(id)), 'battle + 5 tribos');
ok(fix.includes('REGIAO_TRIBO'), 'mapa região→tribo');
ok(fix.includes('switchTrack') && fix.includes('musicWantedTrack'), 'troca automática por mapa');
ok(fix.includes('dromo-panel') && fix.includes("contains('open')"), 'preparação/batalha detectadas');
ok(fix.includes('drumStep'), 'bateria da batalha');
ok(fix.includes('let v = 40;'), 'volume padrão baixo (40)');
ok(fix.includes('now + 4)'), 'fade de entrada 4s (começa baixo)');
const blocks = [...fix.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]);
const main = blocks.find(b => b.includes('initLobbyMusic'));
ok(!!main, 'script principal extraível');
if (main) {
  fs.writeFileSync('/tmp/cl_main.js', main);
  try { execFileSync('node', ['--check', '/tmp/cl_main.js']); ok(true, 'node --check principal OK'); }
  catch (e) { ok(false, 'node --check principal OK', String(e.message).split('\n')[0]); }
}
console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
