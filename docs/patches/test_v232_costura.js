// v2.32 (v169) — MATERIAIS POR NÍVEL + CUSTO DO UPGRADE + PAINEL NOVO DA COSTURA-11
const { puppeteer, sleep, CHROME, novoJogador } = require('/tmp/pptr/lib_chaos.js');
let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) { console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); cond ? OK++ : FALHOU++; }
(async () => {
  const b = await puppeteer.launch({ headless: true, args: CHROME, protocolTimeout: 400000 });
  const A = await novoJogador(b, 'S');
  await A.p.bringToFront();
  await A.p.evaluate(() => { GameState.player.lvl = 99; GameState.player.visitedRegions = REGIONS.map(r => r.id); });

  console.log('\n[1] OS 15 MATERIAIS EM 3 TIERS');
  const t1 = await A.p.evaluate(() => ({
    total: GROUND_MATS.length,
    porTier: [1, 2, 3].map(t => matsDoTier169(t).length),
    nomes3: matsDoTier169(3).map(m => m.name + ' ' + m.icon),
    texturas: [1, 2, 3].map(t => matsDoTier169(t).every(m => !!m.tex)),
    ids: GROUND_MATS.map(m => m.id).length === new Set(GROUND_MATS.map(m => m.id)).size,
  }));
  checa('15 materiais, 5 por tier', t1.total === 15 && t1.porTier.join('/') === '5/5/5', t1.total + ' materiais (' + t1.porTier.join(' · ') + ')');
  checa('todos têm textura própria', t1.texturas.every(x => x));
  checa('sem id repetido', t1.ids);
  console.log('      tier 3: ' + t1.nomes3.join(' · '));

  console.log('\n[2] CADA NÍVEL DE MAPA DROPA O SEU TIER');
  const t2 = await A.p.evaluate(() => {
    const tierPorMapa = {};
    ['ow_grove', 'uw_ember', 'dan_hive', 'mip_oasis', 'meadow', 'lava_cave', 'swamp', 'time_ruins', 'forest', 'mountain', 'void_rim', 'mp_mirage', 'lac_black'].forEach(r => { tierPorMapa[r] = tierDaRegiao169(r); });
    // 2.000 sorteios por região: só pode sair material do tier dela
    const res = {};
    ['ow_grove', 'meadow', 'forest', 'lac_black'].forEach(r => {
      const t = tierDaRegiao169(r); const vistos = {}; let errado = 0;
      for (let i = 0; i < 2000; i++) { const m = rollGroundMat(r); vistos[m.id] = 1; if (m.tier !== t) errado++; }
      res[r] = { tier: t, tipos: Object.keys(vistos).length, errado: errado };
    });
    return { tierPorMapa: tierPorMapa, res: res };
  });
  console.log('      tiers: ' + Object.keys(t2.tierPorMapa).map(k => k + '=' + t2.tierPorMapa[k]).join(' '));
  checa('os 4 mapas de nível 1 = tier 1', ['ow_grove', 'uw_ember', 'dan_hive', 'mip_oasis'].every(r => t2.tierPorMapa[r] === 1));
  checa('os 4 mapas de nível 2 = tier 2', ['meadow', 'lava_cave', 'swamp', 'time_ruins'].every(r => t2.tierPorMapa[r] === 2));
  checa('os mapas 3 e a Lagoa Negra = tier 3', ['forest', 'mountain', 'void_rim', 'mp_mirage', 'lac_black'].every(r => t2.tierPorMapa[r] === 3));
  checa('2.000 sorteios por mapa: 0 material do tier errado', Object.keys(t2.res).every(k => t2.res[k].errado === 0), Object.keys(t2.res).map(k => k + ': ' + t2.res[k].tipos + ' tipos').join(' · '));

  console.log('\n[3] CUSTO DO UPGRADE (5×10 · 5×20 · 10×10 · 10×20 · 15×10)');
  const t3 = await A.p.evaluate(() => {
    const out = [];
    for (let lvl = 0; lvl <= 4; lvl++) {
      const c = upgradeCost(lvl);
      const qs = {}; c.forEach(r => { qs[r.qty] = (qs[r.qty] || 0) + 1; });
      const tiers = {}; c.forEach(r => { const m = getGroundMat(r.matId); tiers[m.tier] = (tiers[m.tier] || 0) + 1; });
      out.push({ lvl: lvl, itens: c.length, qs: JSON.stringify(qs), tiers: JSON.stringify(tiers) });
    }
    return out;
  });
  t3.forEach(o => console.log('      upg ' + (o.lvl + 1) + ': ' + o.itens + ' materiais · quantidades ' + o.qs + ' · tiers ' + o.tiers));
  checa('upg1: 5 materiais ×10 (tier 1)', t3[0].itens === 5 && t3[0].qs === '{"10":5}' && t3[0].tiers === '{"1":5}');
  checa('upg2: 5 ×20 (tier 1)', t3[1].itens === 5 && t3[1].qs === '{"20":5}' && t3[1].tiers === '{"1":5}');
  checa('upg3: 10 ×10 (tiers 1+2)', t3[2].itens === 10 && t3[2].qs === '{"10":10}' && t3[2].tiers === '{"1":5,"2":5}');
  checa('upg4: 10 ×20 (tiers 1+2)', t3[3].itens === 10 && t3[3].qs === '{"20":10}' && t3[3].tiers === '{"1":5,"2":5}');
  checa('upg5: 15 ×10 (tiers 1+2+3)', t3[4].itens === 15 && t3[4].qs === '{"10":15}' && t3[4].tiers === '{"1":5,"2":5,"3":5}');

  console.log('\n[4] O PAINEL NOVO (mesa holográfica)');
  const t4 = await A.p.evaluate(() => {
    GameState.player.backpackLvl = 0;
    openClerkPanel('upgrade');
    const el = document.getElementById('clerk-panel');
    const temClasse = el.classList.contains('ck169');
    const slots = el.querySelectorAll('.ck169-slot').length;
    const pack = !!el.querySelector('.ck169-pack svg');
    const braços = el.querySelectorAll('.ck169-arm').length;
    const titulo = (el.querySelector('.ck169-title') || {}).textContent || '';
    const badge = (el.querySelector('.ck169-badge') || {}).textContent || '';
    const sub = (el.querySelector('.ck169-sub') || {}).textContent || '';
    const botao = !!el.querySelector('.ck169-go');
    // nível 3: 10 cartões
    GameState.player.backpackLvl = 2; clerkRender();
    const slots3 = document.querySelectorAll('#clerk-panel .ck169-slot').length;
    // nível máximo: 15 cartões + selo de máximo
    GameState.player.backpackLvl = 5; clerkRender();
    const slotsMax = document.querySelectorAll('#clerk-panel .ck169-slot').length;
    const maxSelo = !!document.querySelector('#clerk-panel .ck169-max');
    const semBotao = !document.querySelector('#clerk-panel .ck169-go');
    GameState.player.backpackLvl = 0;
    return { temClasse: temClasse, slots: slots, pack: pack, bracos: braços, titulo: titulo.trim(), badge: badge.trim(), sub: sub.replace(/\s+/g, ' ').trim(), botao: botao, slots3: slots3, slotsMax: slotsMax, maxSelo: maxSelo, semBotao: semBotao };
  });
  checa('o painel usa o layout novo (.ck169)', t4.temClasse);
  checa('mochila em wireframe + 2 braços robóticos', t4.pack && t4.bracos === 2);
  checa('nível 1 → 5 cartões de material; nível 3 → 10; máximo → 15', t4.slots === 5 && t4.slots3 === 10 && t4.slotsMax === 15, t4.slots + ' / ' + t4.slots3 + ' / ' + t4.slotsMax);
  checa('cabeçalho com nome, nível e slots', /COSTURA-11/.test(t4.titulo) && /nível 0\/5/.test(t4.sub) && /slots 5/.test(t4.sub), t4.titulo.trim() + ' | ' + t4.sub.slice(0, 70));
  checa('rodapé com o selo do upgrade e os bits', /UPGRADE 1\/5/.test(t4.badge) && /bits/.test(t4.badge), t4.badge);
  checa('no máximo: selo ✓ e sem botão', t4.maxSelo && t4.semBotao);

  console.log('\n[5] O UPGRADE FUNCIONA (consome e sobe os slots)');
  const t5 = await A.p.evaluate(() => {
    const p = GameState.player;
    p.backpackLvl = 0; p.bits = 99999;
    p.inventory = p.inventory.filter(it => it.type !== 'material');
    p.storage = [];
    // dá os materiais do tier 1 com 10 de cada
    matsDoTier169(1).forEach(m => addItemToBackpack(makeMatItem(m.id, 10)));
    openClerkPanel('upgrade');
    const botao = document.querySelector('#clerk-panel .ck169-go');
    const habilitado = botao && !botao.disabled;
    const antes = { lvl: p.backpackLvl, slots: getBackpackMax(), bits: p.bits };
    upgradeBackpack();
    const depois = { lvl: p.backpackLvl, slots: getBackpackMax(), bits: p.bits, mats: matsDoTier169(1).map(m => countMat(m.id)) };
    // o nível 2 pede 20 de cada: com 0 não pode habilitar
    clerkRender();
    const botao2 = document.querySelector('#clerk-panel .ck169-go');
    return { habilitado: habilitado, antes: antes, depois: depois, botao2Desabilitado: botao2 ? botao2.disabled : true, cards: document.querySelectorAll('#clerk-panel .ck169-slot').length };
  });
  checa('com os 5 materiais ×10 o botão habilita', t5.habilitado, t5.cards + ' cartões no painel');
  checa('o upgrade sobe o nível e os slots (+2)', t5.depois.lvl === t5.antes.lvl + 1 && t5.depois.slots === t5.antes.slots + 2, 'nível ' + t5.antes.lvl + '→' + t5.depois.lvl + ' · slots ' + t5.antes.slots + '→' + t5.depois.slots);
  checa('os 10 de cada foram consumidos', t5.depois.mats.every(q => q === 0), 'restou: ' + t5.depois.mats.join(','));
  checa('o nível 2 pede 20 de cada (botão trava sem material)', t5.botao2Desabilitado);

  console.log('\n[6] REGRESSÕES');
  const t6 = await A.p.evaluate(() => {
    // a Drome paga tier 3
    const tiersDrome = []; for (let i = 0; i < 40; i++) tiersDrome.push(rollGroundMat('mp_mirage').tier);
    // o painel do FORJA (craft) continua no layout antigo
    openClerkPanel('craft');
    const craftAntigo = !document.getElementById('clerk-panel').classList.contains('ck169');
    const temReceita = document.querySelectorAll('#clerk-panel .ck-row').length;
    const etiquetas = Array.prototype.map.call(document.querySelectorAll('#clerk-panel .ck-tier169'), e => e.textContent);
    const rec = KEY_RECIPE.map(r => r.matId + ' x' + r.qty).join(' + ');
    closeClerkPanel();
    // o inventário enxerga os materiais novos
    const novoItem = makeMatItem('gema', 3);
    addItemToBackpack(novoItem);
    return { tiersDrome: Array.from(new Set(tiersDrome)).join(','), craftAntigo: craftAntigo, linhasReceita: temReceita, etiquetas: etiquetas, rec: rec, itemNovo: novoItem.name + ' x' + countMat('gema') };
  });
  checa('a Drome só dá materiais do tier 3', t6.tiersDrome === '3');
  checa('o painel do FORJA-7 (craft de chave) segue como era', t6.craftAntigo && t6.linhasReceita >= 3, t6.linhasReceita + ' linhas de receita');
  checa('a receita do FORJA-7 mostra de que nível de mapa vem cada material', t6.etiquetas.join('|') === 'MAPAS 2|MAPAS 1|MAPAS 2', t6.etiquetas.join(' · '));
  checa('e o custo da receita não mudou', t6.rec === 'cristal x2 + dente x1 + retalho x1', t6.rec);
  checa('os materiais novos entram na mochila', /Gema Estelar/.test(t6.itemNovo), t6.itemNovo);

  console.log('\nerros de página: ' + JSON.stringify(A.errs.slice(0, 4)));
  console.log('\nRESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌');
  await b.close();
  process.exit(FALHOU ? 1 : 0);
})().catch(e => { console.error('FALHA GERAL: ' + (e.stack || e.message)); process.exit(1); });
