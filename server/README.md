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

## v128 — Roleta de Scan sem trapaças e sem tela travada

- **Anti-burla**: o prêmio é sorteado e **salvo no exato momento do giro**
  (antes da animação). Fechar o jogo no meio do giro não re-roleta: as 10
  cartas já foram consumidas e o prêmio já está garantido no save
  (local + nuvem via bridge).
- **Fix da tela travada**: `finishRoulette` chamava funções inexistentes
  (`updateUI`/`notify`) → ReferenceError deixava a janela presa no
  "Girando..." sem botão. Agora o final mostra o card + botão
  **✔ CONFIRMAR E SAIR**; em qualquer erro inesperado, `rouletteFailSafe`
  garante a mesma janela de confirmação (nunca mais tela sem saída).
- `getCardElements` agora recebe os ivs corretos (antes recebia o nome do
  monstro → NaN; estrelas/coroas de elemento funcionam de verdade).

## v129 — mundo vivo: vento, folhas e água de verdade

- **Árvores com vento**: as copas balançam suavemente (tween de rotação com
  pivô na base do tronco, fase/duração aleatória por árvore) no Pátio,
  nas regiões de Perim e no Exterior;
- **Folhas caindo**: folhas verdes soltam das copas, caem girando com
  deriva de vento e somem no chão (máx. 14 simultâneas por cena);
- **Água nova**: textura com gradiente de profundidade, ondas que sobem/descem
  e brilhos de sol — 4 quadros animados (antes: 2, quase estática). No
  Exterior, as faixas de água nas bordas têm **correnteza** rolante contínua
  (tileSprite em movimento, cada borda numa direção);
