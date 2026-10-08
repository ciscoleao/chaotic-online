// Integração da versão atual: usa somente arquivos de execução e dados fictícios.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const cp = require('node:child_process');
const crypto = require('node:crypto');

test('site, skins, personagens e progresso sobrevivem à organização e ao restart', async () => {
  const root = path.resolve(__dirname, '..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chaotic-cleanup-test-'));
  const files = ['package.json', 'game/index.html', 'site/index.html', 'server/server.js', 'server/auth-security.js', 'server/fem.json', 'server/skins.json'];
  for (const file of files) {
    const target = path.join(dir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  fs.cpSync(path.join(root, 'site/assets'), path.join(dir, 'site/assets'), { recursive: true });
  const skins = JSON.parse(fs.readFileSync(path.join(dir, 'server/skins.json'), 'utf8'));
  const chars = [
    { nick: 'Teste', sex: 'm', skin: (skins.find(s => s.sex === 'm') || {}).id },
    { nick: 'Ana', sex: 'f', skin: (skins.find(s => s.sex === 'f') || {}).id }
  ];
  const email = 'integration@example.test';
  const token = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.join(dir, 'server/data'));
  fs.writeFileSync(path.join(dir, 'server/data/db.json'), JSON.stringify({
    accounts: { [email]: { email, user: 'Integracao', chars } },
    sessions: { [token]: { email } }, saves: {}, chat: [], nicks: {}, blocks: {}
  }));
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  let child;
  let logs = '';
  async function start() {
    child = cp.spawn(process.execPath, [path.join(dir, 'server/server.js')], {
      env: { PATH: process.env.PATH, PORT: String(port), GOOGLE_CLIENT_ID: 'fake-test-id', GOOGLE_CLIENT_SECRET: 'fake-test-secret', PUBLIC_URL: 'https://game.example' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.on('data', b => { logs += b; });
    child.stderr.on('data', b => { logs += b; });
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Servidor encerrou: ${logs}`);
      try { if ((await fetch(base + '/api/config')).ok) return; } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Servidor não iniciou: ${logs}`);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
    child = null;
  }
  try {
    await start();
    let r = await fetch(base + '/');
    assert.equal(r.status, 200);
    assert.equal(await r.text(), fs.readFileSync(path.join(root, 'site/index.html'), 'utf8'));
    const manifest = await (await fetch(base + '/site-assets/manifest.json')).json();
    assert.equal(manifest.creatures, 120);
    for (const file of fs.readdirSync(path.join(root, 'site/assets'))) {
      r = await fetch(base + '/site-assets/' + file);
      assert.equal(r.status, 200, 'Asset público deve ser servido: ' + file);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert((await r.arrayBuffer()).byteLength > 0);
    }
    r = await fetch(base + '/site-assets/inexistente.webp');
    assert.equal(r.status, 404);
    r = await fetch(base + '/site-assets/../server.js');
    assert.equal(r.status, 404);
    r = await fetch(base + '/api/skins');
    assert.equal(r.status, 200);
    const pack = await r.json();
    assert.equal(pack.length, skins.length);
    assert.equal(pack.find(s => s.id === 'nova-rosa').vip, false);
    assert.equal(pack.find(s => s.id === 'rosa').vip, true);
    r = await fetch(base + '/auth/google', {redirect:'manual'});
    assert.equal(r.status, 302);
    const oauth = new URL(r.headers.get('location'));
    assert.equal(oauth.origin, 'https://accounts.google.com');
    assert.equal(oauth.searchParams.get('redirect_uri'), 'https://game.example/auth/google/callback');
    assert(oauth.searchParams.get('state'));
    assert(r.headers.get('set-cookie').includes('HttpOnly'));
    assert(r.headers.get('set-cookie').includes('Secure'));
    r = await fetch(base + '/auth/google/callback?code=fake&state=invalid', {redirect:'manual'});
    assert.equal(r.headers.get('location'), '/?google=erro');
    r = await fetch(base + '/game', { redirect: 'manual' });
    assert.equal(r.status, 302);
    const headers = { 'x-session': token, 'content-type': 'application/json' };
    r = await fetch(base + '/api/character', {method:'POST',headers,body:JSON.stringify({nick:'VipLocked',sex:'f',skin:'rosa'})});
    assert.equal(r.status,403, 'A API rejeita a skin VIP para conta comum');
    r = await fetch(base + '/api/character', {method:'POST',headers,body:JSON.stringify({nick:'NovaRosa',sex:'f'})});
    assert.equal(r.status,200);
    assert.equal((await r.json()).chars.at(-1).skin, 'nova-rosa', 'A criação feminina usa a nova skin por padrão');
    const progress = JSON.stringify({ player: { name: 'Teste', lvl: 5, sarah299: { stage: 1, active: true, progress: 7200000, acceptedAt: 1 } } });
    r = await fetch(base + '/api/save', { method: 'POST', headers, body: JSON.stringify({ data: progress }) });
    assert.equal(r.status, 200);
    const firstAt = (await r.json()).updatedAt;
    const purchase = JSON.stringify({ player: { name: 'Teste', pilhas: 35, bits: 20, xp: 25 } });
    r = await fetch(base + '/api/save', { method: 'POST', headers, body: JSON.stringify({ data: purchase, baseUpdatedAt: firstAt }) });
    assert.equal(r.status, 200);
    const purchaseAt = (await r.json()).updatedAt;
    assert(purchaseAt > firstAt);
    // Simula um request anterior que só chega depois da compra.
    r = await fetch(base + '/api/save', { method: 'POST', headers, body: JSON.stringify({ data: progress, baseUpdatedAt: firstAt }) });
    assert.equal(r.status, 409);
    assert.equal((await r.json()).updatedAt, purchaseAt);
    r = await fetch(base + '/api/save', { headers });
    assert.equal((await r.json()).data, purchase);
    r = await fetch(base + '/api/save', { method: 'POST', headers, body: JSON.stringify({ data: progress, baseUpdatedAt: purchaseAt }) });
    assert.equal(r.status, 200);
    r = await fetch(base + '/api/save', { headers });
    assert.equal((await r.json()).data, progress);
    for (const ch of chars) {
      r = await fetch(base + '/game?char=' + ch.nick, { headers });
      assert.equal(r.status, 200);
      const html = await r.text();
      assert(html.includes('window.CHAOS_ONLINE='));
      assert(html.includes(JSON.stringify(ch.nick)));
      assert(html.includes('window.CHAOS_FEM='));
      assert(html.includes('window.CHAOS_SAVE=' + JSON.stringify(progress)));
      assert(html.includes('sarah299'));
      if (ch.skin) assert(html.includes('window.CHAOS_SKIN'));
      assert(html.includes('function createFemaleSideTextures(scene) { return Promise.resolve();'));
      assert(!html.includes("if (prefix === 'femaleHero_' && (direction === 'e' || direction === 'w')) continue;"));
      const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
      for (const script of scripts) if (script[1].trim() && !script[1].trim().startsWith('{')) new (require('node:vm').Script)(script[1]);
    }
    await stop();
    await start();
    r = await fetch(base + '/api/save', { headers });
    assert.equal((await r.json()).data, progress);
    const current = await (await fetch(base + '/api/save', {headers})).json();
    r = await fetch(base + '/api/save', {method:'POST',headers,body:JSON.stringify({data:JSON.stringify({player:{vip:true}}),baseUpdatedAt:current.updatedAt})});
    assert.equal(r.status,200);
    r = await fetch(base + '/game?char=Ana', {headers});
    const vipGame = await r.text();
    assert(!vipGame.includes('function createFemaleSideTextures(scene) { return Promise.resolve();'), 'VIP recupera o atlas e as laterais femininas clássicas');
  } finally {
    await stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
