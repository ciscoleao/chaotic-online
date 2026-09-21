// v2.35 (v172) — PRESENÇA RÁPIDA: menos delay vendo gente online.
// Teste 100% Node: checagens estáticas + a predição REAL extraída do HTML +
// simulação de perseguição (bot scriptado) ANTES x DEPOIS.
//
// Uso (na raiz do repo):
//   node docs/patches/test_v235_presence.js
//   GAME_FILE=/tmp/pre_presence.html node docs/patches/test_v235_presence.js
const fs = require('fs');
const path = require('path');

const GAME = process.env.GAME_FILE || path.join(__dirname, '..', '..', 'chaotic_idleworld_v123.html');
const html = fs.readFileSync(GAME, 'utf-8');

let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) {
  console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : ''));
  cond ? OK++ : FALHOU++;
}

console.log('\n[0] MARCADORES NO HTML — ' + GAME);
checa('predPos172 presente', html.includes('function predPos172(samp, now)'));
checa('beat adaptativo (650ms andando)', html.includes("? 650 : 2400"));
checa('poll 1500ms', html.includes('setInterval(gcPoll, 1500)'));
checa('sem setInterval(gcBeat, 2000)', !html.includes('setInterval(gcBeat, 2000)'));
checa('trava gcBeatFly172', html.includes('gcBeatFly172'));
checa('trava gcPollFly172', html.includes('gcPollFly172'));
checa('beat imediato gcBeatSoon', html.includes('function gcBeatSoon()'));
checa('travelTo chama gcBeatSoon', html.includes("typeof gcBeatSoon === 'function') gcBeatSoon()"));
checa('visibilitychange atualiza na volta', html.includes('voltou pra aba'));
checa('snap em teleporte (>550px)', html.includes('dist172 > 550'));
checa('chase perto/longe (0.28/0.45)', html.includes('0.45 : 0.28'));
const titleVersion = html.match(/<title>Chaotic\.idleWorld v(\d+)\.(\d+)/);
checa('título identifica v2.35 ou posterior', titleVersion && (+titleVersion[1] > 2 || (+titleVersion[1] === 2 && +titleVersion[2] >= 35)));

// ------------------------------------------------ extrai predição REAL
function extraiPred(src) {
  const ini = src.indexOf('function predPos172(samp, now) {');
  if (ini === -1) return null;
  const fim = src.indexOf('\n}\n', ini) + 3;
  const fn = src.slice(ini, fim);
  const body = fn.slice(fn.indexOf('{') + 1, fn.lastIndexOf('}'));
  return new Function('samp', 'now', body); // eslint-disable-line no-new-func
}
const pred = extraiPred(html);

console.log('\n[1] PREDIÇÃO REAL (predPos172 extraída do jogo)');
if (!pred) {
  checa('função extraída', false, 'ausente neste HTML');
} else {
  checa('função extraída', true);
  let r = pred([], 1000);
  checa('sem amostras → zerado e parado', r.x === 0 && r.moving === false);
  r = pred([{ x: 5, y: 6, t: 900 }], 1000);
  checa('1 amostra → posição dela, parado', r.x === 5 && r.y === 6 && r.moving === false);
  // andando p/ direita a 200px/s, última notícia há 500ms → projeta +100px
  r = pred([{ x: 0, y: 0, t: 0 }, { x: 130, y: 0, t: 650 }], 1150);
  checa('extrapola a favor do movimento', Math.abs(r.x - 230) < 1 && r.moving === true, 'x=' + r.x.toFixed(1));
  // parado (amostras iguais) → não projeta
  r = pred([{ x: 40, y: 40, t: 0 }, { x: 40, y: 40, t: 2400 }], 3000);
  checa('parado não projeta', r.x === 40 && r.y === 40 && r.moving === false);
  // sem notícia há 5s → projeta no máximo 1.2s (200px/s → +240px)
  r = pred([{ x: 0, y: 0, t: 0 }, { x: 130, y: 0, t: 650 }], 5650);
  checa('trava projeção em 1.2s', Math.abs(r.x - 370) < 1, 'x=' + r.x.toFixed(1));
  // pulo absurdo (900px em 100ms) → velocidade limitada a 420px/s
  r = pred([{ x: 0, y: 0, t: 0 }, { x: 900, y: 0, t: 100 }], 600);
  const sp = Math.sqrt(r.vx * r.vx + r.vy * r.vy);
  checa('capa velocidade em 420px/s', Math.abs(sp - 420) < 1, sp.toFixed(1) + 'px/s');
  // relógio esquisito (now antes da amostra) → sem projeção negativa
  r = pred([{ x: 0, y: 0, t: 0 }, { x: 130, y: 0, t: 650 }], 100);
  checa('now < amostra → sem voltar no tempo', Math.abs(r.x - 130) < 1, 'x=' + r.x.toFixed(1));
}