- **Slow de 20% na água**: herói E monstros andam 20% mais lentos sobre
  tiles de água (função `tileIsWaterAt` lê o mapa por tile; pontes e fora
  d'água não são afetados; na caverna o efeito é nulo por não haver água).

## v130 — rio largo com margens curvas e água funda intransponível

- **Rio com o dobro da largura**: geração serpenteante (deltas suaves +
  carimbo de elipses) — mediana de largura 5 tiles, sem blocos órfãos.
- **Tileset por máscara (autotile)**: cada tile de água analisa os 8 vizinhos —
  **raso** (azul claro, arena na borda + espuma + cantos em curva de quarto-de-círculo
  + pedrinhas) e **fundo** (azul profundo). Margens de grama ganham **barranco
  escuro + pontinhos de areia** de borda. Nada de "blocos soltos".
- **Água funda = parede**: tiles cercados de água por todos os lados viram
  "deep" com colisão total (player e monstros não passam). Só o raso é
  atravessável (com o slow de 20%).
- **Travessias garantidas**: 3 pontes de madeira cruzando o rio;
  praia de chegada do fast travel sempre em terra.
- Fix: corpos estáticos eram destruídos no shutdown da cena (sem zonas
  fantasmas de mapas anteriores bloqueando o novo mapa).

## v131 — rio atravessável + mundo mais polido

Feedback do jogador (referência pixel art enviada):

- **Rio 100% atravessável**: NÃO existe mais água funda no rio — dá pra
  atravessar em qualquer ponto (com o slow de 20%). A água funda (com
  colisão) existe APENAS nos LAGOS (1–2 por mapa, com margens curvas);
- **Margens limpas**: faixa de areia fina e clara contínua (sem placas
  amarelas grosseiras), espuma na linha d'água, barranco escuro discreto
  na grama (e do lado CORRETO da borda — correção do v130);
- **Água com células suaves** (padrão hex sutil da referência);
- **Grama decorada**: ~20% dos tiles ganham pedra grande, pedrinhas,
  flores (branca/rosa/vermelha/azul) ou tufos, assados na textura (custo zero);
- **Sombras suaves** sob árvore grande, casa e pedra;
- **Trilhas com bordas arredondadas**: caminhos agora têm borda de terra
  e cantos curvos (mesma técnica de máscara da água).

## v132 — mundo mais polido (detalhes em toda parte)

Continuação direta do polimento da v131:

- **Arbustos e capim alto na grama**: a decoração assada nos tiles ganhou
  3 variações novas (arbusto pequeno, arbusto largo com flor rosa e capim
  alto com sementes) — a grama nunca fica monótona;
- **Flores no Exterior**: 80 flores espalhadas pelo gramado (longe do
  centro, das trilhas e dos Dromos);
- **Canteiros no Pórtico**: 8 vasos de flores decorando o pátio central
  (combinam com o estilo do hub — flores soltas no chão não);
- **Pedras grandes NOS LAGOS**: rochas emergem da água funda (e o herói
  não engasga mais em quinas diagonais — corpo de colisão mais baixo);
- **Taboas balançando nas margens**: juncos verdes animados pelo vento
  na beira do rio e dos lagos (até 46 por mapa);
- **Névoa leve deslizante**: camada sutil de névoa se movendo devagar no
  Perim e no Exterior;
- **Lagos garantidos**: com a regra "lago não pode tocar o rio", o gerador
  agora sempre nasce pelo menos 1 lago com água funda por mapa.

## v133 — mundo vivo: bichos, brilhos e clima

- **Borboletas** esvoaçando no Perim (10, com voo em curvas suaves);
- **Vagalumes** pulsando no Exterior (16, brilho respirando);
- **Brilhos cintilando na água** do rio e dos lagos (faíscas de 4 pontas
  que acendem e apagam em pontos aleatórios da água rasa);
- **Vitórias-régias** flutuando nos lagos (perto da água funda, com bob
  suave);
- **Sombras de nuvens** gigantes passando devagar no Exterior;
- **Bandeiras** tremulando nos 7 Dromos de batalha;
- **Lanternas pulsantes** decorando o Pórtico (6, com halo quente);
- Tudo da v132 mantido (arbustos, capim, taboas, pedras, névoa, flores,
  canteiros) — testado: 13/13 no test16 + regressão completa verde.

## v134 — vida silvestre: pássaros, peixes, coelhos e cogumelos

- **Pássaros em bando** cruzando o céu (3 de cada vez, asas batendo,
  com sombra correndo no chão) — no Perim E no Exterior;
- **Peixes pulando** na água do rio/lagos (arco com brilho + anel de
  splash na superfície);
- **Coelhos** (4 no Perim) que quicam e FOGEM quando o herói chega perto;
- **Fumaça na chaminé** das casas (pufes que sobem e se dissipam);
- **Cogumelos** vermelhos e marrons na grama decorada (12 variações);
- **Pedra garantida** nos lagos (em mapa com lago pequeno o hash podia
  não sortear nenhuma);
- Testado: test17 13/13 (+ 6 reruns verdes) e regressão completa verde.

## v135 — água viva + hub holográfico

- **Ripples nos pés** do herói enquanto ele nada (ondinhas contínuas);
- **Patos** nadando de um lado pro outro dos lagos (2, com ondinha
  embaixo, indo e voltando);
- **Libélulas azuis** pairando nas margens (5, asas tremendo);
- **Folhas boiando** à deriva na correnteza (nascem, flutuam e somem);
- **Pólen dourado** subindo na luz do Exterior (14 partículas);
- **Faíscas holográficas** subindo dos drones flutuantes do Pórtico
  (reforça o estilo tech do hub da v117);
- Tudo das v132–v134 mantido — test18: 18/18 de primeira e regressão
  completa verde.

## v136 — toques de encanto

- **Sapos** nas margens que PULAM pra água quando o herói chega perto
  (4, com squash no pulo e cooldown);
- **Bolhas** subindo na água funda dos lagos;
- **Cristais brilhantes** cintilando na grama (minerais de Chaotic, 8);
- **Fontes jorrando** água de verdade no Exterior (gotas com arco
  balístico nas 2 fontes);
- **Feixes de luz (god rays)** diagonais atravessando o Exterior (3,
  com respiração lenta);
- **Poeira estelar** caindo devagar no Pórtico (ambiente holográfico);
- Tudo das v132–v135 mantido — test19: 17/17 de primeira e regressão
  completa verde (test4/5/8/9/11/12/13/14/15/16/17/18).

## v137 — dia de vento

- **Patinhos** seguindo o pato em fila nos lagos (2 por pato, com atraso
  de fila — vão-e-vem junto);
- **Pássaros pousados** na grama que VOAM quando o herói chega perto (3);
- **Lanternas pulsantes nas pontes** do rio (até 6);
- **Sombras de nuvens** passando também no Perim (2, já tinham no Exterior);
- **Rajadas de vento**: a cada ~20s a vegetação inteira balança mais
  rápido por ~1s + chuva extra de folhas;
- **Aurora sutil** ondulando no céu do Pórtico (combina com o hub lunar);
- Tudo das v132–v136 mantido — test20: 16/16 de primeira e regressão
  completa verde.

## v138 — água orgânica (estilo Stardew/Eastward, com base na referência)

- **Água pintada num canvas único** (2400x1824): nada mais de escada
  de tiles — a margem é uma linha contínua ONDULADA sobre o rio/lago;
- **Transição suave terra↔água**: areia fina clara + espuma pontilhada
  (tracejada, com fase diferente em cada trecho) + sombra azulada entre
  terra e água; cantos arredondados nas diagonais;
- **Pedrinhas na linha d'água** (3 pedras com brilho, como na referência);
- **Profundidade**: rasinha clara junto à margem, tom médio no meio e
  blobs escuros na água funda + reflexos claros e cintilantes na
  superfície;
- **Rio com carimbo CIRCULAR** (fim das colunas retas — margens
  arredondadas de verdade);
- **PONTES por cima da água** (a areia passa por baixo, como na ref);
- **Vegetação de margem**: arbustos e capim alto no gramado junto à água;
- **Árvores mais exuberantes** (copa em 6 tons);
- **Trilhas com manchas suaves** (sem padrão xadrez visível);
- Provas no teste: amostragem de PIXELS do canvas (água azul, faixa de
  areia terminando a 4–21px — ONDULADA) + 8/8 testes de regressão verde.

## v139 — margem de barro + girassóis (fechando o visual da referência)

- **Franja de BARRO/laterita alaranjada** no lado da terra da margem,
  com **contorno escuro na grama** e sombra interna — o mesmo detalhe
  da referência Stardew/Eastward (também nas diagonais dos cantos);
- **Girassóis** balançando na margem (até 6 por mapa);
- Trilhas com pontinhos quase imperceptíveis (fim de vez com o grid
  visível);
- Prova por pixels: barro + contorno presentes em 6/6 margens
  amostradas; todo o resto da v138 mantido.

## v140 — vida na água II: tartaruga, barril e luz dançante

- **Tartarugas** nadando nos lagos (3) que MERGULHAM com onda quando o
  herói chega perto — e voltam à superfície depois de uns segundos;
- **Barris de vila** na margem (até 4, como o da referência);
- **Caustics de luz**: manchas azuladas suaves dançando devagar sobre a
  água (6, com deriva);
- Provas: mergulho alpha 1→0→1 no teste; caustics se movendo (3525px);
  regressão completa verde.

## v141 — margem viva: ponte rústica, pedra da referência e pássaro se banhando

- **Ponte rústica** (tábuas com tons alternados, frestas escuras e
  pregos — como a da referência) + **guarda-corpo de madeira** nas
  laterais de todas as pontes;
- **Pedra grande na margem** (cinza com musgo e brilho, até 6/mapa);
- **Pássaro se banhando**: pousa na beira da água, respinga 2x
  (ondinhas) e alça voo — a cada ~15s;
- Correção crítica: callback do banho quebrava o create da PerimScene
  (this solto) — pego pelo teste e corrigido com bind;
- test24: 8/8 (pedras, guarda-corpo 40, banho completo pousou→respingou
  →voou) e regressão total verde.

## v142 — CORREÇÃO: caverna secreta com tela preta

Reportado pelo jogador: ao cair no buraco secreto, a Caverna Secreta
ficava toda preta e o jogo travava (nenhuma cena ativa).

- **Causa**: o gancho de limpeza da v130 (anti-corpos fantasmas) acessava
  `physics.world.staticBodies` sem proteção — no desligamento da cena ao
  CAIR NA CAVERNA o physics já estava desmontado, o erro estourava e
  interrompia a transição (Perim sai, Cave não entra);
- **Correção**: gancho blindado com try/catch e verificação de world;
- **Provas (test25, 5/5)**: cair no buraco → CaveScene ativa → caverna
  populada (256 objetos, player ativo) → desmoronamento expulsa em
  ~13,5s → volta ao Perim. Screenshot mostra a caverna renderizada com
  contagem regressiva, corda e balões;
- Regressão completa verde (14 arquivos de teste).

## v143 — polimento final (feedback de gameplay)

- **Patos a 10% da velocidade** (passeio tranquilo, patinhos com passo
  calmo na fila);
- **Anti-stuck em 450ms**: o herói não fica mais 1s inteiro deslizando
  nas bordas — troca de direção bem antes;
- **Casas NUNCA dentro do lago**: se a área cair na água, a casa é
  empurrada pro terreno seco mais próximo;
- **Y-sorting completo**: girassol, monstros e decoração de margem
  respeitam a profundidade das árvores (quem está ao sul fica na frente,
  ao norte fica atrás da copa) — fim dos vazios sobre a árvore;
- **Grama 100% padronizada**: um único tom de verde base + detalhes a 5
  tons (imperceptível que é um quadrado — como no piso da pedra);
- **Névoa uniforme** (grade tremida, quase imperceptível), **sombras de
  nuvem sem bordas retas** e **manchas d'água redondas** (fim dos
  quadradinhos azuis no lago);
