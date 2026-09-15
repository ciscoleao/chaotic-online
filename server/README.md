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
