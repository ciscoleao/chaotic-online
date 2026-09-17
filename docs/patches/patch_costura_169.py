#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_costura_169.py — v2.32 (v169)
1) MATERIAIS POR NÍVEL: 15 materiais divididos em 3 tiers (5 cada).
   - Tiers 1/2 = os 10 materiais que já existiam;
   - Tier 3 = 5 materiais NOVOS (nomes das imagens de referência do autor);
   - os mapas de NÍVEL 1 das tribos só dropam tier 1, os de nível 2 só tier 2
     e os de nível 3 (e a Lagoa Negra) só tier 3.
2) CUSTO DO UPGRADE (como o autor definiu):
   upg1 = 5 tipos × 10 · upg2 = 5 × 20 · upg3 = 10 × 10 · upg4 = 10 × 20 ·
   upg5 = 15 × 10.
3) PAINEL DA COSTURA-11 repaginado no estilo holográfico da referência
   (mesa holográfica, mochila em wireframe com as conexões, cartões de material
   com barra de progresso, braços robóticos e console no rodapé).

Uso: python3 patch_costura_169.py [entrada] [saida]
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

# =====================================================================
# 1) OS 15 MATERIAIS (com TIER) — substitui o bloco GROUND_MATS
# =====================================================================
VELHO_MATS = """const GROUND_MATS = [
  { id: 'dractyl', name: 'Couro Escamoso de Dractyl', icon: '🟫', tex: 'gmat_dractyl', weight: 8, desc: 'Um material resistente ao calor e muito leve, ideal para formar a base e o corpo principal da mochila (inspirado nas criaturas aladas do Submundo).' },
  { id: 'teia', name: 'Teia Reforçada de Mandiblor', icon: '🕸️', tex: 'gmat_teia', weight: 10, desc: 'Fios extremamente grossos e pegajosos extraídos dos insetos Danians, perfeitos para serem usados como linha de costura indestrutível.' },
  { id: 'cipo', name: 'Cipó da Floresta da Vida', icon: '🌿', tex: 'gmat_cipo', weight: 12, desc: 'Uma corda natural verde e vibrante do Outro Mundo (OverWorld), excelente para trançar e criar as alças principais que vão nos ombros.' },
  { id: 'dente', name: 'Dente Lascado de um Magmon', icon: '🦷', tex: 'gmat_dente', weight: 9, desc: 'Um pedaço pontiagudo e avermelhado de rocha vulcânica, usado como um botão rústico ou fivela para fechar a aba principal da mochila.' },
  { id: 'fio', name: 'Fio da Túnica de Najarin', icon: '🧵', tex: 'gmat_fio', weight: 6, desc: 'Um item de raridade mágica. Usar este fio místico na costura interna concede um pequeno efeito de expansão de espaço, permitindo guardar mais itens do que o tamanho da mochila aparenta.' },
  { id: 'musgo', name: 'Musgo do Abismo Prexxor', icon: '🍃', tex: 'gmat_musgo', weight: 11, desc: 'Um musgo espesso e macio retirado de um dos lugares mais perigosos de Perim, servindo como o acolchoamento perfeito para as alças não machucarem os ombros do jogador.' },
  { id: 'cristal', name: 'Fragmento de Cristal do Monte Pillar', icon: '💠', tex: 'gmat_cristal', weight: 8, desc: 'Um pequeno cristal brilhante da montanha Danian que pode ser lapidado e usado como um fecho magnético ou zíper para os bolsos menores.' },
  { id: 'garra', name: 'Garra Caída de um Mipediano', icon: '🪝', tex: 'gmat_garra', weight: 7, desc: 'Uma garra afiada e levemente translúcida (devido aos poderes de invisibilidade da tribo), usada como um gancho externo na mochila para pendurar cantis ou cordas.' },
  { id: 'retalho', name: 'Retalho da Capa de Chaor', icon: '🌑', tex: 'gmat_retalho', weight: 5, desc: 'Um tecido escuro, imponente e quase impossível de rasgar. Exige coragem para ser obtido e serve para reforçar o fundo da mochila contra quedas e desgaste.' },
  { id: 'pena', name: 'Pena de um Phelpor', icon: '🪶', tex: 'gmat_pena', weight: 9, desc: 'Uma pena colorida e macia usada como um enfeite de zíper ou amuleto da sorte pendurado na lateral da mochila.' },
];"""

