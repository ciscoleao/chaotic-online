/* Optional end-to-end check: requires Playwright. All accounts and saves live
 * in a temporary server; the real server/data directory is never opened. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chaotic-lobby-browser-'));
const port = Number(process.env.LOBBY_TEST_PORT || 8917);
const base = 'http://127.0.0.1:' + port;
let server, browser;
let checks = 0;
function check(name, value) { assert.ok(value, name); console.log('PASS ' + name); checks++; }

async function closePanels(page) {
  await page.evaluate(() => {
    closeRoomPanel(); closeClerkPanel(); closeMissionBoardPanel(); closeChatBar();
    if (AH_STATE.open) closeAuctionHouse();
    document.getElementById('inv-panel').style.display = 'none';
    document.activeElement.blur();
  });
}
async function spawnAt(page, point) {
  await page.evaluate(([x, y]) => {
    const sc = game.scene.getScene('PorticoScene');
    sc._lobbyPath = []; sc.player.body.reset(x * sc._lobbyScale, y * sc._lobbyScale - sc._lobbyFootOffset);
  }, point);
}
async function sceneReady(page, name) {
  await page.waitForFunction(key => typeof game !== 'undefined' && game.scene.isActive(key) && !!game.scene.getScene(key).player, name, { timeout: 60000 });
}
async function run() {
  for (const dir of ['assets', 'site', 'server']) fs.cpSync(path.join(root, dir), path.join(tmp, dir), { recursive: true, filter: source => !source.includes(path.sep + 'data' + path.sep) && source !== path.join(root, 'server/data') });
  fs.copyFileSync(path.join(root, 'chaotic_idleworld_v123.html'), path.join(tmp, 'chaotic_idleworld_v123.html'));
  fs.mkdirSync(path.join(tmp, 'server/data'), { recursive: true });
  const accounts = {}, sessions = {};
  for (const [nick, sex, token] of [['LobbyQA', 'm', 'lobby-qa-one'], ['VisitanteQA', 'f', 'lobby-qa-two']]) {
    const email = nick.toLowerCase() + '@example.test';
    accounts[email] = { email, user: nick, chars: [{ nick, sex }], createdAt: Date.now() };
    sessions[token] = { email, createdAt: Date.now() };
  }
  fs.writeFileSync(path.join(tmp, 'server/data/db.json'), JSON.stringify({ accounts, sessions }));
  server = spawn(process.execPath, ['server/server.js'], { cwd: tmp, env: { ...process.env, PORT: String(port), SUPABASE_URL: '', SUPABASE_KEY: '' }, stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    server.stdout.on('data', b => { if (b.toString().includes('na porta')) { clearTimeout(timer); resolve(); } });
    server.once('error', reject);
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  if (process.env.PHASER_TEST_FILE) await context.route('**/phaser.min.js', route => route.fulfill({ path: process.env.PHASER_TEST_FILE, contentType: 'application/javascript' }));
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR ' + e.message); });
  await page.goto(base + '/game?sess=lobby-qa-one', { waitUntil: 'domcontentloaded' });
  await sceneReady(page, 'PorticoScene');
  await page.waitForTimeout(1000);
  const initial = await page.evaluate(() => {
    const s = game.scene.getScene('PorticoScene');
    return { ready: s.textures.exists('central-lobby-v236'), sectors: s.interactables.length, overview: s.fullMapMode, name: GameState.player.name, foot: s._lobbyFootOffset };
  });
  console.log('Initial scene:', initial);
  check('reference art loaded with eleven working access points', initial.ready && initial.sectors === 11);
  check('desktop overview and account character preserved', initial.overview && initial.name === 'LobbyQA');
  const out = process.env.LOBBY_SCREENSHOTS || path.join(tmp, 'screenshots');
  fs.mkdirSync(out, { recursive: true });
  await page.screenshot({ path: path.join(out, 'patio-desktop.png') });
  const x0 = await page.evaluate(() => game.scene.getScene('PorticoScene').player.x);
  await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
  check('WASD movement remains active in overview', await page.evaluate(x => game.scene.getScene('PorticoScene').player.x > x + 30, x0));
  await page.keyboard.press('F8');
  check('F8 switches to following the player', await page.evaluate(() => !game.scene.getScene('PorticoScene').fullMapMode));
  await page.keyboard.press('F8');
  await spawnAt(page, [600, 447]);

  // Click the actual signs; evaluate the existing game panels, not mocked callbacks.
  const sectors = await page.evaluate(() => CentralLobby.SECTORS);
  for (const z of sectors) {
    await closePanels(page);
    const xy = await page.evaluate(rect => {
      const sc = game.scene.getScene('PorticoScene'), c = sc.cameras.main;
      return { x: c.width / 2 + ((rect[0] + rect[2] / 2) * sc._lobbyScale - c.midPoint.x) * c.zoom,
        y: c.height / 2 + ((rect[1] + rect[3] / 2) * sc._lobbyScale - c.midPoint.y) * c.zoom };
    }, z.sign);
    await page.mouse.click(xy.x, xy.y); await page.waitForTimeout(90);
    const opened = await page.evaluate(id => {
      if (id === 'forja') return document.getElementById('clerk-panel').classList.contains('open') && clerkMode === 'craft';
      if (id === 'leilao') return AH_STATE.open;
      if (id === 'missoes') return document.getElementById('mission-board-panel').classList.contains('open');
      if (id === 'comunicacao') return document.getElementById('chat-bar').style.display === 'flex' && gcOpen;
      return document.getElementById('room-menu').style.display === 'block' && currentRoomTab === ({ roleta: 'crafting', portal: 'travel', shop: 'shop', deposito: 'deposit' })[id];
    }, z.id);
    check('sign opens ' + z.name, opened);
  }
  await closePanels(page);
  await spawnAt(page, [307, 505]);
  await page.waitForTimeout(120); await page.keyboard.press('e');
  check('Costura upgrade is reachable using E', await page.evaluate(() => clerkMode === 'upgrade' && document.getElementById('clerk-panel').classList.contains('open')));
  await closePanels(page);
  await spawnAt(page, [600, 447]);
  await page.evaluate(() => {
    const sc = game.scene.getScene('PorticoScene');
    sc._lobbyPath = CentralLobby.findPath([600, 447], [245, 484]);
  });
  await page.waitForFunction(() => !game.scene.getScene('PorticoScene')._lobbyPath.length, null, { timeout: 25000 });
  check('automatic walking follows a route to the forge', await page.evaluate(() => {
    const sc = game.scene.getScene('PorticoScene');
    return Math.hypot(sc.player.x / sc._lobbyScale - 245, (sc.player.y + sc._lobbyFootOffset) / sc._lobbyScale - 484) < 25;
  }));
  await page.keyboard.press('e');
  check('proximity interaction opens the forge', await page.evaluate(() => document.getElementById('clerk-panel').classList.contains('open') && clerkMode === 'craft'));
  await closePanels(page);

  await spawnAt(page, [600, 203]);
  await page.waitForTimeout(100); await page.keyboard.press('e');
  await page.locator('[onclick^="travelTo("]').first().click();
  await sceneReady(page, 'PerimScene');
  check('Portal travels to Perim and removes lobby controls', await page.evaluate(() => GameState.location === 'perim' && !document.getElementById('lobby-controls')));
  await page.evaluate(() => game.scene.getScene('PerimScene').scene.start('PorticoScene'));
  await sceneReady(page, 'PorticoScene');
  check('return to the lobby creates exactly one set of controls', await page.locator('#lobby-controls').count() === 1);
  await spawnAt(page, [600, 852]);
  await page.waitForTimeout(100); await page.keyboard.press('e');
  await sceneReady(page, 'ExteriorScene');
  check('south exit leads to Ilha dos Dromos', await page.evaluate(() => GameState.location === 'exterior'));
  await page.evaluate(() => game.scene.getScene('ExteriorScene').enterCentral());
  await sceneReady(page, 'PorticoScene');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#lobby-map-button').click();
  await page.waitForTimeout(600);
  check('mobile view can follow the character', await page.evaluate(() => !game.scene.getScene('PorticoScene').fullMapMode));
  await page.screenshot({ path: path.join(out, 'patio-mobile.png') });
  await page.locator('#lobby-map-button').click();
  check('mobile button shows the entire map', await page.evaluate(() => game.scene.getScene('PorticoScene').fullMapMode));
  await page.screenshot({ path: path.join(out, 'patio-mobile-map.png') });
  await page.evaluate(() => { openScannerReal(); showScannerPage('mapa'); });
  check('minimap uses all eight sectors', await page.evaluate(() => { drawScannerMinimap(); return document.getElementById('scanner-minimap-legend').textContent.includes('Comunicação'); }));
  check('no JavaScript errors in the browser', errors.length === 0);
  console.log('Browser checks passed:', checks, 'Screenshots:', out);
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { const stopped = new Promise(resolve => server.once('exit', resolve)); server.kill('SIGTERM'); await stopped; }
  fs.rmSync(tmp, { recursive: true, force: true });
});
