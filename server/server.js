#!/usr/bin/env node
/* ============================================================
   CHAOTIC.IDLEWORLD — SERVIDOR FASE 2 (Node puro, 0 dependências)
   ------------------------------------------------------------
   • Contas reais (email+usuário+senha scrypt) em server/data/db.json
   • Sessões com cookie HttpOnly (sobrevivem a restart)
   • Cloudflare Turnstile VERIFICADO no servidor (siteverify)
       - SITEKEY/SECRET abaixo = chaves de TESTE da Cloudflare
         (sempre passam). Troque pelas suas chaves reais em produção.
   • Captcha de 5 caracteres: código gerado no servidor, validado
     no servidor; 3 erros => bloqueio de 1h por IP (persistente)
   • Personagens (nick/sexo) salvos na conta; nick único global
   • GET /game?char=Nick -> devolve o jogo v122 com nick + skin
     feminina injetados server-side (sessão obrigatória)
   • Google OAuth pronto: preencha GOOGLE_CLIENT_ID/SECRET
   Rodar:  node server/server.js   (porta 8901)
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CFG = {
  PORT: Number(process.env.PORT || 8901),
  // Cloudflare Turnstile — CHAVES DE TESTE (doc oficial; sempre passam no widget 1x…AA)
  SITEKEY: '1x00000000000000000000AA',
  SECRET: '1x0000000000000000000000000000000AA',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || ''
};
/* ---------------- Supabase (opcional): persistência que sobrevive a redeploys ----------------
   Defina no ambiente: SUPABASE_URL (Project URL) e SUPABASE_KEY (service_role).
   Tabela única `game_state` (veja publicar/README-SUPABASE.md). Sem essas vars,
   o servidor funciona como antes (só disco local). */
const CLOUD = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) ? {
  url: String(process.env.SUPABASE_URL).replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, ''),
  key: String(process.env.SUPABASE_KEY),
  table: process.env.SUPABASE_TABLE || 'game_state'
} : null;
let cloudDirty = false, cloudTimer = null, cloudSaving = false, cloudReady = false;
async function cloudFetch(pathname, opts) {
  return fetch(CLOUD.url + pathname, Object.assign({}, opts, {
    headers: Object.assign({ apikey: CLOUD.key, Authorization: 'Bearer ' + CLOUD.key }, (opts && opts.headers) || {})
  }));
}
async function cloudLoad() {
  const r = await cloudFetch('/rest/v1/' + CLOUD.table + '?id=eq.1&select=data', {});
  if (!r.ok) {
    let t = '';
    try { t = String(await r.text()).slice(0, 140); } catch (e) {}
    throw new Error('HTTP ' + r.status + (t ? ' · ' + t : ''));
  }
  const j = await r.json();
  return (Array.isArray(j) && j[0] && j[0].data) ? j[0].data : null;
}
async function cloudSaveNow() {
  const body = JSON.stringify([{ id: 1, data: db, updated_at: new Date().toISOString() }]);
  const r = await cloudFetch('/rest/v1/' + CLOUD.table + '?on_conflict=id', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: body
  });
  if (!r.ok) {
    let t = '';
    try { t = String(await r.text()).slice(0, 140); } catch (e) {}
    throw new Error('HTTP ' + r.status + (t ? ' · ' + t : ''));
  }
}
async function cloudRecoverMerge() {
  try {
    const c = await cloudLoad();
    if (!c) return;
    let added = 0;
    for (const em in (c.accounts || {})) if (!db.accounts[em]) { db.accounts[em] = c.accounts[em]; added++; }
    for (const em in (c.saves || {})) {
      const cu = (c.saves[em] && c.saves[em].updatedAt) || 0;
      const lo = (db.saves[em] && db.saves[em].updatedAt) || 0;
      if (cu > lo) db.saves[em] = c.saves[em];
    }
    for (const em in (c.nicks || {})) if (!db.nicks[em]) db.nicks[em] = c.nicks[em];
    if ((c.chat || []).length > (db.chat || []).length) { db.chat = c.chat; reseedChatSeq(); }
    if (added) console.log('[nuvem] recuperação: ' + added + ' conta(s) que só existiam na nuvem foram preservadas');
  } catch (e) {}
}
function scheduleCloudSave(delay) {
  if (!CLOUD) return;
  cloudDirty = true;
  if (cloudTimer || cloudSaving) return;
  cloudTimer = setTimeout(cloudRun, delay || 4000);
  if (cloudTimer.unref) cloudTimer.unref();
  async function cloudRun() {
    cloudTimer = null;
    if (!cloudDirty || cloudSaving) return;
    cloudSaving = true;
    try {
      if (!cloudReady) await cloudRecoverMerge();
      await cloudSaveNow();
      cloudDirty = false;
      if (!cloudReady) { cloudReady = true; console.log('[nuvem] dados persistindo no Supabase ✓'); }
    } catch (e) {
      console.log('[nuvem] falha ao salvar (vou tentar de novo):', e.message);
    } finally {
      cloudSaving = false;
      if (cloudDirty && !cloudTimer) scheduleCloudSave(1500);
    }
  }
}
function reseedChatSeq() {
  db.chat = db.chat || [];
  db.chat.forEach((m, i) => { m.id = i + 1; });
  chatSeq = db.chat.length;
}
const ROOT = path.join(__dirname, '..');
const LOBBY_CANDIDATES = [path.join(ROOT, 'lobby', 'Chaotic_Online_Lobby_FIX.html'), path.join(ROOT, 'Chaotic_Online_Lobby_FIX.html')];
const LOBBY_FILE = LOBBY_CANDIDATES.find(f => fs.existsSync(f)) || null;
const GAME_FILE = LOBBY_FILE || (fs.existsSync(path.join(ROOT, 'chaotic_idleworld_v123.html')) ? path.join(ROOT, 'chaotic_idleworld_v123.html') : path.join(ROOT, 'chaotic_idleworld_v122.html'));
console.log('[boot] /game serve: ' + GAME_FILE + (LOBBY_FILE ? ' (lobby novo)' : ' (fallback v123/v122)'));
const SITE_FILE = path.join(ROOT, 'site', 'index.html');
const FEM_FILE = path.join(__dirname, 'fem.json');
let SKINS = [];
try { SKINS = JSON.parse(fs.readFileSync(path.join(__dirname, 'skins.json'), 'utf8')); console.log('[boot] skins: ' + SKINS.length + ' carregadas (' + SKINS.map(x => x.id).join(', ') + ')'); }
catch (e) { console.log('[boot] skins.json ausente/invalida — somente skin Classica'); }
const DB_FILE = path.join(__dirname, 'data', 'db.json');

