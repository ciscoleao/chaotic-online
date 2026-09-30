# Como subir: site → login → jogar com o lobby novo

## Como o servidor encontra o lobby (2 layouts aceitos)

O `server.js` patcheado procura o jogo nesta ordem:

1. `lobby/Chaotic-Online-v238.html` (pasta organizada — preferido)
2. `Chaotic-Online-v238.html` (**raiz** — export atual)
3. `lobby/Chaotic_Online_Lobby_FIX.html` ou `Chaotic_Online_Lobby_FIX.html` (fallback compatível)
4. `chaotic_idleworld_v123.html` / v122 (fallback = jogo antigo)

Ou seja: **funciona do jeito que já está no repo hoje** (arquivos na raiz).
Nada precisa ser reorganizado para o jogo entrar no ar.

## Passo a passo (GitHub web) — só 2 arquivos

### 1. Ativar o lobby novo (obrigatório)

Sem este passo o servidor continua servindo o v123 antigo.

1. No repo, abra a pasta **`server/`**.
2. **Add file → Upload files** → selecione o `server.js` deste pacote
   (`lobby/integracao/server.js`) → **Commit**.
   - Subir um arquivo com o mesmo nome **sobrescreve** — é isso mesmo.
3. O Render faz redeploy sozinho. Confira o log do deploy — tem que aparecer:
   `[boot] /game serve: .../Chaotic-Online-v238.html (lobby novo)`
4. Teste: abra o site → login → Jogar → o pátio novo (drones verdes) abre.
   Sem login, `/game` redireciona para o site (comportamento normal).

### 2. Restaurar o README original (recomendado)

Se o `README.md` da raiz foi sobrescrito pelo README do pacote do lobby:

1. Na raiz do repo, abra `README.md` → ⋮ → **Delete** → Commit.
2. **Add file → Upload files** → selecione o `README.md` original
   (guardado como `para-subir/README.md` no workspace) → Commit.

### 3. Limpeza opcional (outra hora, via git)

Os arquivos do pacote na raiz (`bug_*.png`, `test_*.js`, etc.) são inofensivos
— o servidor os ignora. Reorganizar para `lobby/` pode ser feito depois com
`git mv`, sem pressa e sem efeito no jogo.

## Rollback (se algo der errado)

- Reverta `server/server.js` para a versão anterior (GitHub: History → Revert),
  **ou** apague/renomeie os exports do lobby — o servidor volta a
  servir o v123 sozinho (log: `(fallback v123/v122)`).

## O que o patch muda

```diff
-const GAME_FILE = ...v123 ou v122...;
+const LOBBY_CANDIDATES = [lobby/Chaotic-Online-v238.html, Chaotic-Online-v238.html, lobby/Chaotic_Online_Lobby_FIX.html, Chaotic_Online_Lobby_FIX.html];
+const LOBBY_FILE = LOBBY_CANDIDATES.find(f => fs.existsSync(f)) || null;
+const GAME_FILE = LOBBY_FILE || (...v123 ou v122...);
+console.log('[boot] /game serve: ' + GAME_FILE + ...);
```

Todo o resto (injeção de sessão/nick/skin/BRIDGE, rotas, login) continua
idêntico — validado pelo teste `tests/test_lobby_server.js`, que sobe o
servidor de verdade nos dois layouts. Diff completo em `server.js.diff`.
