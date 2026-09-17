// v2.33 (v170) — FORJA-7 NOVA: os 3 fragmentos da Drome Key
// (1) a receita nova, (2) o painel, (3) os bloqueios, (4) as 3 fontes de fragmento,
// (5) as ações (forjar / montar com 5 / entrar na Drome), (6) save-reload.
const { puppeteer, sleep, CHROME, novoJogador } = require('/tmp/pptr/lib_chaos.js');
let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) { console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); cond ? OK++ : FALHOU++; }
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8960';

async function sessao(fn) {
  const b = await puppeteer.launch({ headless: true, args: CHROME, protocolTimeout: 200000 });
  const A = await novoJogador(b, 'F');
  await A.p.setViewport({ width: 1280, height: 800 });
  await A.p.bringToFront();
  await A.p.evaluate(() => { GameState.player.lvl = 99; GameState.player.visitedRegions = REGIONS.map(r => r.id); GameState.player.bits = 99999; });
  await sleep(1500);
  let out = null;
  try { out = await fn(A); } catch (e) { out = { erro: e.message.slice(0, 100) }; }
  try { await b.close(); } catch (e) {}
  return out;
}
const zeraTudo = `(function () {
  const p = GameState.player;
  p.fragExp169 = 0; p.fragBat169 = 0; p.fragTempo169 = 0; p.fragments = 0; p.dromeKeys = 0; p.bits = 99999;
  p.inventory = p.inventory.filter(function (it) { return it.type !== 'material'; }); p.storage = [];
  GameState.map100169 = {}; GameState.mapScan = {};
  return 1;
})()`;

