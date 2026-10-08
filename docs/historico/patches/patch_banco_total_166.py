#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_banco_total_166.py — v2.29 (v166)
O BANCO DE 120 CRIATURAS VIRA A FONTE DE CRIATURAS DO JOGO INTEIRO.

Aplica sobre a build v2.28 (canônico). Uso:
    python3 patch_banco_total_166.py [entrada] [saida]
(default: chaotic_idleworld_v123.html -> chaotic_idleworld_v123.html)

Troca os últimos pontos do jogo que ainda sorteavam criaturas do elenco ANTIGO:
 1) Roleta ("Monstros na Roleta")           -> só as 120 do banco
 2) Leilão: ofertas de Scan                 -> só as 120
 3) Leilão: lista de pedidos de criatura    -> só as 120
 4) MASTER: +1 Scan aleatório               -> só as 120
 5) Duelos aleatórios do Dromo (dbMakeFoe)  -> só as 120
 6) Drome (arena de ondas)                  -> só as 120
 7) Códigos promocionais (+N Scans)         -> só as 120
 8) Decks dos 7 Mestres do Código           -> espécies do banco da tribo de cada um
 9) Portal de Viagem                        -> faixa "🧬 Banco de 120 criaturas — X/120"
Exceção documentada: a Lagoa Negra M'arrillian mantém o pool clássico.
"""
import sys, io, os

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'chaotic_idleworld_v123.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else ENTRADA

s = io.open(ENTRADA, encoding='utf-8').read()
antes = len(s)
trocas = []

def troca(nome, velho, novo, vezes=1):
    global s
    n = s.count(velho)
    if n != vezes:
        raise SystemExit('✗ [%s] esperava %d ocorrência(s), achei %d' % (nome, vezes, n))
    s = s.replace(velho, novo, vezes)
    trocas.append(nome)

# ---------------------------------------------------------------- 1) helper
HELPER = """/* ============================================================
 * v166 — O BANCO DE 120 É A FONTE DE CRIATURAS DO JOGO INTEIRO
 * Todo sistema que sorteia uma criatura (Roleta, Leilão, Drome, duelos
 * aleatórios, MASTER, códigos promocionais) usa as 120 do banco.
 * Exceção documentada: a Lagoa Negra M'arrillian mantém o pool clássico
 * (o banco não tem criaturas M'arrillian).
 * ============================================================ */
