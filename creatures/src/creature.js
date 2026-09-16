/* ============================================================
 * Chaotic.IdleWorld — SISTEMA DE CRIATURAS (v1)
 * src/creature.js — Modelo de dados + regras de balanceamento
 * ------------------------------------------------------------
 * Roda em Node (require) e no navegador (window.ChaoticCreature).
 * Este arquivo é a ÚNICA FONTE DE VERDADE das fórmulas:
 *   stats -> baseSpeed / baseDamage / mugicCounters / tiers.
 * Quem gera o banco e quem valida usam exatamente as mesmas funções.
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChaoticCreature = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------
  // CONSTANTES DE LORE / BALANCEAMENTO
  // ------------------------------------------------------------

  /** Os 4 elementos do universo. */
  var ELEMENTS = ['Fogo', 'Terra', 'Água', 'Ar'];

  /** Cor de cada elemento (carta, minimapa, tint de sprite). */
  var ELEMENT_COLORS = { 'Fogo': '#ff6a2a', 'Terra': '#a9803f', 'Água': '#3f8fd4', 'Ar': '#9fd8e8' };

  /**
   * Afinidades por tribo (LORE CONSTRAINT).
   *  principal — elementos do dia a dia da tribo;
   *  excecao   — elementos "fora da curva" (criaturas raras de lore);
   *  multDano  — fator que separa "força bruta" de "poder de carta" (baseDamage != power).
   */
  var TRIBE_META = {
    OverWorld:  { id: 'ow', label: 'OverWorld',  cor: '#3f9a46', multDano: 1.00,
                  principal: ['Terra', 'Água', 'Fogo'], excecao: ['Ar'] },
    UnderWorld: { id: 'uw', label: 'UnderWorld', cor: '#8b2500', multDano: 1.10,
                  principal: ['Fogo', 'Terra'], excecao: ['Água', 'Ar'] },
    Danian:     { id: 'dn', label: 'Danian',     cor: '#9a7a44', multDano: 1.00,
                  principal: ['Terra', 'Água'], excecao: ['Fogo', 'Ar'] },
    Mipedian:   { id: 'mp', label: 'Mipedian',   cor: '#c9b070', multDano: 1.05,
                  principal: ['Ar', 'Terra'], excecao: ['Fogo', 'Água'] }
  };

  var TRIBES = Object.keys(TRIBE_META);

  /**
   * A matemática EXATA de cada mapa (não é sugestão: o validador cobra).
   *   slots      — quantas criaturas exclusivas a tribo tem naquele mapa
   *   passive    — quantas 100% passivas (isAggressive: false)
   *   aggressive — quantas agressivas
   *   rare       — quantas agressivas com isRare: true
   *   band       — faixa de nível das criaturas
   */
  var MAPS = {
    1: { mapLevel: 1, requiredLevel: 1,  slots: 5,  passive: 5, aggressive: 0, rare: 0, band: [1, 5],
         label: 'Mapa 1 — Recanto (Nv.1-5)' },
    2: { mapLevel: 2, requiredLevel: 10, slots: 10, passive: 6, aggressive: 4, rare: 1, band: [8, 13],
         label: 'Mapa 2 — Domínio (Nv.10)' },
    3: { mapLevel: 3, requiredLevel: 20, slots: 15, passive: 7, aggressive: 8, rare: 2, band: [17, 24],
         label: 'Mapa 3 — Profundeza (Nv.20)' }
  };

  /**
   * ARQUÉTIPOS — é aqui que nasce a regra dos CONTADORES DE MUGIC.
   * O orçamento de status (soma dos 4 atributos) é FIXO por arquétipo e por mapa,
   * então "muito forte" sempre tem menos mugic que "fraca" (relação inversa garantida
   * por construção, com folga de 25+ pontos entre um arquétipo e o seguinte).
   *
   *   bruto       -> stats totais muito altos  -> mugicCounters = 0
   *   equilibrado -> stats balanceados         -> mugicCounters = 1
   *   mistico     -> stats baixos, foco em magia -> mugicCounters = 2
   */
  var ARCHETYPES = {
    bruto: {
      key: 'bruto', label: 'Bruto', mugic: 0, tier: 'muito-forte',
      budget: { 1: 170, 2: 240, 3: 330 },
      weights: { courage: 0.44, power: 0.30, wisdom: 0.06, speed: 0.20 }
    },
    equilibrado: {
      key: 'equilibrado', label: 'Equilibrado', mugic: 1, tier: 'mediana',
      budget: { 1: 145, 2: 205, 3: 285 },
      weights: { courage: 0.34, power: 0.25, wisdom: 0.21, speed: 0.20 }
    },
    mistico: {
      key: 'mistico', label: 'Místico', mugic: 2, tier: 'fraca',
      budget: { 1: 115, 2: 165, 3: 230 },
      weights: { courage: 0.26, power: 0.16, wisdom: 0.40, speed: 0.18 }
    }
  };

  /** Multiplicador de criatura RARA: +20% em baseSpeed e baseDamage. */
  var RARE_MULT = 1.2;

  /**
   * Escala de dano: `power` é o valor da CARTA (leitura do jogador); o dano que
   * a criatura aplica por golpe é power x multDano x DANO_SCALE. Sem isso um bruto
   * de mapa 3 tiraria mais vida num golpe do que tem de vida, e o combate acabaria
   * em 1 turno. Com 0,35 o bruto precisa de 3 a 4 golpes contra um alvo do mesmo porte.
   */
  var DANO_SCALE = 0.35;

  /** Perfil de spawn -> peso de sorteio (rara é rara de aparecer). */
  var SPAWN_WEIGHTS = { passiva: 34, agressiva: 26, 'rara-agressiva': 12 };

  // ------------------------------------------------------------
  // FÓRMULAS (fonte de verdade)
  // ------------------------------------------------------------

  /** Soma dos 4 atributos = "força bruta" da carta. */
  function statsTotal(stats) {
    return stats.courage + stats.power + stats.wisdom + stats.speed;
  }

  /**
   * Velocidade no mapa, em px/s.
   * A âncora é o MONSTER_WANDER_SPEED do jogo (155 px/s): no mapa 2 uma
   * criatura mediana fica em ~155. Rara = +20% (regra do balanceamento).
   */
  function rawSpeed(stats, mapLevel) {
    return [0, 118, 130, 145][mapLevel] + stats.speed * [0, 0.35, 0.45, 0.55][mapLevel];
  }
  function baseSpeedFrom(stats, mapLevel, isRare) {
    return Math.round(rawSpeed(stats, mapLevel) * (isRare ? RARE_MULT : 1));
  }

  /**
   * Dano físico. `power` é o valor da CARTA; baseDamage leva o fator de guerra
   * da tribo (UnderWorld bate mais forte) e, se for rara, +20%.
   */
  function rawDamage(stats, tribe) {
    var meta = TRIBE_META[tribe] || { multDano: 1 };
    return stats.power * meta.multDano * DANO_SCALE;
  }
  function baseDamageFrom(stats, mapLevel, isRare, tribe) {
    return Math.round(rawDamage(stats, tribe) * (isRare ? RARE_MULT : 1));
  }

  /** Recompensas (o jogo usa xp + faixa de bits). */
  function rewardsFrom(level, isRare) {
    var xp = Math.round(Math.pow(level, 1.6) * 3.2 * (isRare ? 2.2 : 1));
    return { xp: xp, bits: [Math.round(xp * 0.35), Math.round(xp * 0.9)] };
  }

  /** Qual é o tier de força de uma soma de stats (mapa -> faixas do orçamento). */
  function tierFromTotal(total, mapLevel) {
    var b = ARCHETYPES.bruto.budget[mapLevel];
    var eq = ARCHETYPES.equilibrado.budget[mapLevel];
    var mi = ARCHETYPES.mistico.budget[mapLevel];
    if (total >= (b + eq) / 2) return 'muito-forte';
    if (total >= (eq + mi) / 2) return 'mediana';
    return 'fraca';
  }

  var MUGIC_BY_TIER = { 'muito-forte': 0, 'mediana': 1, 'fraca': 2 };

  // ------------------------------------------------------------
  // MODELO
  // ------------------------------------------------------------

  /**
   * Creature — a carta.
   * @param {object} d dados crus (ver tools/gerar_banco.js e data/creatures.json)
   */
  function Creature(d) {
    d = d || {};
    var meta = TRIBE_META[d.tribe] || { id: '', cor: '#888888' };

    this.id = d.id || '';
    this.name = d.name || '';
    this.tribe = d.tribe || '';
    this.tribeId = meta.id;
    this.tribeColor = meta.cor;

    this.mapLevel = d.mapLevel || 1;          // 1 | 2 | 3
    this.level = d.level || 1;                // nível da criatura

    this.elements = (d.elements || []).slice(0, 2);
    this.elementKind = d.elementKind || 'principal';  // 'principal' | 'excecao' (lore)
    this.tint = d.tint || ELEMENT_COLORS[this.elements[0]] || '#888888';

    this.isAggressive = !!d.isAggressive;
    this.isRare = !!d.isRare;

    this.archetype = ARCHETYPES[d.archetype] ? d.archetype : 'equilibrado';
    this.stats = {
      courage: num(d.stats && d.stats.courage),   // HP máximo
      power: num(d.stats && d.stats.power),       // força / dano físico
      wisdom: num(d.stats && d.stats.wisdom),     // mana
      speed: num(d.stats && d.stats.speed)        // iniciativa / velocidade
    };
    this.mugicCounters = (typeof d.mugicCounters === 'number')
      ? d.mugicCounters
      : ARCHETYPES[this.archetype].mugic;

    this.ability = d.ability ? {
      name: d.ability.name, type: d.ability.type,
      manaCost: d.ability.manaCost, desc: d.ability.desc
    } : null;

    this.rewards = d.rewards || rewardsFrom(this.level, this.isRare);
    this.art = d.art || 'slime';   // sprite existente no jogo (integração futura)
    this.desc = d.desc || '';

    this.derive();
  }

  function num(v) { return (typeof v === 'number' && isFinite(v)) ? Math.round(v) : 0; }

  /** Recalcula tudo o que é derivado (chamado no construtor e ao mudar stats). */
  Creature.prototype.derive = function () {
    this.totalStats = statsTotal(this.stats);
    this.powerTier = tierFromTotal(this.totalStats, this.mapLevel);
    this.rarityMult = this.isRare ? RARE_MULT : 1;

    this.baseSpeed = baseSpeedFrom(this.stats, this.mapLevel, this.isRare);
    this.baseDamage = baseDamageFrom(this.stats, this.mapLevel, this.isRare, this.tribe);

    this.spawnProfile = this.isRare ? 'rara-agressiva' : (this.isAggressive ? 'agressiva' : 'passiva');
    this.spawnWeight = SPAWN_WEIGHTS[this.spawnProfile];

    // Bloco de combate pronto para o jogo
    this.runtime = {
      hp: this.stats.courage,
      atk: this.baseDamage,
      mana: this.stats.wisdom,
      initiative: this.stats.speed,
      moveSpeed: this.baseSpeed
    };
    // Bloco no formato do ENEMY_TYPES atual do jogo (integração drop-in)
    this.gameCompat = {
      name: this.name, hp: this.stats.courage, atk: this.baseDamage,
      xp: this.rewards.xp, bits: this.rewards.bits.slice(),
      level: this.level, art: this.art,
      isAggressive: this.isAggressive, isRare: this.isRare
    };
    return this;
  };

  /** JSON "de arquivo": base + derivados (tudo versionável e diffável). */
  Creature.prototype.toJSON = function () {
    return {
      id: this.id, name: this.name, tribe: this.tribe, tribeId: this.tribeId,
      mapLevel: this.mapLevel, level: this.level,
      elements: this.elements.slice(), elementKind: this.elementKind, tint: this.tint,
      isAggressive: this.isAggressive, isRare: this.isRare,
      archetype: this.archetype, powerTier: this.powerTier, mugicCounters: this.mugicCounters,
      stats: { courage: this.stats.courage, power: this.stats.power, wisdom: this.stats.wisdom, speed: this.stats.speed },
      totalStats: this.totalStats,
      baseSpeed: this.baseSpeed, baseDamage: this.baseDamage, rarityMult: this.rarityMult,
      ability: this.ability, rewards: this.rewards, art: this.art, desc: this.desc,
      spawnProfile: this.spawnProfile, spawnWeight: this.spawnWeight
    };
  };

  Creature.fromJSON = function (d) { return new Creature(d); };
  Creature.fromList = function (arr) { return (arr || []).map(function (d) { return new Creature(d); }); };

  /**
   * Validação de integridade da carta. Retorna [] quando está tudo ok.
   * É a mesma checagem que o validador do banco roda em lote.
   */
  Creature.prototype.validate = function () {
    var p = [];
    var self = this;
    if (!this.id) p.push('id vazio');
    if (!this.name) p.push('name vazio');
    if (TRIBES.indexOf(this.tribe) === -1) p.push('tribo inválida: ' + this.tribe);
    if (!MAPS[this.mapLevel]) p.push('mapLevel inválido: ' + this.mapLevel);
    if (this.elements.length < 1 || this.elements.length > 2) p.push('elements deve ter 1 ou 2 itens');
    this.elements.forEach(function (e) { if (ELEMENTS.indexOf(e) === -1) p.push('elemento inválido: ' + e); });
    if (this.elements.length === 2 && this.elements[0] === this.elements[1]) p.push('elementos repetidos');
    if (this.elementKind === 'excecao' && !this.elements.some(function (e) {
      return (TRIBE_META[self.tribe] || { excecao: [] }).excecao.indexOf(e) !== -1;
    })) p.push('criatura de exceção sem elemento de exceção');
    if (this.elementKind === 'principal' && this.elements.some(function (e) {
      return (TRIBE_META[self.tribe] || { principal: [] }).principal.indexOf(e) === -1;
    })) p.push('criatura principal com elemento fora da afinidade da tribo');

    Object.keys(this.stats).forEach(function (k) {
      if (!(self.stats[k] > 0)) p.push('stat inválido: ' + k + '=' + self.stats[k]);
    });

    var esperadoMugic = MUGIC_BY_TIER[this.powerTier];
    if (esperadoMugic !== undefined && this.mugicCounters !== esperadoMugic) {
      p.push('mugicCounters ' + this.mugicCounters + ' não bate com o tier ' + this.powerTier + ' (esperado ' + esperadoMugic + ')');
    }
    if (this.mugicCounters !== ARCHETYPES[this.archetype].mugic) {
      p.push('mugicCounters ' + this.mugicCounters + ' != arquétipo ' + this.archetype);
    }

    var vEsp = baseSpeedFrom(this.stats, this.mapLevel, this.isRare);
    if (this.baseSpeed !== vEsp) p.push('baseSpeed ' + this.baseSpeed + ' != fórmula (' + vEsp + ')');
    var dEsp = baseDamageFrom(this.stats, this.mapLevel, this.isRare, this.tribe);
    if (this.baseDamage !== dEsp) p.push('baseDamage ' + this.baseDamage + ' != fórmula (' + dEsp + ')');

    if (this.isRare && !this.isAggressive) p.push('criatura rara deve ser agressiva');
    if (this.mapLevel === 1 && this.isAggressive) p.push('mapa 1 é 100% passivo');

    var band = (MAPS[this.mapLevel] || {}).band;
    if (band && (this.level < band[0] || this.level > band[1])) {
      p.push('nível ' + this.level + ' fora da faixa do mapa ' + this.mapLevel + ' [' + band + ']');
    }
    if (!this.ability || !this.ability.name || !(this.ability.manaCost > 0)) p.push('habilidade inválida');
    if (!this.rewards || !(this.rewards.xp > 0) || !(this.rewards.bits && this.rewards.bits.length === 2)) p.push('recompensas inválidas');
    return p;
  };

  return {
    Creature: Creature,
    ELEMENTS: ELEMENTS,
    ELEMENT_COLORS: ELEMENT_COLORS,
    TRIBES: TRIBES,
    TRIBE_META: TRIBE_META,
    MAPS: MAPS,
    ARCHETYPES: ARCHETYPES,
    MUGIC_BY_TIER: MUGIC_BY_TIER,
    SPAWN_WEIGHTS: SPAWN_WEIGHTS,
    RARE_MULT: RARE_MULT,
    DANO_SCALE: DANO_SCALE,
    rawSpeed: rawSpeed,
    rawDamage: rawDamage,
    statsTotal: statsTotal,
    baseSpeedFrom: baseSpeedFrom,
    baseDamageFrom: baseDamageFrom,
    rewardsFrom: rewardsFrom,
    tierFromTotal: tierFromTotal
  };
});