/* ---------------- DB (JSON persistente, escrita atômica) ---------------- */
let db = { accounts: {}, sessions: {}, blocks: {}, nicks: {}, saves: {}, chat: [] };
let chatSeq = 0;
const chatRate = {};
const presence = {};   // email -> { n, nick, map, x, y, ts, sid }
const nearRing = [];   // chat de proximidade (em memória, por sala)
let nearSeq = 0;
const pmBox = {};      // email -> mensagens privadas {i, from|to, x, ts}
const pmSeq = {};
setInterval(() => {
  const now = Date.now();
  for (const em in presence) if (now - presence[em].ts > 90000) delete presence[em];
  while (nearRing.length && now - nearRing[0].ts > 300000) nearRing.shift();
  for (const em in pmBox) { const b = pmBox[em]; while (b.length && now - b[0].ts > 1800000) b.shift(); }
}, 30000);
const pvpQ = [];   // fila de busca de duelo
const pvpM = {};   // partidas ativas
function chatSys(text) {
  const m = { id: ++chatSeq, n: '', x: String(text).slice(0, 200), ts: Date.now(), sys: true };
  db.chat.push(m);
  while (db.chat.length > 300) db.chat.shift();
  saveDB();
  return m.id;
}
try {
  const __disk = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db = Object.assign(db, __disk);
  reseedChatSeq();
  console.log('[boot] disco local:', Object.keys(db.accounts || {}).length, 'contas ·', (db.chat || []).length, 'msgs');
} catch (e) {}
function saveDB() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const t = DB_FILE + '.tmp';
  fs.writeFileSync(t, JSON.stringify(db));
  fs.renameSync(t, DB_FILE);
  if (CLOUD) scheduleCloudSave();
}
setInterval(() => { // varredura de partidas PVP (W.O. por desconexão)
  const now = Date.now();
  for (let i = pvpQ.length - 1; i >= 0; i--) if (now - pvpQ[i].ts > 120000) pvpQ.splice(i, 1);
  for (const id in pvpM) {
    const mt = pvpM[id];
    if (mt.ended) continue;
    const older = now - mt.created;
    const aStale = now - mt.a.seen > 10000, bStale = now - mt.b.seen > 10000;
    if (older > 25000 && (aStale || bStale)) {
      mt.ended = true;
      if (aStale && !bStale) { mt.b.q.push({ s: ++mt.b.seq, d: { t: 'walkover', win: true } }); chatSys('🚪 ' + mt.a.user + ' desconectou do duelo contra ' + mt.b.user + '. W.O.'); }
      else if (bStale && !aStale) { mt.a.q.push({ s: ++mt.a.seq, d: { t: 'walkover', win: true } }); chatSys('🚪 ' + mt.b.user + ' desconectou do duelo contra ' + mt.a.user + '. W.O.'); }
      else { mt.a.q.push({ s: ++mt.a.seq, d: { t: 'walkover', win: null } }); mt.b.q.push({ s: ++mt.b.seq, d: { t: 'walkover', win: null } }); }
      setTimeout(() => { delete pvpM[id]; }, 20000);
      console.log('[pvp] W.O. em', id);
    } else if (older > 600000) {
      mt.ended = true;
      setTimeout(() => { delete pvpM[id]; }, 20000);
    }
  }
}, 5000).unref();

setInterval(() => { // limpeza de blocos expirados
  let ch = false;
  const now = Date.now();
  for (const k in db.blocks) if (db.blocks[k] < now) { delete db.blocks[k]; ch = true; }
  if (ch) saveDB();
}, 300000).unref();

/* ---------------- helpers ---------------- */
function ip(req) {
  const f = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return f || req.socket.remoteAddress || '?';
}
function blocked(req) {
  const u = db.blocks[ip(req)] || 0;
  return u > Date.now() ? u : 0;
}
function json(res, code, o) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(o));
}
function readBody(req, max) {
  max = max || 100000;
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > max) { reject(new Error('body grande')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { resolve({}); } });
    req.on('error', reject);
  });
}
function getSid(req) {
  const m = /(?:^|;\s*)chaos_sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}
function auth(req) {
  const sid = String(req.headers['x-session'] || '') || getSid(req);
  const s = sid && db.sessions[sid];
  return s ? (db.accounts[s.email] || null) : null;
}
function sessToken(req) {
  return String(req.headers['x-session'] || '') || getSid(req) || '';
}
function cookieSet(sid) {
  return 'chaos_sid=' + sid + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (30 * 24 * 3600);
}
function cookieClear() {
  return 'chaos_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
function hashPass(pass, salt) {
  return crypto.scryptSync(pass, salt, 64).toString('hex');
}
function safeEq(a, b) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

/* ---------------- Turnstile (siteverify) ---------------- */
async function verifyTS(token, ipaddr) {
  if (!token || typeof token !== 'string') return false;
  const isTest = CFG.SITEKEY.startsWith('1x0000') || CFG.SITEKEY.startsWith('2x0000') || CFG.SITEKEY.startsWith('3x0000');
  if (token === 'SIMULATED') return isTest; // só modo teste aceita fallback do cliente
  try {
    const body = new URLSearchParams({ secret: CFG.SECRET, response: token, remoteip: ipaddr });
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = await r.json();
    return !!j.success;
  } catch (e) {
    // sem internet (ex.: sandbox offline): só aceita em modo de teste
    return isTest;
  }
}

/* ---------------- Captcha (servidor) ---------------- */
const capMap = new Map(); // id -> {code, exp, tries, checked}
const CAP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  let s = '';
  for (let i = 0; i < 5; i++) s += CAP_CHARS[crypto.randomInt(CAP_CHARS.length)];
  return s;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of capMap) if (v.exp < now) capMap.delete(k);
}, 60000).unref();
function capConsume(id, text) {
  const e = capMap.get(String(id || ''));
  if (!e || e.exp < Date.now() || !e.checked) { capMap.delete(String(id || '')); return false; }
  if (String(text || '').toUpperCase().trim() !== e.code) return false;
  capMap.delete(String(id || ''));
  return true;
}

