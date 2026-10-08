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
ok(h(uFix) === '1be04c65ab8ea1d2076e8a9d3f3abcfa1a80e33f5acdb82366c8a87c32f2c663', 'hash do webp v4 (forja mockup v189)');
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
ok(fix.includes('music-hud'), 'indicador 🎵 no HUD');
ok(fix.includes('gainGuard'), 'watchdog de ganho');
ok(fix.includes('pendingTrack'), 'troca sem cancelamento (anti-dip-perpétuo)');
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
// 9. texturas procedurais: nenhuma chave usada sem ser criada (quadrados pretos)
ok(fix.includes('lanternTex(this);'), "lanternTex chamada (fix pontes v184)");
{
  const defAt = fix.indexOf('lanternTex(this);');
  const useAt = fix.indexOf("'lantern').setDepth(5.2)");
  ok(defAt > 0 && useAt > defAt, 'lantern criada ANTES do uso nas pontes');
}
{
  // auditoria genérica: toda *Tex usada em add.image/sprite precisa ser chamada
  const noPhaser = fix.split('\n').filter((_, i) => i !== 29).join('\n');
  const defs = {};
  const re = /function (\w+Tex)\(scene\) \{/g;
  let mm;
  while ((mm = re.exec(noPhaser))) {
    const km = noPhaser.slice(mm.index, mm.index + 400).match(/const key = '([^']+)'/);
    if (km) defs[mm[1]] = km[1];
  }
  const used = new Set();
  const reU = /add\.(?:image|sprite)\(([^\n]{0,200}?)\)/g;
  while ((mm = reU.exec(noPhaser))) {
    const parts = mm[1].split(',');
    if (parts.length >= 3) {
      const km = parts[2].trim().match(/^'([^']+)'$/);
      if (km) used.add(km[1]);
    }
  }
  for (const mm2 of noPhaser.matchAll(/setTexture\('([^']+)'/g)) used.add(mm2[1]);
  let bad = '';
  for (const [fn, key] of Object.entries(defs)) {
    if (!used.has(key)) continue; // função morta (ex.: auroraTex) — inofensiva
    const calls = noPhaser.split('\n').filter(l => new RegExp('\\b' + fn + '\\(\\s*\\w').test(l) && !l.includes('function')).length;
    if (calls === 0) bad += fn + ' ';
  }
  ok(bad === '', 'toda textura usada é criada', bad || `${Object.keys(defs).length} Tex auditadas`);
}
// §10 — v185: zoom inicial aproximado + música ativada de começo
ok(/fullMapMode\s*=\s*false/.test(fix), 'lobby começa aproximado (fullMapMode=false)');
{
  const i0 = fix.indexOf('function initLobbyMusic()'), i1 = fix.indexOf('initLobbyMusic();');
  ok(i0 > -1 && fix.slice(i0, i1).includes('lobbyMusicKick();'), 'initLobbyMusic tenta tocar já no carregamento');
}
{
  const k = fix.indexOf('function lobbyMusicKick()');
  ok(k > -1 && fix.slice(k, k + 400).includes("state === 'suspended') LobbyMusic.ctx.resume()"), 'kick retoma AudioContext dentro do gesto');
}
ok(fix.includes("(!LobbyMusic.started || (LobbyMusic.ctx && LobbyMusic.ctx.state === 'suspended'))") && fix.includes('_wasSusp'),
  'HUD suspenso + refresh ao liberar o som');
// §11 — v186: sem 'Ver pátio' no HUD + NPC só no [E]
ok(!fix.includes("mapButton.id = 'lobby-map-button'"), "botão 'Ver pátio' removido do HUD normal");
ok(fix.includes('foto-map150') && fix.includes('toggleMapView'), 'visão ampla mora no Modo Foto (🗺️)');
ok(!fix.includes('openService(sc, r.service)') && !fix.includes("event.stopPropagation(); it.action();"),
  'NPC/setores sem clique (só [E])');
ok(!fix.includes("spriteM.on('pointerdown'") && !fix.includes('_lobbyNearest) sc._lobbyNearest.action()'),
  'MASTER e balão sem clique');
ok((fix.match(/addKey\('E'\)/g) || []).length >= 2 && fix.includes('JustDown(sc.interactKey)') && fix.includes('JustDown(this.interactKey)'),
  'tecla E intacta (Pátio + tribo)');
ok(fix.includes("sc.input.on('pointerdown', moveTo)") && fix.includes('function mobileActionTap'),
  'clique-anda e botão 👆 (mobile) intactos');
// §12 — v187: rebuild do Pátio (simula o modelo de colisão real do FIX)
{
  const span = (a, b) => { const i = fix.indexOf(a); return fix.slice(i, fix.indexOf(b, i)); };
  const src = span('const WIDTH = 1200, HEIGHT = 900, CELL = 12;', 'function sliceForeground')
    + '\n' + span('const rectContains', 'function wallRects');
  const extras = [...fix.matchAll(/x: wx\((\d+)\), y: wy\((\d+)\) - sc\._lobbyFootOffset/g)].map(m => [+m[1], +m[2]]);
  const driver = ";const PTS = SECTORS.map(z => [z.id, z.point]).concat([['saida', EXIT.point]]).concat(__EXTRAS__.map((p, i) => ['extra' + i, p]));"
    + ";const out = { walk: [], unreach: [], corrMin: Math.min(...CORRIDORS.map(c => c[4])), nObs: OBSTACLES.length, nOcc: OCCLUDERS.length,"
    + " occOut: OCCLUDERS.filter(o => o[1] < 0 || o[2] < 0 || o[1] + o[3] > WIDTH || o[2] + o[4] > HEIGHT).map(o => o[0]) };"
    + ";for (const [id, pt] of PTS) { if (!isWalkable(pt[0], pt[1])) out.walk.push(id); else if (!findPath([600, 447], pt).length) out.unreach.push(id); }"
    + ";out.spawnWalk = isWalkable(600, 447); out.nPts = PTS.length; return JSON.stringify(out);"
  let sim = null, simErr = '';
  try { sim = JSON.parse(new Function(src + driver.replace('__EXTRAS__', JSON.stringify(extras)))()); }
  catch (e) { simErr = String(e).slice(0, 90); }
  ok(!!sim, 'simulação de colisão extraída do FIX', simErr || (sim ? sim.nPts + ' pontos' : ''));
  if (sim) {
    ok(sim.spawnWalk, 'spawn andável');
    ok(sim.walk.length === 0, 'todos os pontos andáveis', sim.walk.join(',') || '12/12');
    ok(sim.unreach.length === 0, 'todos os pontos alcançáveis do spawn (BFS)', sim.unreach.join(',') || '12/12');
    ok(sim.corrMin >= 36, 'corredores com largura física', 'min=' + sim.corrMin);
    ok(sim.nObs >= 60 && sim.nOcc >= 50 && sim.occOut.length === 0, 'rebuild: obstáculos + occluders íntegros', sim.nObs + ' obs, ' + sim.nOcc + ' occ');
  }
  ok(fix.includes("addKey('F9')") && fix.includes('toggleCollisionDebug') && fix.includes('_colDbg'), 'overlay de colisão F9');
}
console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