- test26 novo: 7/7 (prova por pixels da cor única + velocidade do pato +
  casas secas + y-sorting SUL/NORTE) e 16 arquivos de teste verdes.

## v144 — desempenho (FPS no celular)

- **Chão assado em 1 canvas**: todos os ~4.300 sprites de tile de grama/
  areia/barro/trilha foram fundidos num único canvas (groundbake) desenhado
  uma vez por mapa — a cena cai de **4.648 para ~430 objetos**;
- **Água sem Image duplicada**: os tiles de água ficam só como dados
  (máscara + profundidade); o visual continua sendo a água orgânica da
  v138 (margens, areia, espuma, profundidade, glints, caustics);
- **Modo lite em touch** (`ontouchstart`/`maxTouchPoints`): borboletas
  10→6, vaga-lumes 16→8, pétalas 14→7, caustics 6→3 — mantendo tartarugas,
  patos, peixes, coelhos, pássaros e todo o resto da vida;
- **Reentrada blindada**: se a textura groundbake já existir (travelTo
  recria a cena), ela é removida antes do addCanvas — chão nunca vira
  "missing texture" na 2ª/3ª entrada (prova test14b: 3 entradas seguidas,
  9/9 ×2);
- **Números medidos (Chrome headless, CPU 4× via CDP)**: antes 4.648
  filhos / 11 FPS → depois **431 filhos / 23 FPS @CPU4×** e **60 FPS sem
  throttling**;