function especiesDoBanco166() {
  return ENEMY_TYPES.filter(function (e) { return !!e.banco164; });
}
function poolDoBanco166(filtro) {
  const todos = especiesDoBanco166();
  const p = filtro ? todos.filter(filtro) : todos;
  return p.length ? p : todos;
}
function sorteiaDoBanco166(filtro) {
  const pool = poolDoBanco166(filtro);
  return pool[Math.floor(Math.random() * pool.length)];
}
"""
troca('helper v166',
      "/* ============================================================\n * v165 — A FICHA DO BANCO VALE NA BATALHA",
      HELPER + "/* ============================================================\n * v165 — A FICHA DO BANCO VALE NA BATALHA")

# ---------------------------------------------------------------- 2) Roleta: título + lista
troca('roleta: título',
      ">Monstros na Roleta</div>",
      ">Monstros na Roleta — as 120 do banco</div>")

troca('roleta: lista',
      "  for (let i = 0; i < ENEMY_TYPES.length; i++) {\n    const enemy = ENEMY_TYPES[i];\n    html += '<div style=\"background:#1e2418;",
      "  const _lista166 = especiesDoBanco166(); // v166 — a Roleta mostra só as 120 do banco\n"
      "  for (let i = 0; i < _lista166.length; i++) {\n    const enemy = _lista166[i];\n    html += '<div style=\"background:#1e2418;")

# ---------------------------------------------------------------- 3) Leilão: oferta de criatura
troca('leilão: oferta',
      "  const maxLvl = Math.max(3, p.lvl + 6);\n"
      "  const pool = ENEMY_TYPES.filter(function(e) { return e.level <= maxLvl; });\n"
      "  const t = (pool.length ? pool : ENEMY_TYPES)[Math.floor(Math.random() * (pool.length ? pool.length : ENEMY_TYPES.length))];\n"
      "  const card = generateRouletteCard(t);\n"
      "  card.source = 'leilao';",
      "  const maxLvl = Math.max(3, p.lvl + 6);\n"
      "  const pool = poolDoBanco166(function (e) { return e.level <= maxLvl; }); // v166 — o Leilão vende scans do banco\n"
      "  const t = pool[Math.floor(Math.random() * pool.length)];\n"
      "  const card = generateRouletteCard(t);\n"
      "  card.source = 'leilao';")

# ---------------------------------------------------------------- 4) Leilão: pedidos de criatura
troca('leilão: pedidos',
      "    for (let i = 0; i < ENEMY_TYPES.length; i++) opts += '<option>' + ENEMY_TYPES[i].name + '</option>';",
      "    const _nomes166 = especiesDoBanco166().map(function (e) { return e.name; }); // v166 — pedidos só do banco\n"
      "    for (let i = 0; i < _nomes166.length; i++) opts += '<option>' + _nomes166[i] + '</option>';")

# ---------------------------------------------------------------- 5) MASTER: +1 Scan
troca('master: +1 scan',
      "  const pool = ENEMY_TYPES.filter(function(t) { return !t.isBoss; });\n"
      "  const t = pool[Math.floor(Math.random() * pool.length)];\n"
      "  const card = generateRouletteCard(t); card.source = 'master';",
      "  const pool = poolDoBanco166(function (t) { return !t.isBoss; }); // v166 — o MASTER sorteia do banco\n"
      "  const t = pool[Math.floor(Math.random() * pool.length)];\n"
      "  const card = generateRouletteCard(t); card.source = 'master';")

# ---------------------------------------------------------------- 6) Duelos aleatórios do Dromo
troca('duelos aleatórios',
      "    const pool = ENEMY_TYPES.filter(function(e) { return Math.abs(e.level - myLvl) <= 5 && e.name !== 'Guardiao do Vazio'; });\n"
      "    const t = (pool.length ? pool : ENEMY_TYPES)[Math.floor(Math.random() * (pool.length ? pool.length : ENEMY_TYPES.length))];",
      "    const pool = poolDoBanco166(function (e) { return Math.abs(e.level - myLvl) <= 5; }); // v166 — duelos só com o banco\n"
      "    const t = pool[Math.floor(Math.random() * pool.length)];")

# ---------------------------------------------------------------- 7) Drome: ondas
troca('drome: ondas',
      "      const et = ENEMY_TYPES[Math.min(ENEMY_TYPES.length - 1, Math.floor(Math.random() * ENEMY_TYPES.length))];",
      "      const _b166 = especiesDoBanco166(); // v166 — a Drome nasce só com o banco\n"
      "      const et = _b166[Math.floor(Math.random() * _b166.length)];")

# ---------------------------------------------------------------- 8) Códigos promocionais
troca('códigos promocionais',
      "            const t = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];\n"
      "            p.scannedCards.push(generateRouletteCard(t)); added++;",
      "            const t = sorteiaDoBanco166(); // v166 — códigos dão scans do banco\n"
      "            p.scannedCards.push(generateRouletteCard(t)); added++;")

# ---------------------------------------------------------------- 9) Decks dos 7 Mestres do Código
DECKS = [
    ("Crellan",  "deck: ['Mandiblor Daniano', 'Bruto Subterraneo', 'Lobo Cinzento'] },", "OverWorld · mapa 2"),
    ("Hotekk",   "deck: ['Sentinela Eterna', 'Cronomante', 'Guardiao Temporal'] },",    "Mipedian · mapa 2 (ancestrais)"),
    ("Amzen",    "deck: ['Chamão do Caos', 'Gargula de Perim'] },",                      "UnderWorld · mapa 2"),
    ("Oron",     "deck: ['Batedor Mipediano', 'Encantador Mipediano', 'Escudeiro de Perim'] },", "Mipedian · mapa 3"),
    ("Tirasis",  "deck: ['Gargula de Perim', 'Devorador M’arriliano'] },",               "OverWorld · mapa 3"),
    ("Imthor",   "deck: ['Maré M’arriliana', 'Flagelo Abissal', 'Sombra'] },",           "Danian · mapa 3 (feras)"),
    ("Chirrul",  "deck: ['Sentinela Eterna', 'Paradoxo', 'Guardiao do Vazio'] },",       "tribos do mapa 3 (+1 rara)"),
]
NOVOS_DECKS = {
    "Crellan": "deck: ['Falcão Carbonizado', 'Tartaruga Flamejante', 'Texugo Escaldado'] }, // v166 — banco: OverWorld m2",
    "Hotekk":  "deck: ['Píton Tempestuosa', 'Feneco Célere', 'Verme-da-areia Pedregoso'] }, // v166 — banco: Mipedian m2",
    "Amzen":   "deck: ['Sapo Neblinoso', 'Cascudo Fuliginoso', 'Basilisco Ondeante'] }, // v166 — banco: UnderWorld m2",
    "Oron":    "deck: ['Feneco Pedregoso', 'Gênio Fluido', 'Jerboa Trovejante'] }, // v166 — banco: Mipedian m3",
    "Tirasis": "deck: ['Javali Titânico', 'Castor Granítico', 'Cervo Vulcânico'] }, // v166 — banco: OverWorld m3",
    "Imthor":  "deck: ['Lagarta Titânica', 'Broca Tempestuosa', 'Centopeia Terrosa'] }, // v166 — banco: Danian m3",
    "Chirrul": "deck: ['Lagartixa Férrea', 'Imp Flamejante', 'Gafanhoto Etéreo'] }, // v166 — banco: m3 + rara",
}
for nome, velho, rot in DECKS:
    troca('deck ' + nome, velho, NOVOS_DECKS[nome])

# ---------------------------------------------------------------- 10) Portal: faixa do banco
troca('portal: faixa do banco',
      "  let html = '<div class=\"portal-tabs\">';",
      "  let html = '';\n"
      "  /* v166 — faixa do BANCO DE 120 no topo do Portal (o banco fica visível de cara) */\n"
      "  const _p166 = (typeof codexProgresso165 === 'function') ? codexProgresso165('todas') : { feitos: 0, total: 120 };\n"
      "  html += '<button class=\"gadget-strip\" onclick=\"codexAbrir165()\" style=\"background:#16281c;border-color:#31663c;color:#cfe8a0;\">🧬 Banco de 120 criaturas — ' + _p166.feitos + '/' + _p166.total + ' escaneadas · abrir a Coleção 📖</button>';\n"
      "  html += '<div class=\"portal-tabs\">';")

# ---------------------------------------------------------------- 11) título + changelog
troca('título',
      "<title>Chaotic.idleWorld v2.28 — Banco na batalha (elemento e escala) + Coleção das 120 no jogo</title>",
      "<title>Chaotic.idleWorld v2.29 — O banco de 120 no jogo inteiro (Roleta, Leilão, Drome, Mestres)</title>")

CHANGELOG = """// ============================================================
// CHAOTIC.IDLEWORLD v2.29 — CHANGELOG (v166 O banco de 120 no jogo inteiro)
// - v166 — O BANCO DE 120 É A FONTE DE CRIATURAS DO JOGO INTEIRO: a Roleta
//   ("Monstros na Roleta"), o Leilão (ofertas de Scan e a lista de pedidos), o
//   MASTER (+1 Scan), os duelos aleatórios do Dromo, as ondas da Drome e os
//   códigos promocionais passam a sortear SÓ as 120 do banco.
// - v166 — MESTRES DO CÓDIGO COM DECK DO BANCO: cada um dos 7 Mestres luta com
//   criaturas do banco da sua tribo (Crellan=OverWorld m2 · Hotekk=Mipedian m2 ·
//   Amzen=UnderWorld m2 · Oron=Mipedian m3 · Tirasis=OverWorld m3 ·
//   Imthor=Danian m3 · Chirrul=m3 das tribos, com uma RARA na equipe).
// - v166 — PORTAL DE VIAGEM com a faixa "🧬 Banco de 120 criaturas — X/120
//   escaneadas · abrir a Coleção 📖" no topo (atalho direto para a Coleção).
// - v166 — exceção documentada: a Lagoa Negra M'arrillian continua com o pool
//   clássico (o banco não tem criaturas M'arrillian).
"""
troca('changelog',
      "// ============================================================\n// CHAOTIC.IDLEWORLD v2.28 — CHANGELOG",
      CHANGELOG + "// ============================================================\n// CHAOTIC.IDLEWORLD v2.28 — CHANGELOG")

io.open(SAIDA, 'w', encoding='utf-8').write(s)
print('✅ v166 aplicado em %s (%d B -> %d B)' % (os.path.basename(SAIDA), antes, len(s)))
for t in trocas:
    print('   ·', t)
