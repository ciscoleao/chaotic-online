# 🎮 CHAOTIC.IDLEWORLD — FASE 2 (Online com servidor real)

Servidor **Node puro (zero dependências)** que hospeda o site, as contas,
o captcha anti-bot e o jogo v122 com **nick + skin feminina injetados por sessão**.

## ▶ Como rodar

```bash
node server/server.js
# → http://localhost:8901
```

Pronto. O site está em `site/index.html` (servido em `/`), o jogo em
`chaotic_idleworld_v122.html` (servido em `/game?char=Nick`, exige login).

## 🔐 O que o servidor faz

| Recurso | Detalhe |
|---|---|
| **Contas** | email + usuário + senha (hash **scrypt** + salt) em `server/data/db.json` |
| **Sessões** | cookie `chaos_sid` HttpOnly, 30 dias, **sobrevive a restart** |
| **Turnstile** | widget **oficial** do Cloudflare + verificação `siteverify` no servidor |
| **Captcha 5 chars** | código gerado e validado **no servidor** (o cliente só desenha); expira em 2 min |
| **Bloqueio anti-brute-force** | 3 erros de captcha/senha → **1h bloqueado por IP** (persistente) |
| **Personagens** | até 3 por conta, **nick único global**, sexo m/f, salvo no servidor |
| **/game** | injeta `window.CHAOS_ONLINE={nick,sex}` + skin feminina no HTML do v122 |

## ☁️ Turnstile: chaves de teste → reais

Hoje usa as **chaves de teste oficiais** da Cloudflare (widget mostra
"For testing only" e sempre passa). Em produção, troque no topo de
`server/server.js`:

```js
SITEKEY: '0x4AAAAAAA...',   // sua sitekey real (dash.cloudflare.com → Turnstile)
SECRET:  '0x4AAAAAAA...',   // seu secret real
```

Modos de teste úteis (doc Cloudflare): `1x00000000000000000000AA` sempre passa,
`2x00000000000000000000AB` sempre bloqueia, `3x00000000000000000000FF` força
desafio visível.

## ☁️ Save na nuvem (por conta)

O progresso do jogo (bits, nível, Scans, mochila, DromoWins, missões…)
agora **acompanha a conta**:

- O servidor injeta o save da conta em `window.CHAOS_SAVE` ao servir `/game`;
- Uma **ponte** dentro do jogo resolve o que fazer:
  - dispositivo sem save local → adota o do servidor (e registra o hash);
  - save local em sincronia com o servidor → servidor é dono (troca de dispositivo tranquila);
  - save local divergente (ex.: **progresso da Fase 1** antes da nuvem) → é **adotado e enviado** ao servidor na 1ª gravação (migração automática);
- Cada `saveGame()` do jogo enfileira um POST para `/api/save` (debounce 2,5s) e há *flush* ao ocultar a aba (`sendBeacon`);
- Limite de 250 KB por save; honra a sessão (cookie) e o personagem ativo.

Troca de dispositivo: **login → JOGAR → progresso de volta**. ✓

## 🔑 Login com o Google (opcional)

O botão já existe. Para ativar o OAuth real:

1. Google Cloud Console → Credenciais → OAuth 2.0
2. Redirect URI: `http://SEU-DOMINIO:8901/auth/google/callback`
3. Preencha no `server/server.js` (ou como variáveis de ambiente):

```bash
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com \
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx \
node server/server.js
```

Sem as chaves, o botão abre uma página explicando a configuração.

## 📂 Arquivos

- `server/server.js` — servidor completo (rotas, captcha, sessões, injeção)
- `server/fem.json` — skin feminina (gerado por `build_site2.py`)
- `server/data/db.json` — banco (contas/sessões/blocos/nicks) — **apague p/ resetar**
- `site/index.html` — cliente (gerado por `build_site2.py` a partir de `site_template2.html`)
- `site_fase1_backup.html` — versão standalone da fase 1 (sem servidor), preservada

## 🧪 Testado (27/27 + persistência via curl)

- cadastro → captcha → personagem F → jogo com skin rosa ✓
- nick duplicado global rejeitado ✓
- senha errada rejeitada; 3 captchas errados → 1h de bloqueio ✓
- logout/login (usuário **ou** email) ✓
- **restart do servidor mantendo sessão e contas** ✓
- mobile 390px sem overflow, widget Turnstile real sem sobreposição ✓

**Save na nuvem (20/20):** progresso sobe ao servidor (bits/dromoWins) ✓ ·
outro dispositivo loga e **recebe o progresso** ✓ · dispositivo antigo reabre e
**adota o save mais novo** ✓ · save local da Fase 1 **migrou sozinho** ✓ ·
flush via `sendBeacon` ✓ · mobile restaurou tudo ✓

