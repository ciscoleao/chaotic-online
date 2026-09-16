# -*- coding: utf-8 -*-
"""v2.26 / patch v163 — NPC MASTER na ILHA DOS DROMOS.

Pedido: "adicione um NPC MASTER no mapa da ILHA DOS DROMOS; ele vai ter opção de
dar 1 LV toda vez apertando +1 LV, também vai dar Bits apertando em +1000 bits,
vai dar um scan aleatório apertando em +1 SCAN, 1 equipamento de batalha apertando
em +1 equipamento e dando 1 mugic apertando em +1 mugic."

- NPC dourado na praça da Ilha dos Dromos, ao lado da entrada do Pátio Central.
  Fala pelo [E] (PC), pelo botão 👆 (celular) ou clicando nele.
- Painel com 5 botões, cada um dá o presente na hora:
    +1 LV · +1000 Bits · +1 Scan (criatura aleatória) · +1 Equipamento · +1 Mugic
- O Scan respeita o limite dos Scanners (100 cartas) e conta para o % do mapa da
  espécie sorteada, igual a um scan de verdade.
"""
import io, sys
ARQ = 'chaotic_idleworld_v123.html'
s = io.open(ARQ, encoding='utf-8').read()

def troca(velho, novo, rot):
    global s
    if s.count(velho) != 1:
        print('ABORTADO (%s): %d ocorrencia(s)' % (rot, s.count(velho))); sys.exit(1)
    s = s.replace(velho, novo, 1); print('ok: ' + rot)

# ---------- 1) textura do NPC (dourado) ----------
troca("""    for (let i = 0; i < NPCS_DATA.length; i++) { createTextureFromCanvas(this, 'npc_' + i, drawNPC, 32, 32, NPCS_DATA[i].color); }""",
"""    for (let i = 0; i < NPCS_DATA.length; i++) { createTextureFromCanvas(this, 'npc_' + i, drawNPC, 32, 32, NPCS_DATA[i].color); }
    createTextureFromCanvas(this, 'npc_master', drawNPC, 32, 32, '#ffd54f'); // v163 — NPC MASTER da Ilha dos Dromos (dourado)""",
'textura npc_master')

# ---------- 2) CSS do painel ----------
troca("""#clerk-panel.open { display: block; }""",
"""#clerk-panel.open { display: block; }
/* ===== v163 — NPC MASTER (Ilha dos Dromos) ===== */
#master-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(520px, 94vw); max-height: 88vh; overflow: auto; background: linear-gradient(180deg, #1c1808, #0e0c06); border: 2px solid #ffd54f; border-radius: 14px; z-index: 93; display: none; padding: 16px; box-shadow: 0 0 46px rgba(255,213,79,0.28); }
#master-panel.open { display: block; }
.mst-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.mst-head h3 { margin: 0; font-size: 15px; color: #ffd54f; letter-spacing: 1px; }
.mst-head .mst-x { margin-left: auto; background: #2a2410; border: 1px solid #6b5a20; color: #ffd54f; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-size: 14px; }
.mst-row { display: flex; align-items: center; gap: 10px; background: #15130a; border: 1px solid #3a3320; border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; }
.mst-ic { font-size: 20px; width: 26px; text-align: center; }
.mst-nm { flex: 1; color: #ffe9b0; font-size: 13px; font-weight: 700; }
.mst-sub { display: block; color: #8a8060; font-size: 10px; font-weight: 400; }
.mst-go { background: linear-gradient(180deg, #ffe9a8, #d4a72c); color: #241c06; border: none; border-radius: 9px; padding: 9px 14px; font-weight: 800; cursor: pointer; font-size: 12px; white-space: nowrap; font-family: monospace; }
.mst-go:hover { filter: brightness(1.12); }
.mst-msg { margin-top: 10px; font-size: 11px; color: #ffe9b0; background: rgba(255,213,79,0.08); border: 1px solid rgba(255,213,79,0.28); border-radius: 8px; padding: 8px 10px; min-height: 14px; line-height: 1.6; }
.mst-bits { margin-top: 8px; font-size: 10px; color: #8a8060; text-align: right; font-family: monospace; }""",
'CSS do painel do MASTER')

# ---------- 3) div do painel ----------
troca("""<div id="clerk-panel"></div>""",
"""<div id="clerk-panel"></div>
<div id="master-panel"></div>""",
'div do painel do MASTER')

