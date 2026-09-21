/* Pátio Central: geometry uses a 1200 × 900 reference canvas. The game keeps
 * its 3200 × 2400 world coordinates, including online presence and saves. */
(function (root) {
  'use strict';
  const WIDTH = 1200, HEIGHT = 900, CELL = 12;
  const TEXTURE = 'central-lobby-v236';
  const SECTORS = [
    { id: 'roleta', name: 'Roleta', color: '#ff83c6', point: [243, 220], sign: [176, 33, 127, 47], area: [100, 110, 240, 145] },
    { id: 'portal', name: 'Portal', color: '#9ddfff', point: [600, 203], sign: [547, 37, 113, 55], area: [566, 98, 68, 85] },
    { id: 'shop', name: 'Shop', color: '#64f3d1', point: [982, 212], sign: [907, 35, 148, 54], area: [865, 113, 226, 146] },
    { id: 'forja', name: 'Forja', color: '#ffc16e', point: [245, 484], sign: [143, 311, 157, 54], area: [130, 392, 168, 68] },
    { id: 'leilao', name: 'Leilão', color: '#d3a0ff', point: [977, 505], sign: [921, 313, 149, 51], area: [939, 407, 84, 63] },
    { id: 'deposito', name: 'Depósito', color: '#79caff', point: [279, 754], sign: [151, 599, 145, 49], area: [177, 670, 144, 101] },
    { id: 'missoes', name: 'Missões', color: '#8ff5c1', point: [600, 756], sign: [525, 620, 160, 50], area: [530, 670, 136, 48] },
    { id: 'comunicacao', name: 'Comunicação', color: '#98c6ff', point: [958, 760], sign: [891, 599, 197, 48], area: [927, 679, 92, 67] }
  ];
  const EXIT = { id: 'saida', name: 'Ilha dos Dromos', color: '#ffe297', point: [600, 852], sign: [572, 865, 56, 26] };
  // Floors and doorways, separate from the painted walls and furniture.
  const FLOORS = [
    [[100, 102], [333, 102], [345, 228], [315, 253], [112, 253], [89, 233]],
    [[867, 99], [1092, 99], [1101, 230], [1075, 258], [875, 258], [849, 229]],
    [[113, 363], [310, 363], [337, 389], [337, 516], [311, 542], [113, 542], [95, 521], [95, 390]],
    [[883, 364], [1085, 364], [1100, 388], [1100, 521], [1076, 542], [884, 542], [863, 519], [863, 390]],
    [[124, 643], [322, 643], [391, 684], [391, 771], [366, 795], [119, 795], [100, 774], [100, 672]],
    [[876, 643], [1082, 643], [1101, 669], [1101, 773], [1080, 795], [814, 795], [791, 772], [791, 683]],
    [[542, 711], [659, 711], [689, 771], [661, 792], [539, 792], [511, 771]]
  ];
  const CORRIDORS = [
    [600, 180, 600, 360, 53],                       // north portal
    [312, 246, 453, 356, 65], [887, 246, 747, 356, 65],
    [310, 447, 888, 447, 58],                      // forge ↔ auction
    [443, 598, 342, 690, 68], [757, 598, 854, 690, 68],
    [600, 564, 600, 626, 54],                     // mission approach splits around its board
    [575, 614, 480, 680, 55], [625, 614, 720, 680, 55],
    [480, 680, 490, 755, 58], [720, 680, 710, 755, 58],
    [488, 756, 712, 756, 64],
    [600, 768, 600, 882, 52]
  ];
  const OBSTACLES = [
    [148, 109, 137, 89],                           // roulette table
    [905, 128, 128, 48],                          // shop counter
    [174, 365, 100, 81],                          // forge / furnace
    [942, 413, 92, 55],                           // auction counter
    [102, 650, 60, 136], [324, 698, 48, 82],       // deposit shelves
    [928, 678, 89, 66],                           // communications hologram
    [527, 658, 146, 58],                          // quest board
    [500, 287, 60, 37], [640, 287, 60, 37],       // benches and planters on the ring
    [404, 359, 39, 56], [758, 359, 39, 56],
    [404, 474, 39, 43], [758, 474, 39, 43],
    [495, 569, 64, 39], [640, 569, 64, 39]
  ];
  const rectContains = (r, x, y) => x >= r[0] && y >= r[1] && x <= r[0] + r[2] && y <= r[1] + r[3];
  function inPolygon(poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function distanceToSegment(x, y, s) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (y - s[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - s[0] - t * dx, y - s[1] - t * dy);
  }
  function isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return false;
    if (OBSTACLES.some(r => rectContains(r, x, y))) return false;
    const radius = Math.hypot(x - 600, (y - 448) * 1.06);
    return radius <= 155 || (radius >= 181 && radius <= 221)
      || FLOORS.some(p => inPolygon(p, x, y))
      || CORRIDORS.some(s => distanceToSegment(x, y, s) <= s[4] / 2);
  }
  function makeGrid() {
    const cols = WIDTH / CELL, rows = HEIGHT / CELL;
    const cells = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      cells[y * cols + x] = isWalkable((x + 0.5) * CELL, (y + 0.5) * CELL) ? 1 : 0;
    }
    return { cols, rows, cells };
  }
  const GRID = makeGrid();
  function nearestCell(x, y) {
    let best = -1, dist = Infinity;
    for (let i = 0; i < GRID.cells.length; i++) {
      if (!GRID.cells[i]) continue;
      const d = Math.hypot((i % GRID.cols + 0.5) * CELL - x, (Math.floor(i / GRID.cols) + 0.5) * CELL - y);
      if (d < dist) { best = i; dist = d; }
    }
    return best;
  }
  // Four-connected BFS cannot cut diagonally through walls or room corners.
  function findPath(from, to) {
    const start = nearestCell(from[0], from[1]), end = nearestCell(to[0], to[1]);
    if (start < 0 || end < 0) return [];
    const prev = new Int32Array(GRID.cells.length).fill(-1), queue = [start];
    prev[start] = start;
    for (let k = 0; k < queue.length && prev[end] < 0; k++) {
      const i = queue[k], x = i % GRID.cols, y = Math.floor(i / GRID.cols);
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = x + dx, ny = y + dy, n = ny * GRID.cols + nx;
        if (nx < 0 || ny < 0 || nx >= GRID.cols || ny >= GRID.rows || !GRID.cells[n] || prev[n] >= 0) continue;
        prev[n] = i; queue.push(n);
      }
    }
    if (prev[end] < 0) return [];
    const path = [];
    for (let i = end; i !== start; i = prev[i]) path.push([(i % GRID.cols + 0.5) * CELL, (Math.floor(i / GRID.cols) + 0.5) * CELL]);
    path.push([(start % GRID.cols + 0.5) * CELL, (Math.floor(start / GRID.cols) + 0.5) * CELL]);
    return path.reverse();
  }
  function wallRects() {
    const rects = [], active = new Map();
    for (let y = 0; y < GRID.rows; y++) {
      const next = new Map();
      for (let x = 0; x < GRID.cols;) {
        if (GRID.cells[y * GRID.cols + x]) { x++; continue; }
        const start = x;
        while (x < GRID.cols && !GRID.cells[y * GRID.cols + x]) x++;
        const key = start + ':' + x;
        const r = active.get(key) || [start * CELL, y * CELL, (x - start) * CELL, 0];
        if (!active.has(key)) rects.push(r);
        r[3] += CELL; next.set(key, r);
      }
      active.clear(); next.forEach((v, k) => active.set(k, v));
    }
    return rects;
  }
  function preload(sc) {
    if (!sc.textures.exists(TEXTURE)) sc.load.image(TEXTURE, 'assets/lobby/patio-central.webp?v=236');
  }
  function inputBlocked() {
    const el = document.activeElement;
    if (el && (el.matches('input,textarea,select') || el.isContentEditable)) return true;
    return ['room-menu', 'clerk-panel', 'mission-board-panel', 'master-panel', 'auction-house', 'vending-panel', 'dromo-panel', 'options-panel', 'scanner-real', 'inv-panel', 'codex-panel', 'dromo-game-overlay'].some(id => {
      const panel = document.getElementById(id);
      return panel && panel.getBoundingClientRect().width > 0 && getComputedStyle(panel).visibility !== 'hidden';
    });
  }
  function closeServices() {
    closeRoomPanel(); closeClerkPanel(); closeMissionBoardPanel();
    if (AH_STATE.open) closeAuctionHouse();
    closeVendingPanel();
  }
  function openService(sc, id) {
    sc._lobbyPath = []; sc.player.setVelocity(0, 0);
    closeServices();
    if (id === 'roleta') openRoomPanel('crafting');
    else if (id === 'portal') { sc.portalOpen = true; openRoomPanel('travel'); }
    else if (id === 'shop') openRoomPanel('shop');
    else if (id === 'forja') openClerkPanel('craft');
    else if (id === 'costura') openClerkPanel('upgrade');
    else if (id === 'bebidas') openVendingPanel();
    else if (id === 'leilao') openAuctionHouse();
    else if (id === 'deposito') openRoomPanel('deposit');
    else if (id === 'missoes') openMissionBoardPanel();
    else if (id === 'comunicacao') {
      gcSetOpen(true);
      openChatBar();
    } else if (id === 'saida') sc.goToExterior();
  }
  function fitCamera(sc) {
    const w = sc.scale.width, h = sc.scale.height, cam = sc.cameras.main;
    // The overview leaves space for the existing HUD and bottom controls.
    const fit = Math.min((w - 20) / sc.worldW, (h - 112) / sc.worldH);
    sc._lobbyFit = Math.max(0.08, fit);
    if (sc.fullMapMode) {
      cam.stopFollow(); cam.removeBounds(); cam.setZoom(sc._lobbyFit);
      cam.centerOn(sc.worldW / 2, sc.worldH / 2);
    } else {
      const zoom = Math.max(sc._lobbyFit, Math.min(0.8, Math.max(0.48, Math.min(w / 1200, h / 1100))));
      cam.setZoom(zoom); cam.setBounds(0, 0, sc.worldW, sc.worldH);
      cam.startFollow(sc.player, true, 0.12, 0.12); cam.centerOn(sc.player.x, sc.player.y);
    }
    sc._lobbyMapButton.textContent = sc.fullMapMode ? 'Aproximar' : 'Ver pátio';
    sc._lobbyMapButton.setAttribute('aria-pressed', String(sc.fullMapMode));
  }
  function toggleMap(sc) { sc.fullMapMode = !sc.fullMapMode; fitCamera(sc); }
  function create(sc) {
    GameState.location = 'portico'; GameState.autoMove = false;
    GameState.autoMoveTarget = null; GameState.scanTarget = null;
    sc.worldW = CONFIG.WORLD_W; sc.worldH = CONFIG.WORLD_H;
    sc._lobbyScale = sc.worldW / WIDTH;
    const s = sc._lobbyScale, wx = x => x * s, wy = y => y * s;
    sc._lobbyPath = []; sc.portalOpen = false; sc._lobbyNearest = null;
    sc.physics.world.setBounds(0, 0, sc.worldW, sc.worldH);
    sc.cameras.main.setBackgroundColor('#040916');
    sc.objects = sc.add.group(); sc.npcs = sc.add.group(); sc.drones = [];
    sc.interactables = []; sc.rooms = SECTORS;
    sc.walls = sc.physics.add.staticGroup();
    if (sc.textures.exists(TEXTURE)) {
      sc.add.image(0, 0, TEXTURE).setOrigin(0).setDisplaySize(sc.worldW, sc.worldH).setDepth(0);
    } else {
      // A failed image download still leaves a navigable map, not a black screen.
      const floor = sc.add.graphics().setDepth(0);
      floor.fillStyle(0x263550);
      for (let i = 0; i < GRID.cells.length; i++) if (GRID.cells[i]) floor.fillRect(wx(i % GRID.cols * CELL), wy(Math.floor(i / GRID.cols) * CELL), wx(CELL), wy(CELL));
      SECTORS.forEach(z => sc.add.text(wx(z.point[0]), wy(z.point[1] - 35), z.name.toUpperCase(), { fontSize: '30px', color: z.color }).setOrigin(0.5));
      showNotif('O cenário não carregou. Recarregue a página para tentar novamente.', 'warning');
    }
    wallRects().forEach(r => {
      const wall = sc.add.rectangle(wx(r[0] + r[2] / 2), wy(r[1] + r[3] / 2), wx(r[2]), wy(r[3]), 0, 0);
      sc.walls.add(wall);
    });
    const spawn = [600, 447];
    sc.player = sc.physics.add.sprite(wx(spawn[0]), wy(spawn[1]), 'hero_s_0');
    sc.player.setCollideWorldBounds(true).setDepth(10).setScale(HERO_SPRITE.scale * 1.65);
    sc.player.body.setSize(HERO_SPRITE.body.w, HERO_SPRITE.body.h);
    sc.player.body.setOffset(HERO_SPRITE.body.ox, HERO_SPRITE.body.oy);
    sc.player.body.updateFromGameObject();
    sc._lobbyFootOffset = sc.player.body.center.y - sc.player.y;
    sc.player.y -= sc._lobbyFootOffset;
    sc.player.body.updateFromGameObject();
    GameState.player.x = sc.player.x; GameState.player.y = sc.player.y;
    sc.physics.add.collider(sc.player, sc.walls);
    sc.walkFrame = 0; sc.walkTimer = 0; sc.playerDir = 's';
    sc.stuckTracker = { lastX: sc.player.x, lastY: sc.player.y, timer: 0, isJumping: false };
    sc.cursors = sc.input.keyboard.createCursorKeys();
    sc.wasd = sc.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
    sc.interactKey = sc.input.keyboard.addKey('E');
    sc.fullMapKey = sc.input.keyboard.addKey('F8');
    sc.fullMapMode = sc.scale.width >= 900 && sc.scale.height >= 600;

    const controls = document.createElement('div');
    controls.id = 'lobby-controls';
    const mapButton = document.createElement('button');
    mapButton.type = 'button'; mapButton.id = 'lobby-map-button';
    mapButton.title = 'Alternar visão do pátio (F8)';
    mapButton.addEventListener('click', () => toggleMap(sc));
    const help = document.createElement('span');
    help.textContent = 'WASD / setas · E interagir · clique para andar';
    controls.append(help, mapButton);
    const prompt = document.createElement('button');
    prompt.id = 'lobby-interaction'; prompt.type = 'button'; prompt.hidden = true;
    prompt.addEventListener('click', () => { if (sc._lobbyNearest) sc._lobbyNearest.action(); });
    const ui = document.getElementById('ui-layer'); ui.append(controls, prompt);
    document.body.classList.add('lobby-active');
    sc._lobbyMapButton = mapButton; sc._lobbyPrompt = prompt;
    fitCamera(sc);
    const resize = () => fitCamera(sc);
    sc.scale.on('resize', resize);

    const defs = SECTORS.concat([EXIT]);
    defs.forEach(z => {
      const it = { id: z.id, name: z.name, color: z.color, x: wx(z.point[0]), y: wy(z.point[1]) - sc._lobbyFootOffset,
        action: () => openService(sc, z.id) };
      sc.interactables.push(it);
      // Signs and shop counters keep the game's immediate click/touch access.
      const areas = [z.sign]; if (z.area) areas.push(z.area);
      areas.forEach(r => {
        const zone = sc.add.zone(wx(r[0] + r[2] / 2), wy(r[1] + r[3] / 2), wx(r[2]), wy(r[3])).setDepth(4).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', (pointer, lx, ly, event) => { event.stopPropagation(); it.action(); });
      });
    });
    // Costura remains available in the forge alongside crafting.
    const costura = { id: 'costura', name: 'Costura · mochila', color: '#a9d7ff', x: wx(307), y: wy(505) - sc._lobbyFootOffset,
      action: () => openService(sc, 'costura') };
    sc.interactables.push(costura);
    const costuraText = sc.add.text(wx(286), wy(520), 'COSTURA', {
      fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: '#d9f4ff',
      backgroundColor: '#103251', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    costuraText.on('pointerdown', (pointer, lx, ly, event) => { event.stopPropagation(); costura.action(); });
    // The old vending service is retained at the shop's drinks counter.
    const drinks = { id: 'bebidas', name: 'Bebidas', color: '#81f4d7', x: wx(1054), y: wy(234) - sc._lobbyFootOffset,
      action: () => openService(sc, 'bebidas') };
    sc.interactables.push(drinks);
    sc.add.text(wx(1050), wy(248), 'BEBIDAS', { fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold',
      color: '#d8fff0', backgroundColor: '#103b36', padding: { x: 10, y: 6 } })
      .setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer, lx, ly, event) => { event.stopPropagation(); drinks.action(); });
    sc.portal = { x: wx(600), y: wy(144) };
    sc.missionBoard = { x: wx(600), y: wy(690) };

    const pulse = sc.add.graphics().setDepth(1);
    pulse.lineStyle(wx(1.7), 0x9af8ff, 0.5); pulse.strokeCircle(wx(600), wy(447), wx(60));
    sc.tweens.add({ targets: pulse, alpha: 0.3, duration: 1600, yoyo: true, repeat: -1 });
    const portalLight = sc.add.image(wx(600), wy(139), 'glow_soft').setTint(0xffe9a2).setScale(2.7).setAlpha(0.16).setDepth(1);
    sc.tweens.add({ targets: portalLight, alpha: 0.33, scale: 3.2, duration: 1700, yoyo: true, repeat: -1 });
    sc._lobbyTarget = sc.add.ellipse(0, 0, wx(12), wy(7), 0xa5f6ff, 0.28).setStrokeStyle(2, 0xb6ffff, 0.7).setDepth(2).setVisible(false);
    const moveTo = (pointer, objects) => {
      if ((objects && objects.length) || inputBlocked() || pointer.rightButtonDown()) return;
      const target = sc.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tx = target.x / s, ty = target.y / s;
      if (!isWalkable(tx, ty)) return;
      sc._lobbyPath = findPath([sc.player.x / s, (sc.player.y + sc._lobbyFootOffset) / s], [tx, ty]);
      if (sc._lobbyPath.length) sc._lobbyTarget.setPosition(target.x, target.y).setVisible(true);
    };
    sc.input.on('pointerdown', moveTo);
    const typing = () => document.activeElement && document.activeElement.matches('input,textarea,select,[contenteditable="true"]');
    const inv = () => { if (!typing()) togglePanel('inv-panel', 'btn-inv'); };
    const scanner = () => { if (!typing()) togglePanel('scanner-panel', 'btn-scan'); };
    sc.input.keyboard.on('keydown-I', inv); sc.input.keyboard.on('keydown-Q', scanner);
    sc.events.once('shutdown', () => {
      sc.scale.off('resize', resize); sc.input.off('pointerdown', moveTo);
      sc.input.keyboard.off('keydown-I', inv); sc.input.keyboard.off('keydown-Q', scanner);
      controls.remove(); prompt.remove(); document.body.classList.remove('lobby-active');
      sc._lobbyPath = []; sc.interactables = []; sc._lobbyNearest = null;
    });
    sc.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (GameState.player.battery < CONFIG.MAX_BATTERY) {
        GameState.player.battery = Math.min(CONFIG.MAX_BATTERY, GameState.player.battery + CONFIG.BATTERY_RECHARGE_HUB);
        updateTopBar();
      }
    } });
    updateTopBar(); showNotif('Pátio Central · Explore os oito setores da estação.', 'info');
  }
  function update(sc, time, delta) {
    const p = sc.player, blocked = inputBlocked();
    if (!blocked && Phaser.Input.Keyboard.JustDown(sc.fullMapKey)) toggleMap(sc);
    let nearest = null, best = 155;
    sc.interactables.forEach(it => {
      const d = Math.hypot(p.x - it.x, p.y - it.y);
      if (d < best) { nearest = it; best = d; }
    });
    sc._lobbyNearest = nearest;
    const prompt = sc._lobbyPrompt;
    prompt.hidden = !nearest || blocked;
    if (nearest && !blocked) {
      if (prompt.dataset.sector !== nearest.id) {
        prompt.textContent = 'E · ' + nearest.name;
        prompt.dataset.sector = nearest.id;
        prompt.style.setProperty('--sector-color', nearest.color);
      }
      const cam = sc.cameras.main;
      const x = cam.width / 2 + (p.x - cam.midPoint.x) * cam.zoom;
      const y = cam.height / 2 + (p.y - cam.midPoint.y - p.displayHeight / 2) * cam.zoom - 12;
      prompt.style.left = Math.max(105, Math.min(sc.scale.width - 105, x)) + 'px';
      prompt.style.top = Math.max(82, y) + 'px';
      if (Phaser.Input.Keyboard.JustDown(sc.interactKey)) { nearest.action(); return; }
    }
    if (blocked) { p.setVelocity(0, 0); sc._lobbyPath = []; sc._lobbyTarget.setVisible(false); return; }
    let vx = 0, vy = 0;
    if (sc.cursors.left.isDown || sc.wasd.left.isDown) vx--;
    if (sc.cursors.right.isDown || sc.wasd.right.isDown) vx++;
    if (sc.cursors.up.isDown || sc.wasd.up.isDown) vy--;
    if (sc.cursors.down.isDown || sc.wasd.down.isDown) vy++;
    const joystick = getMoveVector();
    if (joystick.x || joystick.y) { vx = joystick.x; vy = joystick.y; }
    if (vx || vy) sc._lobbyPath = [];
    const speed = CONFIG.PLAYER_SPEED * 1.65 * (1 + getPlayerStats().spd / 100);
    if (!vx && !vy && sc._lobbyPath.length) {
      const target = sc._lobbyPath[0], s = sc._lobbyScale;
      const dx = target[0] * s - p.x, dy = target[1] * s - p.y - sc._lobbyFootOffset;
      const dist = Math.hypot(dx, dy);
      if (dist <= Math.max(4, speed * delta / 1000)) {
        // Finish the grid step before turning; small residual offsets can trap
        // the feet against a narrow doorway when changing direction.
        p.body.reset(target[0] * s, target[1] * s - sc._lobbyFootOffset);
        sc._lobbyPath.shift();
      }
      else { vx = dx / dist; vy = dy / dist; }
    }
    const magnitude = Math.max(1, Math.hypot(vx, vy));
    p.setVelocity(vx / magnitude * speed, vy / magnitude * speed);
    sc._lobbyTarget.setVisible(sc._lobbyPath.length > 0);
    GameState.player.x = p.x; GameState.player.y = p.y;
    if (vx || vy) {
      const angle = Math.atan2(vy, vx), dirs = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
      sc.playerDir = dirs[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
      sc.walkTimer += delta;
      if (sc.walkTimer >= 170) { sc.walkTimer = 0; sc.walkFrame = 1 - sc.walkFrame; }
    } else { sc.walkTimer = 0; sc.walkFrame = 0; }
    p.setTexture('hero_' + sc.playerDir + '_' + sc.walkFrame);
  }
  function drawMinimap(ctx, sc, t) {
    if (sc.textures.exists(TEXTURE)) {
      ctx.drawImage(sc.textures.get(TEXTURE).getSourceImage(), t.ox, t.oy, t.wW * t.s, t.wH * t.s);
      ctx.fillStyle = 'rgba(3,9,25,.3)'; ctx.fillRect(t.ox, t.oy, t.wW * t.s, t.wH * t.s);
    }
    const s = sc._lobbyScale;
    SECTORS.concat([EXIT]).forEach(z => {
      ctx.fillStyle = z.color; ctx.strokeStyle = '#070b17'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mapWX(t, z.point[0] * s), mapWY(t, z.point[1] * s), 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    drawMapPlayer(ctx, t, sc.player.x, sc.player.y);
    setScannerLegend([['Você', '#ffffff']].concat(SECTORS.map(z => [z.name, z.color]), [['Saída', EXIT.color]]));
  }
  const api = { WIDTH, HEIGHT, CELL, SECTORS, EXIT, FLOORS, CORRIDORS, OBSTACLES, GRID, isWalkable, findPath, wallRects, preload, create, update, drawMinimap };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CentralLobby = api;
})(typeof window !== 'undefined' ? window : globalThis);
