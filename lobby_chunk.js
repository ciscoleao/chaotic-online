  // ============ VIDA NO PATIO: robos, drones, anuncios, scans, quarto ============
  /*__LOBBY_SPRITES__*/
  function lobbySpriteCanvas(def) {
    const cv = document.createElement('canvas');
    cv.width = def.w; cv.height = def.h;
    const ctx = cv.getContext('2d');
    const re = /(\d+)(\.|[a-z])/g;
    let m, x = 0, y = 0;
    while ((m = re.exec(def.data)) !== null) {
      const n = parseInt(m[1], 10), ch = m[2];
      if (ch !== '.') { ctx.fillStyle = def.palette[ch.charCodeAt(0) - 97]; ctx.fillRect(x, y, n, 1); }
      x += n;
      if (x >= def.w) { y += Math.floor(x / def.w); x = x % def.w; }
    }
    return cv;
  }
  function ensureLobbyTextures(sc) {
    Object.keys(LOBBY_SPRITES).forEach(k => {
      if (!sc.textures.exists(k)) {
        try { sc.textures.addCanvas(k, lobbySpriteCanvas(LOBBY_SPRITES[k])); } catch (e) { /* sem textura: segue o jogo */ }
      }
    });
  }
  // ---------- meta-dados persistentes (anuncios, scans, quarto) ----------
  const ANNOUNCE_COST = 25, ANNOUNCE_MAX = 20;
  const ADS_KEY = 'chaotic_ads_v1', SCANS_KEY = 'chaotic_scans_v1', ROOM_KEY = 'chaotic_room_v1';
  const SCAN_SECTORS = ['roleta', 'portal', 'shop', 'forja', 'leilao', 'deposito', 'missoes', 'comunicacao'];
  const SCAN_INFO = {
    roleta: ['🎡', 'Roleta'], portal: ['🌀', 'Portal'], shop: ['🛒', 'Shop'], forja: ['⚒️', 'Forja'],
    leilao: ['🔨', 'Leilão'], deposito: ['📦', 'Depósito'], missoes: ['📋', 'Missões'], comunicacao: ['📡', 'Comunicação']
  };
  const SEED_ADS = [
    { name: '📡 Central', text: 'Bem-vindo ao Pátio Central! Complete seu Álbum de Scans visitando os 8 setores.', ts: 0 },
    { name: '📡 Central', text: 'Anuncie no letreiro do pátio! Fale com a Operadora na Comunicação. Só 25 BITS.', ts: 0 }
  ];
  function metaStore() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__chaotic_t', '1'); localStorage.removeItem('__chaotic_t');
        return localStorage;
      }
    } catch (e) { /* sem localStorage: memoria */ }
    if (!metaStore.mem) metaStore.mem = {};
    const mem = metaStore.mem;
    return {
      getItem: k => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: k => { delete mem[k]; }
    };
  }
  function adsList(store) {
    try {
      const raw = store.getItem(ADS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.filter(a => a && typeof a.text === 'string').slice(0, ANNOUNCE_MAX);
      }
    } catch (e) { /* lista padrao */ }
    return SEED_ADS.map(a => ({ name: a.name, text: a.text, ts: a.ts }));
  }
  function adsPublish(store, name, text, bits) {
    const clean = String(text === undefined || text === null ? '' : text).trim().replace(/\s+/g, ' ');
    if (clean.length < 2) return { ok: false, reason: 'Escreva uma mensagem maior.' };
    if (clean.length > 90) return { ok: false, reason: 'Máximo de 90 caracteres.' };
    if (!(bits >= ANNOUNCE_COST)) return { ok: false, reason: 'BITS insuficientes (custa ' + ANNOUNCE_COST + ').' };
    const entry = { name: String(name || 'Caçador').slice(0, 20), text: clean, ts: Date.now() };
    const list = [entry].concat(adsList(store)).slice(0, ANNOUNCE_MAX);
    try { store.setItem(ADS_KEY, JSON.stringify(list)); } catch (e) { /* mostra mesmo assim */ }
    return { ok: true, entry, bits: bits - ANNOUNCE_COST };
  }
  function scansGet(store) {
    let obj = {};
    try { obj = JSON.parse(store.getItem(SCANS_KEY) || '{}') || {}; } catch (e) { obj = {}; }
    const out = {};
    SCAN_SECTORS.forEach(id => { if (obj[id]) out[id] = obj[id]; });
    return out;
  }
  function scansCollect(store, id) {
    const cur = scansGet(store);
    if (SCAN_SECTORS.indexOf(id) < 0) return { isNew: false, count: Object.keys(cur).length };
    if (cur[id]) return { isNew: false, count: Object.keys(cur).length };
    cur[id] = Date.now();
    try { store.setItem(SCANS_KEY, JSON.stringify(cur)); } catch (e) { /* segue o jogo */ }
    return { isNew: true, count: Object.keys(cur).length };
  }
  function collectScanFor(id) {
    if (SCAN_SECTORS.indexOf(id) < 0) return;
    const r = scansCollect(metaStore(), id);
    if (r.isNew) {
      const z = SECTORS.find(s => s.id === id);
      showNotif('📡 Scan registrado: ' + (z ? z.name : id) + ' (' + r.count + '/8)', 'success');
      if (r.count >= SCAN_SECTORS.length) showNotif('🏆 Álbum de scans completo!', 'success');
    }
  }
  // ---------- quarto: dados ----------
  const ROOM_BOUNDS = { x0: 300, y0: 335, x1: 900, y1: 715 };
  const ROOM_ITEMS = {
    cama:     { name: 'Cama',     tex: 'room_cama',     scale: 2, foot: [80, 44] },
    bau:      { name: 'Baú',      tex: 'room_bau',      scale: 2, foot: [44, 30] },
    fornalha: { name: 'Fornalha', tex: 'room_fornalha', scale: 2, foot: [52, 40] },
    bancada:  { name: 'Bancada',  tex: 'room_bancada',  scale: 2, foot: [72, 40] },
    lampada:  { name: 'Lâmpada',  tex: 'room_lampada',  scale: 2, foot: [24, 20] },
    estante:  { name: 'Estante',  tex: 'room_estante',  scale: 2, foot: [64, 32] },
    planta:   { name: 'Planta',   tex: 'room_planta',   scale: 2, foot: [28, 26] },
    console:  { name: 'Console',  tex: 'room_console',  scale: 2, foot: [46, 36] }
  };
  const ROOM_DEFAULTS = [
    { id: 'estante', x: 600, y: 380 }, { id: 'cama', x: 380, y: 430 }, { id: 'lampada', x: 800, y: 400 },
    { id: 'bau', x: 335, y: 600 }, { id: 'bancada', x: 700, y: 580 }, { id: 'fornalha', x: 470, y: 620 },
    { id: 'planta', x: 860, y: 600 }, { id: 'console', x: 580, y: 670 }
  ];
  function roomSanitize(layout) {
    const out = [], seen = {};
    (Array.isArray(layout) ? layout : []).forEach(slot => {
      if (!slot || !ROOM_ITEMS[slot.id] || seen[slot.id]) return;
      const fw = ROOM_ITEMS[slot.id].foot[0];
      let x = +slot.x, y = +slot.y;
      if (!isFinite(x)) x = 600; if (!isFinite(y)) y = 520;
      x = Math.max(ROOM_BOUNDS.x0 + fw / 2, Math.min(ROOM_BOUNDS.x1 - fw / 2, x));
      y = Math.max(ROOM_BOUNDS.y0 + 10, Math.min(ROOM_BOUNDS.y1, y));
      seen[slot.id] = true;
      out.push({ id: slot.id, x: Math.round(x), y: Math.round(y) });
    });
    ROOM_DEFAULTS.forEach(d => { if (!seen[d.id]) out.push({ id: d.id, x: d.x, y: d.y }); });
    return out;
  }
  function roomLoad(store) {
    try {
      const raw = store.getItem(ROOM_KEY);
      if (raw) return roomSanitize(JSON.parse(raw));
    } catch (e) { /* layout padrao */ }
    return roomSanitize(ROOM_DEFAULTS);
  }
  function roomSave(store, layout) {
    try { store.setItem(ROOM_KEY, JSON.stringify(roomSanitize(layout))); } catch (e) { /* segue o jogo */ }
  }
  // ---------- CSS + paineis DOM ----------
  function lobbyCss() {
    if (typeof document === 'undefined' || document.getElementById('lobby-life-css')) return;
    const st = document.createElement('style');
    st.id = 'lobby-life-css';
    st.textContent = [
      '#lobby-ticker{position:fixed;top:54px;left:0;right:0;z-index:30;overflow:hidden;pointer-events:none;',
      'background:rgba(6,11,22,.88);border-top:1px solid #1e3a52;border-bottom:1px solid #1e3a52;',
      'font:12px/26px monospace;color:#9af8ff;height:26px;white-space:nowrap;}',
      '#lobby-ticker .tk{display:inline-block;padding-left:100%;animation-name:lobbyTick;animation-timing-function:linear;animation-iteration-count:infinite;}',
      '@keyframes lobbyTick{from{transform:translateX(0)}to{transform:translateX(-100%)}}',
      '.lobby-panel{position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:500;width:min(430px,92vw);',
      'max-height:74vh;display:flex;flex-direction:column;background:rgba(8,16,30,.97);border:1px solid #2b6f86;',
      'border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6);color:#d9f4ff;font-family:monospace;pointer-events:auto;}',
      '.lobby-panel-head{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;',
      'border-bottom:1px solid #1e3a52;font-size:14px;}',
      '.lobby-x{background:#3a1620;border:1px solid #7d2840;color:#ffb3c0;border-radius:8px;padding:2px 10px;cursor:pointer;}',
      '.lobby-panel-body{padding:12px;overflow-y:auto;}',
      '.lobby-btn{display:block;width:100%;margin:6px 0;padding:10px;background:#103251;border:1px solid #2b6f86;',
      'color:#d9f4ff;border-radius:10px;font-size:14px;cursor:pointer;text-align:left;font-family:monospace;}',
      '.lobby-btn:hover{background:#174a73;}',
      '.lobby-ad{border:1px solid #1e3a52;border-radius:8px;padding:6px 8px;margin:6px 0;font-size:12px;background:#0b1626;}',
      '.lobby-ad b{color:#ffe297;}',
      '.lobby-row{display:flex;gap:6px;margin-top:8px;}',
      '.lobby-row input{flex:1;min-width:0;background:#060b16;border:1px solid #2b6f86;color:#d9f4ff;border-radius:8px;padding:8px;font-family:monospace;}',
      '.lobby-row button{background:#0f4d2e;border:1px solid #2f9e5f;color:#d8ffe8;border-radius:8px;padding:8px 10px;cursor:pointer;font-family:monospace;}',
      '.lobby-scans{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
      '.lobby-scan{border:1px solid #1e3a52;border-radius:10px;padding:10px;text-align:center;background:#0b1626;font-size:12px;}',
      '.lobby-scan.locked{opacity:.45;}',
      '.lobby-scan .em{font-size:26px;}',
      '#room-controls{position:fixed;right:12px;top:100px;z-index:500;display:flex;flex-direction:column;gap:8px;}',
      '#room-controls button{background:#103251;border:1px solid #2b6f86;color:#d9f4ff;border-radius:10px;',
      'padding:10px 12px;font-size:13px;cursor:pointer;font-family:monospace;}',
      '#room-controls button:hover{background:#174a73;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function closeLobbyPanels() {
    if (typeof document === 'undefined') return;
    ['comms-menu', 'ads-panel', 'scans-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }
  function lobbyPanel(id, title, bodyHtml) {
    closeLobbyPanels(); lobbyCss();
    const p = document.createElement('div');
    p.id = id; p.className = 'lobby-panel';
    const head = document.createElement('div'); head.className = 'lobby-panel-head';
    const b = document.createElement('b'); b.textContent = title;
    const x = document.createElement('button'); x.type = 'button'; x.className = 'lobby-x'; x.textContent = '✕';
    x.addEventListener('click', closeLobbyPanels);
    head.append(b, x);
    const body = document.createElement('div'); body.className = 'lobby-panel-body';
    if (typeof bodyHtml === 'string') body.innerHTML = bodyHtml;
    else if (bodyHtml) body.append(bodyHtml);
    p.append(head, body);
    document.getElementById('ui-layer').appendChild(p);
    return body;
  }
  function buildTicker() {
    if (typeof document === 'undefined') return;
    lobbyCss();
    const old = document.getElementById('lobby-ticker');
    if (old) old.remove();
    const ads = adsList(metaStore());
    const msg = ads.map(a => '📢 ' + a.name + ': ' + a.text).join('   +++   ') || '📢 Bem-vindo ao Pátio Central!';
    const tick = document.createElement('div');
    tick.id = 'lobby-ticker';
    const inner = document.createElement('div');
    inner.className = 'tk';
    inner.textContent = msg;
    inner.style.animationDuration = Math.max(20, msg.length * 0.4) + 's';
    tick.appendChild(inner);
    document.getElementById('ui-layer').appendChild(tick);
  }
  function openCommsMenu(sc) {
    const n = Object.keys(scansGet(metaStore())).length;
    const body = lobbyPanel('comms-menu', '📡 Comunicação', '');
    const mk = (label, fn) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'lobby-btn'; btn.textContent = label;
      btn.addEventListener('click', fn);
      body.appendChild(btn);
    };
    mk('💬 Abrir chat da estação', () => { closeLobbyPanels(); gcSetOpen(true); openChatBar(); });
    mk('📢 Anúncios globais (letreiro)', () => openAdsPanel(sc));
    mk('📡 Álbum de scans (' + n + '/8)', () => openScansPanel(sc));
    mk('🛏️ Teleportar para meu quarto', () => { closeLobbyPanels(); teleportRoom(sc); });
  }
  function openAdsPanel(sc) {
    const body = lobbyPanel('ads-panel', '📢 Anúncios globais · ' + ANNOUNCE_COST + ' BITS', '');
    const list = document.createElement('div');
    body.appendChild(list);
    const render = () => {
      list.innerHTML = '';
      adsList(metaStore()).forEach(a => {
        const d = document.createElement('div');
        d.className = 'lobby-ad';
        const b = document.createElement('b'); b.textContent = a.name + ': ';
        const s = document.createElement('span'); s.textContent = a.text;
        d.append(b, s); list.appendChild(d);
      });
    };
    render();
    const row = document.createElement('div'); row.className = 'lobby-row';
    const inp = document.createElement('input');
    inp.maxLength = 90; inp.placeholder = 'Sua mensagem no letreiro... (máx 90)';
    const kb = (on) => { try { if (game && game.input && game.input.keyboard) game.input.keyboard.enabled = on; } catch (e) {} };
    inp.addEventListener('focus', () => kb(false));
    inp.addEventListener('blur', () => kb(true));
    const pub = document.createElement('button');
    pub.type = 'button'; pub.textContent = 'Publicar · ' + ANNOUNCE_COST + ' 🪙';
    const doPub = () => {
      const res = adsPublish(metaStore(), GameState.player.name, inp.value, GameState.player.bits);
      if (!res.ok) { showNotif(res.reason, 'error'); return; }
      GameState.player.bits = res.bits;
      updateTopBar();
      inp.value = '';
      render(); buildTicker();
      showNotif('📢 Anúncio publicado no letreiro!', 'success');
    };
    pub.addEventListener('click', doPub);
    inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') doPub(); ev.stopPropagation(); });
    row.append(inp, pub);
    body.appendChild(row);
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'lobby-btn'; back.textContent = '← Voltar';
    back.addEventListener('click', () => openCommsMenu(sc));
    body.appendChild(back);
  }
  function openScansPanel(sc) {
    const got = scansGet(metaStore());
    const n = Object.keys(got).length;
    const body = lobbyPanel('scans-panel', '📡 Álbum de scans · ' + n + '/8', '');
    const grid = document.createElement('div'); grid.className = 'lobby-scans';
    SCAN_SECTORS.forEach(id => {
      const info = SCAN_INFO[id];
      const card = document.createElement('div');
      card.className = 'lobby-scan' + (got[id] ? '' : ' locked');
      const e = document.createElement('div'); e.className = 'em'; e.textContent = got[id] ? info[0] : '🔒';
      const t = document.createElement('div'); t.textContent = info[1];
      card.append(e, t); grid.appendChild(card);
    });
    body.appendChild(grid);
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'lobby-btn'; back.textContent = '← Voltar';
    back.addEventListener('click', () => openCommsMenu(sc));
    body.appendChild(back);
  }
  // ---------- robos atendentes + drones de patrulha ----------
  const ROBOTS = [
    { id: 'roleta', name: 'Lucky', service: 'roleta', x: 268, y: 238 },
    { id: 'portal', name: 'Sentinela', service: 'portal', x: 648, y: 258 },
    { id: 'shop', name: 'Vendedor', service: 'shop', x: 950, y: 205 },
    { id: 'forja', name: 'Ferreiro', service: 'forja', x: 225, y: 470 },
    { id: 'leilao', name: 'Martelo', service: 'leilao', x: 1000, y: 488 },
    { id: 'deposito', name: 'Guardião', service: 'deposito', x: 250, y: 768 },
    { id: 'missoes', name: 'Capitã', service: 'missoes', x: 645, y: 768 },
    { id: 'comunicacao', name: 'Operadora', service: 'comunicacao', x: 1048, y: 774 },
    { id: 'quarto', name: 'Teleport', service: 'quarto', x: 862, y: 774, tint: 0xc9a7ff }
  ];
  const DRONE_PATHS = [
    [[480, 447], [600, 330], [720, 447], [600, 564]],
    [[350, 300], [600, 250], [850, 300], [600, 350]],
    [[400, 600], [600, 640], [800, 600], [600, 560]]
  ];
  const DRONE_QUIPS = [
    '🛸 Drone de patrulha: pátio tranquilo, comandante.',
    '🛸 Bip-bop! Ronda de segurança em andamento.',
    '🛸 Nenhum invasor à vista. Continuando a patrulha.',
    '🛸 Bateria 100%. Estes corredores são meus!'
  ];
  const BOT_SCALE = 2.8, DRONE_SCALE = 2.2, DRONE_SPEED = 120;
  function spawnRobots(sc, wx, wy) {
    ensureLobbyTextures(sc);
    ROBOTS.forEach((r, i) => {
      const feetX = wx(r.x), feetY = wy(r.y);
      sc.add.ellipse(feetX, feetY + wy(2), wx(15), wy(5), 0x000000, 0.35).setDepth(1);
      const bot = sc.add.image(feetX, feetY, 'lobby_bot').setOrigin(0.5, 1).setScale(BOT_SCALE).setDepth(depthForRefY(r.y));
      if (r.tint) bot.setTint(r.tint);
      const label = sc.add.text(feetX, feetY - bot.displayHeight - wy(6), '🤖 ' + r.name, {
        fontFamily: 'monospace', fontSize: '16px', color: '#9af8ff',
        backgroundColor: 'rgba(8,18,32,.85)', padding: { x: 6, y: 3 }
      }).setOrigin(0.5, 1).setDepth(9.7);
      bot.setInteractive({ useHandCursor: true });
      bot.on('pointerdown', (pointer, lx, ly, event) => { if (event) event.stopPropagation(); openService(sc, r.service); });
      sc.tweens.add({ targets: [bot, label], y: '-=6', duration: 1100 + (i % 3) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 150 });
    });
  }
  function spawnDrones(sc, wx, wy) {
    ensureLobbyTextures(sc);
    sc.drones = [];
    DRONE_PATHS.forEach((path, i) => {
      const d = { path, wi: 1, fx: wx(path[0][0]), fy: wy(path[0][1]), phase: i * 2.1 };
      d.shadow = sc.add.ellipse(d.fx, d.fy + 3, wx(20), wy(6), 0x000000, 0.3).setDepth(1);
      d.body = sc.add.image(d.fx, d.fy - 30, 'lobby_drone').setOrigin(0.5, 0.5).setScale(DRONE_SCALE).setDepth(depthForRefY(path[0][1]));
      d.light = sc.add.circle(d.fx + 13, d.fy - 36, 4, 0xff5a5a).setDepth(6);
      d.body.setInteractive({ useHandCursor: true });
      d.body.on('pointerdown', (pointer, lx, ly, event) => {
        if (event) event.stopPropagation();
        showNotif(DRONE_QUIPS[Math.floor(Math.random() * DRONE_QUIPS.length)], 'info');
      });
      sc.drones.push(d);
    });
  }
  function updateDrones(sc, time, delta) {
    if (!sc.drones || !sc.drones.length) return;
    const s = sc._lobbyScale;
    sc.drones.forEach(d => {
      const wp = d.path[d.wi];
      const tx = wp[0] * s, ty = wp[1] * s;
      const dx = tx - d.fx, dy = ty - d.fy, dist = Math.hypot(dx, dy);
      const step = DRONE_SPEED * delta / 1000;
      if (dist <= Math.max(3, step)) { d.fx = tx; d.fy = ty; d.wi = (d.wi + 1) % d.path.length; }
      else { d.fx += dx / dist * step; d.fy += dy / dist * step; }
      const bob = Math.sin(time / 380 + d.phase) * 5;
      const dep = depthForRefY(d.fy / s);
      d.body.setPosition(d.fx, d.fy - 30 + bob).setDepth(dep);
      d.shadow.setPosition(d.fx, d.fy + 3);
      d.light.setPosition(d.fx + 13, d.fy - 36 + bob).setDepth(dep + 0.01)
        .setAlpha(Math.sin(time / 150 + d.phase) > 0 ? 1 : 0.25);
    });
  }
  // ---------- teleporte + cena do quarto ----------
  let quartoRegistered = false;
  function quartoSceneClass() {
    return class extends Phaser.Scene {
      constructor() { super('QuartoScene'); }
      create() { roomCreate(this); }
      update(t, d) { roomUpdate(this, t, d); }
    };
  }
  function ensureQuarto(sc) {
    if (quartoRegistered) return;
    try { sc.scene.add('QuartoScene', quartoSceneClass(), false); quartoRegistered = true; }
    catch (e) { /* tenta de novo na proxima entrada */ }
  }
  function teleportRoom(sc) {
    showNotif('🌀 Teleportando para seu quarto...', 'info');
    try {
      sc.cameras.main.fadeOut(320, 4, 9, 22);
      sc.time.delayedCall(340, () => sc.scene.start('QuartoScene'));
    } catch (e) { sc.scene.start('QuartoScene'); }
  }
  function backToLobby(rc) {
    showNotif('🌀 Voltando ao Pátio Central...', 'info');
    try {
      rc.cameras.main.fadeOut(320, 4, 9, 22);
      rc.time.delayedCall(340, () => rc.scene.start('PorticoScene'));
    } catch (e) { rc.scene.start('PorticoScene'); }
  }
  function roomCreate(rc) {
    GameState.location = 'quarto';
    lobbyCss();
    ensureLobbyTextures(rc);
    rc.physics.world.setBounds(ROOM_BOUNDS.x0, ROOM_BOUNDS.y0, ROOM_BOUNDS.x1 - ROOM_BOUNDS.x0, ROOM_BOUNDS.y1 - ROOM_BOUNDS.y0);
    rc.cameras.main.setBackgroundColor('#040916');
    const g = rc.add.graphics().setDepth(0);
    g.fillStyle(0x0a0e1a, 1); g.fillRect(0, 0, 1200, 900);
    g.fillStyle(0xe8dcc0, 1); g.fillRect(270, 240, 660, 62);
    g.fillStyle(0x8a7a5c, 1); g.fillRect(270, 294, 660, 8);
    for (let r = 0; r < 15; r++) {
      g.fillStyle(r % 2 ? 0x6b452b : 0x7a5233, 1);
      g.fillRect(270, 302 + r * 30, 660, 30);
    }
    g.lineStyle(3, 0x2b1d10, 1); g.strokeRect(270, 240, 660, 512);
    g.fillStyle(0x274a72, 1); g.fillRect(540, 248, 120, 40);
    g.lineStyle(2, 0x9af8ff, 0.8); g.strokeRect(540, 248, 120, 40);
    g.lineStyle(2, 0x9af8ff, 0.5); g.lineBetween(600, 248, 600, 288);
    g.fillStyle(0x1f6f6b, 1); g.fillRect(526, 244, 16, 48); g.fillRect(658, 244, 16, 48);
    g.fillStyle(0x7a4fd0, 1); g.fillRect(300, 250, 44, 36);
    g.fillStyle(0xff7a1a, 1); g.fillRect(856, 250, 44, 36);
    rc.add.ellipse(600, 545, 260, 130, 0x1f6f6b, 1).setDepth(0.5);
    rc.add.ellipse(600, 545, 200, 96, 0x27948e, 1).setDepth(0.51);
    const store = metaStore();
    rc._roomFurn = [];
    rc._roomWalls = rc.physics.add.staticGroup();
    roomLoad(store).forEach(slot => {
      const def = ROOM_ITEMS[slot.id];
      const fw = def.foot[0], fh = def.foot[1];
      const img = rc.add.image(slot.x, slot.y, def.tex).setOrigin(0.5, 1).setScale(def.scale).setDepth(depthForRefY(slot.y));
      const hit = rc.add.rectangle(slot.x, slot.y - fh / 2, fw, fh, 0, 0);
      rc._roomWalls.add(hit);
      img.setData('furnId', slot.id);
      img.setData('hit', hit);
      img.setInteractive({ draggable: true, useHandCursor: true });
      rc._roomFurn.push(img);
    });
    const onDrag = (pointer, gameObject, dragX, dragY) => {
      const fid = gameObject.getData ? gameObject.getData('furnId') : null;
      if (!fid || !ROOM_ITEMS[fid]) return;
      const fw = ROOM_ITEMS[fid].foot[0], fh = ROOM_ITEMS[fid].foot[1];
      const cx = Math.max(ROOM_BOUNDS.x0 + fw / 2, Math.min(ROOM_BOUNDS.x1 - fw / 2, dragX));
      const cy = Math.max(ROOM_BOUNDS.y0 + 10, Math.min(ROOM_BOUNDS.y1, dragY));
      gameObject.setPosition(Math.round(cx), Math.round(cy)).setDepth(depthForRefY(cy));
      const hit = gameObject.getData('hit');
      if (hit) hit.setPosition(Math.round(cx), Math.round(cy - fh / 2));
    };
    const onDragEnd = () => {
      try { rc._roomWalls.refresh(); } catch (e) { /* colisor atualiza no reset */ }
      roomSave(store, rc._roomFurn.map(f => ({ id: f.getData('furnId'), x: Math.round(f.x), y: Math.round(f.y) })));
    };
    rc.input.on('drag', onDrag);
    rc.input.on('dragend', onDragEnd);
    rc.hero = rc.physics.add.sprite(600, 540, 'hero_s_0');
    rc.hero.setCollideWorldBounds(true).setDepth(6).setScale(HERO_SPRITE.scale * 1.65);
    rc.hero.body.setSize(HERO_SPRITE.body.w, HERO_SPRITE.body.h);
    rc.hero.body.setOffset(HERO_SPRITE.body.ox, HERO_SPRITE.body.oy);
    rc.hero.body.updateFromGameObject();
    rc._roomFoot = rc.hero.body.center.y - rc.hero.y;
    rc.hero.y -= rc._roomFoot;
    rc.hero.body.updateFromGameObject();
    rc.physics.add.collider(rc.hero, rc._roomWalls);
    rc.cursors = rc.input.keyboard.createCursorKeys();
    rc.wasd = rc.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
    rc._roomTarget = null;
    rc._roomDir = 's'; rc._roomFrame = 0; rc._roomWalk = 0;
    const click = (pointer, objects) => {
      if ((objects && objects.length) || pointer.rightButtonDown()) return;
      const t = rc.cameras.main.getWorldPoint(pointer.x, pointer.y);
      rc._roomTarget = [
        Math.max(ROOM_BOUNDS.x0, Math.min(ROOM_BOUNDS.x1, t.x)),
        Math.max(ROOM_BOUNDS.y0, Math.min(ROOM_BOUNDS.y1, t.y))
      ];
    };
    rc.input.on('pointerdown', click);
    const pad = rc.add.circle(830, 690, 26, 0x0e2a3a, 1).setStrokeStyle(3, 0x3fe3ea, 1).setDepth(1);
    rc.tweens.add({ targets: pad, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    rc.add.text(830, 690, 'SAIR', {
      fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#9af8ff'
    }).setOrigin(0.5).setDepth(9.5);
    const zone = rc.add.zone(830, 690, 76, 76).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (pointer, lx, ly, event) => { if (event) event.stopPropagation(); backToLobby(rc); });
    const fit = () => {
      const w = rc.scale.width, h = rc.scale.height;
      rc.cameras.main.setZoom(Math.max(0.2, Math.min((w - 16) / 1200, (h - 96) / 900)));
      rc.cameras.main.centerOn(600, 480);
    };
    fit();
    rc.scale.on('resize', fit);
    const ctrls = document.createElement('div');
    ctrls.id = 'room-controls';
    const back = document.createElement('button'); back.type = 'button'; back.textContent = '🌀 Voltar ao Pátio';
    back.addEventListener('click', () => backToLobby(rc));
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = '♻️ Arrumar quarto';
    reset.addEventListener('click', () => {
      roomSave(store, ROOM_DEFAULTS);
      roomLoad(store).forEach(slot => {
        const f = rc._roomFurn.find(o => o.getData('furnId') === slot.id);
        if (!f) return;
        const fh = ROOM_ITEMS[slot.id].foot[1];
        f.setPosition(slot.x, slot.y).setDepth(depthForRefY(slot.y));
        const hit = f.getData('hit');
        if (hit) hit.setPosition(slot.x, slot.y - fh / 2);
      });
      try { rc._roomWalls.refresh(); } catch (e) {}
      showNotif('Quarto arrumado!', 'success');
    });
    ctrls.append(back, reset);
    document.getElementById('ui-layer').appendChild(ctrls);
    rc.events.once('shutdown', () => {
      rc.scale.off('resize', fit);
      rc.input.off('pointerdown', click);
      rc.input.off('drag', onDrag);
      rc.input.off('dragend', onDragEnd);
      ctrls.remove();
      rc._roomFurn = [];
    });
    rc.cameras.main.fadeIn(300, 4, 9, 22);
    updateTopBar();
    showNotif('🛏️ Seu quarto! Arraste os móveis para decorar — salva sozinho.', 'info');
  }
  function roomUpdate(rc, t, delta) {
    const p = rc.hero;
    if (!p) return;
    let vx = 0, vy = 0;
    if (rc.cursors.left.isDown || rc.wasd.left.isDown) vx--;
    if (rc.cursors.right.isDown || rc.wasd.right.isDown) vx++;
    if (rc.cursors.up.isDown || rc.wasd.up.isDown) vy--;
    if (rc.cursors.down.isDown || rc.wasd.down.isDown) vy++;
    if (vx || vy) rc._roomTarget = null;
    const speed = CONFIG.PLAYER_SPEED * 1.65;
    if (!vx && !vy && rc._roomTarget) {
      const dx = rc._roomTarget[0] - p.x, dy = rc._roomTarget[1] - p.y - rc._roomFoot;
      const dist = Math.hypot(dx, dy);
      if (dist <= Math.max(4, speed * delta / 1000)) {
        p.body.reset(rc._roomTarget[0], rc._roomTarget[1] - rc._roomFoot);
        rc._roomTarget = null;
      }
      else { vx = dx / dist; vy = dy / dist; }
    }
    const m = Math.max(1, Math.hypot(vx, vy));
    p.setVelocity(vx / m * speed, vy / m * speed);
    if (vx || vy) {
      const angle = Math.atan2(vy, vx), dirs = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
      rc._roomDir = dirs[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
      rc._roomWalk += delta;
      if (rc._roomWalk >= 170) { rc._roomWalk = 0; rc._roomFrame = 1 - rc._roomFrame; }
    } else { rc._roomWalk = 0; rc._roomFrame = 0; }
    p.setTexture('hero_' + rc._roomDir + '_' + rc._roomFrame);
    p.setDepth(depthForRefY(p.y + rc._roomFoot));
  }