- Pontes continuam como imagem (profundidade correta sobre a água);
- Regressão completa verde: test4 (24), test5 mobile (OK), test8 (10),
  test9 (18), test11 (22), test12 (10), test13 (13), test14 (12),
  test14b (9), test15 (10), test16 (13), test17 (13), test18 (18),
  test19 (17), test21 (10), test22 (6), test23 (7), test24 (8),
  test25 (5), test26 (7).

## v145 — desempenho II (foco no celular)

- **Buffer do canvas a 80% em touch**: no celular o jogo renderiza em um
  buffer 20% menor (com `Phaser.Scale.NONE` fixo) e o CSS estica o canvas
  preenchendo a tela inteira com `image-rendering: pixelated` — fica
  nítido, sem banda preta e corta ~36% dos pixels por frame (o maior
  custo de CPU/GPU num celular);
- **Desktop intocado**: buffer integral + Scale.RESIZE como antes;
- **`powerPreference: 'high-performance'`**: pede a GPU mais rápida do
  aparelho;
- **Modo lite ainda mais leve em touch** (só decoração; nada de gameplay):
  libélulas 5→3, ripples do herói 240→400ms, folhas à deriva 8→4, folhas
  caindo 14→7, cristais 8→4, sombras de nuvem 3→1 (Perim) e 2→1
  (Exterior), bolhas 550→900ms;