/* ---------------- Jogo: injeção nick + skin feminina ---------------- */
const STORAGE_SHIM = '<script>(function(){try{window.localStorage.getItem("__t")}catch(e){var m={};var sh={getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},key:function(i){return Object.keys(m)[i]||null},clear:function(){m={}},get length(){return Object.keys(m).length}};try{Object.defineProperty(window,"localStorage",{get:function(){return sh},configurable:true})}catch(e){}try{Object.defineProperty(window,"sessionStorage",{get:function(){return sh},configurable:true})}catch(e){}}})();<\/script>';
const ANCHOR_MONSTROS = '\n// ============================================================\n// MONSTROS v1.6';
const ANCHOR_NICK = 'if (!loadGame()) { checkDailyReset(); }';
const BRIDGE = `(function(){
"use strict";
var KEY='chaotic_idleworld_v098_rpg', META='chaos_sync_meta_v1';
function hash(x){var h=5381,i;for(i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))>>>0;return h.toString(36);}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
var local=lsGet(KEY), meta=null;
try{meta=JSON.parse(lsGet(META)||'null');}catch(e){meta=null;}
var srv=window.CHAOS_SAVE||null, srvAt=window.CHAOS_SAVE_AT||0;
var synced=!!(local&&meta&&meta.h===hash(local));
var mode;
if(!srv) mode=local?'local':'none';
else if(!local) mode='server';
else mode=synced?'server':'local';
if(mode==='server'){ lsSet(KEY,srv); meta={h:hash(srv),at:srvAt}; lsSet(META,JSON.stringify(meta)); }
window.__CHAOS_SYNC=mode;
var t=null,lastPushed=null;
function push(){
  var d=lsGet(KEY); if(!d||d===lastPushed) return; lastPushed=d;
  try{fetch('/api/save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:d}),keepalive:true}).catch(function(){});}catch(e){}
  meta={h:hash(d),at:Date.now()}; lsSet(META,JSON.stringify(meta));
}
function queue(){ if(t)clearTimeout(t); t=setTimeout(push,2500); }
try{
  var _sg=saveGame;
  saveGame=function(silent){ var r=_sg(silent); queue(); return r; };
}catch(e){}
window.addEventListener('pagehide',function(){ try{ var d=lsGet(KEY); if(d&&d!==lastPushed&&navigator.sendBeacon){ navigator.sendBeacon('/api/save/beacon',new Blob([JSON.stringify({data:d})],{type:'application/json'})); lastPushed=d; } }catch(e){} });
document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') push(); });
if(mode==='local') setTimeout(push,1200);
})();`
const ANCHOR_BOOT = 'if (!loadGame()) { checkDailyReset(); }';
function buildGame(ch, acc, sessId) {
  let html = fs.readFileSync(GAME_FILE, 'utf8');
  const fem = JSON.parse(fs.readFileSync(FEM_FILE, 'utf8'));
  html = html.replace('<head>', '<head>' + STORAGE_SHIM);
  const sv = acc ? (db.saves[acc.email] || null) : null;
  const FETCHX = '(function(){try{var of=window.fetch;if(of&&!of.__sx){var nf=function(u,o){u=String(u);if(u.indexOf("/api/")===0){o=o||{};o.headers=Object.assign({},o.headers||{},{"x-session":window.SESSION_TOKEN||""});}return of.call(this,u,o);};nf.__sx=1;window.fetch=nf;}}catch(e){}})();';
  const sess = '<script>window.CHAOS_ONLINE=' + JSON.stringify({ nick: ch.nick, sex: ch.sex, user: acc.user }) + ';window.SESSION_TOKEN=' + JSON.stringify(String(sessId || '')) + ';' + FETCHX + 'window.CHAOS_FEM=' + JSON.stringify(fem) + ';window.CHAOS_SAVE=' + (sv ? JSON.stringify(sv.data) : 'null') + ';window.CHAOS_SAVE_AT=' + (sv ? sv.updatedAt : 0) + ';</script>';
  html = html.replace('<head>', '<head>' + sess);
  const i = html.indexOf(ANCHOR_MONSTROS);
  if (i < 0) throw new Error('âncora MONSTROS não encontrada');
  const skinId = ch.skin || '';
  const sk = SKINS.find(x => x.id === skinId);
  let skinSwitch = '';
  if (sk) {
    const set = sk.sex === 'f' ? sk.fem : sk.masc;
    skinSwitch = '\nif (window.CHAOS_SKIN === undefined) { window.CHAOS_SKIN = ' + JSON.stringify({ palette: set.palette, frames: set.frames }) + '; }\nif (window.CHAOS_SKIN) { HERO_SPRITE.palette = window.CHAOS_SKIN.palette; HERO_SPRITE.frames = window.CHAOS_SKIN.frames; }\n';
  } else {
    skinSwitch = '\nif (window.CHAOS_ONLINE && window.CHAOS_ONLINE.sex === "f" && window.CHAOS_FEM) { HERO_SPRITE.palette = window.CHAOS_FEM.palette; HERO_SPRITE.frames = window.CHAOS_FEM.frames; }\n';
  }
  html = html.slice(0, i) + skinSwitch + html.slice(i);
  const j = html.indexOf(ANCHOR_NICK);
  if (j < 0) throw new Error('âncora do nick não encontrada');
  const nickSet = '\nif (window.CHAOS_ONLINE) { GameState.player.name = window.CHAOS_ONLINE.nick; }';
  html = html.slice(0, j + ANCHOR_NICK.length) + nickSet + html.slice(j + ANCHOR_NICK.length);
  const kB = html.indexOf(ANCHOR_BOOT);
  if (kB < 0) throw new Error('âncora do boot não encontrada');
  html = html.slice(0, kB) + BRIDGE + '\n' + html.slice(kB);
  return html;
}