(async () => {
  console.log('\n[1] A RECEITA NOVA E AS FONTES');
  const t1 = await sessao(async A => A.p.evaluate(() => ({
    frags: KEY_FRAGS170.map(f => f.icon + ' ' + f.qty).join(' · '),
    ids: KEY_FRAGS170.map(f => f.id).join(','),
    campo: ['exp', 'bat', 'tempo'].map(id => fragCampo170(id)).join(','),
    fonteTempo: /setInterval\(tickTempo170/.test(tickTempo170.toString()) ? 'função viva' : 'ok',
    custo: '400 bits'
  })));
  console.log('      ' + JSON.stringify(t1));
  checa('a receita é 🧭 ×1 · ⚔️ ×5 · ⚙️ ×7', t1.frags === '🧭 1 · ⚔️ 5 · ⚙️ 7', t1.frags);

  console.log('\n[2] O PAINEL DA FORJA (a chave no centro)');
  const t2 = await sessao(async A => {
    await A.p.evaluate(zeraTudo);
    return A.p.evaluate(() => {
      const p = GameState.player; p.fragExp169 = 1; p.fragBat169 = 4; p.fragTempo169 = 6;
      openClerkPanel('craft');
      const el = document.getElementById('clerk-panel');
      const r = {
        classe: el.classList.contains('ck170'),
        naoHolografico: !el.classList.contains('ck169'),
        titulo: el.querySelector('.ck170-title') ? el.querySelector('.ck170-title').textContent.trim() : '',
        chave: !!el.querySelector('.ck170-key'),
        halo: !!el.querySelector('.ck170-halo'),
        tiles: Array.prototype.map.call(el.querySelectorAll('.ck170-tile span'), e => e.textContent).join(' '),
        cartoes: el.querySelectorAll('.ck170-row').length,
        tags: Array.prototype.map.call(el.querySelectorAll('.ck170-tag'), e => e.textContent.split('·')[0].trim()).join('/'),
        nums: Array.prototype.map.call(el.querySelectorAll('.ck170-num'), e => e.textContent).join(' '),
        circuitos: el.querySelectorAll('.ck169-cir').length,
        placa: el.querySelector('.ck169-plate') ? el.querySelector('.ck169-plate').textContent : '',
        custo: el.querySelector('.ck170-cost') ? el.querySelector('.ck170-cost').textContent.replace(/\s+/g, ' ').trim() : '',
        botaoForjar: el.querySelector('.ck170-go') ? (el.querySelector('.ck170-go').disabled ? 'travado' : 'liberado') : 'nao existe',
        botaoFrags: el.querySelector('.ck170-go2') ? (el.querySelector('.ck170-go2').disabled ? 'travado' : 'liberado') : 'nao existe',
        tip: el.querySelector('.ck170-tip') ? el.querySelector('.ck170-tip').textContent.trim() : ''
      };
      return r;
    });
  });
  console.log('      ' + JSON.stringify(t2));
  checa('o painel usa o layout novo (.ck170) e não o do COSTURA', t2.classe && t2.naoHolografico, t2.titulo);
  checa('a chave e o halo estão no centro', t2.chave && t2.halo);
  checa('os 3 cartões com os contadores certos', t2.cartoes === 3 && t2.nums === '1/1 4/5 6/7', t2.nums);
  checa('os tiles laterais mostram Exploração/Batalha/Tempo', t2.tiles === '1/1 4/5 6/7', t2.tiles);
  checa('os cantos/circuitos e a plaquinha da bancada vieram', t2.circuitos === 4 && /FORJA-7/.test(t2.placa), t2.placa);
  checa('o custo mostra os 400 bits e o que o jogador tem', /400 bits/.test(t2.custo) && /9\.999/.test(t2.custo), t2.custo);
  checa('faltando fragmento o botão trava e o aviso explica', t2.botaoForjar === 'travado' && /Faltam fragmentos/.test(t2.tip), t2.tip);
  checa('o caminho dos 5 fragmentos do scan fica travado sem fragmentos', t2.botaoFrags === 'travado');

  console.log('\n[3] SEM BITS O BOTÃO TAMBÉM TRAVA');
  const t3 = await sessao(async A => A.p.evaluate(() => {
    const p = GameState.player; p.fragExp169 = 1; p.fragBat169 = 5; p.fragTempo169 = 7; p.bits = 50;
    openClerkPanel('craft');
    const el = document.getElementById('clerk-panel');
    return { botao: el.querySelector('.ck170-go').disabled ? 'travado' : 'liberado', tip: el.querySelector('.ck170-tip').textContent.trim() };
  }));
  checa('com os fragmentos mas sem 400 bits o botão trava', t3.botao === 'travado' && /bits/.test(t3.tip), t3.tip);

  console.log('\n[4] AS 3 FONTES DE FRAGMENTO');
  const fontes = await sessao(async A => {
    const r = {};
    // (a) ⚔️ BATALHA: vitória contra um Mestre do Dromo (pela função real da vitória)
    r.dromo = await A.p.evaluate(() => {
      const p = GameState.player; p.fragBat169 = 0;
      GameState.dromoWins = {};
      DROMO_MASTERS[0].base = DROMO_MASTERS[0].base || 1;
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'DROMO_RESULT', masterId: DROMO_MASTERS[0].id, win: true } }));
      return { frag: p.fragBat169, bits: p.bits };
    });
    // (b) ⚔️ BATALHA: vitória no PVP
    r.pvp = await A.p.evaluate(() => {
      const p = GameState.player; p.fragBat169 = 0;
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'DROMO_RESULT', pvp: true, win: true } }));
      return { frag: p.fragBat169 };
    });
    // (c) ⚔️ BATALHA: vitória na Arena do Chefe
    r.arena = await A.p.evaluate(() => {
      const p = GameState.player; p.fragBat169 = 0;
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'DROMO_RESULT', masterId: 'boss150_' + BOSS_DEFS149[0].map, win: true } }));
      return { frag: p.fragBat169 };
    });
    // (d) 🧭 EXPLORAÇÃO: um mapa chegando a 100% (scan da última espécie do pool)
    r.exploracao = await A.p.evaluate(`(async function () {
      const p = GameState.player; p.fragExp169 = 0; GameState.map100169 = {};
      closeClerkPanel();
      travelTo('ow_grove');
      await new Promise(function (r) { setTimeout(r, 2600); });
      const reg = 'ow_grove';
      if (!GameState.mapScan) GameState.mapScan = {};
      GameState.mapScan[reg] = {};
      const pool = MAP_POOLS[reg] || [];
      for (let i = 0; i < pool.length - 1; i++) GameState.mapScan[reg][pool[i]] = 1;
      const antes = mapScanPct(reg), antesFrag = p.fragExp169;
      const sc = game.scene.getScene('PerimScene');
      const nome = pool[pool.length - 1];
      const alvo = { type: ENEMY_TYPES.find(function (e) { return e.name === nome; }) || ENEMY_TYPES[0], level: 4, maxHp: 20, hp: 20, ivs: gerarIVsNaFaixa167(FAIXAS167[1]), x: 500, y: 500, scanned: false, setVisible: function () {}, body: { enable: true }, label: { destroy: function () {} } };
      GameState.currentRegion = reg;
      sc.completeScan(alvo);
      const ov = document.getElementById('scan-card-overlay'); if (ov) ov.remove();
      const pct = mapScanPct(reg);
      // de novo no mesmo mapa: NÃO pode dar outro fragmento
      const alvo2 = Object.assign({}, alvo, { scanned: false });
      sc.completeScan(alvo2);
      const ov2 = document.getElementById('scan-card-overlay'); if (ov2) ov2.remove();
      return { antes: antes, pct: pct, frag: p.fragExp169, depoisDeRepetir: p.fragExp169, mapa: reg };
    })()`);
    // (e) ⚙️ TEMPO: 10 minutos de jogo viram 1 fragmento (relógio controlado)
    r.tempo = await A.p.evaluate(() => {
      const p = GameState.player; p.fragTempo169 = 0;
      p.playMs169 = TEMPO_MS170 - 1000;          // faltava 1s de jogo
      p.lastSeen169 = Date.now() - 3000;         // e passaram 3s de verdade
      tickTempo170();
      return { frag: p.fragTempo169, sobra: p.playMs169 };
    });
    // (f) ⚙️ TEMPO: com o jogo fechado, até 3 por ausência
    r.offline = await A.p.evaluate(() => {
      const p = GameState.player; p.fragTempo169 = 0; p.lastSeen169 = Date.now() - (60 * 60 * 1000);
      tickTempo170();
      const tres = p.fragTempo169;
      p.fragTempo169 = 0; p.lastSeen169 = Date.now() - (60 * 60 * 1000);
      tickTempo170(); // 1 hora de ausência = 6x 10min → teto de 3
      return { tres: tres, teto: p.fragTempo169 };
    });
    return r;
  });
  if (!fontes || fontes.erro) { console.log('      💥 a sessão das fontes caiu: ' + JSON.stringify(fontes)); }
  console.log('      dromo: ' + JSON.stringify(fontes.dromo) + ' · pvp: ' + JSON.stringify(fontes.pvp) + ' · arena: ' + JSON.stringify(fontes.arena));
  console.log('      exploração: ' + JSON.stringify(fontes.exploracao));
  console.log('      tempo: ' + JSON.stringify(fontes.tempo) + ' · ausência: ' + JSON.stringify(fontes.offline));
  checa('vitória no Dromo dá ⚔️ Fragmento de Batalha', fontes.dromo.frag === 1);
  checa('vitória no PVP dá ⚔️ Fragmento de Batalha', fontes.pvp.frag === 1);
  checa('vitória na Arena do Chefe dá ⚔️ Fragmento de Batalha', fontes.arena.frag === 1);
  checa('mapa chegando a 100% dá 🧭 Fragmento da Exploração (e só na 1ª vez)', fontes.exploracao.pct === 100 && fontes.exploracao.frag === 1 && fontes.exploracao.depoisDeRepetir === 1, 'pct ' + fontes.exploracao.antes + '→' + fontes.exploracao.pct + ' · fragmentos ' + fontes.exploracao.frag);
  checa('10 minutos de jogo viram ⚙️ Fragmento do Tempo', fontes.tempo.frag === 1, 'sobrou ' + fontes.tempo.sobra + 'ms');
  checa('tempo com o jogo fechado dá fragmento, com teto de 3', fontes.offline.tres === 3 && fontes.offline.teto === 3, '1h fechado = ' + fontes.offline.teto);

  console.log('\n[5] FORJAR A CHAVE (com os 3 fragmentos) E ENTRAR NA DROME');
  const t5 = await sessao(async A => {
    await A.p.evaluate(zeraTudo);
    const antes = await A.p.evaluate(`(function () {
      const p = GameState.player; p.fragExp169 = 1; p.fragBat169 = 5; p.fragTempo169 = 7; p.bits = 5000;
      openClerkPanel('craft');
      return { dromeKeys: p.dromeKeys, bits: p.bits, frags: [p.fragExp169, p.fragBat169, p.fragTempo169].join(',') };
    })()`);
    await A.p.evaluate(() => { const b = document.querySelector('#clerk-panel .ck170-go'); b.click(); });
    await sleep(500);
    const depois = await A.p.evaluate(() => {
      const p = GameState.player;
      const el = document.getElementById('clerk-panel');
      return {
        dromeKeys: p.dromeKeys, bits: p.bits, frags: [p.fragExp169, p.fragBat169, p.fragTempo169].join(','),
        nums: Array.prototype.map.call(el.querySelectorAll('.ck170-num'), e => e.textContent).join(' '),
        sub: el.querySelector('.ck170-sub') ? el.querySelector('.ck170-sub').textContent : '',
        botaoDrome: el.querySelector('.ck170-go2.drome') ? (el.querySelector('.ck170-go2.drome').disabled ? 'travado' : 'liberado') : 'nao existe',
        aviso: document.body.innerText.indexOf('Drome Key forjada') >= 0
      };
    });
    console.log('      antes: ' + JSON.stringify(antes) + '\n      depois: ' + JSON.stringify(depois));
    checa('o clique no "Forjar Drome Key" gasta 400 bits e os 3 fragmentos', depois.dromeKeys === 1 && depois.bits === antes.bits - 400 && depois.frags === '0,0,0', 'chaves ' + depois.dromeKeys + ' · bits ' + antes.bits + '→' + depois.bits + ' · frags ' + depois.frags);
    checa('o painel se redesenha zerado e o aviso aparece', depois.nums === '0/1 0/5 0/7' && depois.aviso, depois.nums);
    checa('com 1 chave o botão de entrar na Drome libera', depois.botaoDrome === 'liberado');
    return depois;
  });

  console.log('\n[6] SAVE E RELOAD (os fragmentos ficam salvos)');
  const t6 = await sessao(async A => {
    await A.p.evaluate(zeraTudo);
    await A.p.evaluate(() => {
      const p = GameState.player; p.fragExp169 = 3; p.fragBat169 = 2; p.fragTempo169 = 5; p.playMs169 = 123456; p.dromeKeys = 2;
      GameState.map100169 = { ow_grove: 1 };
      saveGame(true);
    });
    await A.p.reload({ waitUntil: 'load' });
    await A.p.waitForFunction(() => { try { return typeof fragCount170 === 'function' && !!GameState.player; } catch (e) { return false; } }, { timeout: 90000, polling: 300 });
    await sleep(1500);
    const d = await A.p.evaluate(() => {
      const p = GameState.player;
      return { exp: p.fragExp169, bat: p.fragBat169, tempo: p.fragTempo169, playMs: p.playMs169, chaves: p.dromeKeys, mapa100: JSON.stringify(GameState.map100169) };
    });
    console.log('      ' + JSON.stringify(d));
    checa('os 3 contadores e os bits do relógio voltam do save', d.exp === 3 && d.bat === 2 && d.tempo === 5 && d.playMs >= 123456 && d.playMs < 123456 + 60000 && d.chaves === 2, JSON.stringify(d));
    checa('os mapas já 100% também voltam (não dá fragmento repetido)', /ow_grove/.test(d.mapa100), d.mapa100);
    return d;
  });

  console.log('\nRESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌');
  process.exit(FALHOU ? 1 : 0);
})().catch(e => { console.error('FALHA GERAL: ' + (e.stack || e.message).slice(0, 400)); process.exit(1); });
