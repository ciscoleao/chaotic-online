# -*- coding: utf-8 -*-
"""v2.28 / patch v165 — O BANCO NA BATALHA + COLEÇÃO DAS 120 NO JOGO.

Continuação da integração do banco (v164). Duas entregas:

A) A BATALHA (Sala de Batalha do Dromo + Duelo PVP) passa a usar a ficha do
   banco da criatura escaneada:
     · o arquétipo de luta vem do ELEMENTO da espécie (Fogo → Pyrodonte,
       Água → Aquarion, Terra → Terramole, Ar → Voltrax) e do perfil dela
       (místico de Terra → Sibilora; RARA de Água / controladora → Noctumbra);
     · vida, dano (físico e mágico) e velocidade escalam pela espécie
       (m1 < m2 < m3 < rara), tudo clampado para não quebrar o balanceamento;
     · a Sala mostra a habilidade de carta da criatura junto da descrição;
     · carta sem ficha do banco (Scan antigo / clássica) continua como era.

B) COLEÇÃO DAS 120 dentro do jogo (painel 📖 COLEÇÃO no acervo do Scanner):
   4 abas de tribo, progresso x/30 e x/120, filtro Todas/Escaneadas/Faltando,
   e cada espécie com arte, nível, elementos, habilidade, Mugic, RARIDADE,
   AGRESSIVIDADE e ONDE ELA VIVE (mapa do jogo) + ✓ se você já escaneou.
"""
import io, re, sys, base64, json

ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot, n=1):
    global s
    q = s.count(velho)
    if q != n:
        print('ABORTADO (%s): esperava %d, achei %d' % (rot, n, q)); sys.exit(1)
    s = s.replace(velho, novo, n); print('ok: ' + rot)

# ============================================================
# A) BATALHA COM A FICHA DO BANCO
# ============================================================
HELPERS = r"""/* ============================================================
 * v165 — A FICHA DO BANCO VALE NA BATALHA (Sala de Batalha e PVP)
 * O arquétipo de luta vem do ELEMENTO e do PERFIL da espécie escaneada, e os
 * atributos do banco escalam vida/dano/velocidade do Scan (clampado).
 * ============================================================ */
const ARQ_POR_ELEMENTO165 = { fogo: 'pyrodonte', agua: 'aquarion', terra: 'terramole', ar: 'voltrax' };
const ELEMENTO_PT_PARA_ARQ165 = { 'Fogo': 'fogo', '\u00c1gua': 'agua', 'Terra': 'terra', 'Ar': 'ar' };
function especieDaCarta165(card) {
  if (!card || !card.name) return null;
  return ENEMY_TYPES.find(function (e) { return e.name === card.name && e.banco164; }) || null;
}
function elementoDaCarta165(card) {
  const t = especieDaCarta165(card);
  if (!t) return null;
  return ELEMENTO_PT_PARA_ARQ165[(t.elements || [])[0]] || null;
}
/* Bruto vai de corpo a corpo, místico/controlador vai de longo alcance. */
function arquetipoDaCarta165(card) {
  const t = especieDaCarta165(card);
  if (!t) return null; // Scan clássico: o hash continua sorteando, como antes
  const el = elementoDaCarta165(card);
  const tipo = (t.ability164 && t.ability164.t) || '';
  const magico = (tipo === 'cura' || tipo === 'controle' || tipo === 'buff');
  if (el === 'terra') return magico ? 'sibilora' : 'terramole';
  if (el === 'agua') return (t.isRare || tipo === 'controle') ? 'noctumbra' : 'aquarion';
  if (el === 'fogo') return 'pyrodonte';
  if (el === 'ar') return 'voltrax';
  return 'noctumbra';
}
/* Escala da luta: 0,85 (mapa 1 fraco) → 1,35 (mapa 3 RARA) - clampado para não
 * quebrar o balanceamento da Sala de Batalha. */
function multBatalha165(card) {
  const cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  const t = especieDaCarta165(card);
  const hp = t ? t.hp : (card && card.hp) || 150;
  const atk = t ? t.atk : (card && card.atk) || 20;
  const spd = (t && t.moveSpeed164) || 155;
  // Calibrado nas faixas do banco (courage 33-136 · atk 5-49 · spd 124-225):
  // mapa 1 ~0.86-0.98 · mapa 2 ~0.95-1.12 · mapa 3 (e as RARAS) ~1.16-1.33.
  return {
    hp: cl(0.85 + (hp - 30) / 220, 0.85, 1.35),
    dmg: cl(0.85 + (atk - 5) / 100, 0.85, 1.35),
    spd: cl(0.90 + (spd - 124) / 400, 0.90, 1.20),
  };
}
function bancoNaBatalha165(card) {
  const t = especieDaCarta165(card);
  if (!t) return null;
  return {
    elem: elementoDaCarta165(card), arq: arquetipoDaCarta165(card), mult: multBatalha165(card),
    hab: t.ability164 ? t.ability164.n : null, habDesc: t.ability164 ? t.ability164.d : null,
    mugic: t.mugic164 || 0, tribo: t.tribo164 || null, rara: !!t.isRare, nivel164: t.mapa164 || null,
  };
}
"""
troca('const AGGRO_BASE148 = 150;', HELPERS + 'const AGGRO_BASE148 = 150;', 'helpers da batalha (elemento/escala)')