NOVO_MATS = """/* v169 — MATERIAIS POR NÍVEL DO MAPA (3 tiers de 5 tipos)
 * tier 1 → mapas de NÍVEL 1 das 4 tribos (Bosque, Cavernas de Brasas, Túneis do
 *          Monte Pillar, Oásis) · tier 2 → mapas de NÍVEL 2 · tier 3 → mapas de
 *          NÍVEL 3 (e a Lagoa Negra). O upgrade usa: 5×10 · 5×20 · 10×10 ·
 *          10×20 · 15×10 (níveis 1 a 5 da mochila). */
const GROUND_MATS = [
  // ---------- TIER 1 — MAPAS DE NÍVEL 1 ----------
  { id: 'dractyl', name: 'Couro Escamoso de Dractyl', icon: '🟫', tex: 'gmat_dractyl', tier: 1, weight: 10, desc: 'Um material resistente ao calor e muito leve, ideal para formar a base e o corpo principal da mochila (inspirado nas criaturas aladas do Submundo).' },
  { id: 'teia', name: 'Teia Reforçada de Mandiblor', icon: '🕸️', tex: 'gmat_teia', tier: 1, weight: 12, desc: 'Fios extremamente grossos e pegajosos extraídos dos insetos Danians, perfeitos para serem usados como linha de costura indestrutível.' },
  { id: 'cipo', name: 'Cipó da Floresta da Vida', icon: '🌿', tex: 'gmat_cipo', tier: 1, weight: 14, desc: 'Uma corda natural verde e vibrante do Outro Mundo (OverWorld), excelente para trançar e criar as alças principais que vão nos ombros.' },
  { id: 'dente', name: 'Dente Lascado de um Magmon', icon: '🦷', tex: 'gmat_dente', tier: 1, weight: 10, desc: 'Um pedaço pontiagudo e avermelhado de rocha vulcânica, usado como um botão rústico ou fivela para fechar a aba principal da mochila.' },
  { id: 'garra', name: 'Garra Caída de um Mipediano', icon: '🪝', tex: 'gmat_garra', tier: 1, weight: 9, desc: 'Uma garra afiada e levemente translúcida (devido aos poderes de invisibilidade da tribo), usada como um gancho externo na mochila para pendurar cantis ou cordas.' },
  // ---------- TIER 2 — MAPAS DE NÍVEL 2 ----------
  { id: 'cristal', name: 'Fragmento de Cristal do Monte Pillar', icon: '💠', tex: 'gmat_cristal', tier: 2, weight: 11, desc: 'Um pequeno cristal brilhante da montanha Danian que pode ser lapidado e usado como um fecho magnético ou zíper para os bolsos menores.' },
  { id: 'fio', name: 'Fio da Túnica de Najarin', icon: '🧵', tex: 'gmat_fio', tier: 2, weight: 9, desc: 'Um item de raridade mágica. Usar este fio místico na costura interna concede um pequeno efeito de expansão de espaço, permitindo guardar mais itens do que o tamanho da mochila aparenta.' },
  { id: 'musgo', name: 'Musgo do Abismo Prexxor', icon: '🍃', tex: 'gmat_musgo', tier: 2, weight: 12, desc: 'Um musgo espesso e macio retirado de um dos lugares mais perigosos de Perim, servindo como o acolchoamento perfeito para as alças não machucarem os ombros do jogador.' },
  { id: 'retalho', name: 'Retalho da Capa de Chaor', icon: '🌑', tex: 'gmat_retalho', tier: 2, weight: 8, desc: 'Um tecido escuro, imponente e quase impossível de rasgar. Exige coragem para ser obtido e serve para reforçar o fundo da mochila contra quedas e desgaste.' },
  { id: 'pena', name: 'Pena de um Phelpor', icon: '🪶', tex: 'gmat_pena', tier: 2, weight: 10, desc: 'Uma pena colorida e macia usada como um enfeite de zíper ou amuleto da sorte pendurado na lateral da mochila.' },
  // ---------- TIER 3 — MAPAS DE NÍVEL 3 (novos) ----------
  { id: 'gema', name: 'Gema Estelar', icon: '💎', tex: 'gmat_gema', tier: 3, weight: 10, desc: 'Uma gema que concentra a luz das estrelas de Perim. Serve de núcleo de energia para os bolsos maiores da mochila.' },
  { id: 'leviatha', name: 'Escama Brilhante de LeViathã', icon: '🐉', tex: 'gmat_leviatha', tier: 3, weight: 12, desc: 'Escama de uma das feras ancestrais das profundezas. Flexível como tecido e mais dura que aço — perfeita para o forro da mochila.' },
  { id: 'vulcano', name: 'Essência de Fogo de Vulcano', icon: '🔥', tex: 'gmat_vulcano', tier: 3, weight: 11, desc: 'Uma brasa líquida colhida no coração de um vulcão de Perim: a costura que leva esta essência nunca se rompe.' },
  { id: 'reator', name: 'Núcleo Pulsante de Reator', icon: '⚙️', tex: 'gmat_reator', tier: 3, weight: 9, desc: 'Um núcleo que pulsa como um coração mecânico. É ele que faz os bolsos extras “respirarem” e caberem mais itens.' },
  { id: 'fenix', name: 'Penas de Fênix Prismática', icon: '🪶', tex: 'gmat_fenix', tier: 3, weight: 8, desc: 'Penas que refletem todas as cores de Perim e se regeneram sozinhas — o toque final do Robô COSTURA-11.' },
];
function matsDoTier169(t) { return GROUND_MATS.filter(function (m) { return m.tier === t; }); }
function tierDaRegiao169(regionId) {
  const r = REGIONS.find(function (x) { return x.id === regionId; });
  const lv = r ? r.mapLevel : 1;
  if (lv >= 3) return 3;
  if (lv === 2) return 2;
  return 1;
}"""
troca('GROUND_MATS por tier', VELHO_MATS, NOVO_MATS)

