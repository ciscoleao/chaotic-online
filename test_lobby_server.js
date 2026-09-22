// E2E servidor: sobe o server.js patcheado com o lobby e percorre site>login>jogar.
// Monta fixture em tmpdir, semeia 1 conta+sessão, testa /game anônimo (302) e
// autenticado (200 + injeções + marcadores do lobby novo) e o fallback p/ v123.
// Uso: node tests/test_lobby_server.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? ' — ' + extra : '')); }
};

const HERE = __dirname;
const SERVER_JS = path.join(HERE, '..', 'integracao', 'server.js');
const LOBBY_HTML = path.join(HERE, '..', 'Chaotic_Online_Lobby_FIX.html');
const FEM = path.join(HERE, '..', 'integracao', 'fixture', 'fem.json');
const SKINS = path.join(HERE, '..', 'integracao', 'fixture', 'skins.json');
const V123 = path.join(HERE, '..', '..', 'chaotic_idleworld_v123.html'); // só existe dentro do repo

const SID = 'sessfixa123';
const SEED = {
  accounts: { 't@t.t': { user: 'tester', email: 't@t.t', chars: [{ nick: 'HeroiTeste', sex: 'm', skin: '' }] } },
  sessions: { [SID]: { email: 't@t.t', createdAt: 1750000000000 } },
  blocks: {}, nicks: {}, saves: {}, chat: []
};

function req(port, p, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: p, headers }, res => {
      let b = '';
      res.on('data', c => { b += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
    }).on('error', reject);
  });
}

function boot(fixture, port) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(process.execPath, ['server/server.js'],
      { cwd: fixture, env: Object.assign({}, process.env, { PORT: String(port) }) });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('exit', code => {
      if (!settled) { settled = true; reject(new Error('saiu cedo (codigo ' + code + '): ' + out.slice(0, 300))); }
    });
    const t0 = Date.now();
    (async () => {
      while (Date.now() - t0 < 15000) {
        if (settled) return;
        try { await req(port, '/api/config'); settled = true; return resolve({ child, out: () => out }); }
        catch (e) { await new Promise(r => setTimeout(r, 300)); }
      }
      if (!settled) {
        settled = true;
        try { child.kill('SIGKILL'); } catch (e) {}
        reject(new Error('nao subiu na porta ' + port + ': ' + out.slice(0, 300)));
      }
    })();
  });
}

function kill(child) { try { child.kill('SIGKILL'); } catch (e) {} }

async function bootAny(fixture) {
  let last = null;
  for (const p of [18901, 18902, 18903]) {
    try { const s = await boot(fixture, p); return { srv: s, port: p }; }
    catch (e) { last = e; }
  }
  throw last;
}

(async () => {
  console.log('== pacote (arquivos da integracao) ==');
  for (const [n, f] of [['server.js', SERVER_JS], ['lobby html', LOBBY_HTML], ['fem.json', FEM], ['skins.json', SKINS]]) {
    ok(fs.existsSync(f), 'presente: ' + n);
  }
  if (fail) { console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`); process.exit(1); }

  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'lobby-e2e-'));
  fs.mkdirSync(path.join(fixture, 'lobby'), { recursive: true });
  fs.mkdirSync(path.join(fixture, 'server', 'data'), { recursive: true });
  fs.copyFileSync(SERVER_JS, path.join(fixture, 'server', 'server.js'));
  fs.copyFileSync(FEM, path.join(fixture, 'server', 'fem.json'));
  fs.copyFileSync(SKINS, path.join(fixture, 'server', 'skins.json'));
  fs.copyFileSync(LOBBY_HTML, path.join(fixture, 'lobby', 'Chaotic_Online_Lobby_FIX.html'));
  fs.writeFileSync(path.join(fixture, 'server', 'data', 'db.json'), JSON.stringify(SEED));
  const hasV123 = fs.existsSync(V123);
  if (hasV123) fs.copyFileSync(V123, path.join(fixture, 'chaotic_idleworld_v123.html'));

  console.log('== fluxo site>login>jogar (servidor real) ==');
  let srv, port;
  try { ({ srv, port } = await bootAny(fixture)); }
  catch (e) { ok(false, 'servidor subiu', e.message); fs.rmSync(fixture, { recursive: true, force: true }); console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`); process.exit(1); }
  try {
    ok(/\(lobby novo\)/.test(srv.out()), 'boot anuncia (lobby novo)');
    const anon = await req(port, '/game');
    ok(anon.status === 302 && /\/$/.test(anon.headers.location || ''), 'sem login: /game -> 302 /');
    const g = await req(port, '/game?char=HeroiTeste', { 'x-session': SID });
    ok(g.status === 200, '/game com sessao -> 200');
    const s = g.body;
    for (const [n, m] of [
      ['sessao CHAO_ONLINE', 'window.CHAOS_ONLINE='],
      ['nick HeroiTeste', 'HeroiTeste'],
      ['SESSION_TOKEN', SID],
      ['skinswitch FEM', 'window.CHAOS_FEM'],
      ['nickSet GameState', 'GameState.player.name = window.CHAOS_ONLINE.nick'],
      ['BRIDGE sync', '__CHAOS_SYNC'],
      ['lobby NOVO (drone_side)', 'lobby_drone_side'],
      ['lobby NOVO (chaoticDrone)', 'drawChaoticDrone'],
      ['lobby NOVO (central-lobby)', 'data-embedded="central-lobby"'],
    ]) ok(s.includes(m), 'injecao: ' + n);
  } finally { kill(srv.child); }

  console.log('== fallback (sem lobby -> v123) ==');
  if (hasV123) {
    fs.rmSync(path.join(fixture, 'lobby', 'Chaotic_Online_Lobby_FIX.html'));
    let srv2 = null, port2 = 0;
    try { ({ srv: srv2, port: port2 } = await bootAny(fixture)); }
    catch (e) { ok(false, 'fallback: servidor subiu', e.message); }
    try {
      if (srv2) {
        ok(/\(fallback/.test(srv2.out()), 'fallback: boot anuncia fallback');
        const g2 = await req(port2, '/game', { 'x-session': SID });
        ok(g2.status === 200 && !g2.body.includes('lobby_drone_side') &&
          g2.body.includes('HeroiTeste') && g2.body.includes('__CHAOS_SYNC'),
          'fallback: serve v123 injetado');
      }
    } finally { if (srv2) kill(srv2.child); }
  } else {
    console.log('  ⏭ fallback v123: pulado (fora do repo)');
  }

  fs.rmSync(fixture, { recursive: true, force: true });
  console.log(`\nRESULTADO: ${pass} ok, ${fail} falhas`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  ❌ ERRO: ' + (e && e.message)); process.exit(1); });
