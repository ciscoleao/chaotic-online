# Lobby novo (Pátio Central) — pacote p/ o repo `chaotic-online`

Subpasta pronta para subir ao GitHub + integração site → login → jogar.
Status: **204/204 testes (206/206 dentro do repo), tudo verde** ✅

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
node tests/test_lobby_fix.js      # 19: regressões vs. uploads/Chaotic_Online_Lobby_Teste.html
node tests/test_lobby_server.js   # 16 (18 no repo): servidor real + fluxo /game + fallback
node tests/test_editor_mapa.js    # editor de mapa (pula 1 check sem o clone)
node tests/test_editor_e2e.js     # E2E do editor com DOM falso
```

## Estrutura

| Pasta/arquivo | O quê |
|---|---|
| `Chaotic_Online_Lobby_FIX.html` | Jogo (canônico — o servidor usa este) |
| `index.html` | Prévia standalone (o servidor não precisa dele) |
| `integracao/server.js` | Servidor patcheado (base: main `8a327de`) — sobrescreve `server/server.js` |
| `integracao/server.js.diff` | Diff da mudança (3 linhas) |
| `integracao/fixture/` | `fem.json` + `skins.json` p/ o teste E2E |
| `integracao/COMO-SUBIR.md` | Passo a passo de upload + rollback |
| `tests/` | 6 suítes, caminhos relativos |
| `tools/` | Geradores e editores (drones, pixel-art, mapa, demos) |
| `previews/` | Prévias ampliadas dos sprites |
| `debug/` | Grids, zooms e mockups da depuração visual |
| `uploads/` | Screenshots + baseline `Chaotic_Online_Lobby_Teste.html` |
| `CONTINUIDADE.md` | Handoff técnico p/ continuar o desenvolvimento |

## Notas

- Pixel-art do pátio em RLE próprio: `/(\d+)(\.|[a-z])/g` (`.` = transparente,
  letras = índice da paleta), decodificado em `lobbySpriteCanvas()` no HTML.
- `tools/lobby_sprites.js` é snapshot antigo só p/ referência.
- Ferramentas `build_*` que leem o clone `chaotic-online/` avisam e saem
  graciosamente se ele não estiver ao lado da pasta.