# =====================================================================
# 2) SORTEIO POR REGIÃO (o material do chão depende do nível do mapa)
# =====================================================================
troca('rollGroundMat por região',
      """function rollGroundMat() {
  const total = GROUND_MATS.reduce(function(a, m) { return a + m.weight; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < GROUND_MATS.length; i++) { r -= GROUND_MATS[i].weight; if (r <= 0) return GROUND_MATS[i]; }
  return GROUND_MATS[0];
}""",
      """function rollGroundMat(regionId) {
  // v169 — o material do chão é do TIER da região (mapa 1 → tier 1, etc.)
  const reg = regionId || GameState.currentRegion;
  const pool = matsDoTier169(tierDaRegiao169(reg));
  const total = pool.reduce(function(a, m) { return a + m.weight; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= pool[i].weight; if (r <= 0) return pool[i]; }
  return pool[0];
}""")

troca('spawnMaterial usa a região',
      "      const gm = rollGroundMat();\n      let mx2, my2, tx2, ty2, att2 = 0;",
      "      const gm = rollGroundMat((this.region && this.region.id) || GameState.currentRegion); // v169 — tier do mapa\n      let mx2, my2, tx2, ty2, att2 = 0;")

troca('drop do scan usa a região',
      "    if (Math.random() < 0.6) {\n      const gm = rollGroundMat();",
      "    if (Math.random() < 0.6) {\n      const gm = rollGroundMat(GameState.currentRegion); // v169 — tier do mapa")

troca('recompensa da Drome = tier 3',
      "    for (let ri = 0; ri < 5; ri++) { const gm = rollGroundMat(); rewards.push(makeMatItem(gm.id, 1 + Math.floor(Math.random() * 2))); }",
      "    for (let ri = 0; ri < 5; ri++) { const gm = rollGroundMat('mp_mirage'); rewards.push(makeMatItem(gm.id, 1 + Math.floor(Math.random() * 2))); } // v169 — a Drome paga materiais do tier 3")

# =====================================================================
# 3) TEXTURAS DOS 5 MATERIAIS NOVOS
# =====================================================================
troca('draws novos',
      "    function drawGMatDractyl(ctx) { drawGroundMat(ctx, '#b5713d', '#8a4f28', 'couro'); }",
      """    function drawGMatGema(ctx) { drawGroundMat(ctx, '#7fe9ff', '#3f6fc4', 'cristal'); }
    function drawGMatLeviatha(ctx) { drawGroundMat(ctx, '#4fd8c8', '#1f7a72', 'couro'); }
    function drawGMatVulcano(ctx) { drawGroundMat(ctx, '#ff8a3a', '#c8451a', 'dente'); }
    function drawGMatReator(ctx) { drawGroundMat(ctx, '#e07fff', '#7a2fa8', 'fio'); }
    function drawGMatFenix(ctx) { drawGroundMat(ctx, '#ffb3d1', '#e05c8a', 'pena'); }
    function drawGMatDractyl(ctx) { drawGroundMat(ctx, '#b5713d', '#8a4f28', 'couro'); }""")

troca('texturas novas',
      "    createTextureFromCanvas(this, 'gmat_dractyl', drawGMatDractyl, 32, 32);",
      """    createTextureFromCanvas(this, 'gmat_gema', drawGMatGema, 32, 32);
    createTextureFromCanvas(this, 'gmat_leviatha', drawGMatLeviatha, 32, 32);
    createTextureFromCanvas(this, 'gmat_vulcano', drawGMatVulcano, 32, 32);
    createTextureFromCanvas(this, 'gmat_reator', drawGMatReator, 32, 32);
    createTextureFromCanvas(this, 'gmat_fenix', drawGMatFenix, 32, 32);
    createTextureFromCanvas(this, 'gmat_dractyl', drawGMatDractyl, 32, 32);""")

