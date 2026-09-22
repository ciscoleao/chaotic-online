// Harness: executa lobby_music_snippet.js com WebAudio/DOM falsos e valida tudo.
// Cobre: UI/volume, 7 faixas, troca por mapa, bateria, vento, lab de teste.
// Uso: node test_music_harness.js
const fs = require('fs');
const path = require('path');
const SNIPPET = path.join(__dirname, 'lobby_music_snippet.js');
const LAB = path.join(__dirname, '..', 'Testar_Musicas.html');
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
};

// ---------- stubs ----------
const oscStarts = [];
function fakeParam() {
  return {
    value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {},
    setTargetAtTime(v) { this.value = v; },
    cancelScheduledValues() {}, linearRampToValueAtTime(v) { this.value = v; }
  };
}
function fakeOsc() {
  return {
    type: '', frequency: fakeParam(), detune: fakeParam(),
    connect() {}, start() { oscStarts.push(1); }, stop() {}
  };
}
function fakeGain() { return { gain: fakeParam(), connect() {} }; }
class FakeAC {
  constructor() {
    this.currentTime = 100; this.state = 'running'; this.destination = {};
    this.sampleRate = 44100;
  }
  createGain() { return fakeGain(); }
  createOscillator() { return fakeOsc(); }
  createDelay() { return { delayTime: fakeParam(), connect() {} }; }
  createBiquadFilter() { return { type: '', frequency: fakeParam(), connect() {} }; }
  createBuffer() { return { getChannelData: () => new Float32Array(44100) }; }
  createBufferSource() { return { buffer: null, loop: false, connect() {}, start() {}, stop() {} }; }
  resume() { this.state = 'running'; }
}
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); }
};
const els = {};
function fakeEl(id) {
  if (!els[id]) {
    const classes = new Set();
    els[id] = {
      id, value: '', textContent: '', listeners: {},
      addEventListener(ev, fn) { this.listeners[ev] = fn; },
      classList: {
        add: c => classes.add(c), remove: c => { classes.delete(c); },
        contains: c => classes.has(c)
      }
    };
  }
  return els[id];
}
const docListeners = {};
global.document = {
  getElementById: id => fakeEl(id),
  addEventListener: (ev, fn) => { docListeners[ev] = fn; }
};
global.window = { AudioContext: FakeAC };
let testLoc = 'portico';
global.mapaAtual154 = () => testLoc;
const notifs = [];
global.showNotif = (t, ty) => notifs.push([t, ty]);
const bound = {};
global.bindImmediateButton = (id, fn) => { bound[id] = fn; };

