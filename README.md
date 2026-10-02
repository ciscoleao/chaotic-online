# Lobby novo (Pátio Central) — pacote p/ o repo `chaotic-online`

Subpasta pronta para subir ao GitHub + integração site → login → jogar.
Status: **248/248 testes (250/250 dentro do repo), tudo verde** ✅

## Subir para o GitHub

Siga **`integracao/COMO-SUBIR.md`** (resumo: pasta `lobby/` inteira vai para a
raiz do repo; `integracao/server.js` sobrescreve `server/server.js`).

## Jogar

- **Online (oficial):** após subir + redeploy do Render: site → login → Jogar.
- **Local:** abra `index.html` (cópia de `Chaotic_Online_Lobby_FIX.html`).

> Para editar o jogo, altere `Chaotic_Online_Lobby_FIX.html` e regenere
> `index.html` como cópia.

## Testes (Node, a partir desta pasta)

```bash
node tests/test_lobby_depth.js    # 130: conectividade, colisão, atores, chevrons
node tests/test_lobby_meta.js     # 39: pixel-art RLE, anúncios, scans, quarto
node tests/test_lobby_fix.js      # 61 (19 + 22 música + 3 texturas + 4 zoom/autostart + 6 sem-clique + 7 rebuild): regressões vs. uploads/Chaotic_Online_Lobby_Teste.html
node tests/test_lobby_server.js   # 18 (20 no repo): /game nos 2 layouts + fallback
node tests/test_editor_mapa.js    # editor de mapa (pula 1 check sem o clone)
node tests/test_editor_e2e.js     # E2E do editor com DOM falso
```

## Estrutura

| Pasta/arquivo | O quê |
|---|---|
| `Chaotic-Online-v238.html` | Jogo canônico servido por `/game`, baseado no HTML mais recente enviado |
| `Chaotic_Online_Lobby_FIX.html` | Cópia compatível do lobby (fallback/edição legada) |
| `index.html` | Prévia standalone |
| `integracao/server.js` | Servidor patcheado (base: main `8a327de`) — sobrescreve `server/server.js` |
| `integracao/server.js.diff` | Diff da mudança (3 linhas) |
| `integracao/fixture/` | `fem.json` + `skins.json` p/ o teste E2E |
| `integracao/COMO-SUBIR.md` | Passo a passo (2 arquivos) + rollback |
| `tests/` | 6 suítes, caminhos relativos |
| `tools/` | Geradores e editores (drones, pixel-art, mapa, demos) + música (`lobby_music_snippet.js` 7 faixas, harness 65, `build_music_lab.py`, `preview_musica.py`) |
| `previews/` | Prévias dos sprites + `musica_lobby_preview.wav` (64s = 2 loops) |
| `debug/` | Grids, zooms e mockups da depuração visual |
| `uploads/` | Screenshots + baseline `Chaotic_Online_Lobby_Teste.html` |
| `CONTINUIDADE.md` | Handoff técnico p/ continuar o desenvolvimento |

## Notas

- Pixel-art do pátio em RLE próprio: `/(\d+)(\.|[a-z])/g` (`.` = transparente,
  letras = índice da paleta), decodificado em `lobbySpriteCanvas()` no HTML.
- `tools/lobby_sprites.js` é snapshot antigo só p/ referência.
- Ferramentas `build_*` que leem o clone `chaotic-online/` avisam e saem
  graciosamente se ele não estiver ao lado da pasta.

## Dromo de batalha

A batalha embutida fica versionada em `docs/dromo/Dromo_Battle_Rework.html` para
ser editada como HTML legível. Depois de alterar essa fonte, rode
`python3 docs/patches/build_dromo_battle.py` para atualizar as cópias embutidas
em `Chaotic_Online_Lobby_FIX.html` e `index.html`.

A regressão estática do fluxo pode ser executada com `node tests/test_dromo_rework.js`.

`Chaotic-Online-v238.html` é a cópia pública do export atual usado para a revisão;
ela e o arquivo recebido em `../upload/Chaotic-Online-v238(1).html` permanecem com o
mesmo Dromo embutido da fonte legível.

O comando de build atualiza as três cópias públicas e, quando disponível, o anexo
recebido em `../upload`:

```bash
python3 docs/patches/build_dromo_battle.py
```
# Chaotic Online

*Jogo HTML multiplayer – código aberto para visualização, mas **não pode ser usado, comercializado ou modificado** sem autorização.*

## Copyright

© 2026 Francisco de Arêa Leão – Todos os direitos reservados.  
Este repositório está licenciado sob a **Creative Commons Attribution‑NonCommercial‑NoDerivatives 4.0 International**. Veja o arquivo `LICENSE` para detalhes.
