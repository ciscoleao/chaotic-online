'use strict';
const crypto = require('node:crypto');

function publicOrigin(req, cfg) {
  if (cfg.PUBLIC_URL) return new URL(cfg.PUBLIC_URL).origin;
  const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = req.socket.encrypted || (cfg.TRUST_PROXY && forwarded === 'https') ? 'https' : 'http';
  return protocol + '://' + (req.headers.host || 'localhost:' + cfg.PORT);
}

async function verifyTurnstile(token, ip, action, hostname, cfg, request = fetch) {
  if (typeof token !== 'string' || !token || token.length > 2048 || !cfg.SITEKEY || !cfg.SECRET) return false;
  const testKey = /^[123]x0000/.test(cfg.SITEKEY);
  if (cfg.PRODUCTION && testKey) return false;
  // A simulação é exclusiva da suíte local, nunca do site publicado.
  if (token === 'SIMULATED') return cfg.LOCAL_TEST === true && !cfg.PRODUCTION && testKey;
  try {
    const r = await request('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({secret: cfg.SECRET, response: token, remoteip: ip}),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return false;
    const result = await r.json();
    return result.success === true && (testKey || (result.action === action && result.hostname === hostname));
  } catch (_) { return false; }
}

function createOAuthStates() {
  const pending = new Map();
  return {
    issue() {
      const now = Date.now();
      for (const [key, exp] of pending) if (exp < now) pending.delete(key);
      const state = crypto.randomBytes(32).toString('hex');
      pending.set(state, now + 600000);
      return state;
    },
    consume(state, cookie) {
      const exp = pending.get(state);
      pending.delete(state);
      if (!exp || exp < Date.now() || !/^[a-f0-9]{64}$/.test(state || '') || !/^[a-f0-9]{64}$/.test(cookie || '')) return false;
      return crypto.timingSafeEqual(Buffer.from(state), Buffer.from(cookie));
    }
  };
}

async function googleExchange(code, origin, cfg, request = fetch) {
  if (!code) throw new Error('Código ausente');
  const r = await request('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({code, client_id: cfg.GOOGLE_CLIENT_ID, client_secret: cfg.GOOGLE_CLIENT_SECRET,
      redirect_uri: cfg.GOOGLE_REDIRECT || origin + '/auth/google/callback', grant_type: 'authorization_code'})
  });
  if (!r.ok) throw new Error('Google indisponível');
  const tokens = await r.json();
  if (!tokens.access_token) throw new Error('Token ausente');
  // Perfil confirmado pelo próprio Google; não confiar em JWT apenas decodificado.
  const profile = await request('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {Authorization: 'Bearer ' + tokens.access_token}, signal: AbortSignal.timeout(15000)
  });
  if (!profile.ok) throw new Error('Perfil inválido');
  const info = await profile.json();
  if (!info.sub || info.email_verified !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email || '')) throw new Error('Email não confirmado');
  return {email: info.email.toLowerCase(), name: info.name || info.email.split('@')[0], sub: info.sub};
}

module.exports = {publicOrigin, verifyTurnstile, createOAuthStates, googleExchange};