# =====================================================================
# 4) CUSTO DO UPGRADE (5×10 · 5×20 · 10×10 · 10×20 · 15×10)
# =====================================================================
troca('upgradeCost',
      """function upgradeCost() {
  return GROUND_MATS.map(function(m) { return { matId: m.id, qty: 1 }; });
}""",
      """function upgradeCost(lvlForcado) {
  // v169 — custo por nível da mochila: 5 tipos ×10 · 5 ×20 · 10 ×10 · 10 ×20 · 15 ×10
  const lvl = (typeof lvlForcado === 'number') ? lvlForcado : (GameState.player.backpackLvl || 0);
  const tabela = [
    { tiers: [1], q: 10 }, { tiers: [1], q: 20 }, { tiers: [1, 2], q: 10 },
    { tiers: [1, 2], q: 20 }, { tiers: [1, 2, 3], q: 10 },
  ];
  const t = tabela[Math.max(0, Math.min(4, lvl))];
  let out = [];
  for (let i = 0; i < t.tiers.length; i++) {
    const mats = matsDoTier169(t.tiers[i]);
    for (let j = 0; j < mats.length; j++) out.push({ matId: mats[j].id, qty: t.q });
  }
  return out;
}
function upgradeMatsDoNivel169(lvlForcado) { // quais TIERS o próximo upgrade pede (para a tela)
  const lvl = (typeof lvlForcado === 'number') ? lvlForcado : (GameState.player.backpackLvl || 0);
  return [[1], [1], [1, 2], [1, 2], [1, 2, 3]][Math.max(0, Math.min(4, lvl))];
}""")

