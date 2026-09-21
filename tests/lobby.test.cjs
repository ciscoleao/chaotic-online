'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const vm = require('node:vm');
const lobby = require('../assets/lobby/central-lobby.js');
const root = path.join(__dirname, '..');

test('all eight sectors, secondary counters and the Dromos exit are reachable from the plaza', () => {
  assert.equal(lobby.SECTORS.length, 8);
  for (const z of lobby.SECTORS.concat([lobby.EXIT, { name: 'Costura', point: [307, 505] }, { name: 'Bebidas', point: [1054, 234] }])) {
    assert.ok(lobby.isWalkable(...z.point), z.name + ': interaction point is on a floor');
    const route = lobby.findPath([600, 447], z.point);
    assert.ok(route.length > 0, z.name + ': connected to spawn');
    for (let i = 0; i < route.length; i++) {
      assert.ok(lobby.isWalkable(...route[i]), z.name + ': route stays on a floor');
      if (i) assert.equal(Math.abs(route[i][0] - route[i - 1][0]) + Math.abs(route[i][1] - route[i - 1][1]), lobby.CELL);
    }
    assert.ok(Math.hypot(route.at(-1)[0] - z.point[0], route.at(-1)[1] - z.point[1]) < lobby.CELL);
  }
});

test('walls block space and furnishings and agree with the navigation grid', () => {
  for (const p of [[0, 0], [1199, 899], [600, 25], [217, 150], [227, 400], [975, 445], [600, 690]]) {
    assert.equal(lobby.isWalkable(...p), false, 'blocked reference point ' + p);
  }
  const rects = lobby.wallRects();
  for (let i = 0; i < lobby.GRID.cells.length; i++) {
    const x = (i % lobby.GRID.cols + 0.5) * lobby.CELL;
    const y = (Math.floor(i / lobby.GRID.cols) + 0.5) * lobby.CELL;
    const blocked = rects.some(r => x > r[0] && x < r[0] + r[2] && y > r[1] && y < r[1] + r[3]);
    assert.equal(blocked, !lobby.GRID.cells[i], 'collision and route agree at ' + x + ',' + y);
  }
});

test('runtime serves lobby assets while keeping accounts and repository files private', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chaotic-lobby-test-'));
  for (const file of ['server/server.js', 'server/skins.json', 'server/fem.json', 'chaotic_idleworld_v123.html']) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  fs.cpSync(path.join(root, 'assets'), path.join(dir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'site')); fs.writeFileSync(path.join(dir, 'site/index.html'), '<p>Test</p>');
  fs.mkdirSync(path.join(dir, 'server/data'));
  const email = 'lobby-test@example.test';
  fs.writeFileSync(path.join(dir, 'server/data/db.json'), JSON.stringify({
    accounts: { [email]: { email, user: 'LobbyTest', chars: [{ nick: 'LobbyTest', sex: 'm' }] } },
    sessions: { 'lobby-test-session': { email, createdAt: Date.now() } }
  }));
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const proc = spawn(process.execPath, ['server/server.js'], {
    cwd: dir, env: { ...process.env, PORT: String(port), SUPABASE_URL: '', SUPABASE_KEY: '' }, stdio: 'pipe'
  });
  t.after(async () => {
    if (proc.exitCode === null) {
      const exited = new Promise(resolve => proc.once('exit', resolve));
      proc.kill('SIGTERM'); await exited;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    proc.stdout.on('data', data => { if (data.toString().includes('na porta')) { clearTimeout(timer); resolve(); } });
    proc.once('error', error => { clearTimeout(timer); reject(error); });
  });
  const base = 'http://127.0.0.1:' + port;
  for (const [asset, type] of [['central-lobby.js', 'application/javascript'], ['central-lobby.css', 'text/css'], ['patio-central.webp', 'image/webp']]) {
    const response = await fetch(base + '/assets/lobby/' + asset + '?v=236');
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
    const data = await response.arrayBuffer();
    assert.equal(data.byteLength, fs.statSync(path.join(root, 'assets/lobby', asset)).size);
    const head = await fetch(base + '/assets/lobby/' + asset, { method: 'HEAD' });
    assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
  for (const url of ['/assets/lobby/missing.webp', '/assets/lobby/../../server/data/db.json', '/server/data/db.json', '/assets/lobby/%2e%2e/%2e%2e/server/server.js']) {
    assert.equal((await fetch(base + url)).status, 404, url);
  }
  assert.equal((await fetch(base + '/game', { redirect: 'manual' })).status, 302);
  const game = await fetch(base + '/game?sess=lobby-test-session');
  assert.equal(game.status, 200);
  const html = await game.text();
  assert.ok(html.includes('window.CHAOS_ONLINE={"nick":"LobbyTest"'));
  assert.ok(html.includes('src="assets/lobby/central-lobby.js?v=236"'));
  assert.ok(html.includes('CentralLobby.create(this)'));
  let inlineScripts = 0;
  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    new vm.Script(match[1], { filename: 'served-game-script-' + inlineScripts++ + '.js' });
  }
  assert.ok(inlineScripts >= 4, 'the authenticated game scripts were syntax checked');
});