- **Números (Chrome headless, CPU 4×)**: v143 = 11 FPS → v144 = 23 →
  **v145 = 37 FPS em touch** (3,4×) com a tela inteira preenchida;
  desktop 447 filhos / 22 FPS @CPU4× / 59 FPS sem throttle (mantido);
- **Prova visual**: screenshot em viewport de celular (390×844) mostra o
  jogo ocupando a tela toda, pixelado nítido, água orgânica e HUD intactos;
- Regressão completa verde: test4 (24), test5 mobile (OK), test8 (10),
  test9 (18), test11 (22), test12 (10), test13 (13), test14 (12),
  test14b (9), test15 (10), test16 (13), test17 (13), test18 (18),
  test19 (17), test21 (10), test22 (6), test23 (7), test24 (8),
  test25 (5), test26 (7).

## v146 — desempenho III (culling + auto-degradação)

- **Culling de estáticos no touch**: 186 objetos parados (árvores, casas,
  pedras, decor) que ficavam FORA da tela passam a ser escondidos — o
  Phaser não faz culling automático, então tudo era desenhado à toa
  (a tela só mostra ~13% do mapa). Só ficam visíveis os ~63 perto da
  câmera; o conjunto troca sozinho conforme o herói anda (prova test27:
  interseção de 3 em 63 após andar 700px — 3/3);
  Seguros de fora: monstros, patos, tartarugas, borboletas (tweens),
  pontes e tudo que tem colisão além de árvore/casa;
- **Auto-degradação**: se depois de ~12s o aparelho rodar a menos de
  22 FPS, o buffer cai sozinho para 65% (prova: CPU 16× → buffer
  312→253 sem intervenção);
- **Números (Chrome headless, CPU 4×, viewport celular)**: v143 = 11 →
  v144 = 23 → v145 = 37 → **v146 = 49 FPS** (4,5×) com a tela inteira
  preenchida; desktop segue intocado (sem culling);
- **Visual idêntico**: screenshot ancorado na margem mostra água
  orgânica, patos, taboas, girassol e sombras — nada desaparece
  (v146_margem.png); regressão completa verde nos 20 arquivos.

## v147 — Tribos de Perim (elementos + portal em abas + safe zones + progressão)

### 1. Vantagens elementais (Dromos) — regra estrita ×1,15
- Ciclo: ÁGUA > FOGO > TERRA > AR > ÁGUA (+15% de dano no ciclo);
- Tudo fora do ciclo = 1.00 (sem resistências — regra do design);
- `elementMultiplier(atk, def)` reescrita como dados declarativos
  (`ELEMENT_CYCLE`) + aliases de legado (raio→Ar, planta→Terra,
  sombra→Água) para não quebrar habilidades nem saves antigos;
- Monstros remapeados: Voltrax=Ar, Sibilora=Terra, Noctumbra=Água;
  `elementWeaknessText` mostra "fraco contra/forte contra" no novo ciclo.

### 2. Portal em 4 abas de tribo
- `TRIBES` (OverWorld 🌿, UnderWorld 🔥, Danian 🐝, Mipedian 🏜️) +
  estado `PORTAL_UI.tab`; M'arrillian aparece desabilitada (futura);
- Cards por mapa: badge 🛡 SAFE ZONE, "Mapa N da tribo", nível exigido,
  barra + % de escaneamento e estado 🔒 com o motivo exato do bloqueio
  (meta clara = retenção); clicar bloqueado explica e NÃO viaja.

### 3. Safe Zones Nv 1 (mapa 1 de cada tribo)
- ow_grove Bosque Verdejante (floresta harmoniosa), uw_ember Cavernas de
  Brasas (lava estática laranja), dan_hive Túneis do Monte Pillar
  (lago de néctar âmbar), mip_oasis Oásis Enfumaçado (areia + água azul
  + névoa 2,4×);
- `safe: true` → criaturas não perseguem NEM atacam (Perim e Caverna);
  scans/trilhas/recompensas funcionam iguais;
- Temas visuais por região (grama/água/areia/névoa) aplicados no bake
  do chão v144 — 4 biomas fiéis ao universo de Chaotic;
