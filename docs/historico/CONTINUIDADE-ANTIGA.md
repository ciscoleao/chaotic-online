# Handoff — lobby novo + integração (novo chat)

> Extraia o ZIP e rode as suítes para validar o ambiente. Upload ao GitHub:
> `integracao/COMO-SUBIR.md`.

## Onde paramos (2026-09-21)

1. **Integração site→login→jogar** — `server.js` patcheado v2 (base main `8a327de`):
   `/game` serve o lobby de `lobby/` **ou da raiz** (upload achatado funciona),
   senão cai para v123/v122. Upload real do jogador foi achatado na raiz +
   README sobrescrito → patch dual-path + README original recuperado
   (`para-subir/`). Injeção (sessão/nick/skin/BRIDGE) funciona sem mudanças
   porque o lobby tem todas as âncoras. Teste E2E (`test_lobby_server.js`: 18 standalone + 2 de fallback no repo)
   sobe o servidor de verdade nos 2 layouts: 302 sem login, 200 + 9 injeções
   com sessão, fallback validado. Patch: 3 linhas (`integracao/server.js.diff`).
2. **Drones cartoon** — bichinho verde extraído de `uploads/image-1.png`
   (`tools/drone_extract.py`: flood-fill + median-cut 12 cores + RLE). Lobby:
   3 variantes 48x60; Pórtico em vetor canvas (`drawChaoticDrone`).
3. **Porta da forja** — poste obstáculo fino sem oclusor, farol na porta,
   setas reposicionadas, brilho na abertura.
4. **Suítes:** depth 130 + meta 39 + fix 61 + server 18 = **248/248**
   (250/250 dentro do repo, com o fallback);
   editores 11+11.
5. **Música por mapa (v181)** — 7 faixas WebAudio, troca auto c/ crossfade:
   patio (sci-fi) | battle (épica 120bpm c/ bateria) | 5 tribos (pastoral,
   doom, colmeia, deserto c/ vento, lagoa negra); sonda 1s via `mapaAtual154()`
   + `#dromo-panel`/overlay `.open` → battle; fonte `tools/lobby_music_snippet.js`
   após `pipArme152();`; lab `Testar_Musicas.html`; Opções (`chaotic_music_*`).
   v182: indicador 🎵 no HUD (faixa atual; toque=mutar), watchdog de ganho,
   logs `[musica]`, `window.__musica` p/ debug.
   v183: FIX dip perpétuo (sonda 1s x DIP 1.2s se cancelava p/ sempre):
   pendingTrack + debounce (2 ticks) + `watchTick()`; validado em Chrome
   headless c/ AnalyserNode (7 faixas audíveis, RMS 0.010–0.016).
6. **Pontes v184** — `lanternTex(this)` nunca era chamada → `__MISSING`
   (quadrados pretos) nas pontes; fix 1 linha + auditoria genérica de
   texturas no fix.js (toda *Tex usada precisa ser chamada).
7. **Zoom+música v185** — lobby começava em fullMapMode no PC (-wide);
   agora fullMapMode=false (aproximado). Música: kick no load + resume
   no gesto (iOS) + HUD suspenso honesto + refresh ao liberar som.
8. **Sem-clique v186** — botão 'Ver pátio' removido do HUD (🗺️ só no
   Modo Foto); NPC/setores/MASTER/balão sem clique (só [E]/👆);
   clique-anda mantido.
9. **Rebuild Pátio v187** — 4 tabelas refeitas da arte (7 pisos, 12
   corredores, 70 obstáculos, 65 occluders); pontos reposicionados;
   F9 overlay de colisão; BUG REAL: jardineiras cortavam os arcos S
   (dep/comms isolados) + fendas estreitas p/ física; sim BFS 12/12.
   Depth atualizada p/ o novo modelo (65 oclusores, sondas novas);
   faixas/setas/faróis do chão realinhados aos corredores novos.
10. **Forja refeita v188** — bancada+armário da direita mudados p/
    a parede esquerda (cirurgia no webp: 2 pastes + fill de piso
    espelhado); arm/caixas/obst+oclus mudados juntos; costura
    (200,500), Ferreiro na entrada (312,438); sala toda livre;
    webp v3 (hash novo no fix).

11. **Forja mockup v189** — costura (máquina+dummies+caixas) + mesa/gavetas
    transplantados do mockup (`uploads/image-1.png`); topo com 2 peças
    (4 não cabem na parede real); webp v4 (q90); obst+oclus juntos
    (forja-costura, forja-mesa); costura (200,500), Ferreiro (312,438);
    suítes 248/248 + editores 11+11.

## Comandos

```bash
cd lobby
node tests/test_lobby_depth.js && node tests/test_lobby_meta.js && node tests/test_lobby_fix.js && node tests/test_lobby_server.js
node tools/test_music_harness.js   # 65: 7 faixas + troca + bateria + HUD + watchdog + antidip
python3 tools/build_music_lab.py     # gera Testar_Musicas.html (lab das 7 faixas)
python3 tools/preview_musica.py    # regenera previews/musica_lobby_preview.wav (64s = 2 loops)
python3 tools/drone_extract.py   # regenera RLE dos drones (PIL+numpy)
```

## Convenções

- Patches no HTML/servidor via Python com `assert count == 1` nos anchors.
- Sem browser no ambiente: validação via PIL (mesmo algoritmo do JS) +
  `node --check` nos `<script>` extraídos + servidor real em porta alta.
- Testes travam direção de arte e fluxo: ao mudar, atualizar junto.
- Caminhos relativos (`__dirname` / `HERE`/`ROOT`); nada de `/home/user`.
- Mockups PIL de chevron são aproximação; confiar no jogo + posições validadas.

## Mapa rápido

- HTML do jogo: `LOBBY_SPRITES` (~l1171, RLE `/(\d+)(\.|[a-z])/g`),
  `spawnDrones`/`updateDrones` (3 rotas), `OCCLUDERS` (~l1130),
  `OBSTACLES`, `PASSAGE_STRIPS`/`CHEVRON_RUNS`/`BEACONS`; Pórtico em outro
  `<script>` (`drawDroneA/B/C`, `createTextureFromCanvas`).
- Servidor: `GAME_FILE`/`LOBBY_FILE` (~l115), `buildGame` injeta
  `CHAOS_ONLINE`/`SESSION_TOKEN`/`CHAOS_FEM` + skinSwitch (âncora MONSTROS) +
  nickSet + BRIDGE (âncora boot). Rota `/game` exige login (302 → `/`).

## Atenção

- O clone local `chaotic-online/` (fora do ZIP) tem mods **v173 não commitadas**
  (skin id na sessão, lastChar) — patch base foi o main limpo, sem elas.
  Se quiser, commitar separado depois.
- `lobby/index.html` no repo + Pages = prévia pública sem login; apagar do repo
  se não quiser (o servidor não usa).
- Fora do ZIP de propósito: clone (32 MB) e ZIPs v235–237 (apagados, superados).

## Ideias pendentes

- 4ª pose de drone (`fullside` no `drone_rle.json`) como variação.
- Spawn dos `drone_a/b/c` do Pórtico (só texturas existem).
- Mockup da porta da forja com herói no vão.