// ---------- executa o snippet ----------
const src = fs.readFileSync(SNIPPET, 'utf8');
eval(src + '\n;global.__LM = { LobbyMusic, MUSIC_TRACKS, REGIAO_TRIBO, musicWantedTrack };');
const LM = global.__LM.LobbyMusic;
const TRACKS = global.__LM.MUSIC_TRACKS;
const wanted = global.__LM.musicWantedTrack;
function mulberry32(a) {
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(20260717);
const calls = { melody: 0, arp: 0, bass: 0, bell: 0, kick: 0, snare: 0, hat: 0, tom: 0 };
const wrapKey = { melodyNote: 'melody', arpNote: 'arp', bassNote: 'bass', bell: 'bell', kick: 'kick', snare: 'snare', hat: 'hat', tom: 'tom' };
for (const k of Object.keys(wrapKey)) {
  const orig = LM[k].bind(LM);
  const key = wrapKey[k];
  LM[k] = (f, t) => { calls[key]++; orig(f, t); };
}

// ---------- UI/volume (igual antes) ----------
ok(typeof LM === 'object', 'LobbyMusic definido');
ok(LM.vol === 40 && LM.muted === false, 'defaults vol=40 (começa baixo), unmuted');
ok(els['opt-music-vol'].value === '40', 'slider inicia em 40');
ok(els['opt-music-pct'].textContent === '40%', 'label 40%');
ok(els['opt-music-mute'].textContent === '🔊', 'botão 🔊');
ok(typeof docListeners.pointerdown === 'function' && typeof docListeners.keydown === 'function', 'kick no pointerdown+keydown');
ok(typeof bound['opt-music-mute'] === 'function', 'mute ligado via bindImmediateButton');
els['opt-music-vol'].value = '25';
els['opt-music-vol'].listeners.input();
ok(LM.vol === 25, 'slider ajusta vol');
ok(store.chaotic_music_vol === '25', 'vol persistido');
ok(els['opt-music-pct'].textContent === '25%', 'label atualiza');
bound['opt-music-mute']();
ok(LM.muted === true && store.chaotic_music_mute === '1', 'mute liga + persiste');
ok(els['opt-music-mute'].textContent === '🔇' && els['opt-music-pct'].textContent === '0%', 'UI muted');
bound['opt-music-mute']();
ok(LM.muted === false, 'mute desliga');
ok(LM.started === true, 'primeiro mute-off deu kick (started)');
ok(Math.abs(LM.musicBus.gain.value - Math.pow(0.25, 1.5) * 0.6) < 1e-9, 'ganho = curva perceptiva');
LM.muted = true; LM.applyVol();
ok(LM.musicBus.gain.value === 0, 'mute zera ganho');
LM.muted = false; LM.applyVol();
ok(notifs.length === 1 && /Opções/.test(notifs[0][0]), 'notifica 1x sobre Opções');

// ---------- 7 faixas: estrutura válida ----------
const IDS = ['patio', 'battle', 'tribe_overworld', 'tribe_underworld', 'tribe_danian', 'tribe_mipedian', 'tribe_marrillian'];
ok(IDS.every(id => !!TRACKS[id]), '7 faixas definidas', Object.keys(TRACKS).join(','));
{
  let bad = '';
  for (const id of IDS) {
    const c = TRACKS[id];
    if (!c.chords || c.chords.length !== 4 || !c.chords.every(ch => ch.length === 5 && ch.every(f => f > 30 && f < 2000))) bad += id + ':chords ';
    if (!c.melody || c.melody.length !== 4 || !c.melody.every(m => m.every(([o, f]) => o >= 0 && o < c.chordDur && f > 30 && f < 2000))) bad += id + ':melody ';
    if (!Array.isArray(c.bells) || !c.bells.every(f => f > 30 && f < 2000)) bad += id + ':bells ';
    if (!['sawtooth', 'triangle', 'square', 'sine'].includes(c.pad.t1)) bad += id + ':pad ';
    if (!['sawtooth', 'triangle', 'square', 'sine'].includes(c.lead.t1)) bad += id + ':lead ';
    if (!Array.isArray(c.drone) || !c.drone.length) bad += id + ':drone ';
    if (c.melodyRepeat && !c.melodyRepeat.every(o => o >= 0 && o < c.chordDur)) bad += id + ':repeat ';
  }
  ok(bad === '', 'acordes/melodia/sinos/timbres válidos nas 7 faixas', bad);
}
{
  let bad = '';
  for (const id of IDS) {
    const d = TRACKS[id].drums;
    if (!d) continue;
    for (const k of ['kick', 'snare', 'hat', 'tom']) {
      if (typeof d[k] !== 'string' || d[k].length !== d.steps || /[^x.]/.test(d[k])) bad += id + ':' + k + ' ';
    }
    if (!(d.step > 0) || Math.abs(d.step * d.steps - TRACKS[id].chordDur) > 1e-6) bad += id + ':grid ';
  }
  ok(bad === '', 'baterias: padrões no tamanho da grade (battle 64, under 48)', bad);
}
ok((TRACKS.battle.drums.kick.match(/x/g) || []).length === 16, 'battle: bumbo 4-no-chão (16x)');
ok((TRACKS.battle.drums.snare.match(/x/g) || []).length === 8, 'battle: caixa 2e4 (8x)');
ok(TRACKS.tribe_underworld.drums.snare.indexOf('x') === -1, 'underworld: sem caixa (só doom)');

// ---------- seletor por mapa ----------
{
  const panel = fakeEl('dromo-panel'), ov = fakeEl('dromo-game-overlay');
  panel.classList.remove('open'); ov.classList.remove('open');
  const cases = [
    ['portico', 'patio'], ['drome', 'patio'], ['cave', 'patio'], ['exterior', 'patio'],
    ['ow_grove', 'tribe_overworld'], ['meadow', 'tribe_overworld'], ['forest', 'tribe_overworld'],
    ['uw_ember', 'tribe_underworld'], ['lava_cave', 'tribe_underworld'], ['mountain', 'tribe_underworld'],
    ['dan_hive', 'tribe_danian'], ['swamp', 'tribe_danian'], ['void_rim', 'tribe_danian'],
    ['mip_oasis', 'tribe_mipedian'], ['time_ruins', 'tribe_mipedian'], ['mp_mirage', 'tribe_mipedian'],
    ['lac_black', 'tribe_marrillian'], ['mapa_desconhecido', 'patio']
  ];
  let bad = '';
  for (const [loc, want] of cases) { testLoc = loc; if (wanted() !== want) bad += loc + ' '; }
  ok(bad === '', 'mapa→faixa (18 casos)', bad);
  testLoc = 'ow_grove';
  panel.classList.add('open');
  ok(wanted() === 'battle', 'sala de preparação → battle');
  panel.classList.remove('open'); ov.classList.add('open');
  ok(wanted() === 'battle', 'overlay da batalha → battle');
  ov.classList.remove('open');
  ok(wanted() === 'tribe_overworld', 'fechou → volta p/ faixa do mapa');
}

// ---------- simulação 40s no pátio ----------
const before = oscStarts.length;
for (let s = 0; s < 40; s++) { LM.ctx.currentTime += 1; LM.tick(); }
const scheduled = oscStarts.length - before;
ok(LM.chordStep === 6, 'acordes avançam (6 em 40s)', 'chordStep=' + LM.chordStep);
ok(scheduled >= 115 && scheduled < 170, 'vozes agendadas (115..170 starts)', 'starts=' + scheduled);
ok(calls.melody === 12, 'solo: 12 notas', 'melody=' + calls.melody);
ok(calls.arp === 24, 'arpejo: 4 notas x 6 acordes', 'arp=' + calls.arp);
ok(calls.bass === 6, 'baixo: 1 pulso por acorde', 'bass=' + calls.bass);
ok(calls.bell >= 3 && calls.bell <= 10, 'pings: 3 da abertura + raros', 'bells=' + calls.bell);
ok(LM.droneNodes.length === 2, 'drone do pátio (2 oscs)');
ok(LM.windNodes === null, 'pátio sem vento');

// ---------- troca de faixa + bateria + vento (async) ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  LM.DIP_MS = 10;
  for (const k of Object.keys(calls)) calls[k] = 0;
  LM.switchTrack('battle');
  await sleep(60);
  ok(LM.trackId === 'battle' && LM.cfg.name === 'Batalha de Dromo', 'switchTrack adota battle');
  ok(Math.abs(LM.dly.delayTime.value - 0.32) < 1e-9, 'eco adotado (0.32s)');
  for (let s = 0; s < 8; s++) { LM.ctx.currentTime += 1; LM.tick(); }
  ok(calls.kick >= 12 && calls.snare >= 6 && calls.hat >= 24 && calls.tom >= 1,
    'bateria toca (bumbo/caixa/chimbal/tom)', `k=${calls.kick} s=${calls.snare} h=${calls.hat} t=${calls.tom}`);
  ok(calls.bass >= 30, 'baixo dobrado da batalha (>=30)', 'bass=' + calls.bass);
  ok(calls.melody >= 30, 'riff repetido 4x/acorde (>=30)', 'melody=' + calls.melody);
  ok(LM.droneNodes.length === 1, 'drone da batalha (1 osc Mi)');

  for (const k of Object.keys(calls)) calls[k] = 0;
  LM.switchTrack('tribe_underworld');
  await sleep(60);
  for (let s = 0; s < 8; s++) { LM.ctx.currentTime += 1; LM.tick(); }
  ok(calls.kick > 0 && calls.tom > 0 && calls.snare === 0 && calls.hat === 0,
    'doom tribal: bumbo+tom, sem caixa/chimbal', `k=${calls.kick} t=${calls.tom}`);

  LM.switchTrack('tribe_mipedian');
  await sleep(60);
  ok(LM.windNodes && LM.windNodes.length === 2, 'vento do deserto ligado');
  LM.switchTrack('patio');
  await sleep(60);
  ok(LM.windNodes === null, 'vento desliga ao sair do deserto');
  ok(LM.trackId === 'patio', 'volta ao pátio');

  // ---------- lab de teste ----------
  const lab = fs.readFileSync(LAB, 'utf8');
  ok(lab.includes('MUSIC_TRACKS'), 'lab embute o motor');
  ok(IDS.every(id => lab.includes('data-track="' + id + '"')), 'lab: 7 botões de faixa');
  ok(lab.includes('id="opt-music-vol"') && lab.includes('id="opt-music-mute"'), 'lab: volume do motor reaproveitado');
  ok(lab.includes('LobbyMusic.manual = true'), 'lab: modo manual (sem sonda)');

  clearInterval(LM.timer); clearInterval(LM.watchTimer);
  console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS CRASH:', e); process.exit(1); });