# ---------- 4) funções do painel + os 5 presentes ----------
troca("""// ---- abrir/fechar ----
function openAuctionHouse() {""",
"""// ---- abrir/fechar ----
/* ============================================================
 * v163 — NPC MASTER (Ilha dos Dromos): entrega presentes
 * ============================================================ */
let masterMsg = '';
function openMasterPanel() {
  const el = document.getElementById('master-panel');
  if (!el) return;
  el.classList.add('open');
  masterRender();
}
function closeMasterPanel() {
  const el = document.getElementById('master-panel');
  if (el) el.classList.remove('open');
}
function masterRender() {
  const el = document.getElementById('master-panel');
  if (!el) return;
  const p = GameState.player;
  const linhas = [
    { ic: '⭐', nm: '+1 LV', sub: 'Sobe um nível agora (nível atual: ' + p.lvl + ')', fn: 'masterDarLv()' },
    { ic: '💠', nm: '+1000 Bits', sub: 'Carteira: ' + (p.bits || 0) + ' bits', fn: 'masterDarBits()' },
    { ic: '📡', nm: '+1 Scan', sub: 'Escaneia uma criatura aleatória de Perim', fn: 'masterDarScan()' },
    { ic: '⚔️', nm: '+1 Equipamento', sub: 'Um equipamento de batalha aleatório', fn: 'masterDarEquip()' },
    { ic: '🎵', nm: '+1 Mugic', sub: 'Um Mugic aleatório (toque para sentir o efeito)', fn: 'masterDarMugic()' }
  ];
  let html = '<div class="mst-head"><span style="font-size:22px">🏆</span><h3>MASTER DOS DROMOS</h3>' +
             '<button class="mst-x" onclick="closeMasterPanel()" title="Fechar">✕</button></div>';
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    html += '<div class="mst-row"><span class="mst-ic">' + l.ic + '</span>' +
            '<span class="mst-nm">' + l.nm + '<span class="mst-sub">' + l.sub + '</span></span>' +
            '<button class="mst-go" onclick="' + l.fn + '">' + l.nm + '</button></div>';
  }
  html += '<div class="mst-msg" id="master-msg">' + (masterMsg || 'Aperte um botão: o presente é seu na hora. Volte sempre que quiser.') + '</div>';
  html += '<div class="mst-bits">📡 Scanners: ' + (GameState.player.scannedCards ? GameState.player.scannedCards.length : 0) + '/100 cartas</div>';
  el.innerHTML = html;
}
function masterFechar(msg, tipo) {
  masterMsg = msg;
  try { updateTopBar(); } catch (e) {}
  try { renderScannerCardsUI(); } catch (e) {}
  try { updateInventoryUI(); } catch (e) {}
  try { saveGame(true); } catch (e) {}
  showNotif(msg.replace(/<[^>]*>/g, ''), tipo || 'success');
  masterRender();
}
// ⭐ +1 nível — mesma conta do level up normal (checkLevelUp)
function masterDarLv() {
  const p = GameState.player;
  p.lvl++;
  p.xpToNext = Math.floor(100 * Math.pow(1.2, p.lvl - 1));
  p.maxHp += 10; p.hp = getPlayerStats().maxHp; p.atk += 2; p.def += 1;
  masterFechar('⭐ Nível ' + p.lvl + '! +10 de vida, +2 de ataque e +1 de defesa.');
}
// 💠 +1000 bits
function masterDarBits() {
  const p = GameState.player;
  p.bits = (p.bits || 0) + 1000;
  masterFechar('💠 +1000 bits! Carteira: ' + p.bits + ' bits.');
}
// 📡 +1 scan de criatura aleatória (conta para o % do mapa dela, como um scan de verdade)
function masterDarScan() {
  const p = GameState.player;
  if (!p.scannedCards) p.scannedCards = [];
  if (p.scannedCards.length >= 100) { masterFechar('📡 Scanners cheios (100 cartas)! Nada foi guardado.', 'warning'); return; }
  const pool = ENEMY_TYPES.filter(function(t) { return !t.isBoss; });
  const t = pool[Math.floor(Math.random() * pool.length)];
  const card = generateRouletteCard(t); card.source = 'master';
  p.scannedCards.push(card);
  const reg = (t.regions && t.regions[0]) || GameState.currentRegion;
  if (reg) {
    if (!GameState.mapScan) GameState.mapScan = {};
    if (!GameState.mapScan[reg]) GameState.mapScan[reg] = {};
    GameState.mapScan[reg][t.name] = (GameState.mapScan[reg][t.name] || 0) + 1;
  }
  const regNome = (REGIONS.find(function(x) { return x.id === reg; }) || {}).name || reg;
  masterFechar('📡 Scan aleatório: <b>' + t.name + '</b> Lv.' + card.level + ' [' + card.rarityName + '] — guardado nos Scanners (' + regNome + ').');
}
// ⚔️ +1 equipamento de batalha
function masterDarEquip() {
  const p = GameState.player;
  if (!p.scannedCards) p.scannedCards = [];
  if (p.scannedCards.length >= 100) { masterFechar('⚔️ Scanners cheios (100 cartas)! Nada foi guardado.', 'warning'); return; }
  const eq = generateItem(Math.max(1, p.lvl));
  p.scannedCards.push(makeGearCard(eq));
  masterFechar('⚔️ Equipamento de batalha: <b>' + eq.name + '</b> [' + RARITIES[eq.rarity].name + '] — guardado nos Scanners.');
}
// 🎵 +1 mugic
function masterDarMugic() {
  const p = GameState.player;
  if (!p.scannedCards) p.scannedCards = [];
  if (p.scannedCards.length >= 100) { masterFechar('🎵 Scanners cheios (100 cartas)! Nada foi guardado.', 'warning'); return; }
  const def = MUGIC_DEFS[Math.floor(Math.random() * MUGIC_DEFS.length)];
  p.scannedCards.push(makeMugicCard(def.id));
  masterFechar('🎵 Mugic: ' + def.icon + ' <b>' + def.name + '</b> — guardado nos Scanners. ' + def.desc);
}
// ---- abrir/fechar ----
function openAuctionHouse() {""",
'funções do MASTER')