## 💬 CHAT GLOBAL + 🕹️ PVP ENTRE JOGADORES (v123)

**Chat com 3 abas** (`/api/chat` GET `?since=&nsince=&psince=` / POST `{text,scope,to}`):
- **📍 PERTO** — só quem está na MESMA sala vê (anel em memória, 5 min);
- **🌐 GLOBAL** — todo mundo vê (cap 300 no `db.chat`, rate 1s/IP);
- **✉️ PRIVADO** — dropdown com quem está online; entrega mesmo offline (30 min).
- **Presença** (`/api/presence` POST): roster de quem online (sala/posição,
  heartbeat 12s, expira em 45s) + avatares com nick dos jogadores na sala.
- Erros aparecem **dentro da aba** (sem depender de toast).
- BUGFIX crítico: `chatSeq` era semeado antes da carga do db — após restart,
  msgs novas nasciam com id 1 e os clientes filtravam tudo ("escrevo e não
  aparece"). Agora carrega o histórico ANTES de semear e normaliza ids antigos.
Cliente: **TAB** abre o campo, **ENTER** envia (balão sobre o personagem +
eco local na aba ativa), **ESC** fecha; painel fixo no canto inferior
esquerdo (no mobile sobe pra não cobrir o joystick); botão 💬 do HUD abre
por toque. Selo **v123** no cabeçalho do painel.

**PVP 1x1 real** (`/api/pvp/queue|status|leave|msg|poll|finish`):
1. Jogador clica **PVP** no painel do Dromo → fila; o servidor pareia 2 e
   devolve `{id, role: a|b, opp:{nick}}`.
2. Cada cliente abre o jogo de batalha com `mode:'pvp'` e troca mensagens
   pelo relay (`msg`/`poll`, seq por lado).
3. Servidor converte `loadout` → `oppteam` pro rival; **quando os dois
   enviaram**, sorteia a **cara ou coroa 50/50** (`{t:'coin',youWon}`).
4. Vencedor escolhe o confronto; o `pick` vai ao rival **e é ecoado ao
   autor** — os dois entram na mesma batalha (mapa do autor).
5. `finish {win|lose|forfeit}` encerra, anuncia no chat global
   (`⚔️ X venceu Y no Dromo PVP!`) e credita **+1 pvpWins / +350 bits**.
6. Sweep: W.O. em ~10s sem contato (após 25s de partida), partidas >600s
   são descartadas.

**E2E (puppeteer, 2 navegadores): 24/24 PASS** — chat (balão centralizado
dx=0, TAB/ENTER/ESC, aba global, mensagens cruzadas), PVP (pareio, prep,
moeda, escolha, batalha ativa nos dois, sync de movimento, dano via relay,
resultado nos dois, recompensas, save na nuvem), regressão PVE e smoke
mobile 390×844 (toque no 💬, balão, aba acima do joystick).
Shots: `shots/f4_*` (desktop) e `shots/f5_*` (mobile).

## 🧹 v125 — ajustes de chat/UX (feedback do playtest)

- **Balões de fala do chat REMOVIDOS** (ficavam longe do personagem) — a fala
  aparece só no painel de chat (aba ativa); nada mais usava balões.
- **Botão ✕/🏠 do HUD removido**: o teleporte ao Pátio Central agora é um
  botão dentro do **⚙️ Opções** (junto com resgate e deslogar).
- **Ícone do Scanner**: antena 📡 → **scanner vermelho** (SVG, renderiza em
  qualquer aparelho); ganha **bolinha vermelha** quando chega PM.
- **Digitar não move mais o personagem**: campos de mensagem/código de
  resgate desativam o teclado do jogo enquanto focados (WASD/I/Q ignorados);
  ao sair do campo, volta ao normal.
- **Aba MSG do Scanner**: nunca mais "fecha sozinha" ao digitar/listar
  (re-render agora só quando seguro); **adicionar amigo é POR NOME**
  (lista de todos os online removida — valida se a pessoa está online).

## ☁️ Persistência Supabase (contas sobrevivem a redeploys)

Defina `SUPABASE_URL` + `SUPABASE_KEY` (service_role) no ambiente e crie a
tabela `game_state` (SQL em `publicar/README-SUPABASE.md`). O servidor então:
- **adota** o estado da nuvem no boot (contas/saves/chat/blocos);
- salva com **debounce** (~4s) a cada `saveDB()` e **no SIGTERM/SIGINT**
  (o Render envia SIGTERM a cada redeploy — nada se perde);
- sem as variáveis, opera só com disco local (comportamento antigo).
Teste de ciclo completo (mock REST local): `test10_supabase.js` — 9/9.

## 🆕 v124 — presença real, ⚙️ resgate/deslogar, Scanner MSG

- **Jogadores visíveis no mapa**: sprites REAIS (herói masc. `hero_*` /
  jogadoras com skin feminina `heroF_*` + nick flutuante), interpolados via
  heartbeat de 2s; direção/frames de caminhada remotos.
- **Skin feminina corrigida**: `build_site2.py` extraía só direções n/s
  (`[ns][ew]?`) — faltavam `e`/`w` (virava quadrado preto). Agora 8 direções.
- **HUD**: botão 🏠 = Voltar ao Pátio Central (era 🏛️, confundido com ✕);
  **Deslogar** foi pro ⚙️ Opções.
- **⚙️ Opções**: campo de **código de resgate** — `scan10` (+10 Scans
  aleatórios) e `goldfree` (+10.000 bits), 1 resgate por conta
  (`/api/redeem`, persistido em `acc.redeemed`).
- **Chat**: sem mensagens automáticas ("X Scanner(s) nesta sala" removido);
  PRIVADO por **nome digitado** (com sugestões de quem está online).
- **Scanner → aba ✉️ MSG**: conversas privadas (log por jogador), **lista de
  amigos** (adicionar/remover online, persistido no save), enviar/ler PM sem
  sair do Scanner; PM do chat abre a conversa automaticamente.
- Testes: `test9_v124.js` 15/15 · `test8_tabs.js` 10/10 · `test4_chat_pvp.js` 24/24.

## 🔑 Sessão em iframe/preview (v123.1)

Quando o site abre **embutido** (preview em iframe cruzado), o navegador
descarta o cookie de sessão (`SameSite=Lax` não viaja em contexto
third-party) — sintomas: "Olá, undefined" e "Faça login primeiro." ao criar
personagem. Solução implementada:
- **Token de sessão**: registro/login/me devolvem `token`; o site guarda e
  envia o header `x-session` em toda chamada (`api()`); o mundo recebe
  `window.SESSION_TOKEN` + wrapper de `fetch` (server injeta em `/game`).
- **`/game?sess=`**: navegação embutida leva o token na URL.
- **CORS**: `/api/*` e `/game` refletem `Origin` e aceitam `x-session`
  (OPTIONS 204).
- Cookie segue como caminho primário no navegador normal (aba cheia).
Testes: `test6_embedded.js` (11/11, reproduz o iframe sem cookie) +
`test4_chat_pvp.js` (24/24).

## ⚠️ Limitações atuais (próximas fases)

- Conflito de save = **último push ganha** (não há merge campo a campo);
  com a ponte, isso só ocorre se o mesmo jogador jogar em 2 dispositivos
  ao mesmo tempo e gravar nos dois.
- PVP: 1 partida por par por vez; sem matchmaking por nível; reconexão
  volta à partida em curso (por e-mail) mas não restaura o estado do duelo.
- Para produção pública: rode atrás de HTTPS (proxy Cloudflare/nginx) —
  o Turnstile real exige domínio próprio registrado no dashboard.

## v126 — engrenagem visível (correção)

O botão ✕ "Voltar ao site" (do `site/index.html`) ficava **por cima** da
engrenagem do HUD (z-index 40 > 30) e a tapava. Mudanças:

- ✕ removido do site (sair do jogo = 🚪 Deslogar no menu ⚙️);
- engrenagem do HUD agora é **SVG** (não depende de fonte de emoji do aparelho);
- título do painel ⚙️ também em SVG.

Arquivos alterados: `site/index.html`, `chaotic_idleworld_v123.html`.
Testes: test4 24/24 · test9 18/18 · test8 10/10 · test5 mobile OK.

## v127 — 6 skins (3 masculinas + 3 femininas)

Na criação do personagem (Scanner), além de nick e sexo, o jogador escolhe a
**SKIN** com preview animado no painel: Clássico · Noturno · Volts (♂) e
Rosa · Aurora · Solar (♀). Variações de tom de pele (incl. pele negra),
cabelo (afro, raspado, platinado, roxo, castanho) e roupas (barras, zíper,
listras, cores de jaqueta e pulseira).

- `server/skins.json` — as 6 skins completas (gerado por `build_skins.py`);
- `GET /api/skins` — lista pública com previews (s_0/s_1 dos dois sexos);
- `POST /api/character` aceita `skin` (valida por id+sexo; inválida → padrão do sexo);
- `/game` injeta `CHAOS_SKIN` (paleta+frames completos) do personagem;
- chars antigos sem skin continuam funcionando (Classica/fem.json).