- 4 espécies por Safe Zone (100% de scan alcançável no idle).

### 4. Progressão: scan 100% + nível
- `checkMapUnlock(playerLevel, currentMapScanPercentage, targetMapLevel)`
  (função pura): mapa N exige 100% do mapa N-1 + nível (N-1)×10
  (mapa 2 = Lv10, mapa 3 = Lv20, mapa 4 = Lv30...);
- `mapScan` por região persistido no save; cada espécie nova escaneada
  sobe o % do mapa com feedback "📑 Mapa: N%" e marcos;
- `mapUnlocked()` valida no travelTo E no portal; quem já visitava uma
  região antes da v147 mantém o acesso (nada de progresso perdido);
- Novos jogadores começam no Bosque Verdejante (Safe Zone do OverWorld).

**Provas (test28, 36/36)**: ciclo elemental completo + legados, 5 abas,
badge/bloqueio/notificação, temas pixel-provados nos 4 biomas (lava
176,52,20 · âmbar 154,122,68 · areia 194,168,106), monstro sem atacar
(HP estável), 0%→100% liberando Caverna de Lava em Lv10, persistência.
Regressão completa verde (21 arquivos, incl. PVP online test4 24/24) e
FPS mantido (touch 42 @CPU4×, desktop 23 @CPU4×/453 filhos).

---

## v2.15 — v148: Sobrevivência Idle (pools, aggro, fuga, auto-port, gadgets)

### 1. Pool de criaturas por mapa (fonte única `MAP_POOLS`)
- **Mapas 1 (Safe Zones)**: exatamente **4 espécies, 100% passivas** —
  ow_grove, uw_ember, dan_hive e mip_oasis;
- **Mapas 2 (Prado Verde, Cavernas de Lava, Pântano Sombrio, Ruínas do
  Tempo)**: **6 espécies, 2 agressivas** (`isAggressive:true`);
- `AGGRO_SPECIES` = lista canônica de agressivos (Lobo Cinzento, Aranha
  Gigante, Cão/Salamandra de Magma, Crocodilo, Maré M'arrilliana,
  Sentinela Eterna, Paradoxo, Dragão Jovem, Gárgula de Perim,
  Abominação); floresta/montanha/beirada do vazio herdam 2 agressivos;
- IIFE de fauna zera as regiões antigas e reconstrói tudo dos pools —
  uma única fonte de verdade (sem divergência spawn × codex).

### 2. Aggro Radius + perseguição + DPS de contato
- `aggroRadiusOf(type)`: **0** para passivos e dentro de Safe Zones;
  **150px** para agressivos (só relevante a partir dos mapas 2);
- Agressivo persegue a v=55 dentro do raio e aplica **DPS de contato**
  (`atk + (nível da criatura − nível do tipo)`) ao encostar;
- `e.peaceful` agora é **por espécie** (`!type.isAggressive`) — antes
  era só da meadow; label ☮️ segue a espécie certa.

### 3. IA idle de fuga/kiting (o herói NUNCA luta)
- Agressivo próximo (visão = detecção + 60px): o herói **foge na
  direção oposta** até sair do raio + 30px de margem;
- Scan idle **só na beirada** do limite de segurança (agressivo entre
  o herói e a borda → "Alvo fugiu!" e o scan aborta; passivo → normal);
- Caça passiva de cartas ignora agressivos e exige o mapa sem
  penalidade — sobreviver em primeiro lugar, lucrar depois.

### 4. Auto-Port —`emergencyPortOut()` (HP ≤ 20%)
- Dispara **antes** do bloco de morte: invulnerável 6s
  (`invulUntil`), HP restaurado, animação de TP (anel + feixe de luz +
  12 partículas + flash) e volta ao **Pátio Central**;
- **Scans do mapa preservados** (nada se perde) e **penalidade de
  −10% na exploração** daquele mapa (`mapPenalty[regiao]`, persistida);
- **Re-scan recupera**: escanear de novo uma espécie já conhecida num
  mapa penalizado devolve −10% (penalidade zera a 0 e o mapa volta a
  100%); sem carta duplicada no acervo;
- Bateria crítica continua voltando ao Pátio pelo fluxo antigo.

