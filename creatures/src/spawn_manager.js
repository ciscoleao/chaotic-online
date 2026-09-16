/* ============================================================
 * Chaotic.IdleWorld — SPAWN MANAGER
 * src/spawn_manager.js
 * ------------------------------------------------------------
 * Dono das pools de monstros por (tribo, mapaLevel).
 * A matemática do mapa NÃO é configurável: ela vem de MAPS
 * (src/creature.js) e o banco é validado contra ela.
 *
 *   Mapa 1 (Nv.1)  ->  5 criaturas, 100% passivas
 *   Mapa 2 (Nv.10) -> 10 criaturas, 6 passivas + 4 agressivas (1 rara)
 *   Mapa 3 (Nv.20) -> 15 criaturas, 7 passivas + 8 agressivas (2 raras)
 *
 * Uso (Node):
 *   const { getMapSpawns, SpawnManager } = require('./src/spawn_manager.js');
 *   getMapSpawns('UnderWorld', 2);       // -> array com as 10 criaturas do mapa
 *
 * Uso (navegador): <script src="src/creature.js"></script>
 *                  <script src="src/creature_db.js"></script>
 *                  <script src="src/spawn_manager.js"></script>
 *                  window.ChaoticSpawn.getMapSpawns('UnderWorld', 2);
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./creature.js'), require('./creature_db.js'));
  } else {
    root.ChaoticSpawn = factory(root.ChaoticCreature, root.CreatureDB);
  }
})(typeof self !== 'undefined' ? self : this, function (ChaoticCreature, CreatureDB) {
  'use strict';

  var MAPS = ChaoticCreature.MAPS;
  var TRIBE_META = ChaoticCreature.TRIBE_META;
  var SPAWN_WEIGHTS = ChaoticCreature.SPAWN_WEIGHTS;

  // ----------------------------------------------------------
  // normalização de entrada (aceita 'uw', 'underworld', 'UnderWorld'...)
  // ----------------------------------------------------------
  function normalizarTribo(t) {
    if (!t) return null;
    var s = String(t).trim().toLowerCase();
    if (TRIBE_META[t]) return t;
    var achou = null;
    Object.keys(TRIBE_META).forEach(function (k) {
      if (k.toLowerCase() === s || TRIBE_META[k].id === s) achou = k;
    });
    return achou;
  }
  function normalizarMapa(m) {
    var n = parseInt(String(m).replace(/[^0-9]/g, ''), 10);
    return MAPS[n] ? n : null;
  }

  function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

  // ----------------------------------------------------------
  // SpawnManager
  // ----------------------------------------------------------
  /**
   * @param {object} db  banco (CreatureDB por padrão)
   * @param {function} rnd gerador aleatório injetável (testes usam um determinístico)
   */
  function SpawnManager(db, rnd) {
    this.db = db || CreatureDB;
    this.rnd = rnd || Math.random;
    if (!this.db || !this.db.all) throw new Error('SpawnManager: banco de criaturas ausente');
    this.pools = {};                       // cache: 'UnderWorld:2' -> array
    this._construirPools();
  }

  /** Monta as pools e confere a matemática de cada mapa/tribo. */
  SpawnManager.prototype._construirPools = function () {
    var self = this;
    Object.keys(TRIBE_META).forEach(function (tribe) {
      Object.keys(MAPS).map(Number).forEach(function (mapLevel) {
        var criaturas = self.db.byMap(tribe, mapLevel);
        var regra = MAPS[mapLevel];
        var passivas = criaturas.filter(function (c) { return !c.isAggressive; }).length;
        var agressivas = criaturas.filter(function (c) { return c.isAggressive; }).length;
        var raras = criaturas.filter(function (c) { return c.isRare; }).length;
        if (criaturas.length !== regra.slots || passivas !== regra.passive || agressivas !== regra.aggressive || raras !== regra.rare) {
          throw new Error('Pool fora da regra: ' + tribe + ' mapa ' + mapLevel
            + ' -> ' + criaturas.length + ' criaturas (esperado ' + regra.slots + '), '
            + passivas + ' passivas (esperado ' + regra.passive + '), '
            + agressivas + ' agressivas (esperado ' + regra.aggressive + '), '
            + raras + ' raras (esperado ' + regra.rare + ')');
        }
        self.pools[tribe + ':' + mapLevel] = criaturas.slice().sort(function (a, b) {
          if (a.level !== b.level) return a.level - b.level;      // curva dentro do mapa
          if (a.isRare !== b.isRare) return a.isRare ? 1 : -1;    // rara fica no fim (é o "chefão")
          return a.name.localeCompare(b.name);
        });
      });
    });
  };

  /** Configuração de spawn derivada do próprio pool (sem número mágico solto). */
  SpawnManager.prototype.getPoolSettings = function (tribe, mapLevel) {
    var pool = this.getMapSpawns(tribe, mapLevel);
    var agressivas = pool.filter(function (c) { return c.isAggressive; }).length;
    var raras = pool.filter(function (c) { return c.isRare; }).length;
    return {
      tribe: normalizarTribo(tribe), mapLevel: normalizarMapa(mapLevel),
      requiredLevel: MAPS[normalizarMapa(mapLevel)].requiredLevel,
      total: pool.length, passive: pool.length - agressivas, aggressive: agressivas, rare: raras,
      aggressiveRatio: agressivas / pool.length,        // mapa 2 = 0.40 · mapa 3 = 0.533
      rareChance: raras / pool.length,                  // mapa 2 = 0.10 · mapa 3 = 0.133
      maxLive: Math.round(pool.length * 0.6),           // teto de criaturas vivas por mapa
      elements: contarElementos(pool)
    };
  };

  /**
   * ⭐ FUNÇÃO PEDIDA: as criaturas que o mapa deve carregar.
   * @param {string} tribe     'OverWorld' | 'UnderWorld' | 'Danian' | 'Mipedian' (ou id)
   * @param {number} mapLevel  1 | 2 | 3
   * @param {object} [opt]     { only: 'passivas'|'agressivas'|'raras'|'nao-raras', element: 'Fogo' }
   * @returns {Array} lista de criaturas (cópias seguras) com metadados de spawn
   */
  SpawnManager.prototype.getMapSpawns = function (tribe, mapLevel, opt) {
    var t = normalizarTribo(tribe);
    var m = normalizarMapa(mapLevel);
    if (!t) throw new Error('getMapSpawns: tribo inválida "' + tribe + '" (use ' + Object.keys(TRIBE_META).join(', ') + ')');
    if (!m) throw new Error('getMapSpawns: mapa inválido "' + mapLevel + '" (use 1, 2 ou 3)');
    opt = opt || {};

    var pool = this.pools[t + ':' + m].map(clonar);
    if (opt.only === 'passivas') pool = pool.filter(function (c) { return !c.isAggressive; });
    else if (opt.only === 'agressivas') pool = pool.filter(function (c) { return c.isAggressive; });
    else if (opt.only === 'raras') pool = pool.filter(function (c) { return c.isRare; });
    else if (opt.only === 'nao-raras') pool = pool.filter(function (c) { return !c.isRare; });
    if (opt.element) pool = pool.filter(function (c) { return c.elements.indexOf(opt.element) !== -1; });

    return pool.map(function (c) {
      c.spawn = {
        profile: c.spawnProfile,
        weight: c.spawnWeight,
        mapRequiredLevel: MAPS[m].requiredLevel,
        tribeId: TRIBE_META[t].id
      };
      return c;
    });
  };

  /**
   * Sorteia UMA criatura respeitando os pesos (rara é 3x mais difícil de aparecer).
   * @param {object} [opt] { aggressive: true|false|null, allowRare: true|false }
   */
  SpawnManager.prototype.rollSpawn = function (tribe, mapLevel, opt) {
    opt = opt || {};
    var pool = this.getMapSpawns(tribe, mapLevel);
    if (opt.aggressive === true) pool = pool.filter(function (c) { return c.isAggressive; });
    if (opt.aggressive === false) pool = pool.filter(function (c) { return !c.isAggressive; });
    if (opt.allowRare === false) pool = pool.filter(function (c) { return !c.isRare; });
    if (!pool.length) return null;

    var total = pool.reduce(function (s, c) { return s + c.spawn.weight; }, 0);
    var sorteio = this.rnd() * total;
    for (var i = 0; i < pool.length; i++) {
      sorteio -= pool[i].spawn.weight;
      if (sorteio <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  /**
   * Sorteia uma leva (wave) para encher o mapa. Garante a proporção de agressivas
   * do próprio pool e nunca repete a MESMA criatura duas vezes na leva.
   * @param {number} count quantas criaturas subir de uma vez
   */
  SpawnManager.prototype.rollWave = function (tribe, mapLevel, count, opt) {
    opt = opt || {};
    var st = this.getPoolSettings(tribe, mapLevel);
    count = Math.max(0, Math.min(count || st.maxLive, st.total));
    var querAgressiva = [];
    for (var i = 0; i < count; i++) {
      var quer = (opt.aggressive === true) ? true
        : (opt.aggressive === false) ? false
        : (this.rnd() < st.aggressiveRatio);
      querAgressiva.push(quer);
    }
    var usados = {};
    var wave = [];
    for (var k = 0; k < querAgressiva.length; k++) {
      var c = this.rollSpawn(tribe, mapLevel, { aggressive: querAgressiva[k], allowRare: opt.allowRare !== false });
      if (!c) c = this.rollSpawn(tribe, mapLevel, {});
      if (!c) break;
      if (usados[c.id]) {                                   // já está na leva: tenta outro perfil
        var alt = this.rollSpawn(tribe, mapLevel, { aggressive: !querAgressiva[k] });
        if (alt && !usados[alt.id]) c = alt;
      }
      usados[c.id] = 1;
      wave.push(c);
    }
    return wave;
  };

  /** Texto pronto para log/tela de debug. */
  SpawnManager.prototype.describe = function (tribe, mapLevel) {
    var st = this.getPoolSettings(tribe, mapLevel);
    var linhas = [
      '══ ' + normalizarTribo(tribe) + ' · Mapa ' + st.mapLevel + ' (Nv.' + st.requiredLevel + ') ══',
      'criaturas: ' + st.total + '  (' + st.passive + ' passivas · ' + st.aggressive + ' agressivas · ' + st.rare + ' rara' + (st.rare === 1 ? '' : 's') + ')',
      'teto de vivas no mapa: ' + st.maxLive + ' · chance de agressiva: ' + Math.round(st.aggressiveRatio * 100) + '%',
      'elementos: ' + Object.keys(st.elements).map(function (e) { return e + ' ' + st.elements[e]; }).join(' · ')
    ];
    this.getMapSpawns(tribe, mapLevel).forEach(function (c) {
      var tags = [];
      if (c.isRare) tags.push('RARA');
      tags.push(c.isAggressive ? 'agressiva' : 'passiva');
      if (c.elementKind === 'excecao') tags.push('exceção de lore');
      linhas.push('  ' + c.name.padEnd(30)
        + ' Nv.' + String(c.level).padStart(2)
        + ' [' + c.elements.join('/') + '] '
        + 'COR ' + String(c.stats.courage).padStart(3)
        + ' POD ' + String(c.stats.power).padStart(3)
        + ' SAB ' + String(c.stats.wisdom).padStart(3)
        + ' VEL ' + String(c.stats.speed).padStart(3)
        + ' · mugic ' + c.mugicCounters
        + ' · v' + c.baseSpeed + 'px/s d' + c.baseDamage
        + ' · ' + tags.join(', '));
    });
    return linhas.join('\n');
  };

  function contarElementos(pool) {
    var out = {};
    pool.forEach(function (c) { c.elements.forEach(function (e) { out[e] = (out[e] || 0) + 1; }); });
    return out;
  }

  // ----------------------------------------------------------
  // ATALHOS (singleton) — a API "de uma linha" para o jogo
  // ----------------------------------------------------------
  var _instancia = null;
  function manager() { if (!_instancia) _instancia = new SpawnManager(CreatureDB); return _instancia; }

  /** ⭐ getMapSpawns(tribe, mapLevel) — a função pedida, pronta para o mapa atual. */
  function getMapSpawns(tribe, mapLevel, opt) { return manager().getMapSpawns(tribe, mapLevel, opt); }
  function getPoolSettings(tribe, mapLevel) { return manager().getPoolSettings(tribe, mapLevel); }
  function rollSpawn(tribe, mapLevel, opt) { return manager().rollSpawn(tribe, mapLevel, opt); }
  function rollWave(tribe, mapLevel, count, opt) { return manager().rollWave(tribe, mapLevel, count, opt); }
  function describe(tribe, mapLevel) { return manager().describe(tribe, mapLevel); }

  return {
    SpawnManager: SpawnManager,
    getMapSpawns: getMapSpawns,
    getPoolSettings: getPoolSettings,
    rollSpawn: rollSpawn,
    rollWave: rollWave,
    describe: describe,
    normalizarTribo: normalizarTribo,
    normalizarMapa: normalizarMapa
  };
});
