// v2.32 (v169) — PONTA A PONTA: chão dos mapas (spawn real), drop do scan por região,
// Depósito, bloqueios, os 5 upgrades em sequência e o resto do jogo.
const { puppeteer, sleep, CHROME, novoJogador } = require('/tmp/pptr/lib_chaos.js');
let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) { console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); cond ? OK++ : FALHOU++; }

async function sessao(fn) {
  const b = await puppeteer.launch({ headless: true, args: CHROME, protocolTimeout: 120000 });
  const A = await novoJogador(b, 'E');
  await A.p.setViewport({ width: 1024, height: 700 });
  await A.p.bringToFront();
  await A.p.evaluate(() => { GameState.player.lvl = 99; GameState.player.visitedRegions = REGIONS.map(r => r.id); GameState.player.bits = 999999; });
  await sleep(1500);
  let saida = null;
  try { saida = await fn(A); } catch (e) { saida = { erro: e.message.slice(0, 90) }; }
  try { await b.close(); } catch (e) {}
  return saida;
}
function medir(regioes) {
  return sessao(async A => {
    const out = {};
    for (const item of regioes) {
      const lvl = item.lvl, reg = item.reg;
      await A.p.evaluate(`(function () { travelTo(${JSON.stringify(reg)}); return 1; })()`);
      await sleep(2600);
      const d = JSON.parse(await A.p.evaluate(`(function () {
        const sc = game.scene.getScene('PerimScene');
        if (!sc || !sc.materials) return JSON.stringify({ erro: 'sem cena' });
        sc.materials.getChildren().slice().forEach(function (m) { m.destroy(); });
        for (let i = 0; i < 30; i++) sc.spawnMaterial();
        const tab = {}; GROUND_MATS.forEach(function (m) { tab[m.tex] = { tier: m.tier, id: m.id }; });
        const vistos = {}; let errados = 0, classicos = 0;
        sc.materials.getChildren().forEach(function (spr) {
          const t = tab[spr.texture.key];
          if (t) { vistos[t.id] = (vistos[t.id] || 0) + 1; if (t.tier !== ${lvl}) errados++; }
          else classicos++;
        });
        return JSON.stringify({ cena: sc.region ? sc.region.id : '?', tipos: Object.keys(vistos).length, errados: errados, classicos: classicos });
      })()`));
      out[reg] = Object.assign({ lvl: lvl }, d);
    }
    return out;
  });
}
const DROP_SCAN = `(function () {
  const sc = game.scene.getScene('PerimScene');
  const tab = {}; GROUND_MATS.forEach(function (m) { tab[m.id] = m.tier; });
  const saida = {};
  const todos = { 1: ['ow_grove', 'dan_hive'], 2: ['meadow', 'time_ruins'], 3: ['forest', 'void_rim'] };
  for (let lvl = 1; lvl <= 3; lvl++) {
    for (let k = 0; k < todos[lvl].length; k++) {
      const reg = todos[lvl][k];
      GameState.currentRegion = reg;
      GameState.player.inventory = GameState.player.inventory.filter(function (it) { return it.type !== 'material'; });
      const conta = function () { const o = {}; GameState.player.inventory.forEach(function (it) { if (it.type === 'material') o[it.matId] = (o[it.matId] || 0) + (it.qty || 1); }); return o; };
      let errados = 0, ganhos = 0, ids = {};
      for (let i = 0; i < 6; i++) {
        const alvo = { type: ENEMY_TYPES[3], level: 4, maxHp: 30, hp: 30, ivs: gerarIVsNaFaixa167(FAIXAS167[1]), x: 400 + i * 3, y: 400, scanned: false, setVisible: function () {}, body: { enable: true }, label: { destroy: function () {} } };
        const antes = conta();
        sc.completeScan(alvo);
        const ov = document.getElementById('scan-card-overlay'); if (ov) ov.remove();
        const depois = conta();
        Object.keys(depois).forEach(function (id) {
          const g = (depois[id] || 0) - (antes[id] || 0);
          if (g > 0) { ganhos += g; ids[id] = 1; if (tab[id] !== lvl) errados += g; }
        });
      }
      saida[reg] = { ganhos: ganhos, errados: errados, ids: Object.keys(ids).length };
    }
  }
  return JSON.stringify(saida);
})()`;