// ------------------------------------------- simulação: bot perseguido
// Bot scriptado (verdade): anda/para/vira. Emissor = beat do remoto (ANTES 2000ms
// fixo / DEPOIS 650ms andando). Render a cada 110ms como no jogo.
function verdade(t) { // t em ms → [x, y]
  const s = t / 1000;
  let x = 200, y = 500;
  const pernas = [
    [0, 3, 180, 0], [3, 4, 0, 0], [4, 7, 0, 180],
    [7, 8, 0, 0], [8, 11, -127, -127], [11, 12, 0, 0],
  ];
  for (const [a, b, vx, vy] of pernas) {
    const d = Math.max(0, Math.min(s, b) - a);
    x += vx * d; y += vy * d;
  }
  return [x, y];
}
function simula(beatMs, novo) {
  const TICK = 110, RTT = 100, FIM = 12000;
  const emiss = [];
  for (let t = 0; t <= FIM; t += beatMs) emiss.push({ t, p: verdade(t) });
  let pos = [200, 500], alvo = [200, 500], samp = [{ x: 200, y: 500, t: 0 }];
  let soma = 0, n = 0, max = 0, ei = 0;
  for (let now = 0; now <= FIM; now += TICK) {
    while (ei < emiss.length && emiss[ei].t + RTT <= now) {
      const e = emiss[ei++];
      alvo = e.p;
      samp.push({ x: e.p[0], y: e.p[1], t: e.t });
      if (samp.length > 3) samp.shift();
    }
    if (novo) {
      const p = pred(samp, now);
      let dx = p.x - pos[0], dy = p.y - pos[1];
      const d = Math.hypot(dx, dy);
      if (d > 550) { pos = [p.x, p.y]; }
      else if (d > 0.5) { const k = d > 220 ? 0.45 : 0.28; pos = [pos[0] + dx * k, pos[1] + dy * k]; }
    } else {
      pos = [pos[0] + (alvo[0] - pos[0]) * 0.16, pos[1] + (alvo[1] - pos[1]) * 0.16];
    }
    const v = verdade(now);
    const err = Math.hypot(v[0] - pos[0], v[1] - pos[1]);
    soma += err; n++; if (err > max) max = err;
  }
  return { media: soma / n, max };
}

console.log('\n[2] PERSEGUIÇÃO SIMULADA (12s de bot andando/parando/virando)');
if (!pred) {
  checa('simulação', false, 'sem predPos172 neste HTML');
} else {
  const antes = simula(2000, false); // beat 2s + lerp 0.16 no alvo parado
  const depois = simula(650, true);  // beat 650ms + predição + chase 0.28/0.45
  console.log('      ANTES: erro médio ' + antes.media.toFixed(1) + 'px · pico ' + antes.max.toFixed(1) + 'px');
  console.log('      DEPOIS: erro médio ' + depois.media.toFixed(1) + 'px · pico ' + depois.max.toFixed(1) + 'px');
  checa('erro médio caiu ≥45%', depois.media < antes.media * 0.55,
    antes.media.toFixed(0) + 'px → ' + depois.media.toFixed(0) + 'px');
  checa('erro médio < 90px', depois.media < 90);
  checa('pico < 60% do pico antigo', depois.max < antes.max * 0.6,
    antes.max.toFixed(0) + 'px → ' + depois.max.toFixed(0) + 'px');
}

console.log('\n==== RESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌ ====\n');
process.exit(FALHOU ? 1 : 0);