# --- payload do Dromo (Sala de Batalha dos Code Masters)
troca("""  const playerScans = creatures.slice(0, 24).map(function(c, i) {
    return {
      uid: i, name: c.name, level: c.level || 1, rarity: c.rarity || 'common',
      arch: DROMO_ARCHETYPES[dromoHash((c.code || '') + '|' + c.name) % DROMO_ARCHETYPES.length],
    };
  });""",
"""  const playerScans = creatures.slice(0, 24).map(function(c, i) {
    const b165 = bancoNaBatalha165(c); // v165 — o elemento da espécie decide o arquétipo de luta
    return {
      uid: i, name: c.name, level: c.level || 1, rarity: c.rarity || 'common',
      arch: (b165 && b165.arq) || DROMO_ARCHETYPES[dromoHash((c.code || '') + '|' + c.name) % DROMO_ARCHETYPES.length],
      banco: b165,
    };
  });""",
'payload do Dromo: arquétipo pelo elemento + ficha do banco')

# --- payload do PVP
troca("    return { uid: i, name: c.name, level: c.level || 1, rarity: c.rarity || 'common', arch: DROMO_ARCHETYPES[dromoHash((c.code || '') + '|' + c.name) % DROMO_ARCHETYPES.length] };",
      "    const b165 = bancoNaBatalha165(c); // v165 — idem no PVP\n"
      "    return { uid: i, name: c.name, level: c.level || 1, rarity: c.rarity || 'common',\n"
      "      arch: (b165 && b165.arq) || DROMO_ARCHETYPES[dromoHash((c.code || '') + '|' + c.name) % DROMO_ARCHETYPES.length], banco: b165 };",
      'payload do PVP: arquétipo pelo elemento + ficha do banco')

# ============================================================
# B) COLEÇÃO DAS 120 NO JOGO (Codex)
# ============================================================
troca('<div class="scanner-cards-count" id="scanner-cards-count">0 scan cards</div>',
      '<div class="scanner-cards-count" id="scanner-cards-count">0 scan cards</div>\n'
      '        <button id="codex-open-165" style="width:100%;margin:6px 0;background:linear-gradient(160deg,#1d3a2a,#122a1e);color:#9fe870;border:1px solid #3f9a46;border-radius:8px;padding:7px 4px;font-size:10px;font-family:monospace;font-weight:700;cursor:pointer;">\U0001F4D6 COLE\u00c7\u00c3O DAS 120 ESP\u00c9CIES</button>',
      'botão COLEÇÃO no acervo do Scanner')

