'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {publicOrigin, verifyTurnstile, createOAuthStates, googleExchange} = require('../server/auth-security');
const cfg = {SITEKEY: 'real-sitekey', SECRET: 'real-secret', PRODUCTION: true};
const response = body => ({ok: true, json: async () => body});

test('HTTPS do Render e origem configurada geram o retorno OAuth correto', () => {
  const req = {headers: {host: 'chaotic-online.onrender.com', 'x-forwarded-proto': 'https'}, socket: {}};
  assert.equal(publicOrigin(req, {TRUST_PROXY: true}), 'https://chaotic-online.onrender.com');
  assert.equal(publicOrigin(req, {TRUST_PROXY: false}), 'http://chaotic-online.onrender.com');
  assert.equal(publicOrigin(req, {PUBLIC_URL: 'https://game.example/path'}), 'https://game.example');
});
test('Turnstile rejeita simulação, tokens longos, erro de rede e resposta inválida', async () => {
  let called = false;
  const request = async () => {called = true; throw Error('offline');};
  assert.equal(await verifyTurnstile('SIMULATED', '127.0.0.1', 'login', 'game.example', cfg, request), false);
  assert.equal(called, false);
  assert.equal(await verifyTurnstile('x'.repeat(2049), '', 'login', 'game.example', cfg, request), false);
  assert.equal(await verifyTurnstile('valid-token', '', 'login', 'game.example', cfg, request), false);
  assert.equal(await verifyTurnstile('valid-token', '', 'login', 'game.example', cfg, async()=>response({success:false})), false);
});
test('Turnstile valida ação e domínio além de success', async () => {
  const check = body => verifyTurnstile('token', '', 'login', 'game.example', cfg, async()=>response(body));
  assert.equal(await check({success:true, action:'login', hostname:'game.example'}), true);
  assert.equal(await check({success:true, action:'create', hostname:'game.example'}), false);
  assert.equal(await check({success:true, action:'login', hostname:'other.example'}), false);
});
test('chaves de teste são proibidas em produção e simulação exige modo local explícito', async () => {
  const testCfg = {SITEKEY:'1x00000000000000000000AA',SECRET:'test',LOCAL_TEST:true};
  assert.equal(await verifyTurnstile('SIMULATED', '', 'login', 'localhost', testCfg), true);
  assert.equal(await verifyTurnstile('SIMULATED', '', 'login', 'localhost', {...testCfg,LOCAL_TEST:false}), false);
  assert.equal(await verifyTurnstile('SIMULATED', '', 'login', 'localhost', {...testCfg,PRODUCTION:true}), false);
});
test('retorno Google requer state vinculado ao cookie, de uso único e não expirado', () => {
  const states = createOAuthStates();
  const state = states.issue();
  assert.equal(states.consume(state, '0'.repeat(64)), false);
  assert.equal(states.consume(state, state), false);
  const second = states.issue();
  assert.equal(states.consume(second, second), true);
  assert.equal(states.consume(second, second), false);
  const oldNow = Date.now;
  try {
    const third = states.issue();
    Date.now = () => oldNow() + 600001;
    assert.equal(states.consume(third, third), false);
  } finally {Date.now = oldNow;}
});
test('Google confirma perfil no UserInfo e exige email verificado', async () => {
  const opts = {GOOGLE_CLIENT_ID:'fake-id',GOOGLE_CLIENT_SECRET:'fake-secret'};
  const calls = [];
  const request = async (url, options) => {calls.push({url,options});return response(calls.length === 1 ? {access_token:'fake-access-token'} : {sub:'user-1',email:'TEST@example.test',email_verified:true,name:'Test'});};
  const user = await googleExchange('fake-code', 'https://game.example', opts, request);
  assert.equal(user.email,'test@example.test');
  assert.equal(calls[0].options.body.get('redirect_uri'), 'https://game.example/auth/google/callback');
  assert.equal(calls[1].url,'https://openidconnect.googleapis.com/v1/userinfo');
  assert.equal(calls[1].options.headers.Authorization,'Bearer fake-access-token');
  let count = 0;
  await assert.rejects(googleExchange('code','https://game.example',opts,async()=>response(++count===1?{access_token:'fake'}:{sub:'u',email:'test@example.test',email_verified:false})),/não confirmado/);
});