### 5. Gadgets do Scanner (equipáveis ANTES de explorar)
- Novo painel "🧰 Gadgets do Scanner" + strip no portal de viagem;
- **🥷 Manto de Furtividade**: raio de ameaça dos monstros −30%
  (150 → 105px) — encosta mais perto sem virar alvo;
- **👟 Botas de Agilidade**: velocidade do movimento idle +15%
  (119 → 137) — fugas mais fáceis;
- 1 gadget equipado por vez (`toggleGadget`); escolha persistida no
  save e validada no load (`manto`/`botas`, senão null).

**Provas (test29, 24/24)**: pools 4×4 e 6×6 com 2 agressivos por mapa 2,
aggro=0 em Safe Zone, Lobo persegue v=55 (dot=1,0), DPS de contato,
passivo nunca persegue, fuga 90→187px, Manto 150→105, Botas 119→137,
strip+2 cards+equipar pela UI, auto-port (Pátio+invul+HP ok+penalidade
10%+scans mantidos 6/6), re-scan 10→0 e mapa 100%.
Regressão completa verde (test4–test29). Screenshots: v148_lobo_persegue,
v148_autoport, v148_gadgets, v148_safezone.

---

## v2.16 — v149: Chefe de Mapa + Fone de Escuta + Botas de Nado

### 1. CHEFE DE MAPA — o líder da tribo guarda o mapa dominado
- Fechar **100% de escaneamento** num mapa de tribo desperta o CHEFE:
  **Maxxor** (Guardião do OverWorld, Prado Verde), **Chaor** (Senhor do
  UnderWorld, Cavernas de Lava), **Rainha Illexia** (Mãe do Enxame Danian,
  Pântano Nebuloso) e **Príncipe Ire** (Estandarte Mipediano, Ruínas do
  Tempo) — todos Lv.14;
- O herói NÃO luta: o desafio é **escanear o Chefe à base de fuga e
  stalk na beirada** — raio de ameaça **220px** e velocidade **62**
  (agressivos comuns: 150px/55); sprite 1,7× maior com label
  "👑 Nome Lv.14 — Título" dourada;
- Recompensa: **carta lendária exclusiva** com fanfarra
  ("👑 CARTA LENDÁRIA!"); `isBoss` → nunca duplica (spawn dedupado e
  nasce `scanned` se a carta já está no acervo);
- O **Manto de Furtividade não engana o Chefe** (raio segue 220) —
  as Botas de Agilidade viram o gadget da moda;
- **Guardião permanente**: revisitou o mapa dominado → o Chefe
  re-desperta (delayedCall 2,5s no create), inclusive sem re-carta;
- Safe Zones continuam absolutas: aggro 0 até para o Chefe.

### 2. Fone de Escuta Code Master 🎧 (gadget 3)
- **Seta-guia** orbitando o herói aponta o agressivo mais próximo em
  até 420px — **dourada** quando o alvo é o Chefe, vermelha no comum;
- Só informação: o herói idle usa a seta para escolher a rota de fuga
  (depth 8.5, some sem gadget).

### 3. Botas de Nado 🏊 (gadget 4)
- **Água funda dos lagos vira rasa para o herói**: process-callback do
  collider v130 retorna false com o gadget → atravesse qualquer lago
  (monstros continuam contornando — vantagem tática de fuga);
- Água rasa (rios) segue igual: atravessável desde a v131.

### 4. FIX de produto — scanBar DOM (crash do game loop)
- `createScanBar` chamava `.destroy()` em elementos **DOM**
  (`scanBar`/`scanBarText` são `<div>` criados via createElement; o
  correto é `.remove()`, como já fazia o `cancelScan`). Um novo scan
  iniciado com barra remanescente **derrubava o game loop** —
  alcançável desde o scan de agressivos na beirada (v148) e
  **provocado no teste** (pageerror capturado). Corrigido para
  `.remove()` + comentário.

### 5. Correção silenciosa da v148 — janela de scan da beirada
- A janela de scan de agressivos era `SCAN_RANGE+70` (166px) — MENOR
  que a beirada de fuga (raio 150 + 30 = 180px): **sem Manto era
  impossível escanear agressivos** (100% do mapa 2 inalcançável).
  Agora a janela = **raio + 80** (230px, dentro da beirada) e o abort
  de scan usa o MESMO critério — progressão 100% viável em qualquer
  gadget.