# =====================================================================
# 5) O PAINEL NOVO (CSS holográfico)
# =====================================================================
CSS = """/* ============================================================
   v169 — COSTURA-11 (mesa holográfica). Só o painel de UPGRADE usa estas
   classes: o painel do FORJA-7 (craft de chave) continua no layout antigo.
   ============================================================ */
#clerk-panel.ck169 { background: transparent; border: none; box-shadow: none; width: min(960px, 97vw); max-height: 94vh; overflow: visible; padding: 0; }
.ck169-shell { position: relative; overflow: auto; max-height: 92vh; padding: 16px 18px 0; background: linear-gradient(165deg, #0d2230, #071620 55%, #061019); clip-path: polygon(30px 0, calc(100% - 30px) 0, 100% 30px, 100% calc(100% - 30px), calc(100% - 30px) 100%, 30px 100%, 0 calc(100% - 30px), 0 30px); box-shadow: 0 0 44px rgba(0,0,0,0.8), inset 0 0 90px rgba(20,120,150,0.22); }
.ck169-shell::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(180deg, rgba(140,240,255,0.045) 0 1px, transparent 1px 4px); mix-blend-mode: screen; }
.ck169-shell::before { content: ''; position: absolute; inset: 3px; pointer-events: none; border: 2px solid rgba(96,226,245,0.55); clip-path: polygon(28px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 28px), calc(100% - 28px) 100%, 28px 100%, 0 calc(100% - 28px), 0 28px); box-shadow: inset 0 0 40px rgba(70,220,240,0.12); }
.ck169-top { display: flex; align-items: flex-start; gap: 14px; position: relative; z-index: 3; }
.ck169-av { width: 76px; height: 76px; flex-shrink: 0; border-radius: 50%; border: 3px solid rgba(96,226,245,0.75); background: radial-gradient(circle at 38% 30%, #123a4a, #061219); display: flex; align-items: center; justify-content: center; font-size: 38px; box-shadow: 0 0 22px rgba(80,220,240,0.45), inset 0 0 18px rgba(80,220,240,0.25); animation: ck169Pulse 2.6s ease-in-out infinite; }
@keyframes ck169Pulse { 0%,100% { box-shadow: 0 0 18px rgba(80,220,240,0.35), inset 0 0 16px rgba(80,220,240,0.2); } 50% { box-shadow: 0 0 30px rgba(80,220,240,0.6), inset 0 0 22px rgba(80,220,240,0.3); } }
.ck169-title { font-family: Georgia, 'Times New Roman', serif; font-size: 19px; font-weight: 800; color: #8ef3ff; letter-spacing: 1px; text-shadow: 0 0 12px rgba(96,226,245,0.5); }
.ck169-title span { font-size: 11px; opacity: 0.8; margin-left: 6px; }
.ck169-sub { font-size: 12px; color: #e6fbff; margin-top: 4px; letter-spacing: 0.5px; }
.ck169-sub b { color: #ffd54f; }
.ck169-note { font-size: 10.5px; color: #a9d8e4; line-height: 1.5; margin-top: 5px; max-width: 620px; font-style: italic; }
.ck169-x { margin-left: auto; width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(96,226,245,0.5); background: rgba(8,26,34,0.8); color: #9fe8f5; font-size: 14px; cursor: pointer; }
.ck169-x:hover { border-color: #8ef3ff; color: #fff; }
.ck169-stage { position: relative; display: grid; grid-template-columns: 1fr 190px 1fr; gap: 8px; align-items: center; margin: 12px 0 0; padding-bottom: 8px; z-index: 3; }
.ck169-wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ck169-col { display: flex; flex-direction: column; gap: 7px; }
.ck169-slot { display: flex; align-items: center; gap: 8px; background: rgba(7,26,34,0.78); border: 1px solid rgba(96,226,245,0.5); border-radius: 10px; padding: 5px 8px; box-shadow: inset 0 0 14px rgba(60,200,230,0.12); }
.ck169-slot.no { border-color: rgba(224,110,130,0.5); }
.ck169-slot.ok { border-color: rgba(140,240,170,0.55); }
.ck169-ico { width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; border: 1px solid rgba(96,226,245,0.55); background: rgba(3,16,22,0.9); display: flex; align-items: center; justify-content: center; font-size: 15px; }
.ck169-mid { flex: 1; min-width: 0; }
.ck169-bottom .ck169-sname { font-size: 9px; }
.ck169-bottom .ck169-num { min-width: 34px; font-size: 9.5px; }
.ck169-bottom .ck169-ico { width: 24px; height: 24px; font-size: 12px; }
.ck169-sname { font-size: 10px; color: #e2f8ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
.ck169-bar { height: 8px; border-radius: 4px; background: rgba(3,14,20,0.95); border: 1px solid rgba(96,226,245,0.3); overflow: hidden; }
.ck169-bar i { display: block; height: 100%; background: linear-gradient(180deg, #9ef07a, #45b144); transition: width 0.25s; }
.ck169-slot.no .ck169-bar i { background: linear-gradient(180deg, #8fd8f0, #367f9e); }
.ck169-num { font-size: 10.5px; font-weight: 800; font-family: monospace; color: #8ff0a8; min-width: 42px; text-align: right; }
.ck169-slot.no .ck169-num { color: #ff9aa6; }
.ck169-pack { display: flex; align-items: center; justify-content: center; }
.ck169-pack svg { filter: drop-shadow(0 0 12px rgba(96,226,245,0.5)); animation: ck169Float 3.4s ease-in-out infinite; }
@keyframes ck169Float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.ck169-bottom { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 7px; margin: 2px 0 10px; position: relative; z-index: 3; }
.ck169-desk { display: flex; align-items: center; gap: 12px; margin: 4px -18px 0; padding: 10px 18px 12px; background: linear-gradient(180deg, #12313c, #071720); border-top: 2px solid rgba(96,226,245,0.4); position: relative; z-index: 3; }
.ck169-arm { width: 74px; height: 46px; flex-shrink: 0; }
.ck169-desk-mid { flex: 1; text-align: center; }
.ck169-badge { display: inline-block; font-size: 10px; letter-spacing: 1px; color: #bff6ff; border: 1px solid rgba(96,226,245,0.5); border-radius: 20px; padding: 3px 12px; margin-bottom: 7px; background: rgba(8,30,40,0.7); }
.ck169-go { border: 2px solid #56e0f5; border-radius: 10px; background: linear-gradient(180deg, #0e5a6a, #083740); color: #ccf8ff; font-weight: 800; font-size: 13px; letter-spacing: 1px; padding: 10px 26px; cursor: pointer; box-shadow: 0 0 20px rgba(80,220,240,0.35); }
.ck169-go:hover:not(:disabled) { background: linear-gradient(180deg, #12768c, #0a4c5c); color: #fff; }
.ck169-go:disabled { filter: grayscale(0.85); opacity: 0.55; cursor: not-allowed; box-shadow: none; }
.ck169-max { color: #9ef07a; font-size: 12px; font-weight: 800; letter-spacing: 1px; }
.ck169-tip { font-size: 10px; color: #9fd8e4; margin-top: 6px; }
@media (max-width: 720px) {
  .ck169-bottom { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ck169-stage { grid-template-columns: 1fr; }
  .ck169-pack { display: none; }
  .ck169-col.right { order: 2; }
}
</style>"""
troca('css costura', '</style>', CSS)