(async () => {
  console.log('\n[1] O CHÃO DOS MAPAS, NO JOGO REAL (spawn de verdade, em sessões separadas)');
  const sessoes = [
    [{ reg: 'ow_grove', lvl: 1 }, { reg: 'forest', lvl: 3 }],
    [{ reg: 'dan_hive', lvl: 1 }, { reg: 'void_rim', lvl: 3 }],
    [{ reg: 'meadow', lvl: 2 }],
  ];
  let errosSpawn = 0, tiposOk = 0, visitados = 0;
  for (const lista of sessoes) {
    let res = await medir(lista);
    if (!res || res.erro || Object.keys(res).some(k => res[k] && res[k].erro)) {
      console.log('      (sessão instável — repetindo uma vez)');
      res = await medir(lista);
    }
    if (res && res.erro) { console.log('      (sessão encerrou: ' + res.erro + ')'); continue; }
    Object.keys(res).forEach(reg => {
      const d = res[reg];
      if (d.erro) { console.log('      (sem medida em ' + reg + ': ' + d.erro + ')'); return; }
      visitados++;
      errosSpawn += d.errados;
      if (d.tipos >= 2) tiposOk++;
      console.log('      ' + reg + ' (nível ' + d.lvl + ') → cena ' + d.cena + ' · ' + d.tipos + ' tipos do tier ' + d.lvl + ' · ' + d.errados + ' errados · ' + d.classicos + ' itens clássicos');
    });
  }
  checa('cada mapa real só solta material do seu tier (30 spawns por mapa)', errosSpawn === 0 && visitados >= 4, errosSpawn + ' erros em ' + visitados + ' mapas medidos');
  checa('os mapas visitados sortearam vários tipos do nível', tiposOk === visitados && visitados >= 4, tiposOk + '/' + visitados);

  console.log('\n[2] O DROP DO SCAN usa a região onde você está');
  const r2 = JSON.parse(await sessao(async A => A.p.evaluate(DROP_SCAN)));
  let dErros = 0, dGanhos = 0, dOk = 0;
  Object.keys(r2).forEach(reg => {
    const d = r2[reg]; dErros += d.errados; dGanhos += d.ganhos; if (d.ganhos > 0) dOk++;
    console.log('      ' + reg + ' → ' + d.ganhos + ' materiais ganhos (' + d.ids + ' tipos) · ' + d.errados + ' do tier errado');
  });
  checa('o drop do scan sai sempre do tier do mapa (6 mapas × 6 scans)', dErros === 0 && dOk === 6, dErros + ' erros em ' + dGanhos + ' unidades ganhas');

  console.log('\n[3] O PAINEL: bloqueios corretos');
  const r3 = await sessao(async A => A.p.evaluate(() => {
    const p = GameState.player; p.backpackLvl = 0; p.bits = 999999;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    const t1 = matsDoTier169(1);
    t1.forEach(m => addItemToBackpack(makeMatItem(m.id, 9)));
    openClerkPanel('upgrade');
    const b9 = document.querySelector('#clerk-panel .ck169-go');
    const travado9 = b9 ? b9.disabled : true;
    t1.forEach(m => addItemToBackpack(makeMatItem(m.id, 1)));
    clerkRender();
    const b10 = document.querySelector('#clerk-panel .ck169-go');
    const liberado10 = b10 ? !b10.disabled : false;
    const bitsOk = p.bits; p.bits = 10; clerkRender();
    const bSemBits = document.querySelector('#clerk-panel .ck169-go');
    const travadoSemBits = bSemBits ? bSemBits.disabled : true;
    const avisoBits = document.querySelector('#clerk-panel .ck169-tip') ? document.querySelector('#clerk-panel .ck169-tip').textContent.replace(/\s+/g, ' ').trim() : '';
    p.bits = bitsOk;
    // tira 1 material do último tipo → falta material (aviso de material)
    removeMats([{ matId: matsDoTier169(1)[0].id, qty: 1 }]); clerkRender();
    const avisoMat = document.querySelector('#clerk-panel .ck169-tip') ? document.querySelector('#clerk-panel .ck169-tip').textContent.replace(/\s+/g, ' ').trim() : '';
    const travadoSemMaterial = document.querySelector('#clerk-panel .ck169-go').disabled;
    addItemToBackpack(makeMatItem(matsDoTier169(1)[0].id, 1)); clerkRender();
    return { travado9: travado9, liberado10: liberado10, travadoSemBits: travadoSemBits, avisoBits: avisoBits.slice(0, 70), avisoMat: avisoMat.slice(0, 70), travadoSemMaterial: travadoSemMaterial, com10: matsDoTier169(1).map(m => countMat(m.id)).join(',') };
  }));
  checa('com 9 de 10 o botão fica travado', r3.travado9);
  checa('com os 10 de cada o botão libera', r3.liberado10, r3.com10);
  checa('sem bits o botão trava e o aviso cobra os bits', r3.travadoSemBits && /bits/.test(r3.avisoBits), r3.avisoBits);
  checa('faltando 1 material o botão trava e o aviso cobra o material', r3.travadoSemMaterial && /Faltam materiais/.test(r3.avisoMat), r3.avisoMat);

  console.log('\n[4] O DEPÓSITO também paga o upgrade (mochila vazia, tudo no Depósito)');
  const r4 = await sessao(async A => A.p.evaluate(() => {
    const p = GameState.player; p.backpackLvl = 0; p.bits = 999999;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    matsDoTier169(1).forEach(m => p.storage.push({ type: 'material', matId: m.id, name: m.name, qty: 10 }));
    openClerkPanel('upgrade');
    const botao = document.querySelector('#clerk-panel .ck169-go');
    const liberado = botao && !botao.disabled;
    const antes = { lvl: p.backpackLvl, slots: getBackpackMax(), deposito: p.storage.length };
    upgradeBackpack();
    return { liberado: liberado, antes: antes, depois: { lvl: p.backpackLvl, slots: getBackpackMax(), deposito: p.storage.length }, restou: matsDoTier169(1).map(m => countMat(m.id)).join(',') };
  }));
  checa('com tudo no Depósito o botão libera', r4.liberado);
  checa('o upgrade consome do Depósito e sobe o nível', r4.depois.lvl === r4.antes.lvl + 1 && r4.depois.slots === r4.antes.slots + 2 && r4.depois.deposito === 0, 'nível ' + r4.antes.lvl + '→' + r4.depois.lvl + ' · slots ' + r4.antes.slots + '→' + r4.depois.slots + ' · depósito ' + r4.antes.deposito + '→' + r4.depois.deposito);
  checa('os 10 de cada saíram do Depósito (0 restantes)', r4.restou === '0,0,0,0,0', r4.restou);

  console.log('\n[5] OS 5 UPGRADES EM SEQUÊNCIA (nível 0 → máximo)');
  const r5 = await sessao(async A => A.p.evaluate(() => {
    const p = GameState.player; p.backpackLvl = 0; p.bits = 999999;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    const porDoMaterial = function (matId, qty) {
      const ex = p.inventory.find(function (it) { return it.type === 'material' && it.matId === matId; });
      if (ex) ex.qty = qty; else p.inventory.push({ type: 'material', matId: matId, name: getGroundMat(matId).name, icon: getGroundMat(matId).icon, qty: qty });
    };
    const passos = [];
    let consumidoTotal = 0, consumoErrado = 0, essencial = 0;
    for (let i = 0; i < 5; i++) {
      const custo = upgradeCost(p.backpackLvl);
      const unidades = custo.reduce(function (a, r) { return a + r.qty; }, 0);
      // repõe exatamente o que cada upgrade pede (+5 de folga) para medir o consumo
      custo.forEach(function (r) { porDoMaterial(r.matId, r.qty + 5); });
      // e deixa 0 nos materiais que NÃO fazem parte deste upgrade (têm de sobrar intactos)
      const naLista = {}; custo.forEach(function (r) { naLista[r.matId] = 1; });
      GROUND_MATS.forEach(function (m) { if (!naLista[m.id]) p.inventory = p.inventory.filter(function (it) { return !(it.type === 'material' && it.matId === m.id); }); });
      const antesDos15 = {}; GROUND_MATS.forEach(function (m) { antesDos15[m.id] = countMat(m.id); });
      openClerkPanel('upgrade');
      const botao = document.querySelector('#clerk-panel .ck169-go');
      const liberado = botao && !botao.disabled;
      const lvlAntes = p.backpackLvl, bitsAntes = p.bits;
      upgradeBackpack();
      let gastoDeste = 0, sobrouDoPrimeiro = null;
      custo.forEach(function (r) {
        const d = antesDos15[r.matId] - countMat(r.matId);
        gastoDeste += d;
        if (countMat(r.matId) !== 5) consumoErrado++;                  // pediu qty+5 → tem de sobrar 5
        if (sobrouDoPrimeiro === null) sobrouDoPrimeiro = countMat(r.matId);
      });
      // nada de outro material pode ter sido tocado
      let tocouOutro = 0;
      GROUND_MATS.forEach(function (m) { if (!naLista[m.id] && countMat(m.id) !== 0) tocouOutro++; });
      consumidoTotal += gastoDeste; essencial += unidades;
      passos.push({ n: i + 1, tipos: custo.length, qtd: custo[0].qty, unidades: unidades, gasto: gastoDeste, tocouOutro: tocouOutro, liberado: liberado, de: lvlAntes, para: p.backpackLvl, slots: getBackpackMax(), bits: bitsAntes - p.bits });
    }
    const gastoTotal = consumidoTotal;
    openClerkPanel('upgrade');
    const maxSelo = !!document.querySelector('#clerk-panel .ck169-max');
    const semBotao = !document.querySelector('#clerk-panel .ck169-go');
    const fala = document.querySelector('#clerk-panel .ck169-note') ? document.querySelector('#clerk-panel .ck169-note').textContent.replace(/\s+/g, ' ').trim() : '';
    const cartoes = document.querySelectorAll('#clerk-panel .ck169-slot').length;
    return { passos: passos, gastoTotal: gastoTotal, essencial: essencial, consumoErrado: consumoErrado, maxSelo: maxSelo, semBotao: semBotao, fala: fala.slice(0, 220), cartoes: cartoes, lvl: p.backpackLvl, slots: getBackpackMax() };
  }));
  r5.passos.forEach(s => console.log('      upgrade ' + s.n + ': ' + s.tipos + ' tipos ×' + s.qtd + ' = ' + s.unidades + ' unidades (consumiu ' + s.gasto + ', tocou outro material: ' + s.tocouOutro + ') · nível ' + s.de + '→' + s.para + ' · slots ' + s.slots + ' · bits ' + s.bits + ' · liberado=' + s.liberado));
  const esperadoUnid = [50, 100, 100, 200, 150];
  checa('os 5 upgrades cobraram exatamente 50/100/100/200/150 unidades', r5.passos.every((s, i) => s.unidades === esperadoUnid[i] && s.liberado), r5.passos.map(s => s.unidades).join('·'));
  checa('cada upgrade consumiu exatamente o que cobrou e nada mais (600 no total)', r5.gastoTotal === 600 && r5.essencial === 600 && r5.consumoErrado === 0 && r5.passos.every(s => s.tocouOutro === 0), r5.gastoTotal + ' consumidas · ' + r5.consumoErrado + ' contagens fora do esperado');
  checa('nível final 5 com 15 slots', r5.lvl === 5 && r5.slots === 15, 'nível ' + r5.lvl + ' · slots ' + r5.slots);
  checa('no máximo: selo ✓, sem botão, 15 cartões e a fala coerente', r5.maxSelo && r5.semBotao && r5.cartoes === 15 && /nível 3/.test(r5.fala), 'selo=' + r5.maxSelo + ' semBotao=' + r5.semBotao + ' cartões=' + r5.cartoes + ' fala="' + r5.fala.slice(100, 160) + '"');

  console.log('\n[6] O RESTO DO JOGO SEGUE INTEIRO');
  const r6 = await sessao(async A => A.p.evaluate(() => {
    const p = GameState.player; p.backpackLvl = 0;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    addItemToBackpack(makeMatItem('gema', 7)); addItemToBackpack(makeMatItem('fenix', 4));
    renderDepositUI();
    storageStore(GameState.player.inventory.findIndex(it => it.matId === 'gema'));
    const guardado = p.storage.length && p.storage[0].matId ? p.storage[0].matId + ' x' + p.storage[0].qty : 'nada';
    openClerkPanel('craft');
    const forjaAntigo = !document.getElementById('clerk-panel').classList.contains('ck169');
    const linhas = document.querySelectorAll('#clerk-panel .ck-row').length;
    closeClerkPanel();
    return {
      guardado: guardado, forjaAntigo: forjaAntigo, linhas: linhas,
      rec: KEY_RECIPE.map(function (r) { return r.matId + ' x' + r.qty; }).join(' + '),
      classicos: MATERIAL_TYPES.length, titulo: document.title
    };
  }));
  checa('os materiais novos entram no Depósito', /gema x7/.test(r6.guardado), r6.guardado);
  checa('a receita da Drome Key (FORJA-7) não mudou', r6.rec === 'cristal x2 + dente x1 + retalho x1', r6.rec);
  checa('o painel do FORJA-7 segue no layout antigo', r6.forjaAntigo && r6.linhas === 3, r6.linhas + ' linhas');
  checa('os materiais clássicos do leilão continuam existindo', r6.classicos === 6, r6.classicos + ' tipos clássicos');
  checa('o título do jogo é o da v2.32', /v2\.32/.test(r6.titulo), r6.titulo);

  console.log('\nRESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌');
  process.exit(FALHOU ? 1 : 0);
})().catch(e => { console.error('FALHA GERAL: ' + (e.stack || e.message).slice(0, 400)); process.exit(1); });