CODEX = r"""/* ============================================================
 * v165 — COLEÇÃO DAS 120 ESPÉCIES (o banco no jogo)
 * Painel com as 4 tribos, progresso de scan e a ficha de cada criatura.
 * ============================================================ */
let CODEX165 = { tab: 'overworld', filtro: 'todas' };
function codexEscaneada165(nome) {
  const ms = GameState.mapScan || {};
  const chaves = Object.keys(ms);
  for (let i = 0; i < chaves.length; i++) { if (ms[chaves[i]] && ms[chaves[i]][nome]) return chaves[i]; }
  return null;
}
function codexRegiao165(t, m) {
  const rid = MAPA_PARA_REGIAO164[t + ':' + m];
  const r = rid ? REGIONS.find(function (x) { return x.id === rid; }) : null;
  return r ? r.name : '—';
}
function codexProgresso165(tribo) {
  let feitos = 0, total = 0;
  BANCO164.forEach(function (b) {
    if (tribo !== 'todas' && b.t !== tribo) return;
    total++;
    if (codexEscaneada165(b.n)) feitos++;
  });
  return { feitos: feitos, total: total };
}
function codexFechar165() { const el = document.getElementById('codex-165'); if (el) el.remove(); }
function codexAbrir165() {
  let el = document.getElementById('codex-165');
  if (!el) {
    el = document.createElement('div');
    el.id = 'codex-165';
    el.style.cssText = 'position:fixed;inset:0;z-index:140;background:rgba(3,7,14,0.96);display:flex;flex-direction:column;padding:12px;font-family:monospace;color:#dbe6ff;';
    document.body.appendChild(el);
  }
  const lista = BANCO164.filter(function (b) { return CODEX165.tab === 'todas' || b.t === CODEX165.tab; });
  const prog = codexProgresso165(CODEX165.tab);
  const progTotal = codexProgresso165('todas');
  const filtro = CODEX165.filtro;
  const mostrar = lista.filter(function (b) {
    const ok = !!codexEscaneada165(b.n);
    if (filtro === 'escaneadas') return ok;
    if (filtro === 'faltando') return !ok;
    return true;
  });
  const tribos = [['todas', '\u{1F30D} Todas'], ['overworld', '\u{1F33F} OverWorld'], ['underworld', '\u{1F525} UnderWorld'], ['danian', '\u{1F41D} Danian'], ['mipedian', '\u{1F54E} Mipedian']];
  let html = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    + '<div style="font-size:15px;font-weight:800;color:#9fe870;">\U0001F4D6 COLE\u00c7\u00c3O DAS 120 ESP\u00c9CIES</div>'
    + '<div style="font-size:11px;color:#9fb0cc;">Perim tem <b style="color:#ffd54f;">' + progTotal.feitos + '/' + progTotal.total + '</b> esp\u00e9cies escaneadas'
    + '<span style="margin-left:10px;">Aba: <b style="color:#ffd54f;">' + prog.feitos + '/' + prog.total + '</b></span></div>'
    + '<button onclick="codexAbrirFiltro165()" style="background:#16203a;color:#cfe8a0;border:1px solid #33415c;border-radius:8px;padding:5px 10px;font-size:10px;font-family:monospace;cursor:pointer;">Filtrar: ' + (filtro === 'todas' ? 'Todas' : filtro === 'escaneadas' ? '\u2713 Escaneadas' : '\u2717 Faltando') + '</button>'
    + '<button onclick="codexFechar165()" style="margin-left:auto;background:#3a1020;color:#ffb3c0;border:1px solid #7a2540;border-radius:8px;padding:5px 12px;font-size:11px;font-family:monospace;cursor:pointer;">\u2715 Fechar</button>'
    + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 8px;">';
  tribos.forEach(function (t) {
    const ativo = CODEX165.tab === t[0];
    const p = codexProgresso165(t[0]);
    html += '<button onclick="codexTab165(\'' + t[0] + '\')" style="background:' + (ativo ? '#1d3a2a' : '#101828') + ';color:' + (ativo ? '#9fe870' : '#9fb0cc') + ';border:1px solid ' + (ativo ? '#3f9a46' : '#33415c') + ';border-radius:8px;padding:6px 10px;font-size:11px;font-family:monospace;cursor:pointer;">' + t[1] + ' <b>' + p.feitos + '/' + p.total + '</b></button>';
  });
  html += '</div><div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:8px;padding-right:4px;">';
  if (!mostrar.length) html += '<div style="color:#8a9a70;font-size:12px;">Nada aqui com esse filtro.</div>';
  mostrar.forEach(function (b) {
    const t = ENEMY_TYPES.find(function (e) { return e.name === b.n; });
    const reg = codexEscaneada165(b.n);
    const els = (b.el || []).map(function (e) { return ELEMENTO_EMOJI164[e] || '\u2728'; }).join('');
    html += '<div style="background:#0d1526;border:1px solid ' + (reg ? '#3f9a46' : '#26324a') + ';border-radius:10px;padding:8px;">'
      + '<div style="display:flex;gap:8px;align-items:center;">'
      + '<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#111c33;border-radius:8px;overflow:hidden;">' + getCardSpriteHTML(b.n, 38) + '</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:11px;font-weight:700;color:' + (b.rar ? '#ffd54f' : '#e8eefc') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + b.n + (b.rar ? ' \u2605' : '') + '</div>'
      + '<div style="font-size:9px;color:#8fa4c4;">Lv.' + b.lvl + ' \u00b7 ' + els + ' \u00b7 ' + (b.agg ? '\u2694\uFE0F Agressiva' : '\u263E Passiva') + ' \u00b7 \u{1F3B5} ' + b.mug + '</div>'
      + '<div style="font-size:9px;color:#9fe870;">\u{1F5FA}\uFE0F ' + codexRegiao165(b.t, b.m) + ' \u00b7 M' + b.m + '</div>'
      + '</div>'
      + '<div style="font-size:14px;">' + (reg ? '\u2705' : '\u2B1C') + '</div>'
      + '</div>'
      + '<div style="font-size:9px;color:#a9c0e0;margin-top:5px;line-height:1.4;">\u{1F52E} ' + (b.ab ? b.ab.n : '\u2014') + '</div>'
      + '<div style="font-size:9px;color:' + (reg ? '#7ec850' : '#ff8fa3') + ';margin-top:3px;">' + (reg ? '\u2713 Escaneada' : '\u2717 Ainda n\u00e3o escaneada') + ' \u00b7 \u2764\uFE0F ' + b.hp + ' \u00b7 \u2694\uFE0F ' + b.atk + '</div>'
      + '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}
function codexTab165(t) { CODEX165.tab = t; codexAbrir165(); }
function codexAbrirFiltro165() {
  const ordem = ['todas', 'escaneadas', 'faltando'];
  CODEX165.filtro = ordem[(ordem.indexOf(CODEX165.filtro) + 1) % ordem.length];
  codexAbrir165();
}
"""
troca('// Sobrescrever togglePanel para o scanner real', CODEX + '// Sobrescrever togglePanel para o scanner real', 'painel da Coleção (Codex)')

