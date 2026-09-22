/* ===== v183 — MÚSICA (fix dip perpétuo + debounce) =====
 * Motor multi-faixa: patio (sci-fi) | battle (épica 120bpm c/ bateria) |
 * tribe_overworld (pastoral) | tribe_underworld (vulcânica doom) |
 * tribe_danian (colmeia alien) | tribe_mipedian (deserto) |
 * tribe_marrillian (lagoa negra). Troca automática por mapa (sonda 1s) com
 * crossfade; volume/mute em Opções, salvos. Peças originais geradas na hora.
 * Começa no 1º gesto, baixinho (default 40 + fade 4s). v182: indicador 🎵 no
 * HUD (mostra a faixa; toque = mutar), watchdog de ganho e logs de debug.
 * v183: a sonda (1s) chamava switchTrack de novo antes do dip (1.2s) terminar
 * e o token cancelava a adoção p/ sempre = SILÊNCIO. Fix: pendingTrack (não
 * re-dispara a mesma troca) + debounce (só troca após 2 ticks estáveis). */
const LOBBY_MUSIC_VOL_KEY = 'chaotic_music_vol';
const LOBBY_MUSIC_MUTE_KEY = 'chaotic_music_mute';
const REGIAO_TRIBO = {
  ow_grove: 'overworld', meadow: 'overworld', forest: 'overworld',
  uw_ember: 'underworld', lava_cave: 'underworld', mountain: 'underworld',
  dan_hive: 'danian', swamp: 'danian', void_rim: 'danian',
  mip_oasis: 'mipedian', time_ruins: 'mipedian', mp_mirage: 'mipedian',
  lac_black: 'marrillian'
};
const MUSIC_TRACKS = {
  patio: {
    name: 'Pátio Central', chordDur: 8,
    chords: [
      [146.83, 174.61, 220.00, 261.63, 329.63],
      [116.54, 174.61, 220.00, 261.63, 293.66],
      [146.83, 174.61, 220.00, 261.63, 329.63],
      [110.00, 196.00, 293.66, 329.63, 440.00]
    ],
    melody: [
      [[2.0, 440.00], [5.0, 392.00]],
      [[2.0, 349.23], [5.0, 293.66]],
      [[2.0, 329.63], [5.0, 261.63]],
      [[2.0, 293.66], [5.0, 329.63]]
    ],
    melodyRepeat: null,
    bells: [587.33, 659.25, 698.46, 783.99, 880.00, 1046.50, 1174.66, 1318.51],
    bellP: 0.06, bellPeak: 0.07,
    pad: { t1: 'sawtooth', cut: 550, peak: 0.04, atk: 3.5, overlap: 3 },
    lead: { t1: 'sawtooth', t2: 'sine', cut: 1400, peak: 0.07, atk: 0.5, hold: 2.5, dur: 4, echo: 0.2 },
    bass: { peak: 0.075, dur: 4.0, echo: 0, drive: false },
    arp: { peak: 0.04, dur: 1.6, echo: 0.25, n: 4, step: 1.0 },
    drone: [[73.42, 0.03], [110.00, 0.012]],
    echo: { time: 0.65, fb: 0.5, damp: 1400 },
    drums: null, wind: null,
    opening: [[0.5, 587.33], [1.3, 880.00], [2.1, 1174.66]]
  },
  battle: {
    name: 'Batalha de Dromo', chordDur: 8,
    chords: [
      [82.41, 123.47, 164.81, 246.94, 329.63],
      [65.41, 98.00, 130.81, 196.00, 261.63],
      [98.00, 146.83, 196.00, 293.66, 392.00],
      [73.42, 110.00, 146.83, 220.00, 293.66]
    ],
    melody: [
      [[0, 329.63], [0.25, 329.63], [0.5, 392.00], [0.75, 440.00], [1, 493.88], [1.25, 440.00], [1.5, 392.00], [1.75, 329.63]],
      [[0, 329.63], [0.25, 329.63], [0.5, 392.00], [0.75, 440.00], [1, 392.00], [1.25, 329.63], [1.5, 293.66], [1.75, 261.63]],
      [[0, 293.66], [0.25, 293.66], [0.5, 392.00], [0.75, 440.00], [1, 493.88], [1.25, 440.00], [1.5, 392.00], [1.75, 293.66]],
      [[0, 329.63], [0.25, 369.99], [0.5, 392.00], [0.75, 440.00], [1, 493.88], [1.25, 440.00], [1.5, 392.00], [1.75, 369.99]]
    ],
    melodyRepeat: [0, 2, 4, 6],
    bells: [], bellP: 0, bellPeak: 0.07,
    pad: { t1: 'sawtooth', cut: 1200, peak: 0.05, atk: 0.8, overlap: 1 },
    lead: { t1: 'sawtooth', t2: 'sawtooth', cut: 2200, peak: 0.08, atk: 0.05, hold: 0.2, dur: 0.5, echo: 0.1 },
    bass: { peak: 0.06, dur: 0.3, echo: 0, drive: true },
    arp: { peak: 0.04, dur: 1.0, echo: 0, n: 0, step: 1.0 },
    drone: [[82.41, 0.02]],
    echo: { time: 0.32, fb: 0.3, damp: 2000 },
    drums: {
      step: 0.125, steps: 64,
      kick: 'x...'.repeat(16), snare: '....x.......x...'.repeat(4),
      hat: 'x.'.repeat(32), tom: 'x' + '.'.repeat(31) + 'x' + '.'.repeat(31)
    },
    wind: null, opening: null
  },
  tribe_overworld: {
    name: 'OverWorld — Bosque', chordDur: 8,
    chords: [
      [130.81, 196.00, 246.94, 329.63, 587.33],
      [110.00, 164.81, 246.94, 261.63, 329.63],
      [87.31, 174.61, 220.00, 329.63, 392.00],
      [98.00, 146.83, 246.94, 329.63, 440.00]
    ],
    melody: [
      [[2.0, 523.25], [5.0, 659.25]],
      [[2.0, 440.00], [5.0, 392.00]],
      [[2.0, 523.25], [5.0, 440.00]],
      [[2.0, 493.88], [5.0, 587.33]]
    ],
    melodyRepeat: null,
    bells: [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51],
    bellP: 0.15, bellPeak: 0.06,
    pad: { t1: 'triangle', cut: 900, peak: 0.05, atk: 2.5, overlap: 3 },
    lead: { t1: 'triangle', t2: 'sine', cut: 2000, peak: 0.08, atk: 0.3, hold: 1.5, dur: 2.5, echo: 0.15 },
    bass: { peak: 0.06, dur: 3.0, echo: 0, drive: false },
    arp: { peak: 0.045, dur: 1.2, echo: 0.15, n: 4, step: 1.0 },
    drone: [[65.41, 0.025], [98.00, 0.012]],
    echo: { time: 0.45, fb: 0.35, damp: 1800 },
    drums: null, wind: null, opening: null
  },
  tribe_underworld: {
    name: 'UnderWorld — Brasas', chordDur: 8,
    chords: [
      [82.41, 123.47, 164.81, 246.94, 329.63],
      [87.31, 130.81, 174.61, 261.63, 349.23],
      [82.41, 123.47, 164.81, 246.94, 329.63],
      [73.42, 110.00, 146.83, 220.00, 293.66]
    ],
    melody: [
      [[2.0, 164.81], [5.0, 146.83]],
      [[2.0, 174.61], [5.0, 164.81]],
      [[2.0, 164.81], [5.0, 123.47]],
      [[2.0, 146.83], [5.0, 164.81]]
    ],
    melodyRepeat: null,
    bells: [164.81, 174.61, 196.00, 220.00, 246.94, 293.66],
    bellP: 0.08, bellPeak: 0.05,
    pad: { t1: 'sawtooth', cut: 400, peak: 0.055, atk: 2, overlap: 2 },
    lead: { t1: 'sawtooth', t2: 'sine', cut: 900, peak: 0.08, atk: 0.2, hold: 1.5, dur: 3, echo: 0.1 },
    bass: { peak: 0.08, dur: 3.5, echo: 0, drive: false },
    arp: { peak: 0.03, dur: 1.5, echo: 0.1, n: 2, step: 3.0 },
    drone: [[82.41, 0.035], [123.47, 0.015]],
    echo: { time: 0.4, fb: 0.4, damp: 1200 },
    drums: {
      step: 8 / 48, steps: 48,
      kick: 'x...........'.repeat(4), snare: '.'.repeat(48),
      hat: '.'.repeat(48), tom: '......x...x.'.repeat(4)
    },
    wind: null, opening: null
  },
  tribe_danian: {
    name: 'Danian — Colmeia', chordDur: 8,
    chords: [
      [110.00, 164.81, 246.94, 261.63, 329.63],
      [116.54, 174.61, 220.00, 261.63, 293.66],
      [110.00, 164.81, 246.94, 261.63, 329.63],
      [82.41, 164.81, 207.65, 246.94, 293.66]
    ],
    melody: [
      [[2.0, 880.00], [5.0, 659.25]],
      [[2.0, 698.46], [5.0, 587.33]],
      [[2.0, 783.99], [5.0, 880.00]],
      [[2.0, 659.25], [5.0, 830.61]]
    ],
    melodyRepeat: null,
    bells: [880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00],
    bellP: 0.12, bellPeak: 0.045,
    pad: { t1: 'square', cut: 700, peak: 0.035, atk: 2, overlap: 3 },
    lead: { t1: 'square', t2: 'sine', cut: 1800, peak: 0.06, atk: 0.1, hold: 1.5, dur: 2.5, echo: 0.35 },
    bass: { peak: 0.06, dur: 3.0, echo: 0, drive: false },
    arp: { peak: 0.03, dur: 1.0, echo: 0.3, n: 8, step: 0.5 },
    drone: [[55.00, 0.03], [55.70, 0.03]],
    echo: { time: 0.5, fb: 0.45, damp: 1600 },
    drums: null, wind: null, opening: null
  },
  tribe_mipedian: {
    name: 'Mipedian — Deserto', chordDur: 8,
    chords: [
      [82.41, 123.47, 164.81, 246.94, 329.63],
      [87.31, 130.81, 174.61, 261.63, 349.23],
      [82.41, 123.47, 164.81, 246.94, 329.63],
      [73.42, 110.00, 146.83, 220.00, 293.66]
    ],
    melody: [
      [[2.0, 659.25], [5.0, 698.46]],
      [[2.0, 830.61], [5.0, 698.46]],
      [[2.0, 659.25], [5.0, 587.33]],
      [[2.0, 587.33], [5.0, 659.25]]
    ],
    melodyRepeat: null,
    bells: [659.25, 698.46, 783.99, 830.61, 880.00, 987.77, 1046.50, 1174.66],
    bellP: 0.1, bellPeak: 0.05,
    pad: { t1: 'sawtooth', cut: 600, peak: 0.04, atk: 3, overlap: 3 },
    lead: { t1: 'sawtooth', t2: 'sine', cut: 1600, peak: 0.075, atk: 0.15, hold: 1.5, dur: 2.8, echo: 0.3 },
    bass: { peak: 0.07, dur: 3.0, echo: 0, drive: false },
    arp: { peak: 0.05, dur: 1.0, echo: 0.2, n: 4, step: 1.0 },
    drone: [[82.41, 0.03], [164.81, 0.01]],
    echo: { time: 0.55, fb: 0.4, damp: 1500 },
    drums: null,
    wind: { cut: 400, rate: 0.07, peak: 0.02 },
    opening: null
  },
  tribe_marrillian: {
    name: "M'arrillian — Lagoa Negra", chordDur: 8,
    chords: [
      [146.83, 174.61, 220.00, 261.63, 329.63],
      [116.54, 174.61, 220.00, 261.63, 293.66],
      [98.00, 116.54, 146.83, 174.61, 220.00],
      [110.00, 196.00, 293.66, 329.63, 440.00]
    ],
    melody: [
      [[2.0, 293.66], [5.0, 261.63]],
      [[2.0, 246.94], [5.0, 220.00]],
      [[2.0, 196.00], [5.0, 174.61]],
      [[2.0, 220.00], [5.0, 329.63]]
    ],
    melodyRepeat: null,
    bells: [146.83, 174.61, 196.00, 220.00, 246.94, 293.66],
    bellP: 0.07, bellPeak: 0.05,
    pad: { t1: 'sine', cut: 300, peak: 0.05, atk: 5, overlap: 5 },
    lead: { t1: 'sine', t2: 'sine', cut: 800, peak: 0.07, atk: 1.5, hold: 3, dur: 6, echo: 0.4 },
    bass: { peak: 0.06, dur: 4.0, echo: 0, drive: false },
    arp: { peak: 0.03, dur: 1.5, echo: 0.3, n: 2, step: 4.0 },
    drone: [[73.42, 0.035], [146.83, 0.01]],
    echo: { time: 0.7, fb: 0.5, damp: 1000 },
    drums: null,
    wind: { cut: 800, rate: 0.1, peak: 0.015 },
    opening: null
  }
};
const TRACK_EMOJI = { patio: '🛸', battle: '⚔️', tribe_overworld: '🌲', tribe_underworld: '🌋', tribe_danian: '🐜', tribe_mipedian: '🏜️', tribe_marrillian: '🌊' };
const LobbyMusic = {
  ctx: null, musicBus: null, delaySend: null, dly: null, fb: null, damp: null,
  noiseBuf: null, timer: null, watchTimer: null,
  started: false, manual: false, introPlayed: false,
  trackId: 'patio', cfg: MUSIC_TRACKS.patio,
  chordStep: 0, nextChordT: 0, nextBellT: 0, nextDrumT: 0, drumStep: 0, bellIdx: 4,
  droneNodes: [], windNodes: null, switchToken: 0, DIP_MS: 1200, startAt: 0, dipping: false,
  pendingTrack: null, wantId: null, wantN: 0,
  vol: 40, muted: false, notified: false,
  ensure: function() {
    try {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ctx = new AC();
      this.ctx = ctx;
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.0001;
      this.musicBus.connect(ctx.destination);
      const dly = ctx.createDelay(2.0); dly.delayTime.value = this.cfg.echo.time;
      const fb = ctx.createGain(); fb.gain.value = this.cfg.echo.fb;
      const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = this.cfg.echo.damp;
      dly.connect(damp); damp.connect(fb); fb.connect(dly); damp.connect(this.musicBus);
      this.dly = dly; this.fb = fb; this.damp = damp;
      this.delaySend = ctx.createGain(); this.delaySend.gain.value = 1;
      this.delaySend.connect(dly);
      try { // ruído branco p/ bateria (caixa/chimbal) e vento
        const rate = ctx.sampleRate || 44100;
        const buf = ctx.createBuffer(1, rate, rate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      } catch (e) { this.noiseBuf = null; }
      this.applyVol();
      return true;
    } catch (e) { return false; }
  },
  volTarget: function() {
    return this.muted ? 0 : Math.pow(this.vol / 100, 1.5) * 0.6;
  },
  applyVol: function() {
    try {
      if (this.musicBus) this.musicBus.gain.setTargetAtTime(this.volTarget(), this.ctx.currentTime, 0.1);
    } catch (e) {}
  },
  pad: function(freq, t, dur) {
    try {
      const ctx = this.ctx, P = this.cfg.pad;
      const o1 = ctx.createOscillator(); o1.type = P.t1; o1.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq; o2.detune.value = 6;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = P.cut;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(P.peak, t + P.atk);
      g.gain.setValueAtTime(P.peak, t + dur - 3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.musicBus);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    } catch (e) {}
  },
  glassNote: function(freq, t, peak, dur, echo) {
    try {
      const ctx = this.ctx;
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2;
      const g = ctx.createGain(); const g2 = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(peak * 0.25, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4);
      o1.connect(g); g.connect(this.musicBus);
      o2.connect(g2); g2.connect(this.musicBus);
      if (echo > 0) {
        try { const send = ctx.createGain(); send.gain.value = echo; g.connect(send); send.connect(this.delaySend); } catch (e) {}
      }
      o1.start(t); o1.stop(t + dur + 0.1); o2.start(t); o2.stop(t + dur * 0.4 + 0.1);
    } catch (e) {}
  },
  bassNote: function(freq, t) {
    try { const b = this.cfg.bass; this.glassNote(freq, t, b.peak, b.dur, b.echo); } catch (e) {}
  },
  arpNote: function(freq, t) {
    try { const a = this.cfg.arp; this.glassNote(freq, t, a.peak, a.dur, a.echo); } catch (e) {}
  },
  melodyNote: function(freq, t) {
    try {
      const ctx = this.ctx, L = this.cfg.lead;
      const o1 = ctx.createOscillator(); o1.type = L.t1; o1.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = L.t2; o2.frequency.value = freq;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = L.cut;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(L.peak, t + L.atk);
      g.gain.setValueAtTime(L.peak, t + L.hold);
      g.gain.exponentialRampToValueAtTime(0.0001, t + L.dur);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.musicBus);
      if (L.echo > 0) {
        try { const send = ctx.createGain(); send.gain.value = L.echo; g.connect(send); send.connect(this.delaySend); } catch (e) {}
      }
      o1.start(t); o2.start(t); o1.stop(t + L.dur + 0.1); o2.stop(t + L.dur + 0.1);
    } catch (e) {}
  },
  bell: function(freq, t) {
    try {
      const ctx = this.ctx, peak = this.cfg.bellPeak;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2;
      const g = ctx.createGain(); const g2 = ctx.createGain();
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      g2.gain.setValueAtTime(0.025, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g); g.connect(this.musicBus); g.connect(this.delaySend);
      o2.connect(g2); g2.connect(this.musicBus);
      o.start(t); o.stop(t + 2.8); o2.start(t); o2.stop(t + 1.8);
    } catch (e) {}
  },
  kick: function(t) {
    try {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g); g.connect(this.musicBus);
      o.start(t); o.stop(t + 0.3);
    } catch (e) {}
  },
  snare: function(t) {
    try {
      if (!this.noiseBuf) return;
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      src.connect(f); f.connect(g); g.connect(this.musicBus);
      src.start(t); src.stop(t + 0.2);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.12, t);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(g2); g2.connect(this.musicBus);
      o.start(t); o.stop(t + 0.12);
    } catch (e) {}
  },
  hat: function(t) {
    try {
      if (!this.noiseBuf) return;
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(f); f.connect(g); g.connect(this.musicBus);
      src.start(t); src.stop(t + 0.07);
    } catch (e) {}
  },
  tom: function(t) {
    try {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(this.musicBus);
      o.start(t); o.stop(t + 0.35);
    } catch (e) {}
  },
  stopDrone: function() {
    try {
      if (this.droneNodes) for (let i = 0; i < this.droneNodes.length; i++) {
        try { this.droneNodes[i].stop(); } catch (e) {}
      }
    } catch (e) {}
    this.droneNodes = [];
  },
  startDrone: function(list) {
    this.stopDrone();
    if (!list) return;
    try {
      const ctx = this.ctx, self = this;
      for (let i = 0; i < list.length; i++) {
        (function(freq, peak) {
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 4);
          o.connect(g); g.connect(self.musicBus);
          o.start();
          self.droneNodes.push(o);
        })(list[i][0], list[i][1]);
      }
    } catch (e) {}
  },
  stopWind: function() {
    try {
      if (this.windNodes) for (let i = 0; i < this.windNodes.length; i++) {
        try { this.windNodes[i].stop(); } catch (e) {}
      }
    } catch (e) {}
    this.windNodes = null;
  },
  startWind: function(w) {
    this.stopWind();
    if (!w || !this.noiseBuf) return;
    try {
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = w.cut;
      const g = ctx.createGain(); g.gain.value = w.peak;
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = w.rate;
      const lg = ctx.createGain(); lg.gain.value = w.peak * 0.6;
      lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(this.musicBus);
      src.start(); lfo.start();
      this.windNodes = [src, lfo];
    } catch (e) {}
  },
  scheduleChord: function(T, idx, isFirst) {
    try {
      const cfg = this.cfg, ch = cfg.chords[idx];
      for (let i = 0; i < ch.length; i++) this.pad(ch[i], T, cfg.chordDur + cfg.pad.overlap);
      if (cfg.bass.drive) {
        const n = Math.floor(cfg.chordDur / 0.25);
        for (let i = 0; i < n; i++) this.bassNote(ch[0], T + i * 0.25);
      } else this.bassNote(ch[0], T + 0.05);
      for (let i = 0; i < cfg.arp.n; i++) {
        const f = ch[i % ch.length] * (i >= ch.length ? 2 : 1);
        this.arpNote(f, T + 0.5 + i * cfg.arp.step);
      }
      const reps = cfg.melodyRepeat || [0];
      const mel = cfg.melody[idx];
      for (let r = 0; r < reps.length; r++) {
        for (let i = 0; i < mel.length; i++) this.melodyNote(mel[i][1], T + reps[r] + mel[i][0]);
      }
      if (isFirst && cfg.opening) {
        for (let i = 0; i < cfg.opening.length; i++) this.bell(cfg.opening[i][1], T + cfg.opening[i][0]);
      }
    } catch (e) {}
  },
  tick: function() {
    if (!this.ctx || !this.started) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const ahead = this.ctx.currentTime + 1.2, cfg = this.cfg;
      while (this.nextChordT < ahead) {
        const first = (this.chordStep === 0 && !this.introPlayed);
        if (first) this.introPlayed = true;
        this.scheduleChord(this.nextChordT, this.chordStep % cfg.chords.length, first);
        this.nextChordT += cfg.chordDur;
        this.chordStep++;
      }
      while (this.nextBellT < ahead) {
        if (cfg.bells.length && Math.random() < cfg.bellP) {
          this.bellIdx += Math.floor(Math.random() * 5) - 2;
          if (this.bellIdx < 0) this.bellIdx = 0;
          if (this.bellIdx > cfg.bells.length - 1) this.bellIdx = cfg.bells.length - 1;
          this.bell(cfg.bells[this.bellIdx], this.nextBellT);
        }
        this.nextBellT += 1;
      }
      if (cfg.drums) {
        while (this.nextDrumT < ahead) {
          const s = this.drumStep % cfg.drums.steps;
          if (cfg.drums.kick[s] === 'x') this.kick(this.nextDrumT);
          if (cfg.drums.snare[s] === 'x') this.snare(this.nextDrumT);
          if (cfg.drums.hat[s] === 'x') this.hat(this.nextDrumT);
          if (cfg.drums.tom[s] === 'x') this.tom(this.nextDrumT);
          this.nextDrumT += cfg.drums.step;
          this.drumStep++;
        }
      }
    } catch (e) {}
  },
  adoptTrack: function(id) {
    try {
      const cfg = MUSIC_TRACKS[id];
      if (!cfg) return;
      this.stopDrone(); this.stopWind();
      this.cfg = cfg; this.trackId = id; this.pendingTrack = null;
      try {
        if (this.dly) {
          this.dly.delayTime.value = cfg.echo.time;
          this.fb.gain.value = cfg.echo.fb;
          this.damp.frequency.value = cfg.echo.damp;
        }
      } catch (e) {}
      if (this.started && this.ctx) {
        const t = this.ctx.currentTime + 0.1;
        this.nextChordT = t; this.nextBellT = t + 3; this.nextDrumT = t; this.drumStep = 0;
        this.chordStep = 0;
        this.startDrone(cfg.drone);
        this.startWind(cfg.wind);
        this.tick();
      }
      this.dipping = false;
      lobbyMusicUI();
    } catch (e) {}
  },
  gainGuard: function() {
    try {
      if (!this.started || this.muted || this.vol <= 0 || !this.musicBus || !this.ctx) return;
      if (this.dipping) return;
      if (Date.now() - (this.startAt || 0) < 5000) return;
      const want = this.volTarget();
      if (want > 0.01 && this.musicBus.gain.value < want * 0.25) {
        this.musicBus.gain.setTargetAtTime(want, this.ctx.currentTime, 0.5);
      }
    } catch (e) {}
  },
  switchTrack: function(id) {
    try {
      if (!MUSIC_TRACKS[id] || this.trackId === id) return;
      if (!this.started) { this.adoptTrack(id); return; }
      if (this.pendingTrack === id) return; // já está a caminho: não re-dispara
      this.pendingTrack = id;
      const self = this, token = ++this.switchToken;
      this.dipping = true;
      try { console.log('[musica] → ' + id); } catch (e) {}
      try { this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); } catch (e) {}
      setTimeout(function() {
        if (token !== self.switchToken) return;
        self.adoptTrack(id);
        try { self.musicBus.gain.setTargetAtTime(self.volTarget(), self.ctx.currentTime, 0.6); } catch (e) {}
      }, this.DIP_MS);
    } catch (e) {}
  },
  watchTick: function() {
    try {
      if (!this.started || this.manual) return;
      const want = musicWantedTrack();
      if (want === this.trackId || want === this.pendingTrack) { this.wantId = want; this.wantN = 0; }
      else if (want === this.wantId) {
        this.wantN++;
        if (this.wantN >= 1) this.switchTrack(want);
      } else { this.wantId = want; this.wantN = 0; }
      this.gainGuard();
    } catch (e) {}
  },
  start: function() {
    if (this.started) return true;
    if (!this.ensure()) return false;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      try { // fade de entrada: começa baixinho, chega ao volume em 4s
        const g = this.musicBus.gain, now = this.ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.0001, now);
        g.linearRampToValueAtTime(Math.max(0.0001, this.volTarget()), now + 4);
      } catch (e) {}
      this.adoptTrack(musicWantedTrack());
      const t = this.ctx.currentTime + 0.1;
      this.nextChordT = t; this.nextBellT = t + 3; this.nextDrumT = t; this.drumStep = 0;
      this.chordStep = 0; this.bellIdx = 4;
      this.started = true;
      this.startAt = Date.now();
      this.dipping = false;
      try { console.log('[musica] start: ' + this.trackId); } catch (e) {}
      const self = this;
      this.timer = setInterval(function() { self.tick(); }, 250);
      this.startDrone(this.cfg.drone);
      this.startWind(this.cfg.wind);
      this.tick();
      if (!this.notified && !this.muted && this.vol > 0) {
        this.notified = true;
        try { showNotif('🎵 Música do pátio ligada — ajuste o volume em ⚙️ Opções', 'info'); } catch (e) {}
      }
      lobbyMusicUI();
      return true;
    } catch (e) { return false; }
  }
};
function musicWantedTrack() {
  try {
    const dp = document.getElementById('dromo-panel');
    if (dp && dp.classList && dp.classList.contains('open')) return 'battle';
    const ov = document.getElementById('dromo-game-overlay');
    if (ov && ov.classList && ov.classList.contains('open')) return 'battle';
    const loc = (typeof mapaAtual154 === 'function') ? mapaAtual154() : 'portico';
    if (loc === 'portico' || loc === 'drome' || loc === 'cave' || loc === 'exterior') return 'patio';
    const tribe = REGIAO_TRIBO[loc] || null;
    if (tribe && MUSIC_TRACKS['tribe_' + tribe]) return 'tribe_' + tribe;
    return 'patio';
  } catch (e) { return 'patio'; }
}
function lobbyMusicToggleMute() {
  try {
    LobbyMusic.muted = !LobbyMusic.muted;
    try { localStorage.setItem(LOBBY_MUSIC_MUTE_KEY, LobbyMusic.muted ? '1' : '0'); } catch (e) {}
    if (!LobbyMusic.muted) lobbyMusicKick();
    LobbyMusic.applyVol();
    lobbyMusicUI();
  } catch (e) {}
}
function lobbyMusicHud() {
  try {
    let hud = document.getElementById('music-hud');
    if (!hud) {
      hud = document.createElement('button');
      hud.id = 'music-hud';
      hud.title = 'Música';
      try { hud.style.cssText = 'position:fixed;top:52px;right:10px;z-index:61;background:rgba(16,24,46,.82);border:1px solid #33415c;border-radius:9px;color:#e8eefc;font-size:13px;padding:4px 8px;cursor:pointer;'; } catch (e) {}
      if (document.body) document.body.appendChild(hud);
      bindImmediateButton('music-hud', lobbyMusicToggleMute);
    }
    const cfg = MUSIC_TRACKS[LobbyMusic.trackId];
    if (!LobbyMusic.started) {
      hud.textContent = '🎵'; hud.title = 'Música pronta — toque em qualquer lugar para começar';
      try { hud.style.opacity = '0.55'; } catch (e) {}
    } else if (LobbyMusic.muted || LobbyMusic.vol === 0) {
      hud.textContent = '🔇'; hud.title = 'Música mutada — toque para ativar';
      try { hud.style.opacity = '1'; } catch (e) {}
    } else {
      hud.textContent = '🎵' + (TRACK_EMOJI[LobbyMusic.trackId] || '');
      hud.title = (cfg ? cfg.name : 'Música') + ' — toque para mutar';
      try { hud.style.opacity = '1'; } catch (e) {}
    }
  } catch (e) {}
}
function lobbyMusicKick() {
  try {
    if (LobbyMusic.started) return;
    LobbyMusic.start();
  } catch (e) {}
}
function lobbyMusicUI() {
  try {
    const pct = document.getElementById('opt-music-pct');
    const btn = document.getElementById('opt-music-mute');
    if (pct) pct.textContent = (LobbyMusic.muted ? 0 : LobbyMusic.vol) + '%';
    if (btn) btn.textContent = (LobbyMusic.muted || LobbyMusic.vol === 0) ? '🔇' : '🔊';
  } catch (e) {}
  lobbyMusicHud();
}
function initLobbyMusic() {
  try {
    let v = 40;
    try {
      const sv = localStorage.getItem(LOBBY_MUSIC_VOL_KEY);
      if (sv !== null && sv !== '') v = Math.max(0, Math.min(100, parseInt(sv, 10) || 0));
    } catch (e) {}
    LobbyMusic.vol = v;
    try { LobbyMusic.muted = localStorage.getItem(LOBBY_MUSIC_MUTE_KEY) === '1'; } catch (e) {}
    const slider = document.getElementById('opt-music-vol');
    if (slider) {
      slider.value = String(v);
      slider.addEventListener('input', function() {
        LobbyMusic.vol = Math.max(0, Math.min(100, parseInt(slider.value, 10) || 0));
        if (LobbyMusic.vol > 0 && LobbyMusic.muted) {
          LobbyMusic.muted = false;
          try { localStorage.setItem(LOBBY_MUSIC_MUTE_KEY, '0'); } catch (e) {}
        }
        try { localStorage.setItem(LOBBY_MUSIC_VOL_KEY, String(LobbyMusic.vol)); } catch (e) {}
        LobbyMusic.applyVol();
        lobbyMusicUI();
      });
    }
    bindImmediateButton('opt-music-mute', lobbyMusicToggleMute);
    lobbyMusicUI();
    document.addEventListener('pointerdown', lobbyMusicKick);
    document.addEventListener('keydown', lobbyMusicKick);
    document.addEventListener('click', lobbyMusicKick);
    try { window.__musica = LobbyMusic; } catch (e) {}
    // sonda: troca automática de faixa conforme o mapa (1s)
    try {
      if (LobbyMusic.watchTimer) clearInterval(LobbyMusic.watchTimer);
      LobbyMusic.watchTimer = setInterval(function() { LobbyMusic.watchTick(); }, 1000);
    } catch (e) {}
  } catch (e) {}
}
initLobbyMusic();