# =====================================================================
# 6) RENDER DO PAINEL (upgrade mode)
# =====================================================================
VELHO_RENDER = """  if (clerkMode === 'upgrade') {
    const canUp = lvl < 5 && upgradeCost().every(function(r) { return countMat(r.matId) >= r.qty; }) && p.bits >= upgradeBits();
    let upHtml = '';
    if (lvl >= 5) upHtml = '<div class="shop-info" style="color:#7ec850;">✓ Mochila no upgrade máximo (+10 slots)!</div>';
    else {
      for (let i = 0; i < GROUND_MATS.length; i++) {
        const gm = GROUND_MATS[i];
        upHtml += '<div class="ck-row ' + (countMat(gm.id) >= 1 ? 'ok' : 'no') + '"><span>' + gm.icon + '</span><span style="flex:1">' + gm.name + '</span><b style="color:' + (countMat(gm.id) >= 1 ? '#7ec850' : '#ff8fa3') + '">' + countMat(gm.id) + '/1</b></div>';
      }
    }
    head = '<div class="dp-head"><div class="dp-avatar" style="color:#53a7e8">🤖</div>'
      + '<div><div class="dp-name" style="color:#53a7e8">Robô COSTURA-11</div><div class="dp-title">Unidade de Costura do Pátio — Upgrade de Mochila</div></div>'
      + '<button class="ah-close" style="margin-left:auto;" onclick="closeClerkPanel()">✕</button></div>'
      + '<div class="dp-lore">“Costuro bolsos extras em qualquer mochila! Traga 1 unidade de cada material de Perim. Aceito da mochila OU do Depósito.”</div>'
      + '<div class="dp-sec">🎒 UPGRADE DA MOCHILA — nível ' + lvl + '/5 · slots ' + getBackpackMax() + '</div>'
      + '<div class="ah-sub" style="margin-bottom:6px;">Cada upgrade: +2 slots · 1 unidade de cada material + 💠 ' + upgradeBits() + ' bits</div>'
      + upHtml
      + (lvl < 5 ? '<button class="ck-go up" ' + (canUp ? '' : 'disabled') + ' onclick="upgradeBackpack()">🧵 FAZER UPGRADE (+2 slots · 💠 ' + upgradeBits() + ')</button>' : '');
  } else {"""

