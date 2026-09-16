#!/usr/bin/env node
/* ============================================================
 * Chaotic.IdleWorld — GERADOR DO BANCO DE CRIATURAS
 * tools/gerar_banco.js
 * ------------------------------------------------------------
 * Gera 4 tribos x 30 criaturas (5 + 10 + 15 por mapa) = 120.
 * DETERMINÍSTICO: mesma semente => mesmo banco (pode rodar de novo).
 *
 * Saídas:
 *   data/creatures.json          — banco completo (120)
 *   data/underworld_mapa2.json   — amostra pedida (10 do UnderWorld mapa 2)
 *   data/resumo.json             — contagens por tribo/mapa (checagem rápida)
 *   src/creature_db.js           — mesmo banco em JS (usável no navegador)
 *
 * Uso: node tools/gerar_banco.js
 * ============================================================ */
'use strict';

const path = require('path');
const fs = require('fs');
const C = require(path.join(__dirname, '..', 'src', 'creature.js'));
const { Creature, TRIBE_META, MAPS, ARCHETYPES, ELEMENTS, ELEMENT_COLORS } = C;

// ------------------------------------------------------------
// RNG determinístico (mulberry32) — semente por tribo
// ------------------------------------------------------------
function hashSeed(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngFor = (txt) => mulberry32(hashSeed(txt));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// ------------------------------------------------------------
// LÉXICO (nomes PT-BR por tribo) — 30 espécies por tribo
// ------------------------------------------------------------
const ESPECIES = {
  OverWorld: ['Cervo', 'Coelho', 'Lobo', 'Urso', 'Raposa', 'Esquilo', 'Falcão', 'Garça', 'Texugo', 'Lontra',
    'Castor', 'Coruja', 'Cordeiro', 'Pônei', 'Cabra', 'Guaxinim', 'Tartaruga', 'Truta', 'Besouro', 'Abelha',
    'Libélula', 'Louva-a-deus', 'Rã', 'Pato', 'Javali', 'Búfalo', 'Ganso', 'Carneiro', 'Antílope', 'Pelicano'],
  UnderWorld: ['Lagarto', 'Cão', 'Verme', 'Diabrete', 'Golem', 'Rato', 'Escorpião', 'Morcego', 'Serpente', 'Javali',
    'Besouro', 'Corvo', 'Salamandra', 'Brutamontes', 'Imp', 'Crocodilo', 'Touro', 'Ogro', 'Bode', 'Sapo',
    'Víbora', 'Lacraia', 'Tatu', 'Aranha', 'Caracol', 'Gnomo', 'Cascudo', 'Troglodita', 'Fungo', 'Basilisco'],
  Danian: ['Escaravelho', 'Formiga', 'Cupim', 'Vespa', 'Louva-a-deus', 'Aranha', 'Centopeia', 'Joaninha', 'Gafanhoto', 'Besouro',
    'Lagarta', 'Mariposa', 'Percevejo', 'Lacraia', 'Pulgão', 'Térmite', 'Vaga-lume', 'Larva', 'Broca', 'Caruncho',
    'Abelha', 'Mamangaba', 'Barata', 'Grilo', 'Cigarra', 'Libélula', 'Mosca', 'Mutuca', 'Taturana', 'Rainha'],
  Mipedian: ['Lagarto', 'Víbora', 'Escorpião', 'Falcão', 'Abutre', 'Chacal', 'Hiena', 'Camelo', 'Dromedário', 'Serpente',
    'Gafanhoto', 'Lagartixa', 'Gekko', 'Águia', 'Corvo', 'Jerboa', 'Feneco', 'Dragão', 'Gênio', 'Miragem',
    'Escaravelho', 'Tatu-bola', 'Crocodilo', 'Mamba', 'Píton', 'Caracal', 'Bode', 'Formiga', 'Eremita', 'Verme-da-areia']
};

// [masculino, feminino] — o nome concorda com o gênero da espécie
const EPITETOS = {
  'Fogo': [['Ígneo', 'Ígnea'], ['Flamejante', 'Flamejante'], ['Incandescente', 'Incandescente'], ['Ardente', 'Ardente'],
    ['Escaldado', 'Escaldada'], ['Vulcânico', 'Vulcânica'], ['Fumegante', 'Fumegante'], ['Carbonizado', 'Carbonizada'],
    ['Piromante', 'Piromante'], ['Fuliginoso', 'Fuliginosa']],
  'Terra': [['Rochoso', 'Rochosa'], ['Pedregoso', 'Pedregosa'], ['Granítico', 'Granítica'], ['Terroso', 'Terrosa'],
    ['Barrento', 'Barrenta'], ['Cristalino', 'Cristalina'], ['Férreo', 'Férrea'], ['Titânico', 'Titânica'],
    ['Sedimentar', 'Sedimentar'], ['Mineral', 'Mineral']],
  'Água': [['Aquoso', 'Aquosa'], ['Fluido', 'Fluida'], ['Marítimo', 'Marítima'], ['Gélido', 'Gélida'],
    ['Ondeante', 'Ondeante'], ['Salgado', 'Salgada'], ['Límpido', 'Límpida'], ['Profundo', 'Profunda'],
    ['Nebuloso', 'Nebulosa'], ['Choroso', 'Chorosa']],
  'Ar': [['Alado', 'Alada'], ['Ventoso', 'Ventosa'], ['Trovejante', 'Trovejante'], ['Célere', 'Célere'],
    ['Tempestuoso', 'Tempestuosa'], ['Etéreo', 'Etérea'], ['Sibilante', 'Sibilante'], ['Elevado', 'Elevada'],
    ['Neblinoso', 'Neblinosa'], ['Fulminante', 'Fulminante']]
};

// Espécies femininas (o resto é masculino) — concordância do epíteto.
const FEMININOS = ['Raposa', 'Cabra', 'Tartaruga', 'Abelha', 'Libélula', 'Rã', 'Truta', 'Garça', 'Lontra', 'Coruja',
  'Serpente', 'Salamandra', 'Víbora', 'Lacraia', 'Aranha',
  'Formiga', 'Vespa', 'Centopeia', 'Joaninha', 'Lagarta', 'Mariposa', 'Mamangaba', 'Barata', 'Cigarra', 'Mosca',
  'Mutuca', 'Taturana', 'Broca', 'Larva', 'Rainha',
  'Hiena', 'Lagartixa', 'Águia', 'Miragem', 'Mamba', 'Píton'];
const generoDe = (n) => (FEMININOS.indexOf(n) !== -1 ? 'f' : 'm');

const BIOMAS = {
  OverWorld: ['as clareiras do bosque', 'as margens do lago espelhado', 'os caminhos de terra batida', 'o bosque alto'],
  UnderWorld: ['as galerias de obsidiana', 'os rios de lava', 'as forjas adormecidas', 'os túneis de cinza'],
  Danian: ['os túneis de âmbar', 'a galeria do néctar', 'a câmara da rainha', 'a colmeia profunda'],
  Mipedian: ['as dunas do oásis', 'o poço das areias', 'as miragens do palmeiral', 'as areias enfumaçadas']
};

// Habilidades por tribo (tipo -> lista). manaCost = custo de mana (imita a carta real).
const HABILIDADES = {
  OverWorld: {
    dano: [{ name: 'Chifre de Carvalho', manaCost: 3 }, { name: 'Investida de Seiva', manaCost: 3 }],
    controle: [{ name: 'Raízes Vivas', manaCost: 3 }, { name: 'Névoa do Lago', manaCost: 2 }],
    buff: [{ name: 'Bênção da Clareira', manaCost: 2 }, { name: 'Couraça de Casca', manaCost: 2 }],
    cura: [{ name: 'Seiva Curativa', manaCost: 2 }, { name: 'Orvalho do Bosque', manaCost: 3 }]
  },
  UnderWorld: {
    dano: [{ name: 'Erupção de Lava', manaCost: 4 }, { name: 'Chicote de Brasas', manaCost: 3 }],
    controle: [{ name: 'Cinzas Sufocantes', manaCost: 3 }, { name: 'Correntes de Magma', manaCost: 3 }],
    buff: [{ name: 'Muralha de Obsidiana', manaCost: 2 }, { name: 'Fúria de Cinzas', manaCost: 3 }],
    cura: [{ name: 'Pacto de Brasa', manaCost: 2 }, { name: 'Coração de Pedra-Pomes', manaCost: 3 }]
  },
  Danian: {
    dano: [{ name: 'Néctar Corrosivo', manaCost: 3 }, { name: 'Ferrão Duplo', manaCost: 4 }],
    controle: [{ name: 'Teia de Âmbar', manaCost: 3 }, { name: 'Enxame Cegante', manaCost: 2 }],
    buff: [{ name: 'Casco Reforçado', manaCost: 2 }, { name: 'Feromônio de Guerra', manaCost: 3 }],
    cura: [{ name: 'Gel Real', manaCost: 2 }, { name: 'Nutrir da Colmeia', manaCost: 3 }]
  },
  Mipedian: {
    dano: [{ name: 'Lâmina de Areia', manaCost: 3 }, { name: 'Presas do Sol', manaCost: 4 }],
    controle: [{ name: 'Miragem do Oásis', manaCost: 3 }, { name: 'Vendaval Seco', manaCost: 2 }],
    buff: [{ name: 'Véu de Vento', manaCost: 2 }, { name: 'Marcha das Dunas', manaCost: 3 }],
    cura: [{ name: 'Orvalho Frio', manaCost: 2 }, { name: 'Bênção da Lua de Areia', manaCost: 3 }]
  }
};

// Sprite existente no jogo usado como arte provisória (integração futura).
const ARTES = {
  OverWorld: { bruto: ['golem_stone', 'bruto', 'sentinela'], equilibrado: ['escudeiro', 'batedor', 'wolf'], mistico: ['encantador', 'mare', 'cronomante'] },
  UnderWorld: { bruto: ['cao_magma', 'bruto', 'golem_obsidian'], equilibrado: ['chamao', 'flagelo', 'devorador'], mistico: ['cronomante', 'encantador', 'paradox'] },
  Danian: { bruto: ['mandiblor', 'vespa', 'forjador'], equilibrado: ['vespa', 'mandiblor', 'sentinela'], mistico: ['gargula', 'encantador', 'cronomante'] },
  Mipedian: { bruto: ['golem_stone', 'bruto', 'sentinela'], equilibrado: ['batedor', 'escudeiro', 'forjador'], mistico: ['paradox', 'cronomante', 'encantador'] }
};

// Qualificador usado só quando o nome repetiria entre tribos.
const QUALIFICADOR = {
  OverWorld: ['do Bosque', 'da Clareira', 'do Lago', 'da Colina'],
  UnderWorld: ['das Brasas', 'da Forja', 'do Abismo', 'das Cinzas'],
  Danian: ['do Âmbar', 'da Colmeia', 'dos Túneis', 'do Néctar'],
  Mipedian: ['das Dunas', 'do Oásis', 'da Miragem', 'das Areias']
};

// ------------------------------------------------------------
// PLANO DE SLOTS (a matemática exata pedida, por mapa/tribo)
// ------------------------------------------------------------
/** Distribuição de arquétipos por categoria — restrição: rara é sempre de combate. */
function planoDeArquetipos(mapLevel) {
  if (mapLevel === 1) return { passivas: ['bruto', 'bruto', 'equilibrado', 'equilibrado', 'mistico'], agressivas: [] };
  if (mapLevel === 2) return { passivas: ['equilibrado', 'equilibrado', 'equilibrado', 'mistico', 'mistico', 'mistico'],
                               agressivas: ['bruto', 'bruto', 'bruto', 'equilibrado'] };
  return { passivas: ['equilibrado', 'equilibrado', 'mistico', 'mistico', 'mistico', 'mistico', 'mistico'],
           agressivas: ['bruto', 'bruto', 'bruto', 'bruto', 'bruto', 'equilibrado', 'equilibrado', 'equilibrado'] };
}

/** Quantas criaturas "fora da curva" (exceção de lore) por mapa. */
const QUOTA_EXCECAO = { 1: 1, 2: 2, 3: 3 };

// ------------------------------------------------------------
// GERAÇÃO
// ------------------------------------------------------------
function gerarCriatura(tribe, mapLevel, idx, rng, ctx) {
  const meta = TRIBE_META[tribe];
  const mapa = MAPS[mapLevel];
  const plano = ctx.plano;                                  // {aggressive, archetype, rare}
  const A = ARCHETYPES[plano.archetype];

  // ---- stats: orçamento fixo do arquétipo + deslocamento pela agressividade
  const budget = A.budget[mapLevel];
  let w = Object.assign({}, A.weights);
  if (plano.aggressive) { w.courage -= 0.04; w.power += 0.03; w.wisdom -= 0.02; w.speed += 0.03; }
  else { w.courage += 0.03; w.power -= 0.03; w.wisdom += 0.02; w.speed -= 0.02; }

  const stats = {};
  ['courage', 'power', 'wisdom', 'speed'].forEach(function (k) {
    const bruto = budget * w[k];
    const jitter = 1 + (rng() * 0.06 - 0.03);               // ±3% por atributo
    stats[k] = Math.max(4, Math.round(bruto * jitter));
  });

  // ---- elementos (LORE): principal x exceção
  const ehExcecao = ctx.excecoes.indexOf(idx) !== -1;
  let elements;
  if (ehExcecao) {
    const exc = shuffle(rng, meta.excecao);
    if (rng() < 0.4) elements = [exc[0], pick(rng, meta.principal)];
    else elements = exc.slice(0, meta.excecao.length >= 2 && rng() < 0.5 ? 2 : 1);
  } else {
    const prin = shuffle(rng, meta.principal);
    elements = (rng() < 0.45 && meta.principal.length > 1) ? [prin[0], prin[1]] : [prin[0]];
  }

  // ---- nível dentro da faixa do mapa (mais forte = mais alto)
  const band = mapa.band;
  const baseLevel = plano.rare ? band[1] - 1
    : plano.archetype === 'bruto' ? band[1] - 1
    : plano.archetype === 'equilibrado' ? Math.round((band[0] + band[1]) / 2)
    : band[0] + 1;
  const level = Math.min(band[1], Math.max(band[0], baseLevel + (rng() < 0.4 ? (rng() < 0.5 ? -1 : 1) : 0)));

  // ---- habilidade: bruto bate, equilibrado buffa/controla, místico cura/controla
  const tipo = plano.archetype === 'bruto' ? 'dano'
    : plano.archetype === 'mistico' ? (ctx.habIdx % 2 === 0 ? 'cura' : 'controle')
    : (ctx.habIdx % 2 === 0 ? 'buff' : 'controle');
  const hab = HABILIDADES[tribe][tipo][ctx.habIdx % HABILIDADES[tribe][tipo].length];
  ctx.habIdx++;

  // ---- nome: espécie (1 por slot da tribo) + epíteto do elemento dominante
  const especie = ctx.especies[idx];
  const g = generoDe(especie);
  const forma = (par) => (g === 'f' ? par[1] : par[0]);          // concordância de gênero
  const epitetos = shuffle(rng, EPITETOS[elements[0]]).map(forma);
  let nome = especie + ' ' + epitetos[0];
  if (ctx.usados[nome]) {
    // nome já usado por outra tribo (ex.: Crocodilo/Javali existem em 2 tribos):
    // tenta outro epíteto e, em último caso, um qualificador da tribo.
    let achou = null;
    for (let i = 1; i < epitetos.length; i++) { const cand = especie + ' ' + epitetos[i]; if (!ctx.usados[cand]) { achou = cand; break; } }
    nome = achou || (especie + ' ' + epitetos[0] + ' ' + QUALIFICADOR[tribe][ctx.qualIdx++ % QUALIFICADOR[tribe].length]);
  }
  ctx.usados[nome] = 1;

  // ---- lore / descrição
  const bioma = pick(rng, BIOMAS[tribe]);
  const desc = plano.rare
    ? 'Lendária de ' + bioma + ': poucos voltaram para contar o encontro.'
    : plano.aggressive
      ? 'Patrulha ' + bioma + ' e ataca qualquer intruso à vista.'
      : 'Vagueia por ' + bioma + '; prefere observar a lutar.';

  const d = {
    id: meta.id + '_m' + mapLevel + '_' + String(idx + 1).padStart(2, '0'),
    name: nome,
    tribe: tribe,
    mapLevel: mapLevel,
    level: level,
    elements: elements,
    elementKind: ehExcecao ? 'excecao' : 'principal',
    tint: ELEMENT_COLORS[elements[0]],
    isAggressive: plano.aggressive,
    isRare: plano.rare,
    archetype: plano.archetype,
    stats: stats,
    ability: { name: hab.name, type: tipo, manaCost: hab.manaCost, desc: descricaoHabilidade(tipo, hab.name) },
    rewards: C.rewardsFrom(level, plano.rare),
    art: pick(rng, ARTES[tribe][plano.archetype]),
    desc: desc
  };
  return new Creature(d);
}

function descricaoHabilidade(tipo, nome) {
  const t = {
    dano: 'Causa dano físico pesado a um alvo.',
    controle: 'Impede o alvo de agir por 1 turno.',
    buff: 'Aumenta o dano do seu lado por 2 turnos.',
    cura: 'Restaura vida do seu lado.'
  };
  return nome + ' — ' + t[tipo];
}

const USADOS = {};   // nomes únicos no banco inteiro

function gerarTribo(tribe) {
  const out = [];
  Object.keys(MAPS).map(Number).forEach(function (mapLevel) {
    const rng = rngFor(tribe + '-m' + mapLevel);
    const mapa = MAPS[mapLevel];
    const arq = planoDeArquetipos(mapLevel);

    // ordem final dos slots: passivas e agressivas embaralhadas
    const planos = [];
    arq.passivas.forEach(function (a) { planos.push({ aggressive: false, rare: false, archetype: a }); });
    arq.agressivas.forEach(function (a) { planos.push({ aggressive: true, rare: false, archetype: a }); });
    const misturado = shuffle(rng, planos);
    // raras: só nas agressivas e, de preferência, entre os BRUTOS — a rara é o
    // "chefão" do mapa: chassi mais forte + o bônus de +20% em velocidade e dano.
    const idxAgr = [];
    misturado.forEach(function (p, i) { if (p.aggressive) idxAgr.push(i); });
    const brutosAgr = shuffle(rng, idxAgr.filter(function (i) { return misturado[i].archetype === 'bruto'; }));
    const outrosAgr = shuffle(rng, idxAgr.filter(function (i) { return misturado[i].archetype !== 'bruto'; }));
    brutosAgr.concat(outrosAgr).slice(0, mapa.rare).forEach(function (i) { misturado[i].rare = true; });

    // exceções de lore (posições distintas, sorteadas)
    const excecoes = shuffle(rng, misturado.map(function (_, i) { return i; })).slice(0, QUOTA_EXCECAO[mapLevel]).sort(function (a, b) { return a - b; });

    const ctx = {
      plano: null,
      especies: shuffle(rng, ESPECIES[tribe]),
      excecoes: excecoes,
      habIdx: 0,
      qualIdx: 0,
      usados: USADOS            // nomes já usados (global, evita repetição entre tribos)
    };
    misturado.forEach(function (p, i) { ctx.plano = p; out.push(gerarCriatura(tribe, mapLevel, i, rng, ctx)); });
  });
  return out;
}

// ------------------------------------------------------------
// RESUMO / VALIDAÇÃO RÁPIDA
// ------------------------------------------------------------
function resumo(banco) {
  const porTribo = {};
  banco.forEach(function (c) {
    const t = porTribo[c.tribe] = porTribo[c.tribe] || { total: 0, mapas: {}, elementos: {}, mugic: [0, 0, 0], raras: 0, agressivas: 0, excecoes: 0 };
    t.total++;
    t.mapas[c.mapLevel] = t.mapas[c.mapLevel] || { total: 0, passivas: 0, agressivas: 0, raras: 0 };
    const m = t.mapas[c.mapLevel];
    m.total++; if (c.isAggressive) { m.aggressives = (m.aggressives || 0) + 1; m.agressivas++; t.agressivas++; } else m.passivas++;
    if (c.isRare) { m.raras++; t.raras++; }
    if (c.elementKind === 'excecao') t.excecoes++;
    c.elements.forEach(function (e) { t.elementos[e] = (t.elementos[e] || 0) + 1; });
    t.mugic[c.mugicCounters]++;
  });
  return porTribo;
}

// ------------------------------------------------------------
// SAÍDA
// ------------------------------------------------------------
function main() {
  const datas = [C, C]; // (mantido simples)
  const banco = [];
  Object.keys(TRIBE_META).forEach(function (t) { gerarTribo(t).forEach(function (c) { banco.push(c); }); });

  // integridade antes de escrever qualquer arquivo
  let problemas = [];
  banco.forEach(function (c) { c.validate().forEach(function (p) { problemas.push(c.id + ': ' + p); }); });
  const ids = {}, nomes = {};
  banco.forEach(function (c) {
    if (ids[c.id]) problemas.push('id duplicado: ' + c.id); ids[c.id] = 1;
    if (nomes[c.name]) problemas.push('nome duplicado: ' + c.name); nomes[c.name] = 1;
  });
  if (problemas.length) {
    console.error('BANCO INVÁLIDO (' + problemas.length + '):');
    problemas.slice(0, 20).forEach(function (p) { console.error('  - ' + p); });
    process.exit(1);
  }

  const json = banco.map(function (c) { return c.toJSON(); });
  const dirData = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dirData, { recursive: true });

  fs.writeFileSync(path.join(dirData, 'creatures.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');

  const amostra = json.filter(function (c) { return c.tribe === 'UnderWorld' && c.mapLevel === 2; });
  fs.writeFileSync(path.join(dirData, 'underworld_mapa2.json'), JSON.stringify(amostra, null, 2) + '\n', 'utf8');

  const r = resumo(banco);
  fs.writeFileSync(path.join(dirData, 'resumo.json'), JSON.stringify(r, null, 2) + '\n', 'utf8');

  const cabecalho = '/* GERADO AUTOMATICAMENTE por tools/gerar_banco.js — não edite à mão.\n'
    + ' * Banco de ' + json.length + ' criaturas (4 tribos x 30) — versão ' + new Date().toISOString().slice(0, 10) + ' */\n';
  const corpo = '(function (root, factory) {\n'
    + "  if (typeof module === 'object' && module.exports) module.exports = factory();\n"
    + '  else root.CreatureDB = factory();\n'
    + "})(typeof self !== 'undefined' ? self : this, function () {\n"
    + "  'use strict';\n"
    + '  var CRIATURAS = ' + JSON.stringify(json) + ';\n'
    + '  var porId = {}; CRIATURAS.forEach(function (c) { porId[c.id] = c; });\n'
    + '  return {\n'
    + '    all: CRIATURAS,\n'
    + '    byId: function (id) { return porId[id] || null; },\n'
    + '    byTribe: function (t) { return CRIATURAS.filter(function (c) { return c.tribe === t; }); },\n'
    + '    byMap: function (t, m) { return CRIATURAS.filter(function (c) { return c.tribe === t && c.mapLevel === m; }); },\n'
    + '    byElement: function (e) { return CRIATURAS.filter(function (c) { return c.elements.indexOf(e) !== -1; }); },\n'
    + '    rares: function () { return CRIATURAS.filter(function (c) { return c.isRare; }); },\n'
    + '    resumo: ' + JSON.stringify(r) + '\n'
    + '  };\n'
    + '});\n';
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'creature_db.js'), cabecalho + corpo, 'utf8');

  console.log('BANCO GERADO: ' + json.length + ' criaturas');
  Object.keys(r).forEach(function (t) {
    const x = r[t];
    const mapas = Object.keys(x.mapas).sort().map(function (m) {
      const v = x.mapas[m];
      return 'm' + m + ': ' + v.total + ' (' + v.passivas + ' passivas / ' + (v.agressivas || 0) + ' agressivas, ' + v.raras + ' rara' + (v.raras === 1 ? '' : 's') + ')';
    }).join(' | ');
    console.log('  ' + t.padEnd(11) + ' ' + x.total + ' cr · ' + mapas);
    console.log('    elementos: ' + JSON.stringify(x.elementos) + ' · exceções de lore: ' + x.excecoes + ' · mugic 0/1/2: ' + x.mugic.join('/'));
  });
  console.log('arquivos: data/creatures.json · data/underworld_mapa2.json (' + amostra.length + ') · data/resumo.json · src/creature_db.js');
}

main();