troca("""    filter.textContent = 'Filtrar: ' + SCANNER_CARD_FILTERS[scannerCardFilterIdx];
    renderScannerCardsUI();
  });
}""",
"""    filter.textContent = 'Filtrar: ' + SCANNER_CARD_FILTERS[scannerCardFilterIdx];
    renderScannerCardsUI();
  });
  const codexBtn165 = document.getElementById('codex-open-165');
  if (codexBtn165) codexBtn165.addEventListener('click', function() { codexAbrir165(); });
}""",
'wiring do botão da Coleção')

# ============================================================
# C) VERSÃO
# ============================================================
troca('<title>Chaotic.idleWorld v2.27 \u2014 Banco de 120 criaturas integrado (4 tribos, mapa 3 dos Mipedians e o MASTER)</title>',
      '<title>Chaotic.idleWorld v2.28 \u2014 Banco na batalha (elemento e escala) + Cole\u00e7\u00e3o das 120 no jogo</title>',
      'título v2.28')
troca('// CHAOTIC.IDLEWORLD v2.27 \u2014 CHANGELOG (v164 Banco de 120 criaturas integrado)',
      '// CHAOTIC.IDLEWORLD v2.28 \u2014 CHANGELOG (v165 Banco na batalha + Cole\u00e7\u00e3o das 120)\n'
      '// - v165 \u2014 A BATALHA USA A FICHA DO BANCO: o arqu\u00e9tipo de luta vem do ELEMENTO da\n'
      '//   esp\u00e9cie (Fogo\u2192Pyrodonte, \u00c1gua\u2192Aquarion, Terra\u2192Terramole, Ar\u2192Voltrax) e do perfil\n'
      '//   (m\u00edstico de Terra\u2192Sibilora; RARA de \u00c1gua/controladora\u2192Noctumbra); vida, dano e\n'
      '//   velocidade escalam pela esp\u00e9cie (m1 < m2 < m3 < rara), clampado para n\u00e3o\n'
      '//   quebrar o balanceamento; a Sala mostra a habilidade de carta da criatura.\n'
      '//   Vale no Dromo (Code Masters) e no PVP. Scan sem ficha segue como era.\n'
      '// - v165 \u2014 COLE\u00c7\u00c3O DAS 120 NO JOGO: painel \U0001F4D6 no acervo do Scanner com as 4 abas\n'
      '//   de tribo, progresso x/30 e x/120, filtro Todas/Escaneadas/Faltando e a ficha\n'
      '//   de cada esp\u00e9cie (arte, n\u00edvel, elementos, habilidade, Mugic, onde vive e \u2713).\n'
      '// CHAOTIC.IDLEWORLD v2.27 \u2014 CHANGELOG (v164 Banco de 120 criaturas integrado)',
      'changelog v2.28')