NOVO_RENDER = """  if (clerkMode === 'upgrade') {
    /* v169 — PAINEL NOVO (mesa holográfica da referência do autor) */
    el.classList.add('ck169');
    const maxed = lvl >= 5;
    const custo = upgradeCost(lvl);                 // tiers + quantidades do PRÓXIMO upgrade
    const tiers = upgradeMatsDoNivel169(lvl);
    const temTudo = custo.every(function (r) { return countMat(r.matId) >= r.qty; });
    const canUp = !maxed && temTudo && p.bits >= upgradeBits();
    const qNow = maxed ? 0 : custo[0].qty;
    const nomesTier = function (tt) { return tt.join(' + '); };
    const rotuloTier = function (t) {
      return t === 1 ? 'MAPAS 1' : t === 2 ? 'MAPAS 2' : 'MAPAS 3';
    };
    // cartões de material (esquerda / direita) + fios de conexão
    let esq = '', dir = '', baixo = '', fios = '';
    const total = custo.length;
    const faixa = total > 10 ? 3 : 2;                 // v169 — com 15 materiais: 5 em cima/5 nos lados/5 embaixo
    const meio = Math.ceil(total / faixa);
    const nEsq = meio, nDir = Math.min(meio, total - meio), nBaixo = Math.max(0, total - meio - nDir);
    const linhas = Math.max(nEsq, nDir, 1);
    // v169 — a altura do desenho acompanha a quantidade de cartões (nível 5 = 15)
    const altSVG = Math.max(300, 34 + linhas * 48);
    const passo = linhas > 1 ? (altSVG - 68) / (linhas - 1) : 0;
    const yDe = function (i) { return Math.round(34 + i * passo); };
    for (let i = 0; i < total; i++) {
      const r = custo[i];
      const gm = getGroundMat(r.matId);
      const tem = countMat(r.matId);
      const pct = Math.max(0, Math.min(100, Math.round((tem / r.qty) * 100)));
      const card = '<div class="ck169-slot ' + (tem >= r.qty ? 'ok' : 'no') + '">'
        + '<div class="ck169-ico">' + gm.icon + '</div>'
        + '<div class="ck169-mid"><div class="ck169-sname">' + gm.name + '</div>'
        + '<div class="ck169-bar"><i style="width:' + pct + '%"></i></div></div>'
        + '<div class="ck169-num">' + tem + '/' + r.qty + '</div></div>';
      const fio = function (d) {
        return '<path d="' + d + '" fill="none" stroke="rgba(96,226,245,0.18)" stroke-width="7"/>'
             + '<path d="' + d + '" fill="none" stroke="rgba(140,240,255,0.75)" stroke-width="2.2"/>';
      };
      if (i >= meio + nDir) { baixo += card; }          // fila de baixo (nível máximo)
      else if (i < meio) {   // lado esquerdo: sai do cartão e vai em LEQUE até a mochila
        esq += card;
        const y1 = yDe(i), y2 = Math.round(altSVG / 2 + (i - (nEsq - 1) / 2) * 16);
        fios += fio('M 232 ' + y1 + ' C 305 ' + y1 + ', 335 ' + y2 + ', 396 ' + y2);
      } else {          // lado direito: sai da mochila e vai em LEQUE até o cartão
        const j = i - meio;
        dir += card;
        const y1 = yDe(j), y2 = Math.round(altSVG / 2 + (j - (nDir - 1) / 2) * 16);
        fios += fio('M 668 ' + y1 + ' C 595 ' + y1 + ', 565 ' + y2 + ', 504 ' + y2);
      }
    }
    const packSvg = '<svg width="176" height="186" viewBox="0 0 176 186">'
      + '<g fill="rgba(96,226,245,0.10)" stroke="#8ef3ff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">'
      + '<rect x="42" y="42" width="92" height="118" rx="12"/>'          // corpo
      + '<path d="M42 74 q46 -34 92 0" fill="rgba(96,226,245,0.16)"/>'  // aba
      + '<rect x="60" y="86" width="56" height="34" rx="7"/>'           // bolso central
      + '<rect x="70" y="126" width="36" height="22" rx="6"/>'          // bolso baixo
      + '<path d="M70 42 q-14 -26 -22 -30"/>'                           // alça esquerda
      + '<path d="M106 42 q14 -26 22 -30"/>'                            // alça direita
      + '<path d="M52 60 q-16 4 -18 22"/>'                              // bolso lateral esq
      + '<path d="M124 60 q16 4 18 22"/>'                               // bolso lateral dir
      + '<circle cx="88" cy="103" r="4" fill="#8ef3ff" stroke="none"/>'
      + '<path d="M46 70 q42 -30 84 0" fill="none" stroke="rgba(140,240,255,0.5)" stroke-width="1.6" stroke-dasharray="4 4"/>'
      + '<path d="M48 96 q-10 6 -8 24 M128 96 q10 6 8 24" fill="none" stroke="rgba(140,240,255,0.45)" stroke-width="1.6" stroke-dasharray="3 4"/>'
      + '<circle cx="66" cy="80" r="2.4" fill="#8ef3ff" stroke="none"/><circle cx="110" cy="80" r="2.4" fill="#8ef3ff" stroke="none"/>'
      + '</g></svg>';
    const armSvg = '<svg viewBox="0 0 74 46" width="74" height="46"><g stroke="#4fd0e8" stroke-width="3" fill="none" stroke-linecap="round">'
      + '<path d="M6 42 L18 26 L34 30"/><path d="M34 30 L48 16"/><path d="M48 16 L62 22"/></g>'
      + '<circle cx="62" cy="22" r="4" fill="#8ef3ff"/><circle cx="6" cy="42" r="5" fill="rgba(96,226,245,0.35)" stroke="#4fd0e8" stroke-width="2"/></svg>';
    body = '<div class="ck169-shell">'
      + '<div class="ck169-top">'
      +   '<div class="ck169-av">🤖</div>'
      +   '<div style="flex:1">'
      +     '<div class="ck169-title">ROBÔ COSTURA-11 <span>v.3</span></div>'
      +     '<div class="ck169-sub">🎒 UPGRADE DA MOCHILA — nível <b>' + lvl + '/5</b> · slots <b>' + getBackpackMax() + '</b></div>'
      +     '<div class="ck169-note">“Costuro bolsos extras em qualquer mochila! Traga os materiais do nível certo de Perim — os mapas de ' + (maxed ? 'nível 3' : rotuloTier(tiers[0]).toLowerCase()) + (tiers.length > 1 ? ' + ' + rotuloTier(tiers[tiers.length - 1]).toLowerCase() : '') + ' têm os materiais que eu preciso. Aceito da mochila OU do Depósito.”</div>'
      +   '</div>'
      +   '<button class="ck169-x" onclick="closeClerkPanel()">✕</button>'
      + '</div>'
      + '<div class="ck169-stage">'
      +   '<svg class="ck169-wires" viewBox="0 0 900 ' + altSVG + '" preserveAspectRatio="none">' + fios + '</svg>'
      +   '<div class="ck169-col left">' + esq + '</div>'
      +   '<div class="ck169-pack">' + packSvg + '</div>'
      +   '<div class="ck169-col right">' + dir + '</div>'
      + '</div>'
      + (baixo ? '<div class="ck169-bottom">' + baixo + '</div>' : '')
      + '<div class="ck169-desk"><div class="ck169-arm">' + armSvg + '</div>'
      +   '<div class="ck169-desk-mid">'
      +     '<div class="ck169-badge">' + (maxed ? 'NÍVEL MÁXIMO — TODOS OS BOLSOS COSTURADOS' : 'UPGRADE ' + (lvl + 1) + '/5 — ' + custo.length + ' TIPOS DE ' + qNow + ' · ' + rotuloTier(tiers[0]) + (tiers.length > 1 ? ' + ' + rotuloTier(tiers[tiers.length - 1]) : '')) + ' · 💠 ' + upgradeBits() + ' bits</div><br>'
      +     (maxed
              ? '<span class="ck169-max">✓ MOCHILA NO MÁXIMO — ' + getBackpackMax() + ' slots</span><div class="ck169-tip">O COSTURA-11 já costurou todos os bolsos possíveis. Bom proveito, Caçador!</div>'
              : '<button class="ck169-go" ' + (canUp ? '' : 'disabled') + ' onclick="upgradeBackpack()">🧵 FAZER UPGRADE (+2 slots)</button>'
                + '<div class="ck169-tip">' + (temTudo ? (p.bits >= upgradeBits() ? 'Materiais ok! É só apertar.' : 'Faltam 💠 ' + (upgradeBits() - p.bits) + ' bits.') : 'Faltam materiais — os cartões em vermelho mostram quanto.') + '</div>')
      +   '</div><div class="ck169-arm">' + armSvg + '</div></div>'
      + '</div>';
    head = '';
  } else {"""