**Provas (test30, 22/22 ×4)**: 4 chefes nos 4 mapas de tribo, raio 220,
Manto 220/105 (não engana o Chefe), perseguição v=62, fuga do herói,
fone liga/desliga, janela de scan (Lobo a 200px entra em scan — janela
morta da v148 curada), carta lendária (+1 scanned, Chefe consumido),
nado bloqueia sem gadget e atravessa com gadget, 4 cards na UI, strip
nomeando o gadget certo, safe zone inofensiva, guardião re-desperta sem
re-carta. Regressão test4–test29 100% verde (test29 recalibrado: 24/24).
Screenshots: v149_chefe, v149_fone, v149_nado, v149_gadgets.

---

## v2.17 — v150: Arena do Chefe + Invasão M'arrillian + Clã do Clima + Modo Foto

### 1. 5ª TRIBO — Lagoa Negra M'arrillian (mapa Lv.40)
- Nova tribo no portal (**5 abas reais**, teaser removido) e nova região:
  **Lagoa Negra M'arrillian** — bioma de águas negras (grama #2e4a4a,
  névoa 2,2×), marcos "Trono Afundado" e "Cicatriz das Marés";
- Pool próprio: 6 espécies, **2 agressivos** (Maré M'arrilliana +
  Sentinela Eterna); desbloqueio especial: **Lv.40** (a invasão É o
  marco — motivo explicado no cadeado do portal);
- 5º Chefe: **Lord Van Bloot**, Almirante das Águas Negras (Lv.24,
  raio 220, art 'mare' gigante) — guarda a Lagoa como os demais
  guardiões guardam seus mapas.

### 2. ARENA DO CHEFE (Câmara do Drome)
- Seção nova no painel de qualquer Mestre do Código: os **5 Guardiões
  escaneados** viram oponentes da Sala de Batalha (mesmo jogo em tempo
  real, modo Difícil) — Maxxor, Chaor, Illexia, Ire e Van Bloot com
  times tribais próprios e dificuldade crescente (base 70→78);
- Desafiável SÓ com a carta lendária do Chefe no acervo (🔒 caso
  contrário, com dica do % do mapa); contador de vitórias por Chefe;
- Recompensas: 1ª vitória +💠800 · +200 XP · **🧩 Fragmento garantido**;
  revanches +💠300; derrota +💠60 (consolado);
- Vitórias persistem no save (`bossArenaWins`).

### 3. CLÃ DO CLIMA — missões diárias dos Chefes
- 3 templates novos: 🥷 Sobrevivente (escape do Chefe ×2 — o abort de
  scan com o 👑 na cola conta!), 👑 Caçador de Reis (escaneie um Chefe)
  e ⚔️ Desafiante (vença na Arena);
- **1 missão de Chefe GARANTIDA por dia** (último slot do quadro);
- Handlers `escape_boss`/`scan_boss`/`arena_win` no motor de missões.

### 4. MODO FOTO 📸 (painel ⚙️)
- Esconde HUD/chat/joystick/labels dos monstros, congela o herói para
  a pose e entra **moldura dourada com legenda da região** + botão de
  saída; screenshots limpos de Perim no celular.

**Provas (test31, 19/19 ×3)**: 5 tribos, Lagoa Negra Lv.40/pool
6/2 agressivos/tema, Van Bloot Lv.24 raio 220, portal 5 abas sem
teaser + card novo, Lv.30 bloqueado → Lv.40 libera, Arena (painel,
bloqueio sem scan, abertura boss150:meadow, 1ª vitória 800+frag,
revanche 300), Clã (garantida/dia, escape ×2, scan ×1), Modo Foto
ON/OFF (HUD, moldura, pose, retorno). Regressão test4–test30 100%
verde (test28/test30 atualizados p/ 5 abas/5 chefes; test10 ganhou
cleanup do mock:8905 — mock órfão entre execuções mentia a 3c).
Screenshots: v150_lagoa_negra, v150_foto, v150_arena.