# ============================================================
# D) O JOGO DE BATALHA (base64): aplicar a escala e o elemento do banco
# ============================================================
m = re.search(r'window\.BATTLE_GAME_B64="([^"]+)"', s)
if not m:
    print('ABORTADO: BATTLE_GAME_B64 não encontrado'); sys.exit(1)
velho_b64 = m.group(1)
jogo = base64.b64decode(velho_b64).decode('utf-8')

ancora = """      mk.name = s.name;
      mk.role = "Scan Nv." + s.level + " \u00b7 " + String(s.rarity || "comum").toUpperCase();
      injected.push(mk);"""
if jogo.count(ancora) != 1:
    print('ABORTADO: âncora do initDromo (%d)' % jogo.count(ancora)); sys.exit(1)

novo_trecho = """      mk.name = s.name;
      mk.role = "Scan Nv." + s.level + " \u00b7 " + String(s.rarity || "comum").toUpperCase();
      // v165 \u2014 a ficha do banco vale na batalha: elemento, tamanho e pot\u00eancia do Scan
      if (s.banco) {
        try {
          const mt = s.banco.mult || { hp: 1, dmg: 1, spd: 1 };
          mk.maxHp = Math.round(mk.maxHp * (mt.hp || 1));
          mk.phys = Math.round(mk.phys * (mt.dmg || 1));
          mk.mag = Math.round(mk.mag * (mt.dmg || 1));
          mk.speed = Math.round(mk.speed * (mt.spd || 1));
          if (s.banco.elem) mk.element = s.banco.elem;
          if (s.banco.hab) mk.desc = "Habilidade de carta (banco): " + s.banco.hab + (s.banco.habDesc ? " \\u2014 " + s.banco.habDesc : "") + "\\n\\n" + mk.desc;
          mk.bankMugic = s.banco.mugic || 0;
          mk.bankTribe = s.banco.tribo || null;
          mk.bankRare = !!s.banco.rara;
        } catch (e) {}
      }
      injected.push(mk);"""
jogo = jogo.replace(ancora, novo_trecho, 1)
novo_b64 = base64.b64encode(jogo.encode('utf-8')).decode('ascii')
s = s.replace('window.BATTLE_GAME_B64="' + velho_b64 + '"', 'window.BATTLE_GAME_B64="' + novo_b64 + '"', 1)
print('ok: jogo de batalha (base64) — %d -> %d bytes' % (len(velho_b64), len(novo_b64)))

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('patch aplicado: %d bytes' % len(s.encode('utf-8')))
