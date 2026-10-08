# Como subir: site → login → jogar com o lobby novo

## O que vai para onde (repositório `chaotic-online`)

| Neste pacote | Destino no repo | Como |
|---|---|---|
| pasta `lobby/` inteira | `lobby/` (pasta nova na raiz) | GitHub web: Upload files arrastando a pasta, ou `git add lobby` |
| `lobby/integracao/server.js` | `server/server.js` (**sobrescreve**) | Upload no mesmo caminho, ou copiar por cima + commit |
| `lobby/index.html` | vai junto na pasta (opcional) | Prévia standalone; o servidor não precisa dele |

Nada mais do repo é tocado: `site/`, `/game`, login e `-->>` continuam iguais.

## Passo a passo (GitHub web)

1. Extraia o ZIP e entre na pasta `lobby/`.
2. No repo: **Add file → Upload files** → arraste a pasta `lobby/` → Commit.
3. Ainda no repo, abra `server/server.js` → **⋮ → Upload files**? Não — o web não
   sobrescreve direto: apague `server/server.js` (⋮ → Delete, commit) e suba o
   `lobby/integracao/server.js` para dentro da pasta `server/` (commit).
   - *Via git (mais simples):* `cp lobby/integracao/server.js server/server.js`
     + `cp -r lobby lobby-do-pacote` conforme abaixo, `git add -A`, commit, push.
4. O Render faz redeploy sozinho. Confira o log do deploy — tem que aparecer:
   `[boot] /game serve: .../lobby/Chaotic_Online_Lobby_FIX.html (lobby novo)`
5. Teste: abra o site → login → Jogar → o pátio novo (drones verdes) abre.
   Sem login, `/game` redireciona para o site (comportamento normal, preservado).

> ⚠️ Estrutura final no repo: a pasta chama `lobby/` e o jogo fica em
> `lobby/Chaotic_Online_Lobby_FIX.html` — o `server.js` patcheado procura
> exatamente esse caminho. Não renomeie.

## Rollback (se algo der errado)

- Reverta `server/server.js` para a versão anterior (GitHub: History → Revert),
  **ou** simplesmente apague a pasta `lobby/` — o servidor detecta a falta e
  volta a servir o `chaotic_idleworld_v123.html` sozinho (log: `(fallback v123/v122)`).

## O que o patch muda (3 linhas)

```diff
-const GAME_FILE = fs.existsSync(...v123...) ? ... : ...v122...;
+const LOBBY_FILE = path.join(ROOT, 'lobby', 'Chaotic_Online_Lobby_FIX.html');
+const GAME_FILE = fs.existsSync(LOBBY_FILE) ? LOBBY_FILE : (...v123 ou v122...);
+console.log('[boot] /game serve: ' + GAME_FILE + ...);
```

Todo o resto (injeção de sessão/nick/skin/BRIDGE, rotas, login) continua
idêntico — validado pelo teste `tests/test_lobby_server.js`, que sobe o
servidor de verdade e percorre o fluxo. Diff completo em `server.js.diff`.