troca('render do painel', VELHO_RENDER, NOVO_RENDER)

# fecha: tira a classe ck169 quando NÃO for upgrade + mensagem nova
troca('classe condicional',
      "function clerkRender() {\n  const el = document.getElementById('clerk-panel');\n  if (!el) return;",
      "function clerkRender() {\n  const el = document.getElementById('clerk-panel');\n  if (!el) return;\n  if (clerkMode !== 'upgrade') el.classList.remove('ck169'); // v169 — só o painel do COSTURA usa o layout holográfico")

troca('mensagem de materiais',
      "if (!removeMats(upgradeCost())) { showNotif('Materiais insuficientes! Colete os 10 itens em Perim.', 'warning'); clerkRender(); return; }",
      "if (!removeMats(upgradeCost())) { showNotif('Materiais insuficientes! Colete os itens nos mapas do nível certo de Perim.', 'warning'); clerkRender(); return; } // v169")

# =====================================================================
# 7) TÍTULO + CHANGELOG
# =====================================================================
troca('titulo',
      "<title>Chaotic.idleWorld v2.31 — Ícone de TERRA virou montanha ⛰️</title>",
      "<title>Chaotic.idleWorld v2.32 — Materiais por nível + COSTURA-11 holográfica</title>")

CHANGELOG = """// ============================================================
// CHAOTIC.IDLEWORLD v2.32 — CHANGELOG (v169 Materiais por nível + Costura nova)
// - v169 — MATERIAIS POR NÍVEL: 15 materiais em 3 tiers de 5. Os mapas de NÍVEL 1
//   das tribos só dropam o tier 1; os de NÍVEL 2 só o tier 2; os de NÍVEL 3 (e a
//   Lagoa Negra) só o tier 3. O tier 3 são 5 materiais NOVOS (Gema Estelar,
//   Escama Brilhante de LeViathã, Essência de Fogo de Vulcano, Núcleo Pulsante de
//   Reator e Penas de Fênix Prismática). A Drome paga materiais do tier 3.
// - v169 — CUSTO DO UPGRADE DA MOCHILA: nível 1 = 5 tipos ×10 · nível 2 = 5 ×20 ·
//   nível 3 = 10 ×10 · nível 4 = 10 ×20 · nível 5 = 15 ×10 (antes: 1 unidade de
//   cada um dos 10 materiais em todo upgrade).
// - v169 — PAINEL DO COSTURA-11 REPAGINADO (mesa holográfica): mochila em
//   wireframe com as conexões, cartões de material com barra de progresso,
//   braços robóticos e console no rodapé, com o nível, os slots e os bits.
"""
troca('changelog',
      "// ============================================================\n// CHAOTIC.IDLEWORLD v2.31 — CHANGELOG",
      CHANGELOG + "// ============================================================\n// CHAOTIC.IDLEWORLD v2.31 — CHANGELOG")

io.open(SAIDA, 'w', encoding='utf-8').write(s)
print('✅ v2.32 aplicado em %s (%d B -> %d B)' % (os.path.basename(SAIDA), antes, len(s)))
for t in trocas:
    print('   ·', t)
