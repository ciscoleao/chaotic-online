'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'server/server.js'), 'utf8');
const bridgeStart = server.indexOf('const BRIDGE = `');
const bridgeEnd = server.indexOf('\nconst ANCHOR_BOOT', bridgeStart);
const bridge = vm.runInNewContext(server.slice(bridgeStart, bridgeEnd) + '; BRIDGE');
const game = fs.readFileSync(path.join(root, 'game/index.html'), 'utf8');
const saveGame = game.slice(game.indexOf('function saveGame('), game.indexOf('function sanitizeCard('));
const buyPilhas = game.slice(game.indexOf('function buyPilhas('), game.indexOf('function sellMaterial('));
const peytonEvent = game.slice(game.indexOf('function peytonEvent('), game.indexOf('function buyPilhas('));
const KEY = 'chaotic_lobby_teste_v236';
const initial = JSON.stringify({ player: { name: 'Neto', pilhas: 15, bits: 160, xp: 0, xpToNext: 100, peyton277: {stage:0,active:true,progress:0,visited:[]} } });

function browser({ storage = new Map(), remote = initial, remoteAt = 500, fetcher } = {}) {
  let now = 1000, nextId = 1;
  const timers = new Map(), events = {}, requests = [];
  const storageAPI = {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
  const sandbox = {
    CONFIG:{SAVE_KEY:KEY,PILHA_PRICE:8},GameState:JSON.parse(initial),
    PEYTON_QUESTS:[['Compra','',20,20,0]],
    localStorage:storageAPI,Blob,AbortController,
    window:{CHAOS_SAVE:remote,CHAOS_SAVE_AT:remoteAt,SESSION_TOKEN:'test-session',addEventListener:(type,fn)=>events[type]=fn},
    document:{visibilityState:'visible',addEventListener:(type,fn)=>events[type]=fn},
    navigator:{sendBeacon:()=>false},
    showNotif:()=>{},checkLevelUp:()=>{},updateTopBar:()=>{},renderShopUI:()=>{},
    peytonState:()=>sandbox.GameState.player.peyton277,
    setTimeout:(fn,delay)=>{const id=nextId++;timers.set(id,{fn,at:now+(delay||0)});return id},
    clearTimeout:id=>timers.delete(id),
    fetch:(url,options)=>{requests.push({url,options});return fetcher?fetcher(url,options):Promise.resolve({ok:true,json:async()=>({ok:true,updatedAt:now})})},
    console:{warn:()=>{},log:()=>{}},
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(saveGame + '\n' + peytonEvent + '\n' + buyPilhas + '\n' + bridge,context);
  const raw=storageAPI.getItem(KEY);if(raw)sandbox.GameState=JSON.parse(raw);
  sandbox.GameState.location='portico';
  async function tick(ms) {
    const end=now+ms;
    for(let guard=0;guard<1000;guard++) {
      await new Promise(resolve=>setImmediate(resolve));
      const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!due){now=end;await new Promise(resolve=>setImmediate(resolve));return}
      const [id,t]=due;timers.delete(id);now=t.at;t.fn();
    }
    throw new Error('Timers did not settle');
  }
  return {sandbox,storage,requests,tick,run:code=>vm.runInContext(code,context),event:type=>events[type]?.()};
}

test('a compra de 20 pilhas e a recompensa permanecem locais durante um envio pendente e F5',async()=>{
  const storage=new Map();const b=browser({storage,fetcher:()=>new Promise(()=>{})});
  b.run('buyPilhas(20)');await b.tick(2600);
  const before=JSON.parse(storage.get(KEY));
  assert.equal(before.player.pilhas,35);assert.equal(before.player.bits,20);assert.equal(before.player.xp,25);
  const reload=browser({storage,remote:initial});
  const after=JSON.parse(storage.get(KEY));
  assert.equal(after.player.pilhas,35);assert.equal(after.player.bits,20);assert.equal(after.player.xp,25);
  assert.equal(after.player.peyton277.stage,1);assert.equal(reload.sandbox.window.__CHAOS_SYNC,'local');
});

for(const kind of ['network','HTTP','body'])test(`falha ${kind} mantém a compra pendente e permite uma nova tentativa`,async()=>{
  let fail=true;
  const b=browser({fetcher:()=>fail?(kind==='network'?Promise.reject(new Error('offline')):Promise.resolve({ok:kind==='body',status:503,json:async()=>({err:'save rejeitado'})})):Promise.resolve({ok:true,json:async()=>({ok:true,updatedAt:2000})})});
  b.run('buyPilhas(20)');await b.tick(2600);
  const meta=JSON.parse(b.storage.get('chaos_sync_meta_v1')||'null');
  assert.notEqual(meta?.h,hash(b.storage.get(KEY)));
  fail=false;await b.tick(12000);
  assert(b.requests.length>=2);
  assert.equal(JSON.parse(b.requests.at(-1).options.body).data,b.storage.get(KEY));
});

test('somente uma resposta positiva confirma o snapshot recebido',async()=>{
  const b=browser();b.run('buyPilhas(20)');await b.tick(3000);
  const sent=JSON.parse(b.requests.at(-1).options.body).data;
  assert.equal(JSON.parse(b.storage.get('chaos_sync_meta_v1')).h,hash(sent));
  assert.equal(JSON.parse(sent).player.pilhas,35);
});

test('uma resposta anterior não confirma alterações feitas enquanto o envio está pendente',async()=>{
  let finish;
  const b=browser({fetcher:()=>new Promise(resolve=>finish=resolve)});
  b.run('saveGame(true)');await b.tick(2600);
  b.run('buyPilhas(20)');
  finish({ok:true,json:async()=>({ok:true,updatedAt:2000})});await b.tick(10);
  const reload=browser({storage:b.storage,remote:initial});
  assert.equal(reload.sandbox.GameState.player.pilhas,35);
  assert.equal(reload.sandbox.GameState.player.bits,20);
});

test('pagehide envia o último estado com autenticação sem marcar envio como confirmado',async()=>{
  const b=browser({fetcher:()=>new Promise(()=>{})});b.run('buyPilhas(20)');b.event('pagehide');
  assert.equal(b.requests.length,1);
  const req=b.requests[0];assert.equal(req.options.keepalive,true);assert.equal(req.options.headers['x-session'],'test-session');
  assert.equal(JSON.parse(JSON.parse(req.options.body).data).player.pilhas,35);
  assert.notEqual(JSON.parse(b.storage.get('chaos_sync_meta_v1')||'null')?.h,hash(b.storage.get(KEY)));
});

test('ao transferir para a janela própria a instância antiga não salva',()=>{
  const b=browser();b.sandbox.window.__chaosTransferido152=true;b.event('pagehide');assert.equal(b.requests.length,0);
});

test('F5 antes do timer de envio mantém a compra local',()=>{
  const b=browser();b.run('buyPilhas(20)');
  const reload=browser({storage:b.storage,remote:initial});
  assert.equal(reload.sandbox.GameState.player.pilhas,35);
  assert.equal(reload.sandbox.GameState.player.xp,25);
});

test('uma resposta antiga do servidor não substitui um snapshot local confirmado mais recente',async()=>{
  const b=browser();b.run('buyPilhas(20)');await b.tick(3000);
  const reload=browser({storage:b.storage,remote:initial,remoteAt:500});
  assert.equal(reload.sandbox.GameState.player.pilhas,35);
  assert.equal(reload.sandbox.GameState.player.bits,20);
});

test('um snapshot posterior do servidor substitui o cache já confirmado',async()=>{
  const b=browser();b.run('buyPilhas(20)');await b.tick(3000);
  const newer=JSON.stringify({player:{...JSON.parse(b.storage.get(KEY)).player,pilhas:40}});
  const reload=browser({storage:b.storage,remote:newer,remoteAt:5000});
  assert.equal(reload.sandbox.GameState.player.pilhas,40);
  assert.equal(reload.sandbox.window.__CHAOS_SYNC,'server');
});

test('um navegador sem cache recupera o snapshot do servidor',()=>{
  const remote=JSON.stringify({player:{...JSON.parse(initial).player,pilhas:35,bits:20,xp:25}});
  const b=browser({remote});assert.equal(b.sandbox.GameState.player.pilhas,35);assert.equal(b.sandbox.GameState.player.xp,25);
});

test('metadados da versão anterior não validam uma tentativa sem confirmação',()=>{
  const pending=JSON.stringify({player:{...JSON.parse(initial).player,pilhas:35,bits:20,xp:25}});
  const storage=new Map([[KEY,pending],['chaos_sync_meta_v1',JSON.stringify({h:hash(pending),at:1000})]]);
  const b=browser({storage,remote:initial});assert.equal(b.sandbox.GameState.player.pilhas,35);
  assert.equal(b.sandbox.window.__CHAOS_SYNC,'local');
});

test('um envio travado expira e tenta novamente',async()=>{
  let attempts=0;
  const b=browser({fetcher:(_url,options)=>{
    if(++attempts>1)return Promise.resolve({ok:true,json:async()=>({ok:true,updatedAt:20000})});
    return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}));
  }});
  b.run('buyPilhas(20)');await b.tick(15000);
  assert.equal(attempts,2);assert.equal(JSON.parse(b.storage.get('chaos_sync_meta_v1')).h,hash(b.storage.get(KEY)));
});

test('um conflito de versão reenvia o estado atual contra a versão mais recente',async()=>{
  let attempts=0;
  const b=browser({fetcher:()=>++attempts===1?
    Promise.resolve({ok:false,status:409,json:async()=>({updatedAt:5000})}):
    Promise.resolve({ok:true,json:async()=>({ok:true,updatedAt:5001})})});
  b.run('buyPilhas(20)');await b.tick(3000);
  assert.equal(b.requests.length,2);
  const body=JSON.parse(b.requests[1].options.body);
  assert.equal(body.baseUpdatedAt,5000);assert.equal(JSON.parse(body.data).player.pilhas,35);
});

function hash(x){let h=5381;for(let i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))>>>0;return h.toString(36)}