/* ---------------- Google OAuth (opcional) ---------------- */
function googleHowto(origin) {
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Google Login — config</title>' +
    '<body style="background:#0b1120;color:#e9eefc;font-family:Segoe UI,Arial;display:flex;align-items:center;justify-content:center;min-height:100vh">' +
    '<div style="max-width:560px;background:#101828;border:1px solid #33415c;border-radius:18px;padding:34px;line-height:1.8">' +
    '<h2 style="color:#ffd54f;margin:0 0 12px">Login com o Google</h2>' +
    '<p>O botão já existe — para ativar o <b>Google OAuth real</b>, preencha no <b>server/server.js</b>:</p>' +
    '<pre style="background:#070b14;padding:14px;border-radius:10px;font-size:13px">GOOGLE_CLIENT_ID: "xxxx.apps.googleusercontent.com"\nGOOGLE_CLIENT_SECRET: "GOCSPX-xxxx"</pre>' +
    '<p style="color:#93a0bd;font-size:13px">Credenciais em: console.cloud.google.com → APIs e Serviços → Credenciais → OAuth. URI de redirecionamento autorizada: <b>' + origin + '/auth/google/callback</b></p>' +
    '<a href="/" style="color:#3fe3ea">← Voltar ao site</a></div></body></html>';
}
async function googleExchange(code, origin) {
  const redirect = (CFG.GOOGLE_REDIRECT || origin + '/auth/google/callback');
  const body = new URLSearchParams({
    code, client_id: CFG.GOOGLE_CLIENT_ID, client_secret: CFG.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirect, grant_type: 'authorization_code'
  });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const j = await r.json();
  if (!j.id_token) throw new Error('sem id_token');
  const payload = JSON.parse(Buffer.from(j.id_token.split('.')[1], 'base64url').toString('utf8'));
  return { email: payload.email, name: payload.name || (payload.email || '').split('@')[0] };
}

