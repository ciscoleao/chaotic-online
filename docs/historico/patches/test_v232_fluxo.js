// v2.32 (v169) — FLUXO DO JOGADOR: abrir o painel pelo NPC COSTURA-11 no Pátio Central ([E]),
// clicar no botão com o mouse, coletar material do chão andando em cima, e o painel no CELULAR.
const { puppeteer, sleep, CHROME, novoJogador } = require('/tmp/pptr/lib_chaos.js');
let OK = 0, FALHOU = 0;
function checa(nome, cond, detalhe) { console.log('   ' + (cond ? '✅' : '❌') + ' ' + nome + (detalhe ? ' — ' + detalhe : '')); cond ? OK++ : FALHOU++; }
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8960';
(async () => {
  const b = await puppeteer.launch({ headless: true, args: CHROME, protocolTimeout: 300000 });
  const A = await novoJogador(b, 'L');
  await A.p.setViewport({ width: 1280, height: 800 });
  await A.p.bringToFront();
  await A.p.evaluate(() => { GameState.player.lvl = 99; GameState.player.visitedRegions = REGIONS.map(r => r.id); GameState.player.bits = 99999; });
  await sleep(1500);

  console.log('\n[1] O CAÇADOR ANDA ATÉ O BALCÃO E APERTA [E] (sem chamar função nenhuma)');
  await A.p.evaluate(() => travelTo('portico'));
  await sleep(2600);
  const andar = await A.p.evaluate(`(function () {
    const sc = game.scene.getScene('PorticoScene') || game.scene.getScene('PerimScene');
    const p = sc.player;
    let alvo = null;
    sc.interactables.forEach(function (it) {
      const t = (it.hint && it.hint.text) ? it.hint.text : '';
      if (t.indexOf('Upgrade') >= 0 || t.indexOf('UPGRADE') >= 0) alvo = it;
    });
    if (!alvo) return JSON.stringify({ erro: 'balcao nao encontrado', dicas: sc.interactables.map(function (i) { return i.hint ? i.hint.text : '?'; }) });
    p.setPosition(alvo.x, alvo.y + 26);
    sc.cameras.main.centerOn(p.x, p.y);
    return JSON.stringify({ cena: sc.scene.key, balcao: [Math.round(alvo.x), Math.round(alvo.y)], dica: alvo.hint.text, heroi: [Math.round(p.x), Math.round(p.y)] });
  })()`);
  console.log('      ' + andar);
  await sleep(700);
  await A.p.keyboard.press('KeyE');
  await sleep(900);
  const painel = await A.p.evaluate(() => {
    const el = document.getElementById('clerk-panel');
    return JSON.stringify({
      aberto: !!(el && el.classList.contains('open')),
      novo: !!(el && el.classList.contains('ck169')),
      cartoes: el ? el.querySelectorAll('.ck169-slot').length : 0,
      sub: el && el.querySelector('.ck169-sub') ? el.querySelector('.ck169-sub').textContent.replace(/\s+/g, ' ').trim() : '',
      titulo: el && el.querySelector('.ck169-title') ? el.querySelector('.ck169-title').textContent.trim() : ''
    });
  });
  const pj = JSON.parse(painel);
  console.log('      painel: ' + painel);
  checa('o [E] no balcão abriu o painel do COSTURA-11', pj.aberto && pj.novo && /UPGRADE DA MOCHILA/.test(pj.sub) && /COSTURA-11/.test(pj.titulo), pj.titulo + ' | ' + pj.sub);
  checa('ábriu no nível 0 com os 5 cartões do tier 1', pj.cartoes === 5, pj.cartoes + ' cartões');

  console.log('\n[2] CLIQUE DE MOUSE NO BOTÃO (não é chamada de função)');
  await A.p.evaluate(() => {
    const p = GameState.player;
    p.backpackLvl = 0; p.bits = 99999;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    matsDoTier169(1).forEach(m => addItemToBackpack(makeMatItem(m.id, 10)));
    clerkRender();
  });
  await sleep(500);
  const antes = await A.p.evaluate(() => ({ lvl: GameState.player.backpackLvl, slots: getBackpackMax(), bits: GameState.player.bits }));
  const cx = await A.p.evaluate(() => { const r = document.querySelector('#clerk-panel .ck169-go').getBoundingClientRect(); return JSON.stringify([r.x + r.width / 2, r.y + r.height / 2, r.y > 0 && r.y < innerHeight]); });
  const [gx, gy, naTela] = JSON.parse(cx);
  await A.p.mouse.click(gx, gy);
  await sleep(900);
  const depois = await A.p.evaluate(() => {
    const el = document.getElementById('clerk-panel');
    const notif = document.querySelector('.notif, #notif-area, .notification');
    return {
      lvl: GameState.player.backpackLvl, slots: getBackpackMax(), bits: GameState.player.bits,
      mats: matsDoTier169(1).map(m => countMat(m.id)).join(','),
      sub: el && el.querySelector('.ck169-sub') ? el.querySelector('.ck169-sub').textContent.replace(/\s+/g, ' ').trim() : '',
      cartoes: el ? el.querySelectorAll('.ck169-slot').length : 0,
      aviso: document.body.innerText.indexOf('Mochila melhorada') >= 0 || document.body.innerText.indexOf('melhorada') >= 0
    };
  });
  console.log('      antes: nível ' + antes.lvl + ' slots ' + antes.slots + ' bits ' + antes.bits + ' → depois: nível ' + depois.lvl + ' slots ' + depois.slots + ' bits ' + depois.bits);
  checa('o clique no botão subiu o nível de verdade', naTela && depois.lvl === 1 && depois.slots === 7 && depois.bits === antes.bits - 250, 'nível ' + depois.lvl + ' · slots ' + depois.slots + ' · bits -' + (antes.bits - depois.bits));
  checa('os 10 de cada sumiram da mochila', depois.mats === '0,0,0,0,0', depois.mats);
  checa('o painel já se redesenhou no nível 1 (5 cartões de novo)', depois.cartoes === 5 && /nível 1\/5/.test(depois.sub), depois.sub);

  console.log('\n[3] COLETAR O MATERIAL DO CHÃO ANDANDO EM CIMA (tier 3, na Borda do Vazio)');
  const coletou = await A.p.evaluate(`(async function () {
    closeClerkPanel();
    travelTo('void_rim');
    await new Promise(function (r) { setTimeout(r, 2600); });
    const sc = game.scene.getScene('PerimScene');
    const p = sc.player;
    GameState.player.inventory = GameState.player.inventory.filter(function (it) { return it.type !== 'material'; });
    const gm = rollGroundMat('void_rim');
    const antes = countMat(gm.id);
    const g = sc.materials.create(p.x, p.y, gm.tex);
    g.matType = { id: gm.id, name: gm.name, color: '#9fe870', ground: true };
    g.setDepth(4); g.setScale(0.95);
    const t0 = Date.now();
    while (Date.now() - t0 < 6000 && countMat(gm.id) === antes) {
      await new Promise(function (r) { setTimeout(r, 120); });
    }
    return JSON.stringify({ tier: gm.tier, nome: gm.name, antes: antes, depois: countMat(gm.id), ganhou: countMat(gm.id) - antes, itensNoChao: sc.materials.getChildren().length });
  })()`);
  const col = JSON.parse(coletou);
  console.log('      ' + coletou);
  checa('o herói coletou o material do tier 3 ao passar por cima', col.ganhou >= 1 && col.tier === 3, col.nome + ' ×' + col.ganhou);

  console.log('\n[4] OS BLOCOS DE TEXTO DO PAINEL NO NÍVEL 1 (mensagem de sucesso)');
  const msg = await A.p.evaluate(() => {
    const p = GameState.player; p.backpackLvl = 0; p.bits = 99999;
    p.inventory = p.inventory.filter(it => it.type !== 'material'); p.storage = [];
    matsDoTier169(1).forEach(m => addItemToBackpack(makeMatItem(m.id, 10)));
    openClerkPanel('upgrade');
    upgradeBackpack();
    const txt = document.body.innerText;
    return { melhorada: txt.indexOf('Mochila melhorada') >= 0 || txt.indexOf('melhorada') >= 0, nivel: p.backpackLvl };
  });
  checa('o aviso de sucesso aparece ("mochila melhorada")', msg.melhorada && msg.nivel === 1, 'nível ' + msg.nivel);

  await b.close();

  console.log('\n[5] O PAINEL NO CELULAR (390×844), com os 15 cartões');
  const b2 = await puppeteer.launch({ headless: true, args: CHROME, protocolTimeout: 300000 });
  const M = await novoJogador(b2, 'M');
  await M.p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await M.p.bringToFront();
  await M.p.evaluate(() => { GameState.player.lvl = 99; GameState.player.backpackLvl = 5; GameState.player.bits = 9999; applyUiMode('mobile'); });
  await sleep(800);
  await sleep(1500);
  await M.p.evaluate(() => openClerkPanel('upgrade'));
  await sleep(1000);
  const mob = await M.p.evaluate(() => {
    const el = document.getElementById('clerk-panel');
    const shell = el.querySelector('.ck169-shell') || el;
    const botao = el.querySelector('.ck169-desk .ck169-go, .ck169-desk .ck169-max, .ck169-desk');
    const r = botao ? botao.getBoundingClientRect() : null;
    const grade = el.querySelector('.ck169-bottom');
    const cols = grade ? getComputedStyle(grade).gridTemplateColumns.split(' ').length : 0;
    const painel = el.getBoundingClientRect();
    return {
      largura: Math.round(painel.width), altura: Math.round(painel.height),
      cartoes: el.querySelectorAll('.ck169-slot').length,
      botaoVisivel: r ? (r.y >= 0 && r.bottom <= innerHeight + 2 && r.x >= 0 && r.right <= innerWidth + 2) : false,
      sticky: getComputedStyle(el.querySelector('.ck169-desk')).position,
      colsBaixo: cols,
      scrollH: shell.scrollHeight, clientH: shell.clientHeight,
      vazaHorizontal: document.documentElement.scrollWidth > innerWidth + 2,
      mochila: getComputedStyle(el.querySelector('.ck169-pack')).display,
      chat: (function () { const c = document.getElementById('gc-panel'); return c ? getComputedStyle(c).display : 'n/a'; })(),
      corpo: document.body.className
    };
  });
  console.log('      ' + JSON.stringify(mob));
  checa('no celular o painel cabe na tela e não vaza para o lado', !mob.vazaHorizontal && mob.largura <= 390, mob.largura + 'px de largura');
  checa('o rodapé (selo/botão) fica SEMPRE visível no celular', mob.botaoVisivel && mob.sticky === 'sticky', 'visível=' + mob.botaoVisivel + ' · posição=' + mob.sticky + ' · conteúdo=' + mob.scrollH + 'px em ' + mob.clientH + 'px');
  checa('os 15 cartões entram em blocos de 2 no celular', mob.cartoes === 15 && mob.colsBaixo === 2, mob.cartoes + ' cartões · ' + mob.colsBaixo + ' colunas embaixo');
  checa('com o painel aberto o CHAT sai da frente no celular', mob.chat === 'none' && /mobile-ui/.test(mob.corpo) && /ck-open/.test(mob.corpo), 'chat=' + mob.chat + ' · body="' + mob.corpo + '"');
  await M.p.screenshot({ path: '/home/user/print_v232_celular_max.png' });
  await M.p.evaluate(() => { GameState.player.backpackLvl = 0; clerkRender(); });
  await sleep(700);
  await M.p.screenshot({ path: '/home/user/print_v232_celular.png' });
  console.log('      prints do celular salvos');
  const voltou = await M.p.evaluate(() => { closeClerkPanel(); const c = document.getElementById('gc-panel'); return JSON.stringify({ chat: getComputedStyle(c).display, corpo: document.body.className }); });
  const vt = JSON.parse(voltou);
  checa('ao fechar o painel o CHAT volta', vt.chat !== 'none' && !/ck-open/.test(vt.corpo), 'chat=' + vt.chat + ' · body="' + vt.corpo + '"');
  console.log('\nRESULTADO: ' + OK + ' ✅ · ' + FALHOU + ' ❌');
  await b2.close();
  process.exit(FALHOU ? 1 : 0);
})().catch(e => { console.error('FALHA GERAL: ' + (e.stack || e.message).slice(0, 400)); process.exit(1); });
