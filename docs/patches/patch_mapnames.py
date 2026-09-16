#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v151 — CORREÇÃO DOS NOMES DE MAPA (Chaotic.IdleWorld)
Antes: o HUD do topo (#map-name) traduzia GameState.location ('perim')
direto para o texto fixo "Perim", então TODOS os mapas apareciam como
"Perim". Agora o nome vem da região atual (REGIONS[].name) por uma única
função (placeName151), usada no topo, no Scanner, no minimapa e num
banner de entrada de mapa.
"""
import io, sys, shutil, os

SRC = '/home/user/uploads/chaotic_idleworld_v123.html'
DST = '/home/user/chaotic_idleworld_v123.html'

src = io.open(SRC, 'r', encoding='utf-8').read()
d = src
report = []

def sub(name, old, new, expect=1):
    global d
    n = d.count(old)
    if n != expect:
        print('!! [%s] encontrou %d ocorrencia(s) (esperado %d)' % (name, n, expect))
        sys.exit(1)
    d = d.replace(old, new)
    report.append((name, n))

# ---------------------------------------------------------------- P1: CSS
sub('P1-CSS', """/* Nome do mapa centralizado */
#map-name { position: absolute; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 800; color: #d4cfa8; text-shadow: 0 2px 4px rgba(0,0,0,0.8); letter-spacing: 1px; pointer-events: none; }
""", """/* v151 — NOME DO MAPA ATUAL (topo): nome do mapa + linha fina com tribo/progresso */
#map-label { position: absolute; left: 50%; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 1px; pointer-events: none; max-width: 54vw; }
#map-name { font-size: 14px; font-weight: 800; color: #d4cfa8; text-shadow: 0 2px 4px rgba(0,0,0,0.8); letter-spacing: 1px; pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 54vw; }
#map-sub { font-size: 9px; font-weight: 700; color: #8be2ff; text-shadow: 0 1px 3px rgba(0,0,0,0.9); letter-spacing: 1px; pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 54vw; }
/* v151 — banner que anuncia o nome do mapa ao entrar nele */
#map-banner-151 { position: absolute; top: 62px; left: 50%; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 24px; background: linear-gradient(180deg, rgba(6,12,24,0.92), rgba(6,12,24,0.62)); border: 1px solid rgba(139,226,255,0.42); border-radius: 10px; box-shadow: 0 6px 22px rgba(0,0,0,0.6); pointer-events: none; z-index: 30; animation: mb151in 2.6s ease forwards; }
.mb151-name { font-size: 19px; font-weight: 800; color: #eaf3ff; letter-spacing: 2px; text-shadow: 0 2px 6px rgba(0,0,0,0.9); white-space: nowrap; }
.mb151-sub { font-size: 10px; font-weight: 700; color: #8be2ff; letter-spacing: 1.4px; text-transform: uppercase; white-space: nowrap; }
@keyframes mb151in {
  0%   { opacity: 0; transform: translate(-50%, -12px) scale(0.96); }
  12%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
  78%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -8px) scale(0.99); }
}
""")

# ---------------------------------------------------------------- P2: HTML
sub('P2-HTML', """    <!-- Nome do mapa centralizado -->
    <div id="map-name">Pátio Central</div>
""", """    <!-- v151 — nome do MAPA ATUAL (antes ficava fixo em "Perim") + tribo/progresso -->
    <div id="map-label">
      <div id="map-name">Pátio Central</div>
      <div id="map-sub"></div>
    </div>
""")

# ------------------------------------------- P3: funções (fonte única de verdade)
helpers = """/* ==========================================================================
 * v151 — NOME DO LOCAL/MAPA (fonte ÚNICA de verdade)
 * BUG corrigido: updateTopBar() convertia GameState.location === 'perim'
 * no texto fixo "Perim", então TODOS os mapas do mundo apareciam com o
 * nome "Perim" no topo da tela, ignorando a região atual
 * (GameState.currentRegion). Agora o nome sai SEMPRE de REGIONS[].name.
 * --------------------------------------------------------------------------
 * Como renomear um mapa: ache o REGIONS[] com o id desejado e mude o
 * campo "name" — o topo, o Scanner, o minimapa, o Portal e o banner
 * passam a mostrar o novo nome automaticamente.
 * ========================================================================== */
const TRIBE_COLORS151 = { overworld: '#7ec850', underworld: '#ff6b3d', danian: '#e0a030', mipedian: '#e8c860', marrillian: '#4dc3ff' };
function regionObj151(id) {
  const key = id || (GameState && GameState.currentRegion) || 'ow_grove';
  for (let i = 0; i < REGIONS.length; i++) { if (REGIONS[i].id === key) return REGIONS[i]; }
  return null;
}
function tribeObj151(tribeId) {
  for (let i = 0; i < TRIBES.length; i++) { if (TRIBES[i].id === tribeId) return TRIBES[i]; }
  return null;
}
/* Nome principal do lugar em que o jogador está (linha grande do topo) */
function placeName151() {
  const loc = GameState.location;
  if (loc === 'portico') return 'Pátio Central';
  if (loc === 'exterior') return 'Ilha dos Dromos';
  if (loc === 'cave') return 'Caverna Secreta';
  if (loc === 'drome') return 'Drome';
  const r = regionObj151();          // perim = qualquer mapa do mundo
  return r ? r.name : 'Perim';
}
/* Linha secundária: tribo · mapa N da tribo · Safe Zone (ou contexto da Drome) */
function placeSub151() {
  const loc = GameState.location;
  if (loc === 'portico') return '\\u{1F310} HUB · zona segura';
  if (loc === 'exterior') return '\\u{1F3DD}\\uFE0F zona segura · 7 Mestres do Código';
  if (loc === 'drome') return '\\u{1F300} arena de batalha';
  const r = regionObj151();
  if (!r) return '';
  const tb = tribeObj151(r.tribe);
  const parts = [];
  if (tb) parts.push(tb.icon + ' ' + tb.name);
  if (loc === 'cave') {
    parts.push('sob ' + r.name);
    parts.push('scan 2x');
  } else {
    parts.push('Mapa ' + r.mapLevel + ' da tribo');
    if (r.safe) parts.push('\\u{1F6E1} SAFE ZONE');
  }
  return parts.join(' · ');
}
/* Banner temporário (2.6s) com o nome do mapa — aparece ao entrar no mapa */
let mapBannerTimer151 = null;
function showMapBanner151() {
  const layer = document.getElementById('ui-layer');
  if (!layer) return;
  const old = document.getElementById('map-banner-151');
  if (old) old.remove();
  if (mapBannerTimer151) clearTimeout(mapBannerTimer151);
  const el = document.createElement('div');
  el.id = 'map-banner-151';
  const n = document.createElement('div'); n.className = 'mb151-name'; n.textContent = placeName151();
  const s = document.createElement('div'); s.className = 'mb151-sub'; s.textContent = placeSub151();
  el.appendChild(n); el.appendChild(s);
  layer.appendChild(el);
  mapBannerTimer151 = setTimeout(function() { const x = document.getElementById('map-banner-151'); if (x) x.remove(); }, 2600);
}
const topBarCache = {};"""
sub('P3-helpers', "const topBarCache = {};", helpers)

# ------------------------------------------------- P4: updateTopBar (nome + tribo)
sub('P4-locText', """  const locText = GameState.location === 'portico' ? 'Pátio Central' : GameState.location === 'exterior' ? 'Ilha dos Dromos' : GameState.location === 'perim' ? 'Perim' : GameState.location === 'cave' ? 'Caverna Secreta' : 'Drome';
""", """  const locText = placeName151(); // v151 — nome REAL do mapa atual (antes: "Perim" fixo em toda região do mundo)
""")

sub('P4-mapName', """  // Nome do mapa centralizado
  const mapName = document.getElementById('map-name');
  if (mapName) mapName.textContent = locText;
""", """  // Nome do mapa centralizado (v151: nome do mapa + linha da tribo/progresso)
  const mapName = document.getElementById('map-name');
  if (mapName && mapName.textContent !== locText) mapName.textContent = locText;
  const mapSub = document.getElementById('map-sub');
  if (mapSub) {
    const subTxt = placeSub151();
    if (mapSub.textContent !== subTxt) mapSub.textContent = subTxt;
    const r151 = regionObj151();
    mapSub.style.color = (r151 && TRIBE_COLORS151[r151.tribe]) || '#8be2ff';
  }
""")

# ------------------------------------------------- P5: banner ao entrar no mapa (Perim)
sub('P5-Perim', """    updateTopBar(); checkDailyReset();""",
                """    updateTopBar(); showMapBanner151(); checkDailyReset(); // v151 — banner com o nome CORRETO do mapa""")

# ------------------------------------------------- P6: banner ao entrar na caverna
sub('P6-Cave', """    showNotif('⚠️ Desmoronamento em 15s! Corra pra corda 🪢', 'info');
    updateTopBar();""",
               """    showNotif('⚠️ Desmoronamento em 15s! Corra pra corda 🪢', 'info');
    updateTopBar(); showMapBanner151(); // v151 — "Caverna Secreta · sob <nome do mapa>\"""")

# ------------------------------------------------- P7: Fast Travel com tribo
sub('P7-travel', """  updateTopBar(); closeRoomPanel(); showNotif('Fast Travel: ' + region.name, 'info');""",
                 """  updateTopBar(); closeRoomPanel();
  const tb151 = tribeObj151(region.tribe); // v151 — nome do mapa + tribo no aviso de viagem
  showNotif('\\u{1F5FA}\\uFE0F Fast Travel \\u2192 ' + region.name + (tb151 ? ' · ' + tb151.name : '') + (region.safe ? ' · Safe Zone' : ''), 'info');""")

# ------------------------------------------------- P8: título do minimapa no Scanner
sub('P8-minimap', """  let locName = 'Perim';
  if (key === 'CaveScene') { drawMinimapCave(ctx, sc, t); locName = 'Caverna Secreta'; }""",
                  """  let locName = placeName151(); // v151 — usa o mapa atual (não mais o fallback fixo "Perim")
  if (key === 'CaveScene') { drawMinimapCave(ctx, sc, t); locName = placeName151(); }""")

sub('P8b-minimapPerim', """    const pct = drawMinimapPerim(ctx, sc, t);
    if (sc.region && sc.region.name) locName = sc.region.name + ' · ' + pct + '% explorado';""",
                        """    const pct = drawMinimapPerim(ctx, sc, t);
    const tbM151 = sc.region ? tribeObj151(sc.region.tribe) : null; // v151 — tribo no título do mapa
    if (sc.region && sc.region.name) locName = (tbM151 ? tbM151.icon + ' ' : '') + sc.region.name + ' · ' + pct + '% explorado';""")

# ------------------------------------------------- P9: changelog + título
sub('P9-changelog', """// ============================================================
// CHAOTIC.IDLEWORLD v2.13 — CHANGELOG""",
                   """// ============================================================
// CHAOTIC.IDLEWORLD v2.18 — CHANGELOG
// - NOME DO MAPA CORRIGIDO (v151): o rótulo do topo mostrava "Perim" em
//   TODOS os mapas porque vinha de GameState.location ('perim' = qualquer
//   mapa do mundo). Agora o nome é lido da região atual (REGIONS[].name)
//   por uma fonte única (placeName151) e aparece:
//     · no rótulo do topo (#map-name) + linha da tribo/mapa/Safe Zone;
//     · no painel do Scanner (linha "Local");
//     · no título do minimapa (MAPA — <nome do mapa>);
//     · num banner de 2.6s ao entrar no mapa;
//     · no aviso de Fast Travel do Portal.
//   Para renomear um mapa: mude o campo name do REGIONS com o id dele.
// ============================================================
// CHAOTIC.IDLEWORLD v2.13 — CHANGELOG""")

sub('P9-title', """<title>Chaotic.idleWorld v2.17 — Invasão M’arrillian</title>""",
                """<title>Chaotic.idleWorld v2.18 — Nomes de mapa corrigidos</title>""")


# ------------------------------------------- P10: fix da Drome (achado no teste)
sub('P10-drome-fix', """        const key = isWall ? 'drome_wall' : 'drome_floor';
        if (this._groundCtx && type !== 'bridge') { // v144 — assa o tile no canvas do chão
          const src22 = this.textures.get(key) ? this.textures.get(key).getSourceImage() : null;
          if (src22) { this._groundCtx.drawImage(src22, 0, 0, src22.width, src22.height, x * 32, y * 32, 33, 33); this._groundCounts[key] = (this._groundCounts[key] || 0) + 1; }
        } else { const tile = this.add.image(x * 32 + 16, y * 32 + 16, key); tile.setDepth(type === 'bridge' ? 0.5 : 0); tile.setDisplaySize(33, 33); this.tileGroup.add(tile); } // v138 — pontes por cima da água orgânica""",
"""        const key = isWall ? 'drome_wall' : 'drome_floor';
        if (this._groundCtx) { // v144 — assa o tile no canvas do chão
          const src22 = this.textures.get(key) ? this.textures.get(key).getSourceImage() : null;
          if (src22) { this._groundCtx.drawImage(src22, 0, 0, src22.width, src22.height, x * 32, y * 32, 33, 33); this._groundCounts[key] = (this._groundCounts[key] || 0) + 1; }
        } else { const tile = this.add.image(x * 32 + 16, y * 32 + 16, key); tile.setDepth(0); tile.setDisplaySize(33, 33); this.tileGroup.add(tile); } // v151-fix — aqui não existem pontes na Drome: a variável `type` não existe nesta cena e quebrava a Drome (ReferenceError)""")

# ------------------------------- P11: Ilha dos Dromos marcava o local errado
sub('P11-exterior-loc', """  create() {
    const self = this;
    this.interactables = [];
    const W = 3600, H = 2700;""",
"""  create() {
    GameState.location = 'exterior'; // v151 — garante que o HUD mostre "Ilha dos Dromos" mesmo se a cena for iniciada direto
    const self = this;
    this.interactables = [];
    const W = 3600, H = 2700;""")

# ------------------- P12: ícone da tribo só quando o nome curto (não cortar título)
sub('P12-minimap-icone', """    if (sc.region && sc.region.name) locName = (tbM151 ? tbM151.icon + ' ' : '') + sc.region.name + ' · ' + pct + '% explorado';""",
"""    if (sc.region && sc.region.name) locName = ((tbM151 && sc.region.name.length <= 14) ? tbM151.icon + ' ' : '') + sc.region.name + ' · ' + pct + '% explorado'; // v151 — ícone só quando o nome curto cabe (evita corte no título)""")

# ------------------------------------- P13: changelog do bônus v151-fix
sub('P13-changelog-fix', """//   Para renomear um mapa: mude o campo name do REGIONS com o id dele.
// ============================================================""",
"""//   Para renomear um mapa: mude o campo name do REGIONS com o id dele.
// - BÔNUS (v151-fix): a DROME não abria — DromeScene.create quebrava com
//   "ReferenceError: type is not defined" na hora de posicionar os tiles
//   (a variável `type` não existe nessa cena). Corrigido para profundidade
//   fixa 0, já que na Drome não existem tiles de ponte.
// ============================================================""")

io.open(DST, 'w', encoding='utf-8').write(d)
print('OK — arquivo gravado em', DST)
print('tamanho: %d -> %d bytes' % (len(src), len(d)))
for n, c in report:
    print('  [%s] %d substituição(ões)' % (n, c))