/* ---------------- Rotas ---------------- */
async function route(req, res) {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  const ipk = ip(req);
  const origin = 'http://' + (req.headers.host || ('localhost:' + CFG.PORT));

  /* CORS: permite o jogo embutido em preview/iframe (sessão via header x-session) */
  if (p.startsWith('/api/') || p === '/game') {
    res.setHeader('Access-Control-Allow-Origin', String(req.headers.origin || '*'));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-session');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  }

  if (req.method === 'GET' && p === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(SITE_FILE));
    return;
  }
  if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }

  /* ---- config pública ---- */
  if (p === '/api/config' && req.method === 'GET') {
    return json(res, 200, { sitekey: CFG.SITEKEY, google: !!CFG.GOOGLE_CLIENT_ID });
  }

  /* ---- skins disponíveis (pública) ---- */
  if (p === '/api/skins' && req.method === 'GET') {
    const pack = SKINS.map(sk => ({
      id: sk.id, label: sk.label, sex: sk.sex,
      masc: { palette: sk.masc.palette, s0: sk.masc.frames.s_0, s1: sk.masc.frames.s_1 },
      fem: { palette: sk.fem.palette, s0: sk.fem.frames.s_0, s1: sk.fem.frames.s_1 }
    }));
    return json(res, 200, pack);
  }

  /* ---- captcha ---- */
  if (p === '/api/captcha' && req.method === 'GET') {
    const b = blocked(req);
    if (b) return json(res, 200, { blockedUntil: b });
    const id = crypto.randomUUID();
    capMap.set(id, { code: genCode(), exp: Date.now() + 120000, tries: 0, checked: false });
    return json(res, 200, { id, code: capMap.get(id).code, ttl: 120 });
  }
  if (p === '/api/captcha/check' && req.method === 'POST') {
    const b = blocked(req);
    if (b) return json(res, 200, { blockedUntil: b });
    const body = await readBody(req);
    const e = capMap.get(String(body.id || ''));
    if (!e || e.exp < Date.now()) { capMap.delete(String(body.id || '')); return json(res, 200, { expired: true }); }
    e.tries++;
    if (String(body.text || '').toUpperCase().trim() === e.code) { e.checked = true; return json(res, 200, { ok: true }); }
    if (e.tries >= 3) {
      const until = Date.now() + 3600000;
      db.blocks[ipk] = until; saveDB(); capMap.delete(String(body.id || ''));
      console.log('[captcha] IP bloqueado 1h:', ipk);
      return json(res, 200, { blockedUntil: until });
    }
    return json(res, 200, { ok: false, triesLeft: 3 - e.tries });
  }

  /* ---- registro ---- */
  if (p === '/api/register' && req.method === 'POST') {
    const blk = blocked(req);
    if (blk) return json(res, 403, { err: 'IP bloqueado por tentativas. Volte em ' + Math.ceil((blk - Date.now()) / 60000) + ' min.' });
    const body = await readBody(req);
    if (!(await verifyTS(body.tsToken, ipk))) return json(res, 403, { err: 'Verificação anti-bot falhou. Recarregue a página e tente de novo.' });
    if (!capConsume(body.captchaId, body.captchaText)) return json(res, 403, { err: 'Captcha inválido — resolva o captcha de novo.' });
    const email = String(body.email || '').trim().toLowerCase();
    const user = String(body.user || '').trim();
    const pass = String(body.pass || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { err: 'Email inválido.' });
    if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) return json(res, 400, { err: 'Usuário: 3–16 letras/números/_.' });
    if (pass.length < 6) return json(res, 400, { err: 'Senha muito curta (mín. 6).' });
    if (db.accounts[email]) return json(res, 400, { err: 'Este email já possui conta. Faça login.' });
    for (const k in db.accounts) {
      if (db.accounts[k].user.toLowerCase() === user.toLowerCase()) return json(res, 400, { err: 'Nome de usuário já em uso.' });
    }
    const salt = crypto.randomBytes(16).toString('hex');
    db.accounts[email] = { email, user, salt, hash: hashPass(pass, salt), provider: 'senha', chars: [], createdAt: Date.now() };
    const sid = crypto.randomBytes(24).toString('hex');
    db.sessions[sid] = { email, createdAt: Date.now() };
    saveDB();
    res.setHeader('Set-Cookie', cookieSet(sid));
    console.log('[register]', email);
    return json(res, 200, { ok: true, user, token: sid });
  }

  /* ---- login ---- */
  if (p === '/api/login' && req.method === 'POST') {
    const blk = blocked(req);
    if (blk) return json(res, 403, { err: 'IP bloqueado por tentativas. Volte em ' + Math.ceil((blk - Date.now()) / 60000) + ' min.' });
    const body = await readBody(req);
    if (!(await verifyTS(body.tsToken, ipk))) return json(res, 403, { err: 'Verificação anti-bot falhou. Recarregue a página e tente de novo.' });
    if (!capConsume(body.captchaId, body.captchaText)) return json(res, 403, { err: 'Captcha inválido — resolva o captcha de novo.' });
    const who = String(body.user || '').trim().toLowerCase();
    const pass = String(body.pass || '');
    let acc = db.accounts[who];
    if (!acc) { for (const k in db.accounts) { if (db.accounts[k].user.toLowerCase() === who) { acc = db.accounts[k]; break; } } }
    if (!acc) return json(res, 401, { err: 'Usuário não encontrado — crie uma conta primeiro.' });
    if (!safeEq(acc.hash, hashPass(pass, acc.salt))) return json(res, 401, { err: 'Senha incorreta.' });
    const sid = crypto.randomBytes(24).toString('hex');
    db.sessions[sid] = { email: acc.email, createdAt: Date.now() };
    saveDB();
    res.setHeader('Set-Cookie', cookieSet(sid));
    console.log('[login]', acc.email);
    return json(res, 200, { ok: true, user: acc.user, token: sid });
  }

  /* ---- sessão ---- */
  if (p === '/api/me' && req.method === 'GET') {
    const acc = auth(req);
    if (!acc) return json(res, 200, { ok: false });
    return json(res, 200, { ok: true, user: acc.user, email: acc.email, chars: acc.chars || [], provider: acc.provider, token: sessToken(req) });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    const sid = getSid(req);
    if (sid && db.sessions[sid]) { delete db.sessions[sid]; saveDB(); }
    res.setHeader('Set-Cookie', cookieClear());
    return json(res, 200, { ok: true });
  }

  /* ---- personagens ---- */
  if (p === '/api/character' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'Faça login primeiro.' });
    const body = await readBody(req);
    const nick = String(body.nick || '').trim();
    const sex = body.sex === 'f' ? 'f' : 'm';
    const skinWanted = String(body.skin || '');
    const skinOk = SKINS.find(x => x.id === skinWanted && x.sex === sex);
    const skin = skinOk ? skinOk.id : (SKINS.find(x => x.sex === sex) || { id: 'classico' }).id;
    if (!/^[A-Za-z0-9_]{3,14}$/.test(nick)) return json(res, 400, { err: 'Nick: 3–14 letras, números ou _ (sem espaços).' });
    if ((acc.chars || []).length >= 3) return json(res, 400, { err: 'Limite de 3 personagens por conta.' });
    const k = nick.toLowerCase();
    if (db.nicks[k] && db.nicks[k] !== acc.email) return json(res, 400, { err: 'Este nick já está em uso por outro jogador.' });
    if ((acc.chars || []).some(c => c.nick.toLowerCase() === k)) return json(res, 400, { err: 'Você já tem um personagem com esse nick.' });
    db.nicks[k] = acc.email;
    (acc.chars = acc.chars || []).push({ nick, sex, skin, createdAt: Date.now(), reg: String(1000 + crypto.randomInt(9000)) });
    saveDB();
    console.log('[char]', acc.email, '->', nick, sex, 'skin:', skin);
    return json(res, 200, { ok: true, chars: acc.chars });
  }

  /* ---- presença (quem online, em que sala) ---- */
  if (p === '/api/presence' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const body = await readBody(req, 2000);
    const me = presence[acc.email] = presence[acc.email] || { sid: sessToken(req) };
    me.n = acc.user;
    me.nick = String(body.nick || me.nick || acc.user).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20) || acc.user;
    me.map = String(body.map || me.map || 'portico').slice(0, 16);
    me.sex = body.sex === 'f' ? 'f' : 'm';
    me.x = Number(body.x) || 0; me.y = Number(body.y) || 0;
    me.ts = Date.now();
    const now = Date.now();
    const roster = Object.values(presence).filter(x => now - x.ts < 45000).map(x => ({ n: x.n, nick: x.nick, map: x.map, sex: x.sex || 'm', x: Math.round(x.x), y: Math.round(x.y), me: x === me }));
    return json(res, 200, { ok: true, roster });
  }

  /* ---- códigos de resgate ---- */
  const REDEEM_CODES = {
    scan10: { kind: 'scans', n: 10 },
    goldfree: { kind: 'bits', amount: 10000 }
  };
  if (p === '/api/redeem' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const body = await readBody(req, 2000);
    const code = String(body.code || '').trim().toLowerCase();
    const def = REDEEM_CODES[code];
    if (!def) return json(res, 404, { err: 'Código inválido ou inexistente.' });
    acc.redeemed = acc.redeemed || {};
    if (acc.redeemed[code]) return json(res, 409, { err: 'Você já resgatou o código "' + code + '" nesta conta.' });
    acc.redeemed[code] = Date.now();
    saveDB();
    console.log('[redeem]', acc.email, '->', code);
    return json(res, 200, { ok: true, effect: def });
  }

  /* ---- chat global ---- */
  if (p === '/api/chat' && req.method === 'GET') {
    const since = Number(u.searchParams.get('since') || 0);
    const nsince = Number(u.searchParams.get('nsince') || 0);
    const psince = Number(u.searchParams.get('psince') || 0);
    const msgs = db.chat.filter(m => m.id > since).slice(-50);
    const last = db.chat.length ? db.chat[db.chat.length - 1].id : 0;
    const out = { msgs, last, near: [], nlast: nearSeq, pms: [], plast: 0, roster: [] };
    const acc = auth(req);
    if (acc) {
      const me = presence[acc.email];
      const myMap = me ? me.map : null;
      if (myMap) out.near = nearRing.filter(m => m.i > nsince && m.map === myMap).slice(-40);
      out.nlast = nearSeq;
      const box = pmBox[acc.email] || [];
      out.pms = box.filter(m => m.i > psince).slice(-30);
      out.plast = box.length ? box[box.length - 1].i : 0;
      const now = Date.now();
      out.roster = Object.values(presence).filter(x => now - x.ts < 45000).map(x => ({ n: x.n, nick: x.nick, map: x.map, sex: x.sex || 'm', x: Math.round(x.x), y: Math.round(x.y), me: x === me }));
    }
    return json(res, 200, out);
  }
  if (p === '/api/chat' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'Faça login para usar o chat.' });
    const blk = blocked(req);
    if (blk) return json(res, 403, { err: 'IP bloqueado. Volte em ' + Math.ceil((blk - Date.now()) / 60000) + ' min.' });
    const body = await readBody(req, 5000);
    const text = String(body.text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);
    if (!text) return json(res, 400, { err: 'Mensagem vazia.' });
    const now = Date.now();
    if (now - (chatRate[ipk] || 0) < 1000) return json(res, 429, { err: 'Aguarde 1 segundo entre mensagens.' });
    chatRate[ipk] = now;
    const scope = body.scope === 'near' || body.scope === 'pm' ? body.scope : 'global';
    if (scope === 'near') {
      const me = presence[acc.email];
      if (!me || !me.map) return json(res, 400, { err: 'Presença sincronizando — tente de novo em 1s.' });
      const myNear = { i: ++nearSeq, n: acc.user, nick: me.nick, map: me.map, x: text, ts: now };
      nearRing.push(myNear);
      while (nearRing.length > 200) nearRing.shift();
      return json(res, 200, { ok: true, scope, i: myNear.i });
    }
    if (scope === 'pm') {
      const toNick = String(body.to || '').trim().toLowerCase();
      if (!toNick) return json(res, 400, { err: 'Escolha o destinatário.' });
      let tgtEmail = null, tgtPres = null;
      for (const em in presence) { if (String(presence[em].nick || '').toLowerCase() === toNick) { tgtEmail = em; tgtPres = presence[em]; break; } }
      if (!tgtEmail) for (const em in db.accounts) { if (String(db.accounts[em].user || '').toLowerCase() === toNick) { tgtEmail = em; break; } }
      if (!tgtEmail) return json(res, 404, { err: 'Jogador "' + String(body.to).slice(0, 20) + '" não encontrado.' });
      const ins = (em, entry) => { const b = pmBox[em] = pmBox[em] || []; entry.i = (pmSeq[em] = (pmSeq[em] || 0) + 1); b.push(entry); while (b.length > 80) b.shift(); };
      ins(acc.email, { from: '', to: (tgtPres && tgtPres.nick) || toNick, x: text, ts: now });
      if (tgtEmail !== acc.email) ins(tgtEmail, { from: acc.user, to: '', x: text, ts: now });
      const myBox = pmBox[acc.email] || [];
      return json(res, 200, { ok: true, scope, away: !tgtPres || (Date.now() - tgtPres.ts > 45000), pi: myBox.length ? myBox[myBox.length - 1].i : 0 });
    }
    const m = { id: ++chatSeq, n: acc.user, x: text, ts: now, sys: false };
    db.chat.push(m);
    while (db.chat.length > 300) db.chat.shift();
    saveDB();
    return json(res, 200, { ok: true, last: m.id });
  }

  /* ---- pvp: busca + relay ---- */
  if (p === '/api/pvp/queue' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const blk = blocked(req);
    if (blk) return json(res, 403, { err: 'IP bloqueado' });
    for (const id in pvpM) {
      if (pvpM[id].ended) continue;
      if (pvpM[id].a.email === acc.email) return json(res, 200, { matched: true, id, role: 'a', opp: { nick: pvpM[id].b.user } });
      if (pvpM[id].b.email === acc.email) return json(res, 200, { matched: true, id, role: 'b', opp: { nick: pvpM[id].a.user } });
    }
    const body = await readBody(req, 80000);
    const qi = pvpQ.findIndex(x => x.email === acc.email);
    if (qi >= 0) { pvpQ[qi].scans = body.playerScans || pvpQ[qi].scans; pvpQ[qi].equips = body.playerEquips || pvpQ[qi].equips; return json(res, 200, { queued: true }); }
    pvpQ.push({ email: acc.email, user: acc.user, scans: body.playerScans || [], equips: body.playerEquips || [], ts: Date.now() });
    if (pvpQ.length >= 2) {
      const A = pvpQ.shift(), B = pvpQ.shift();
      const id = crypto.randomBytes(8).toString('hex');
      pvpM[id] = {
        a: { email: A.email, user: A.user, q: [], seq: 0, seen: Date.now(), done: false },
        b: { email: B.email, user: B.user, q: [], seq: 0, seen: Date.now(), done: false },
        created: Date.now(), ended: false,
      };
      console.log('[pvp] partida:', A.user, 'vs', B.user);
      if (A.email === acc.email) return json(res, 200, { matched: true, id, role: 'a', opp: { nick: B.user } });
      return json(res, 200, { matched: true, id, role: 'b', opp: { nick: A.user } });
    }
    return json(res, 200, { queued: true });
  }
  if (p === '/api/pvp/status' && req.method === 'GET') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    for (const id in pvpM) {
      if (pvpM[id].ended) continue;
      if (pvpM[id].a.email === acc.email) return json(res, 200, { matched: true, id, role: 'a', opp: { nick: pvpM[id].b.user } });
      if (pvpM[id].b.email === acc.email) return json(res, 200, { matched: true, id, role: 'b', opp: { nick: pvpM[id].a.user } });
    }
    const qi = pvpQ.findIndex(x => x.email === acc.email);
    if (qi >= 0) return json(res, 200, { queued: true, wait: Math.round((Date.now() - pvpQ[qi].ts) / 1000) });
    return json(res, 200, { queued: false });
  }
  if (p === '/api/pvp/leave' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const qi = pvpQ.findIndex(x => x.email === acc.email);
    if (qi >= 0) pvpQ.splice(qi, 1);
    return json(res, 200, { ok: true });
  }
  if (p === '/api/pvp/msg' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const body = await readBody(req, 120000);
    const mt = pvpM[String(body.id || '')];
    if (!mt || mt.ended) return json(res, 200, { gone: true });
    const side = mt.a.email === acc.email ? 'a' : (mt.b.email === acc.email ? 'b' : null);
    if (!side) return json(res, 403, { err: 'não é desta partida' });
    const opp = side === 'a' ? mt.b : mt.a;
    mt[side].seen = Date.now();
    for (const d of (body.msgs || []).slice(0, 100)) {
      if (d && d.t === 'loadout') {
        // guarda o loadout do lado e avisa o rival com o time dele
        mt[side].loadout = d.team || [];
        opp.q.push({ s: ++opp.seq, d: { t: 'oppteam', team: mt[side].loadout } });
        // ambos prontos → cara ou coroa 50/50
        if (mt.a.loadout && mt.b.loadout && !mt.coinDone) {
          mt.coinDone = true;
          const aWins = Math.random() < 0.5;
          mt.a.q.push({ s: ++mt.a.seq, d: { t: 'coin', youWon: aWins } });
          mt.b.q.push({ s: ++mt.b.seq, d: { t: 'coin', youWon: !aWins } });
          console.log('[pvp] moeda:', (aWins ? mt.a.user : mt.b.user) + ' comeca');
        }
      } else if (d && d.t === 'pick') {
        // vai ao rival E ecoa ao autor: os dois precisam entrar na batalha
        opp.q.push({ s: ++opp.seq, d });
        mt[side].q.push({ s: ++mt[side].seq, d });
      } else opp.q.push({ s: ++opp.seq, d });
    }
    while (opp.q.length > 240) opp.q.shift();
    return json(res, 200, { ok: true });
  }
  if (p === '/api/pvp/poll' && req.method === 'GET') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const mt = pvpM[String(u.searchParams.get('id') || '')];
    if (!mt) return json(res, 200, { gone: true });
    const side = mt.a.email === acc.email ? 'a' : (mt.b.email === acc.email ? 'b' : null);
    if (!side) return json(res, 200, { gone: true });
    mt[side].seen = Date.now();
    const since = Number(u.searchParams.get('seq') || 0);
    const msgs = mt[side].q.filter(m => m.s > since).slice(0, 60);
    return json(res, 200, { msgs, gone: !!(mt.ended && mt[side].done) });
  }
  if (p === '/api/pvp/finish' && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const body = await readBody(req, 5000);
    const mt = pvpM[String(body.id || '')];
    if (!mt || mt.ended) return json(res, 200, { ok: true });
    const side = mt.a.email === acc.email ? 'a' : (mt.b.email === acc.email ? 'b' : null);
    if (!side) return json(res, 403, { err: 'não é desta partida' });
    const opp = side === 'a' ? mt.b : mt.a;
    const result = String(body.result || 'forfeit');
    let line;
    if (result === 'win') line = '⚔️ ' + mt[side].user + ' venceu ' + opp.user + ' no Dromo PVP!';
    else if (result === 'lose') line = '⚔️ ' + opp.user + ' venceu ' + mt[side].user + ' no Dromo PVP!';
    else line = '🚪 ' + mt[side].user + ' abandonou o duelo contra ' + opp.user + '.';
    mt.ended = true;
    mt[side].done = true; opp.done = true;
    setTimeout(() => { delete pvpM[String(body.id || '')]; }, 20000);
    chatSys(line);
    console.log('[pvp] fim:', line);
    return json(res, 200, { ok: true });
  }

  /* ---- save na nuvem (por conta) ---- */
  if (p === '/api/save' && req.method === 'GET') {
    const acc = auth(req);
    if (!acc) return json(res, 200, { data: null, updatedAt: 0 });
    const sv = db.saves[acc.email];
    return json(res, 200, { data: sv ? sv.data : null, updatedAt: sv ? sv.updatedAt : 0 });
  }
  if ((p === '/api/save' || p === '/api/save/beacon') && req.method === 'POST') {
    const acc = auth(req);
    if (!acc) return json(res, 401, { err: 'sem sessão' });
    const body = await readBody(req, 300000);
    const data = typeof body.data === 'string' ? body.data : '';
    if (!data || data.length > 250000) return json(res, 400, { err: 'save inválido' });
    try { const o = JSON.parse(data); if (!o || typeof o !== 'object') throw new Error('x'); } catch (e) { return json(res, 400, { err: 'save corrupto' }); }
    db.saves[acc.email] = { data, updatedAt: Date.now() };
    saveDB();
    console.log('[save]', acc.email, '(' + data.length + ' B)');
    return json(res, 200, { ok: true, updatedAt: db.saves[acc.email].updatedAt });
  }

  /* ---- jogo com sessão ---- */
  if (p === '/game' && req.method === 'GET') {
    let acc = auth(req);
    if (!acc) {
      const st = String(u.searchParams.get('sess') || '');
      const se = st && db.sessions[st];
      if (se) acc = db.accounts[se.email] || null;
    }
    if (!acc || !(acc.chars || []).length) { res.writeHead(302, { Location: '/' }); res.end(); return; }
    const want = (u.searchParams.get('char') || '').toLowerCase();
    let ch = acc.chars[acc.chars.length - 1];
    const f = acc.chars.find(c => c.nick.toLowerCase() === want);
    if (f) ch = f;
    try {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(buildGame(ch, acc, sessToken(req) || String(u.searchParams.get('sess') || '')));
    } catch (e) {
      json(res, 500, { err: 'Falha ao montar o jogo: ' + e.message });
    }
    return;
  }

  /* ---- Google OAuth ---- */
  if (p === '/auth/google' && req.method === 'GET') {
    if (!CFG.GOOGLE_CLIENT_ID) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(googleHowto(origin));
      return;
    }
    const redirect = CFG.GOOGLE_REDIRECT || (origin + '/auth/google/callback');
    const gs = new URLSearchParams({
      client_id: CFG.GOOGLE_CLIENT_ID, redirect_uri: redirect,
      response_type: 'code', scope: 'openid email profile', prompt: 'select_account'
    });
    res.writeHead(302, { Location: 'https://accounts.google.com/o/oauth2/v2/auth?' + gs.toString() });
    res.end();
    return;
  }
  if (p === '/auth/google/callback' && req.method === 'GET') {
    try {
      const code = u.searchParams.get('code') || '';
      const info = await googleExchange(code, origin);
      const email = String(info.email).toLowerCase();
      let acc = db.accounts[email];
      if (!acc) {
        let user = String(info.name || email.split('@')[0]).replace(/[^A-Za-z0-9_]/g, '').slice(0, 16) || 'Jogador';
        for (const k in db.accounts) { if (db.accounts[k].user.toLowerCase() === user.toLowerCase()) { user = user.slice(0, 12) + '_' + crypto.randomInt(999); } }
        acc = db.accounts[email] = { email, user, salt: '', hash: '', provider: 'google', chars: [], createdAt: Date.now() };
      }
      const sid = crypto.randomBytes(24).toString('hex');
      db.sessions[sid] = { email: acc.email, createdAt: Date.now() };
      saveDB();
      res.setHeader('Set-Cookie', cookieSet(sid));
      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (e) {
      res.writeHead(302, { Location: '/?google=erro' });
      res.end();
    }
    return;
  }

  json(res, 404, { err: 'não encontrado' });
}