# ---------- 5) o NPC na Ilha dos Dromos ----------
troca("""    this.interactables.push({ x: cx, y: cy - 60, hint: centralHint, action: function() { self.enterCentral(); } });""",
"""    this.interactables.push({ x: cx, y: cy - 60, hint: centralHint, action: function() { self.enterCentral(); } });
    /* v163 — NPC MASTER: fica na praça, ao lado da entrada do Pátio Central.
     * Fala pelo [E] (PC), pelo 👆 (celular) ou clicando nele. */
    {
      const mx = cx + 300, my = cy + 40;
      self.add.ellipse(mx, my + 26, 76, 26, 0xffd54f, 0.16).setDepth(3); // pedestal
      const glowM = self.add.image(mx, my - 8, 'glow_soft').setDepth(4).setScale(1.6).setTint(0xffe28a).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      self.tweens.add({ targets: glowM, alpha: 0.26, duration: 1400, yoyo: true, repeat: -1 });
      const spriteM = self.add.sprite(mx, my, 'npc_master');
      spriteM.setDepth(7); spriteM.setScale(1.75);
      spriteM.setInteractive({ useHandCursor: true });
      spriteM.on('pointerdown', function() { openMasterPanel(); });
      self.add.text(mx, my - 50, 'MASTER', { fontSize: '11px', color: '#ffd54f', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(9).setShadow(1, 1, '#000', 2);
      const hintM = self.add.text(mx, my - 66, '[E] Falar com o MASTER', {
        fontSize: '10px', color: '#ffe9b0', fontFamily: 'monospace', fontStyle: 'bold',
        backgroundColor: 'rgba(20,24,16,0.85)', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(20).setVisible(false);
      self.interactables.push({ x: mx, y: my, hint: hintM, action: function() { openMasterPanel(); } });
      self.masterNpc163 = { x: mx, y: my };
    }""",
'NPC MASTER na Ilha dos Dromos')

# ---------- 6) changelog ----------
troca("""// - v162 — ITENS NO MAPA A 10%:""",
"""// - v163 — NPC MASTER NA ILHA DOS DROMOS: um NPC dourado na praça (ao lado da
//   entrada do Pátio Central) que fala pelo [E], pelo 👆 do celular ou clique.
//   O painel tem 5 botões, cada um entrega na hora: +1 LV, +1000 Bits, +1 Scan
//   (criatura aleatória de Perim, que também conta para o % do mapa dela), +1
//   Equipamento de batalha e +1 Mugic. Tudo respeita o limite dos Scanners (100).
// - v162 — ITENS NO MAPA A 10%:""",
'changelog v163')

io.open(ARQ, 'w', encoding='utf-8').write(s)
print('escrito: ' + ARQ)