const server = http.createServer((req, res) => {
  route(req, res).catch(e => {
    console.log('[erro]', req.url, e.message);
    try { json(res, 500, { err: 'erro interno' }); } catch (e2) {}
  });
});
/* encerramento digno: salva tudo antes de sair (Render manda SIGTERM em redeploys) */
let shuttingDown = false;
async function flushAndExit(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[fim] ' + sig + ' — salvando estado...');
  try { saveDB(); } catch (e) {}
  if (CLOUD) {
    try { if (cloudTimer) { clearTimeout(cloudTimer); cloudTimer = null; } cloudDirty = true; if (!cloudReady) await cloudRecoverMerge(); await cloudSaveNow(); console.log('[nuvem] estado final salvo ✓'); }
    catch (e) { console.log('[nuvem] falha no salvamento final:', e.message); }
  }
  process.exit(0);
}
process.on('SIGTERM', () => flushAndExit('SIGTERM'));
process.on('SIGINT', () => flushAndExit('SIGINT'));

(async () => {
  if (CLOUD) {
    try {
      const c = await cloudLoad();
      const localAccounts = Object.keys(db.accounts || {}).length;
      const cloudAccounts = c && c.accounts ? Object.keys(c.accounts).length : 0;
      if (cloudAccounts || (c && c.chat && c.chat.length)) {
        db = Object.assign(db, c);
        db.chat = db.chat || [];
        db.accounts = db.accounts || {}; db.sessions = db.sessions || {}; db.nicks = db.nicks || {}; db.saves = db.saves || {}; db.blocks = db.blocks || {};
        reseedChatSeq();
        console.log('[nuvem] estado ADOTADO do Supabase:', Object.keys(db.accounts).length, 'contas ·', db.chat.length, 'msgs');
      } else if (localAccounts || (db.chat && db.chat.length)) {
        await cloudSaveNow();
        cloudReady = true;
        console.log('[nuvem] estado local enviado ao Supabase (primeira vez):', localAccounts, 'contas');
      } else {
        console.log('[nuvem] Supabase configurado — base vazia nos dois lados, começando do zero.');
      }
    } catch (e) {
      let hostInfo = '';
      try { hostInfo = new URL(CLOUD.url).host; } catch (e2) { hostInfo = 'URL-INVALIDA(' + String(CLOUD.url).slice(0, 70) + ')'; }
      console.log('[nuvem] AVISO: Supabase inacessível agora (' + e.message + '). Host: ' + hostInfo + '. Seguindo local; nova tentativa ao salvar.');
    }
  }
  server.listen(CFG.PORT, '0.0.0.0', () => {
    console.log('CHAOTIC.IDLEWORLD servidor FASE 2 na porta ' + CFG.PORT);
    console.log('Turnstile: ' + (CFG.SITEKEY.startsWith('1x0000') ? 'CHAVES DE TESTE (sempre passam)' : 'chaves reais'));
    console.log('Google OAuth: ' + (CFG.GOOGLE_CLIENT_ID ? 'configurado' : 'não configurado (botão mostra instruções)'));
    console.log('Persistência: ' + (CLOUD ? 'SUPABASE (sobrevive a redeploys) ✓' : 'disco local (redeploys apagam)'));
  });
})();
