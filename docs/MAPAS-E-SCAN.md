# 🗺️ Mapas separados de verdade + scan consertado + pontes, Caverna Secreta, o fim dos quadrados escuros e o herói indo atrás da criatura

**Chaotic.IdleWorld · v2.33** · aplicado em `chaotic_idleworld_v123.html`
(continua com o mesmo nome do arquivo — é só substituir o antigo)

> 🔝 **Última rodada (v2.33):** a **FORJA-7** (o robô que forja a chave do Drome) ganhou o **painel novo** e a
> **receita nova**: a Drome Key agora é feita com **🧭 Fragmento da Exploração ×1 + ⚔️ Fragmento de Batalha ×5 +
> ⚙️ Fragmento do Tempo ×7 + 💠 400 bits**. Cada fragmento vem de um lugar diferente do jogo (100% de um mapa ·
> vitória em batalha · tempo jogado). Detalhes na **seção 16**.
>
> 📜 Rodada anterior (v2.32): os os **materiais agora têm NÍVEL**: 15 tipos em 3 tiers de 5 — os mapas
> de **nível 1** só dropam o tier 1, os de **nível 2** só o tier 2 e os de **nível 3** (e a Lagoa Negra) só o
> tier 3 (com 5 materiais **novos**), e o **upgrade da mochila** passou a pedir
> **5×10 · 5×20 · 10×10 · 10×20 · 15×10**. O painel do **COSTURA-11** virou uma **mesa holográfica** com a
> mochila em wireframe, cartões com barra de progresso e os braços robóticos. Detalhes na **seção 15**.
>
> 📜 Rodada anterior (v2.31): o ícone do elemento **TERRA** deixou de ser o planeta **🌍** e virou
> **⛰️ montanha** (na carta, no Scanner e na Coleção) — era o que causava a dúvida no print do Texugo
> Escaldado. Detalhes na **seção 14**.
>
> 📜 Rodada anterior (v2.30): a **carta de scan foi refeita** (na captura e no Scanner):
> só **nome, raridade, os 4 status, os círculos de elemento com a tribo no meio**, o **Mugic** e o
> **código** — sem textos soltos nem habilidade — e a **qualidade virou escala de 50 pontos** com pesos
> (**Fraco 60% · Médio 25% · Bom 10% · Excelente 4,9% · Perfeito 0,1%**). Detalhes na **seção 13**.
>
> 📜 Rodada anterior (v2.29): o **banco de 120** virou **a fonte de criaturas do jogo
> inteiro** — a **Roleta**, o **Leilão** (ofertas e pedidos), o **MASTER**, os **duelos**, a **Drome**,
> os **códigos** e os **decks dos 7 Mestres do Código** passaram a sortear só as 120 (nada mais de
> monstro antigo aparecendo), e o **Portal de Viagem** ganhou a faixa “🧬 Banco de 120 criaturas —
> X/120 escaneadas” que abre a Coleção. Detalhes na **seção 12**.
>
> 📜 Rodada anterior (v2.28): o **banco de 120 criaturas** entrou na **BATALHA** (o **elemento** da
> espécie decide o arquétipo de luta e **vida/dano/velocidade** saem da ficha dela — Dromo e PVP) e
> nasceu a **COLEÇÃO das 120** dentro do jogo: um botão no **acervo do Scanner** abre o painel com
> **Todas + as 4 tribos** (30 cada), progresso **x/120**, filtro **Escaneadas/Faltando** e a ficha
> completa de cada espécie. Detalhes na **seção 11**.
>
> 📜 Rodada anterior (v2.27): o banco de 120 virou **o conteúdo de Perim** — pools por tribo/mapa,
> spawn ponderado, velocidade por espécie, ficha nas cartas e o mapa 3 dos Mipedians (seção 10).
>
> 📜 Rodada anterior (v2.25): o herói **VAI ATRÁS E ESCANEIA QUALQUER CRIATURA**, inclusive as
> **agressivas dentro do mapa 1 SAFE ZONE**. No seu print do Bosque Verdejante ele passou quase colado
> numa **Aranha Gigante Lv.6** e não fez nada: a Safe Zone zera o raio de ameaça (correto — lá nada te
> persegue), mas o auto-move usava esse mesmo zero para **descartar** os agressivos da caça. Agora o
> zero desliga só a fuga: criatura a **≤160px → vai atrás**; a **≤96px → PARA e escaneia (3s)**. E, se
> ela encostar, o herói **recua andando sem largar o scan** (senão o toque cancelava a carga para
> sempre). Detalhes na **seção 8**.
>
> 📜 Rodada anterior (v2.24): fim dos **QUADRADOS ESCUROS** no mapa — a grama decorada e os barrancos
> ficavam com a paleta do mapa anterior; agora toda troca de mapa re-assa tudo o que depende do tema
> (seção 7).

---

## 1. O que você relatou

> *"Eu estava no Bosque e meu amigo nas Cavernas (dois mapas diferentes) e a gente ainda
> conseguia se ver, como se só tivesse mudado as cores dos mapas, mas estávamos no mesmo lugar.
> E os monstros eram todos os mesmos. E eu não consegui scanear ninguém, mesmo a criatura
> passando do meu lado — meu personagem não seguia a criatura nem tentava scanear."*

Os dois problemas existiam mesmo, e eram **três coisas diferentes**:

| # | O que você viu | Causa real |
|---|---|---|
| 1 | Jogadores em mapas diferentes se vendo (e o chat **PERTO** misturado) | o online identificava a sala por `GameState.location`, que vale **`'perim'` para TODOS os mapas**. Ou seja: para o servidor, Bosque Verdejante e Cavernas de Brasas eram a **mesma sala** |
| 2 | "Parecia o mesmo lugar com outra cor" | o terreno (rio, lagos, pedras, árvores) era **sorteado do zero a cada viagem**, sem semente. Dois mapas pequenos saíam com o mesmo "clima" de relevo e pareciam o mesmo lugar repintado |
| 3 | Não dava para escanear, ninguém para escanear, monstros iguais | (a) o herói do Auto-Move mirava **pontos fora do mapa** (as metas usavam o tamanho do Pórtico, 3200×2400, em mapas de 2000×1500) e ficava batendo na borda; (b) havia só **2 criaturas** por mapa, vivendo **20 s** cada; (c) quando o scan começava, a criatura **continuava andando** e saía do alcance de 96 px antes dos 3 s de carga — o scan era cancelado com *"Alvo fugiu!"* |

---

## 2. O que mudou (v2.21)

### 2.1 Cada mapa é um mapa (online)
- O jogo agora manda para o servidor o **id da região** como sala: `ow_grove`, `uw_ember`,
  `dan_hive`, `mip_oasis`, `lava_cave`, `time_ruins`… (e `portico`, `exterior`, `drome`, `cave`
  continuam como salas próprias).
- Consequências:
  - você **não vê** mais quem está em outro mapa (nem o nome flutuante, nem o sprite);
  - o chat **PERTO** só conversa **com quem está no mesmo mapa** (o servidor já filtrava por esse
    campo — o problema era o valor que o jogo mandava);
  - ao trocar de mapa, os sprites de quem ficou no mapa antigo **somem na hora**.
- Nenhuma mudança foi necessária no servidor — ele sempre guardou o campo; agora recebe o valor certo.

### 2.2 Cada mapa tem o SEU terreno (e sempre o mesmo)
- A geração do relevo usa uma **semente derivada do id da região**. Resultado:
  - o Bosque Verdejante é **sempre o mesmo bosque** (você reconhece onde está e onde ficam os lagos);
  - Cavernas de Brasas **não é** o Bosque repintado: rio, lagos, mata e pedras saem em outro desenho;
  - a cor/atmosfera continua sendo o tema da tribo (lava, âmbar, areia, névoa…).

### 2.3 O SCAN (regra do jogo, exatamente como você definiu)

```
   ┌─ a carga do scan leva 3 SEGUNDOS (SCAN_CHARGE_TIME = 3000ms)
   ├─ o alvo tem de estar a no máximo 3 TILES = 96px (SCAN_RANGE)
   └─ se uma criatura passa a até 5 TILES = 160px (MONSTER_DETECT_RANGE),
      o herói do Auto-Move VAI ATRÁS dela para tentar escanear
```

- **A criatura perde 50% DA VELOCIDADE** enquanto é escaneada — ela **pode escapar** dos 3 tiles
  antes dos 3 s e o scan falhar (*"Alvo fugiu!"*). É assim de propósito.
- **O Caçador fica PARADO** enquanto escaneia (só a barra de carga avança).
- O alvo **pode desaparecer** no fim da vida dele (20 s) até no meio de um scan — faz parte do idle.

> ⚖️ **Balanceamento (definido pelo autor):** criaturas são **RARAS** — o mapa 1 tem no máximo **2** vivas
> por vez (o cálculo é por área do próprio mapa) e cada uma dura **20 SEGUNDOS**. O jogo é para ser
> difícil: deixar o Caçador horas no mapa até aparecer uma criatura e conseguir escaneá-la é o objetivo.
>
> **O que eu consertei foi só BUG, não dificuldade:** o herói do Auto-Move mirava metas **do tamanho do
> Pórtico** (3200×2400) mesmo em mapas menores (Bosque = 2000×1500) e ficava preso na borda — era isso que
> fazia parecer que "ele não seguia a criatura". Agora as metas respeitam o mapa atual.

### 2.4 Monstros por mapa (o que você encontra em cada lugar)
| Mapa | Criaturas |
|---|---|
| 🛡 **Bosque Verdejante** (OverWorld 1) | Slime Verde, Lobo Cinzento, Escudeiro de Perim, Aranha Gigante |
| 🔥 **Cavernas de Brasas** (UnderWorld 1) | Esqueleto, Bruto Subterrâneo, Chamão do Caos, Gárgula de Perim |
| 🐝 **Túneis do Monte Pillar** (Danian 1) | Mandiblor Daniano, Vespa Daniana, Aranha Gigante, Sombra |
| 🏜 **Oásis Enfumaçado** (Mipedian 1) | Batedor Mipediano, Encantador Mipediano, Maré M'arriliana, Dragão Jovem |
| 🌊 **Lagoa Negra M'arrillian** (Lv.40) | Maré/Devorador M'arriliano, Sombra, Senhor do Vazio, Sentinela Eterna, Flagelo Abissal |
| *mapas 2 e 3 de cada tribo* | pools próprios, com **2 espécies agressivas** (Prado Verde, Caverna de Lava, Pântano Nebuloso, etc.) |

> Nas **Safe Zones** (mapa 1 de cada tribo) os monstros são pacíficos: o herói idle caça e escaneia
> em paz. Nos mapas 2+ existem agressivos — aí ele foge/stalka e escaneia na "beirada" da área de ameaça.

---

## 3. Como testar com um amigo (5 minutos)

```
1) Os dois entram pelo site, cada um com o seu personagem;
2) um vai para o BOSQUE VERDEJANTE e o outro para as CAVERNAS DE BRASAS (Portal de Viagem);
   → cada um deve estar SOZINHO na tela (ninguém do outro mapa aparece);
3) o do bosque escreve no chat na aba PERTO — o outro NÃO recebe (mapas diferentes);
4) os dois vão para o MESMO mapa: agora um vê o outro andando, com o nome em cima;
5) ligue o Auto-Move (tecla P) e observe: o herói encontra criaturas, chega perto e a barra
   SCANNING completa — o Scan Card aparece com o código de 12 letras;
6) abra o Portal de Viagem e olhe o relevo: cada mapa tem o seu desenho.
```

---

## 4. Testes feitos (Chrome real, no arquivo final, servidor Node de verdade)

```
A) DUAS CONTAS EM MAPAS DIFERENTES (Bosque × Cavernas)
   • presença no servidor .... "NTA@ow_grove" × "NTB@uw_ember" ✓ (antes: os dois "perim")
   • se vêem? ............... NÃO ✓ (0 sprites do outro em cada tela)
   • criaturas no mapa ...... Bosque: Lobo/Slime/Escudeiro/Aranha (5) × Cavernas: Bruto/Chamão/Gárgula ✓
B) MESMO MAPA
   • os dois no bosque ...... um VÊ o outro (sprite + nome) ✓
   • B volta às cavernas .... o sprite dele DESAPARECE na tela do A na hora ✓
   • chat PERTO ............. A no bosque fala e B (nas cavernas) não recebe ✓;
                              B indo para o bosque volta a receber ✓
C) SCAN — REGRAS MEDIDAS NO ARTEFATO FINAL (v2.21c)
   • carga do scan .......... 3 s (3000ms) ✓
   • alcance de scan ........ alvo a ≤3 tiles (96px) ✓
   • perseguição ............ sempre iniciada a ≤5 tiles (160px) ✓ (medido: 4,3–4,9 tiles)
   • herói durante o scan ... PARADO ✓ (0 px/s em 42 quadros medidos)
   • criatura no scan ....... anda a ~52 px/s (50% da velocidade dela) e PODE escapar ✓
   • taxa real de sucesso ... 6 de 9 scans concluídos (67%) com a criatura a ~2 tiles (IA normal);
                              0 de 5 no pior caso (criatura andando em linha reta para longe) — difícil de propósito
   • vida útil .............. 20,03 s medidos (mesma criatura rastreada por identidade) ✓
   • raridade ............... mapa 1: no máximo 2 vivas por vez; em 137 s de observação ficou a maior parte do
                              tempo com 0–1 criatura no mapa ✓ (é para achar pouco, mesmo)
   • metas fora do mapa ..... 0 ✓ (o conserto de bug que fazia o herói bater na borda)
   • Cavernas de Brasas ..... scan completo do "Chamão do Caos" ✓ (print abaixo)

   (detalhe de design: criaturas AGRESSIVAS não entram nessa conta de propósito —
    o herói idle foge delas e só escaneia na "beirada" da área de ameaça.)
D) TERRENO
   • Bosque (ida) × Bosque (volta) .. soma dos tiles IGUAL ✓ (mapa tem identidade)
   • Bosque × Cavernas ............... soma DIFERENTE ✓ (relevo próprio)
E) REGRESSÃO
   • HUD do mapa ............ "Bosque Verdejante · OverWorld · Mapa 1 da tribo · SAFE ZONE" ✓
   • janelinha (PiP) ........ funções presentes e modo "janela própria" ✓
   • save/recarregar ........ região, scans e nível preservados ✓
   • erros de página ........ nenhum ✓
```

Prints desta rodada: `print_mapa_bosque.png` (o bosque com o HUD novo),
`print_mapa_cavernas.png` (scan concluído nas Cavernas de Brasas) e
`print_mapa_pillar.png` (Túneis do Monte Pillar).

---

## 5. v2.22 — Pontes com começo, meio e fim + scan na Caverna Secreta

Os dois problemas desta rodada vieram dos seus prints (`uploads/image-1.png` e `image-2.png`).

### 5.1 "As pontes soltas no lago sem sentido" (print do Bosque Verdejante)

O que você viu: **tábuas soltas na grama**, pedaços de ponte cortados no meio do lago e pontes que
acabavam dentro da água, sem chegar na outra margem.

Eram **duas regras antigas da geração do mapa** somadas:

| # | Causa | O que ela produzia |
|---|---|---|
| 1 | *toda* estrada que tivesse água do lado virava ponte (`path` → `bridge`) | tabuleiro de tábuas no meio do capim, longe de qualquer água |
| 2 | os **lagos eram desenhados depois** e pulavam os tiles de estrada/ponte que já existiam | pedaço de estrada (e de ponte) **ilhado dentro da água**, sem saída |

**Conserto:** as pontes passaram a ser construídas **por último**, quando toda a água do mapa
(rio + lagos) já está pronta. Para cada coluna de travessia — as 3 colunas fixas do mapa
(0,22 / 0,52 / 0,80 da largura) **mais** as colunas onde uma estrada encosta na água — o jogo
procura a **faixa contínua de água** e só constrói a ponte se ela tiver:

```
   ┌─ TERRA FIRME (grama ou estrada) nas DUAS pontas  → começo e fim garantidos
   ├─ pelo menos 3 tiles de água no meio              → a ponte atravessa de verdade
   └─ a ponte é desenhada só onde havia água           → nenhuma tábua cai em terra firme
```

Se não existir travessia válida naquela coluna, **não existe ponte**. Nada de tábua solta e nada
de ponte sem saída — é o que o seu print pedia: *"ponte é pra ter o começo, meio e fim"*.

**Testes (medidos nos 5 mapas: Bosque, Cavernas de Brasas, Túneis do Monte Pillar, Oásis, Prado;**
todos os tiles de ponte do mapa analisados um por um, v2.21c × v2.22):

```
                                   v2.21c (antes)            v2.22 (depois)
  tiles de ponte ................. 65 / 65 / 58 / 70 / 70    97 / 144 / 75 / 109 / 109
  pontes de verdade .............. 5 / 8 / 4 / 10 / 10       4 / 4 / 3 / 3 / 3
  pedaços soltos / sem travessia .. 2 / 5 / 1 / 7 / 7 (22)   0 / 0 / 0 / 0 / 0
  pontes que não começam e
  terminam em terra firme ........ 5 mapas com problema      0  ✓
  estradas ilhadas na água ....... 0                          0  ✓
  erros de JavaScript ............ 0                          0  ✓
```

Ou seja: **22 dos 37 "pedaços" da versão antiga eram tábua solta ou ponte sem saída** — todos
 desapareceram. (A v2.22 tem menos pontes porque as falsas não são mais construídas; as 17 que
existem começam e terminam em terra.)

Print desta rodada: `docs/img/ponte-bosque-v222.png` — o herói **em cima** de uma ponte que
atravessa o lago inteiro, com a outra ponte do mapa aparecendo no canto.

### 5.2 "A Caverna Secreta não escaneava do lado da criatura" (print com a Aranha Gigante)

O que você viu: o herói parado **do lado de uma Aranha Gigante Lv.5**, com o
*DESMORONAMENTO* correndo e **nenhum scan acontecendo**.

**Causa:** a IA da caverna tinha a regra *"não caçar criaturas agressivas"*
(`if (e.type && e.type.isAggressive) continue;`). No mapa aberto isso faz sentido (agressivo =
perigo, o herói stalkeia de longe) — mas dentro da caverna significava que **a Aranha Gigante
(espécie agressiva) era invisível para o herói**: ela podia ficar colada nele e o Auto-Move
seguia vagando como se a caverna estivesse vazia.

**Conserto:** a caverna voltou a caçar **qualquer** criatura — inclusive as agressivas — com
beirada de segurança, mantendo o scan 2x mais rápido de lá:

```
   ├─ se aproxima até max(48px, raio de ameaça + 24)  → para na BEIRADA do perigo
   ├─ escaneia de fora do raio (cancela só se passar de max(96px, raio + 40))
   └─ se a criatura colar nele durante a carga, ele recua andando SEM largar o scan
```

**Testes (caverna, aranha agressiva forçada a 40–45px do herói — igual ao seu print):**

```
   ARANHA A ~45px DO HERÓI (o seu print):        v2.21c (antes)   v2.22 (depois)
   • primeiro scan pedido ...................... NUNCA            0,2 s  ✓
   • tempo com a aranha perto SEM escanear ..... 15,4 s           0,0 s  ✓
     (desse total, colado a menos de 3 tiles) .. 6,9 s            0,0 s  ✓
   • scans concluídos .......................... 0                1 (a 44px)  ✓
   • estados da IA (quadros) ................... só wander        39 scan (o resto wander/chase)
   ARANHA A ~230px (longe):
   • primeiro scan pedido ...................... NUNCA            2,7 s  ✓
   • scans concluídos .......................... 0                1 (a 83px)  ✓
   • se aproximou até .......................... 52px (por acaso)  40px (de propósito)  ✓
   CRIATURA PASSIVA (Slime Verde) na caverna:
   • scan 2x mais rápido ....................... funciona        funciona (carga 1508ms)  ✓
   • erros de JavaScript ....................... 0                0  ✓
```

> ℹ️ Nos dois cenários o herói **sempre** larga o scan por conta própria se a criatura
> escapar do alcance ou colar nele (a criatura vaga rápido: pode falhar e ele tenta de novo —
> é a dificuldade que você pediu, agora **tentando** em vez de ficar parado).

Print desta rodada: `docs/img/caverna-scan-v222.png` — **o mesmo enquadramento do seu print**
(Aranha Gigante Lv.5 colada no herói dentro da caverna), agora com **"SCANNING..."** e o aviso
*"Scan rápido (caverna)!"* na tela.

### 5.3 O que NÃO mudou (de propósito)

- A regra do scan: carga de **3 s**, alvo a ≤**3 tiles (96px)**, perseguição a ≤**5 tiles (160px)**.
- O balanceamento do autor: criaturas **raras** (mapa 1 com no máximo **2** vivas), vida de **20 s**,
  a criatura **perde 50% da velocidade** ao ser escaneada (pode escapar e o scan falhar) e
  **o herói PARA para escanear**.
- O scan **2x mais rápido** da Caverna Secreta (1,5 s) e o desmoronamento de 15 s da caverna.
- O servidor, o site e o `server.js`: **nada** mudou neles nesta versão.

---

## 6. v2.23 — O rio de ponta a ponta + 3 pontes (só no rio) + scan com o bicho colado

### 6.1 "Criou pontes mal feitas, quebrou o rio" (seus dois prints)

O que os prints mostravam: **decks largos de madeira** cobrindo a água (um deles com 8 tiles de
largura por 7 de altura), **pontes que não levavam a lugar nenhum** no meio do mato e o **rio
interrompido por terra**. Eram **três problemas somados** — os dois primeiros nasceram na v2.22:

| # | Causa | O que produzia no mapa |
|---|---|---|
| 1 | a **praia de chegada** (o lugar onde você nasce) convertia em estrada qualquer água ali — inclusive a do rio | o **rio cortado** no meio do mapa |
| 2 | a v2.22 transformava em travessia **toda coluna em que uma estrada encostava na água** | dezenas de pontes coladas uma na outra → **DECKS** de 4×5 e 8×7 tiles cobrindo o rio |
| 3 | uma dessas colunas passava por cima de um **lago** (água funda) | **ponte em lago**, que você proibiu |

**Como ficou agora (a sua regra, ao pé da letra):**

```
   ┌─ O RIO É UM PERCURSO DE PONTA A PONTA: cada tile de água do rio é marcado e, no
   │  fim da geração, um passe reimpõe a água em qualquer ponto onde terreno tentou
   │  tapá-lo. Além disso o rio DESVIA da praia de chegada (deslocamento suave de 1
   │  tile por coluna) — em vez de a praia cortar o rio.
   ├─ SÓ 3 PONTES: nas colunas 0,22 · 0,52 · 0,80 da largura (esquerda, meio, direita).
   │  Acabou a regra "toda coluna com estrada na beira da água" — era ela que criava os decks.
   ├─ PONTE SÓ NO RIO, NUNCA NO LAGO: faixa com água funda é lago e não recebe ponte.
   └─ Cada ponte continua com começo, meio e fim: terra firme nas duas pontas e no
      mínimo 3 tiles de água no meio.
```

**Testes (medidos nos 5 mapas, tile por tile, com o mapa desenhado em texto):**

```
                                        v2.22 (antes)          v2.23 (depois)
  ow_grove — tiles de ponte ............ 97 (4 "pontes")        45 (3 pontes)  ✓
  ow_grove — o maior aglomerado ........ 42 tiles (deck 8x7)   15 tiles (ponte 3x5)  ✓
  travessias sem começo/fim em terra ... 3                      0  ✓
  pontes em cima de ÁGUA FUNDA (lago) .. 3 tiles                0  ✓
  rio — colunas com água ............... 62/63 (cortado!)       63/63  ✓
  rio — terreno dentro da água ......... 1 corte (praia)        0  ✓
  os 5 mapas ........................... 4 mapas com problema   15 pontes, 0 problemas  ✓
                                        (2 decks + ponte em lago)
```

Print desta rodada: `docs/img/rio-3pontes-v223.png` — o rio atravessando o Bosque de ponta a ponta
com as **três pontes** (esquerda, meio, direita), o herói em cima da da esquerda.

### 6.2 A Caverna Secreta: scan com a criatura **colada** no herói

Depois do conserto da v2.22 a caverna já caçava a Aranha Gigante, mas ficou um caso travado, medido
no teste: com a criatura **encostada** (25px), o toque dela **cancela o scan a cada 1,2 s** e a carga
da caverna precisa de **1,5 s** (o scan 2x) → o scan **nunca fechava** (medi: **25 tentativas, 0
concluídas**). No mapa aberto isso não acontece porque o recuo só dispara quando existe raio de
ameaça — e na caverna/safe zone o raio é zero.

**Conserto:** na caverna, quando o alvo chega a menos de **44px**, o herói **recua andando SEM largar
o scan** (é o mesmo comportamento que já estava documentado para o mapa aberto). Sai do alcance do
toque, fecha a carga de 1,5 s e, se a criatura fugir depois, ele volta a caçar.

```
        CAVERNA — aranha agressiva            v2.22      v2.23
        colada (~45px): scans concluídos ..... 1          1  ✓
        colada e depois encostada (25px) ..... 0 (travava) 1  ✓  (2 rodadas: 4/4 cenários)
        criatura longe (~230px) .............. 1          1  ✓
        criatura passiva (Slime Verde) ....... 1 (1,5 s)  1 (1,53 s)  ✓
```

### 6.3 O que NÃO mudou (de propósito)

- A regra do scan: carga de **3 s**, alvo a ≤**3 tiles (96px)**, perseguição a ≤**5 tiles (160px)**.
- O balanceamento do autor: criaturas **raras** (mapa 1 com no máximo **2** vivas), vida de **20 s**,
  a criatura **perde 50% da velocidade** ao ser escaneada (pode escapar e o scan falhar) e
  **o herói PARA para escanear** (na caverna ele só dá passos para trás quando o bicho encosta).
- O scan **2x** da Caverna Secreta, o desmoronamento de 15 s, o servidor e o site.

---

## 7. v2.24 — Os quadrados escuros no mapa (corrigido)

### 7.1 O que você viu

No seu print do **Bosque Verdejante** o chão tinha, espalhados pela grama verde, **quadrados quase
pretos** (alguns com pedra, cogumelo, tufo ou flor dentro) e a **faixa de barranco** na beira da
praia também aparecia escura — bem diferente do print que eu mandei, onde tudo estava verdinho.

### 7.2 A causa (medida, não chutada)

Cada tribo tem a **sua paleta** de grama (Bosque `#3f9a46` verde · Cavernas de Brasas `#4a3230`
marrom-escuro · Túneis do Monte Pillar `#9a7a44` âmbar · Oásis `#c2a86a` areia · Lagoa Negra
`#2e4a4a` verde-escuro). **Três** famílias de textura são desenhadas com essa paleta:

| Textura | Onde aparece | Era re-assada ao trocar de mapa? |
|---|---|---|
| `grass_0..2` | grama lisa (75% dos tiles) | ✅ sim |
| `gdec_0..11` | **grama decorada** — pedra/cogumelo/tufo/flor (25% dos tiles) | ❌ **não** |
| `bk_*` | **barranco** da margem da água | ❌ **não** |

Ou seja: a grama lisa mudava de cor junto com o mapa, mas a **decorada e o barranco ficavam
congelados na paleta do mapa em que o jogo foi aberto**. Provado no Chrome:

```
BOOT do jogo dentro de Cavernas de Brasas:  grass_* = #4a3230   gdec_* = #4a3230   (tudo certo)
DEPOIS do Fast Travel -> Bosque Verdejante: grass_* = #3f9a46   gdec_* = #4a3230   <-- os quadrados
                                            bk_* (corpo)        = #4a3230
```

Medindo o seu print: as manchas escuras eram exatamente **`#4a3230` / `#4b3432` / `#4c3432`** — a
paleta de **Cavernas de Brasas** dentro do Bosque. Não era filtro, cache do navegador nem WebGL:
era textura assada com a cor do mapa errado (por isso só tinha ¼ de tiles escuros — exatamente os
25% que usam a grama decorada).

### 7.3 A correção

1. **Trocar de mapa re-assa tudo o que depende do tema**: grama lisa, as **12 texturas de grama
   decorada** (`gdec_*`) e os **barrancos** (`bk_*`, que são apagados para serem recriados com a
   paleta nova).
2. **Rede de segurança**: antes de assar o chão, a cena do mapa confere se as texturas estão na
   paleta da região em que o herói está — se não estiverem, refaz na hora (nenhum caminho de jogo
   fica de fora).

### 7.4 Provas (Chrome real, no jogo servido pelo `server.js`)

| Verificação | Antes | Depois |
|---|---|---|
| Bosque depois de vir das Cavernas: `gdec_*` | `#4a3230` (escuro) | `#3f9a46` (verde) ✅ |
| Bosque depois de vir das Cavernas: barranco `bk_*` | `#4a3230` | `#3f9a46` ✅ |
| Pixels da paleta escura na área do print do Bosque | **11,0%** | **0,1%** (tons do tronco) ✅ |
| Volta para as Cavernas (direção inversa) | manchas verdes | 100% no tema escuro ✅ |
| Os 5 mapas: grama + 12 decoradas + barranco | — | 5/5 com a paleta certa ✅ |
| Regressão: CONFIG, 5 mapas, caverna 2x, `?pip=1` | — | OK, 0 erros ✅ |
| Rio (63/63 colunas, 0 cortes) e 15 pontes terra-terra | — | 3+3+3+3+3, 0 defeito ✅ |

Prints desta rodada: `mapa_bosque_limpo_v224.png` (o mesmo lugar do seu print, agora limpo) e
`mapa_5_temas_v224.png` (os 5 mapas lado a lado, cada um com a sua paleta).

### 7.5 O que NÃO mudou (de propósito)

- A regra do scan (**3 s**, alvo ≤**3 tiles/96px**, perseguição ≤**5 tiles/160px**) e o balanceamento
  do autor (criaturas raras, vida de 20 s, 50% de lentidão ao escanear, herói **para** para escanear).
- O scan **2x** da Caverna Secreta, o recuo com o bicho colado, o rio de ponta a ponta, as **3 pontes
  só no rio**, 0 pontes em lagos, o servidor e o site.
- As cores de cada tribo continuam as mesmas — o que muda é que agora **todas** as texturas do chão
  acompanham o mapa em que o herói está.

---

## 8. v2.25 — O herói vai atrás e escaneia qualquer criatura (inclusive em Safe Zone)

### 8.1 O que você viu

> *"Passei pela aranha quase do lado e meu personagem passou reto, não foi atrás dela e nem escaneou ela."*

O print é o **Bosque Verdejante · OverWorld · Mapa 1 · 🛡 SAFE ZONE**, com a legenda vermelha
**"Aranha Gigante Lv.6"** (vermelho e **sem ☮️** = espécie agressiva) logo abaixo do herói, no meio do
caminho do auto-move. O herói andou em linha reta, passou a poucos pixels dela e não reagiu —
**nem perseguiu, nem escaneou**.

### 8.2 A causa (medida no jogo real, não chutada)

O raio de ameaça (`aggroRadiusOf()`) é **0 nas Safe Zones** — isso é de propósito: no mapa 1 nada te
persegue, então não existe IA de fuga lá. **O problema é que o auto-move usava esse mesmo zero para
decidir que a criatura não existia:**

| onde | linha (antes) | efeito |
| --- | --- | --- |
| bloco de fuga/stalk | `if (aggroRadiusOf(m.type) <= 0) continue;` | o agressivo nunca entrava na lista de ameaças (certo) — mas era o único caminho que olhava para ele |
| caça passiva | `if (e.type && e.type.isAggressive) continue;` | **todo agressivo era descartado da caça** (o bug) |

Somando as duas: nos **4 mapas 1 (os SAFE ZONE)** uma criatura agressiva era **invisível para o
auto-move** — dava para atravessar por cima dela. Medido no Chrome, no jogo servido pelo `server.js`,
antes da correção: Aranha Gigante a 120px do herói em `ow_grove` → o herói chegou a **58px** dela em
estado `wander` puro, **0 scans iniciados** e **0 scans concluídos**.

### 8.3 A correção (duas partes, uma de cada vez)

**v159 — o zero passa a desligar SÓ a fuga.** A caça vale para toda criatura, em qualquer mapa,
agressiva ou não: a **≤160px (5 tiles)** o herói vai atrás; a **≤96px (3 tiles)** ele **PARA** e
escaneia por **3s**. Em Safe Zone o agressivo não persegue o herói, então não havia motivo nenhum para
ignorá-lo. A "beirada estendida" do scan (raio de ameaça + 80) continua valendo **só onde o raio
existe**; em Safe Zone valem os 96px canônicos.

**v159c — blindagem do update (achada nos testes).** Quatro pontos do jogo faziam
`corpo.enable = false` **sem conferir se o corpo ainda existia**. Se uma criatura fosse **destruída**
(e não apenas morta/vencida) no meio de um scan, a linha explodia com `TypeError` **dentro do update
da cena** — e tudo o que vinha depois dela naquele quadro não rodava. Num jogo idle que fica horas no
automático, uma exceção dessas é **congelamento**. Agora esses quatro pontos só mexem no corpo se ele
existir; no jogo normal o comportamento é **idêntico**. (Reproduzido de propósito num teste: destruir
o alvo no meio do scan → antes, erro de página; depois, o herói cancela, volta a andar e nada trava.)

**v159b — o caso do toque.** A criatura a **≤32px cancela o scan a cada 1,2s** (regra de contato). Em
Safe Zone ela **não causa dano**, mas o cancelamento continuava valendo: o herói ficava literalmente
encostado, a carga reiniciava para sempre e a criatura **nunca** era escaneada — o mesmo laço que a
caverna já tinha resolvido na v2.23. Agora, **colado (alvo a menos de 44px), o herói RECUA ANDANDO SEM
LARGAR O SCAN** (a carga não é zerada). Fora desse caso vale a regra canônica: **o herói fica PARADO
enquanto escaneia**.

### 8.4 Provas (Chrome real, no jogo servido pelo `server.js`)

| cenário | resultado |
| --- | --- |
| **agressiva a 120px em `ow_grove` (SAFE ZONE)** — o seu caso | **antes: 0 scans · depois: perseguiu, parou e escaneou** |
| passiva (Slime Verde) a 120px em SAFE ZONE (controle) | 2 scans concluídos (não regrediu) |
| agressiva em mapa **não-safe** (`meadow`) | 3 scans concluídos **só de fora do raio de ameaça** |
| **fuga/stalk** em mapa perigoso (aranha a 100px, dentro do raio de 150px) | herói saiu para **221px**, nunca voltou ao raio (mín. 141px) e escaneou **de fora** (182px) |
| **scan em SAFE ZONE** (agressiva a 90px) | iniciado a **40px** (limite 96) · carga **3033ms** (canônico 3000) · herói a **0 px/s** ao concluir |
| **scan COLADO** (agressiva a 20px) | recuou andando até **83px** e concluiu a carga (**3177ms**) — sem laço de cancelamentos |
| regressões | título v2.25 · 5 mapas abrem · caverna **scan 2x** (1525ms) · `?pip=1` ok · 15 pontes com começo/meio/fim · 5/5 temas · quadrados escuros 0,1% |
| **alvo destruído no meio do scan** (blindagem v159c) | antes: erro de página `Cannot set properties of undefined` · depois: **0 erros**, o herói cancela e volta a andar |

Prints: [`comparativo_aranha_antes_depois_v225.png`](comparativo_aranha_antes_depois_v225.png) (seu print
em cima, a correção embaixo) e [`print_v225_scan_agressiva.png`](print_v225_scan_agressiva.png)
(herói parado ao lado da aranha com a barra "SCANNING…" carregando) e
[`print_v225_cacada_natural.png`](print_v225_cacada_natural.png) (a mesma caçada em jogo natural:
vai atrás → para e escaneia → carta da criatura).

### 8.5 Jogo natural (sem forçar spawn nenhum)

Além dos testes com criatura travada, deixei o jogo rodando **sozinho** no Bosque Verdejante e
observei **200 s de jogo** (auto-move ligado, nenhum spawn forçado): nasceram **14 criaturas sozinhas**,
6 delas agressivas (Aranha Gigante Lv.5-6, Lobo Cinzento Lv.3-4). O herói largou o rumo, foi atrás e
escaneou — a caçada completa (perseguição → parada → 3 s de carga → carta da criatura) levou **13
segundos** no primeiro caso. Print: `print_v225_cacada_natural.png` (3 quadros da mesma caçada).

> ⚠️ **Detalhe técnico do teste:** o Chrome sem tela (headless) daqui roda a ~7 quadros por segundo e
> entrega ao jogo menos tempo por quadro do que um navegador normal — a vida de 20 s da criatura e a
> carga de 3 s do scan saem de sincronia e o scan quase nunca fecharia. Para medir de forma justa,
> **sincronizei o relógio do jogo com o relógio de parede** (1 s de jogo = 1 s real, como no seu PC a
> 60 fps) em todos os testes de jogo natural desta rodada.

**Por que um scan ainda pode falhar** (medido — em 100% dos cancelamentos foi isso): a criatura **saiu
dos 96px** (3 tiles). Escaneada, ela anda na **metade da velocidade**, mas continua andando: numa
tentativa típica a distância ia de ~40px a ~100px em **1 segundo** e o scan caía. Isso é exatamente a
regra que você pediu — *"ao ser escaneada a criatura perde 50% da velocidade (pode escapar e o scan
falhar)"* e *"o jogo é difícil de propósito: deixar o personagem por horas no mapa para conseguir um
Scan bom"*. O herói **não desiste**: volta, persegue e tenta de novo — nos testes fechou o scan em
5 s, 41 s e 52 s de tentativas (e num deles de primeira, em 4,9 s).

### 8.7 O SEGUNDO CAMINHO DO "PASSA RETO" (v160) — alvo inalcançável

Depois de corrigir a caça em Safe Zone (v159), fui procurar **outro jeito** de o herói passar reto por
uma criatura — e achei: o estado de **perseguição** (`chase`) ignora todo o resto do mapa e **não tinha
desistência**. Como as **criaturas não colidem com casas/paredes** (só com a água funda) e o **herói
colide**, o alvo pode atravessar uma casa e deixar o herói **empurrando a parede para sempre** —
enquanto uma Aranha Gigante passa colada e ele não faz **nada**.

> **Medido antes da correção:** herói em `chase` atrás de um alvo, Aranha Gigante a **87px** dele →
> **0 tentativas de scan** na aranha, **0 quadros** perseguindo ela, e o herói ainda **se afastou**
> (chegou a 184px). É o sintoma exato do seu print, por um caminho diferente.

**Correção (v160):** em `chase`, o herói larga o alvo quando
- fica **~2,4s sem sair do lugar** e sem chegar perto (empurrando parede), **ou**
- o alvo **dispara para além de 300px** (9+ tiles) sem o herói se aproximar.

Aí volta a `wander` e a caça normal (≤160px) pega quem estiver por perto. Vale no **mapa aberto** e na
**Caverna Secreta**. Depois da correção, no mesmo cenário: **12 tentativas de scan na aranha** e ela
perseguida em 7 quadros.

**Jogo livre (210s, nada forçado):** 12 criaturas nasceram (6 agressivas), o herói perseguiu em 158
quadros e tentou 8 scans — as falhas tiveram todas motivo canônico: *fugiu dos 96px* (3), *toque* (2),
*expirou* os 20s de vida (2). Zero erros de página.

### 8.8 O que NÃO mudou (de propósito)

- A **fuga/stalk** nos mapas perigosos (raio 150, Chefe 220, Manto −30%) — conferida no teste de fuga.
- O **scan**: 3s de carga, alvo a ≤96px, detecção a ≤160px, o herói **para** para escanear, a criatura
  RARA perde **50% da velocidade** ao ser escaneada (ela pode escapar e o scan falhar).
- A **vida de 20s** das criaturas, o **re-scan só sob penalidade** e a **Caverna Secreta 2x** (com o
  recuo de 44px de lá).
- O jogo continua **difícil de propósito**: o scan pode falhar, e é assim que deve ser.

---

## 9. v2.26 — Opções limpas, Auto-Move automático, itens raros e o MASTER dos Dromos

### 9.1 O que você pediu (com o print do painel de Opções)

1. *"Remova o comando P de auto move, pois a pessoa não pode controlar quando pode estar em auto move,
   essa função é exclusiva para mapas de criaturas."*
2. *"Remova também esses textos explicativos deixando apenas o ícone com o nome dentro de OPÇÕES."*
3. *"Esses itens não são recolhidos com tanta facilidade justamente pra eles terem mercado no leilão."*
   (10% da quantidade que existia.)
4. Um **NPC MASTER na Ilha dos Dromos**: +1 LV, +1000 Bits, +1 Scan aleatório, +1 Equipamento de
   batalha e +1 Mugic — **um botão para cada**.

### 9.2 Auto-Move automático (v161)

- A **tecla P saiu do jogo** (zero `keydown-P` no código) e o botão 🤖/⏸ do celular virou só 👆 (interação).
  Você **não controla mais** o auto-move.
- `GameState.autoMove` é decidido pela cena, no `create()` de cada mapa:

| Onde | Auto-Move | Por quê |
|---|---|---|
| Bosque Verdejante · Cavernas de Brasas · Túneis do Monte Pillar · Oásis Enfumaçado · Lagoa Negra | **LIGADO** | são os mapas de criaturas |
| Caverna Secreta | **LIGADO** | é o lugar do scan (2x) |
| Pátio Central · Ilha dos Dromos · Dromo (arena) | **DESLIGADO** | lá o controle é 100% seu |

- No mapa de criaturas **não dá para desligar** e no Pátio **não dá para ligar**: não existe mais tecla
  nem botão para isso — quem decide é o mapa em que você está.

### 9.3 O painel de Opções ficou só ícone + nome (v161)

- Saíram os parágrafos de ajuda/aviso/dica (`opt-mode-note`, a nota fixa da janelinha etc.). O painel
  abre com **10 botões, cada um só com o ícone e o nome**: PC/Celular · Som · Música · Cor · Movimento ·
  Janelinha · 🪟 (abrir janela) · Tela cheia · Reconectar · Deslogar.
- Se a janelinha flutuante falhar, o aviso continua aparecendo — mas **na hora, como aviso rápido na
  tela** (toast), não como texto fixo dentro de OPÇÕES.

### 9.4 Itens no mapa a 10% (v162)

| Onde | Antes | Agora |
|---|---|---|
| Qualquer mapa de criaturas | nascia com 20 · até 60 no chão | nasce com **2** · **teto 6** |
| Mesma conta, já com a escala do tamanho do mapa | 8 iniciais / até 23 (Lagoa Negra: 11 / 34) | **1 inicial / até 2** (Lagoa Negra: 1 / 3) |
| Caverna Secreta | 3 | **1** (a caverna nunca fica vazia) |

- Medido no jogo rodando: mapa abre com **1–2 itens** e o pico ao longo do tempo ficou em **2**, contra
  8–11 na versão anterior. Item agora é item: raro, e por isso **tem mercado no Leilão**.

### 9.5 O NPC MASTER da Ilha dos Dromos (v163)

- Um **NPC dourado** (rótulo **MASTER**) fica na Ilha dos Dromos, a leste do posto do escrivão. Chegue
  perto e aparece o atalho **[E] Falar com o MASTER** — também funciona **no toque (👆)** e no clique.
- O painel do MASTER tem **6 botões**: ✕ (fechar) · **+1 LV** · **+1000 Bits** · **+1 Scan aleatório** ·
  **+1 Equipamento de batalha** · **+1 Mugic**. Cada botão dá **uma** coisa — sem sorteio misturado.
- O **+1 LV** leva o nível para o próximo e recalcula os atributos pelo mesmo caminho do jogo
  (no teste: 99 → 100 deu +10 de HP, +2 de ATK, +1 de DEF). Os cards respeitam o **limite de 100 cartas**,
  e o **Scan aleatório** credita a **região certa da espécie** no banco de scans (do jeito que o mapa
  contaria se você tivesse escaneado lá).

### 9.6 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v226.js` — 22 ✅ · 0 ❌** (0 erros de página): painel de Opções com 10 botões e **nenhum texto
  explicativo**; o herói **não anda sozinho** no Pátio Central (0px em 4s) e **anda sozinho** no mapa de
  criaturas (545px em 5s); a tecla **P não desliga** o auto-move; Caverna Secreta ligado; Ilha dos Dromos
  **0px em 4s**; e o MASTER entregando LV, Bits, Scan, Equipamento e Mugic (LV 99→100, bits 10→1010,
  scan *Slime Verde* Lv.4 [Incomum] creditado em `ow_grove`, *Espada de Madeira*, *Hino do Overlord*).
- **`test_v226_itens.js` — 7 ✅ · 0 ❌**: itens 8→1 (teto 23→2) nos 5 mapas, caverna com 1 item, e as
  **regressões da v2.25 continuam verdes com o auto-move automático**: aranha **AGRESSIVA em SAFE ZONE**
  perseguida e escaneada (scan disparado a 44px, carga 3067ms), Caverna Secreta escaneada em **1517ms**
  (≈ 2x mais rápido) e **5/5 mapas** abrindo com auto-move ligado.
- Prints: `docs/img/opcoes-limpo-v226.png`, `docs/img/npc-master-v226.png`, `docs/img/itens-raros-v226.png`.

### 9.7 O que NÃO mudou (de propósito)

- O **scan**: 3s de carga, alvo a ≤96px, detecção a ≤160px, o herói **para** para escanear, a criatura
  RARA perde **50% da velocidade** (pode escapar e o scan falhar), **vida de 20s**, Caverna 2x com o
  recuo de 44px. O jogo continua **difícil de propósito**.
- O **rio de ponta a ponta com exatamente 3 pontes**, o fim dos **quadrados escuros**, a caça a
  agressivos **em SAFE ZONE** e o descarte do **alvo inalcançável** — tudo conferido rodando junto.

---

## 10. v2.27 — O banco de 120 criaturas integrado

### 10.1 O pedido

*"Pode integrar o banco de 120 criaturas."* — Sim: o banco deixou de ser um pacote separado e virou
**o conteúdo de Perim**. As 120 criaturas agora nascem nos mapas, aparecem nas cartas e valem no
Leilão/Dromo.

### 10.2 Como ficou

- **120 espécies de verdade**: 4 tribos × 30 criaturas (OverWorld, UnderWorld, Danian, Mipedian), cada
  tribo com 3 mapas — **m1 com 5 · m2 com 10 · m3 com 15** (7 passivas/8 agressivas no m3, 2 raras).
- **Cada criatura trouxe a sua ficha do banco**: HP, ATK, velocidade, XP, Bits, arte, **elementos**,
  **habilidade** (com custo de Mugic), **contadores de Mugic**, raridade e agressividade.

| Mapa do jogo | Criaturas | Tribo · mapa do banco |
|---|---|---|
| Bosque Verdejante · Cavernas de Brasas · Túneis do Monte Pillar · Oásis Enfumaçado | 5 cada | m1 de cada tribo (100% passivas) |
| Prado Verde · Caverna de Lava · Pantano Nebuloso · Ruinas do Tempo | 10 cada | m2 (1 rara, 4 agressivas) |
| Floresta Sombria · Picos de Cinza · Borda do Vazio · **Miragens do Palmeiral** | 15 cada | m3 (2 raras, 8 agressivas) |
| Lagoa Negra M’arrillian | 6 | segue o pool clássico (o banco não tem M’arrillians) |

- **Nova região: “Miragens do Palmeiral”** — o banco tinha **15 criaturas mipedianas do mapa 3** e o jogo
  não tinha esse mapa. Ela entrou como **Mapa 3 dos Mipedians** (Requer **Lv.20** + **100%** de scan das
  Ruinas do Tempo), com tema próprio de deserto/miragem e os marcos *Palmeiral Invertido* e *Espelho de
  Areia*. No Portal, a aba dos Mipedians agora mostra os 3 mapas.
- **Spawn ponderado pelo banco**: passiva **34** · agressiva **26** · **RARA 12**. Medido: 900 sorteios
  no mapa 3 deram **6,1% de raras** (o esperado pelo peso é 5,7%) — a rara continua sendo rara de
  encontrar, como você pediu.
- **Velocidade por espécie**: cada criatura anda na velocidade da sua ficha (`baseSpeed`), com **teto de
  175 px/s** para o herói (140 px/s) ainda conseguir alcançar. Na prática: m1 anda a 124–129 (mais lento
  que o herói, mapa 1 é o lugar do scan fácil), m2 a 142–155 e m3 a 166–240 (aí o teto entra). A regra
  da **RARA +20% de velocidade** continua valendo, e o **−50% ao ser escaneada** também.
- **Rótulo da criatura no mapa**: **★** marca a espécie **RARA** e **☮️** marca a **passiva** (a
  agressiva vem sem ☮️, em vermelho).
- **Cartas com a cara do banco**: a carta de scan, a da roleta e o painel do Scanner agora mostram
  **Tribo · Mapa**, **elementos do banco** (Terra 🌍, Água 💧, Fogo 🔥, Ar 🌪️ — não mais sorteados),
  **habilidade** e **Mugic**. A **raridade da espécie virou o piso da carta**: criatura RARA nunca sai
  como “Comum”, e muito-forte nunca sai como “Comum” (os IVs continuam podendo subir a carta).
- **HUD**: o banner do mapa e o card do Portal mostram **🐾 N espécies** — dá para saber na hora quantas
  espécies vivem ali (e, portanto, quantas faltam para os 100% de scan).
- **A progressão acompanhou**: o `%` de scan de cada mapa passa a ser sobre as espécies do banco (1/5,
  1/10, 1/15), então mapa 100% = **todas as espécies do banco daquele mapa escaneadas**.

### 10.3 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v227_banco.js` — 24 ✅ · 0 ❌**: 120 espécies registradas com ficha do banco; os 12 mapas com
  o pool certo (5/10/15, todos do banco); m3 com 2 raras e 8 agressivas; Miragens do Palmeiral existe,
  é mapa 3 (Lv.20) e nasce com 15/15 do banco; **sorteio ponderado** (6,1% de raras); **velocidade por
  espécie** (rara m3 224→175 px/s, m1 127 px/s); criatura rara nasce com o HP do banco e **★ no rótulo**;
  carta do scan com elementos/habilidade/Mugic e **piso de raridade** (IV fraco 2/2/2/2 → carta “Raro”);
  a ficha **sobrevive ao save/load**; o **MASTER +1 Scan** sorteia do banco e credita o mapa certo; a
  **Caverna Secreta** usa o pool do banco; o **Portal** mostra 🐾 por mapa e o Mapa 3 dos Mipedians.
- **Regressões verdes**: `test_v226.js` **22 ✅** (Opções limpas, auto-move automático, MASTER — o +1 Scan
  já entregando criatura do banco) · `test_v226_itens.js` **7 ✅** (itens a 10%; aranha agressiva em SAFE
  ZONE escaneada a 44px em 3017ms; Caverna escaneando em 1533ms) · `test_banco.js` **146 OK**.
- **A caça não piorou** (mesmo instrumento, 150s no Bosque Verdejante): v2.26 → 3 scans iniciados e 2
  concluídos; v2.27 → 3 iniciados e 1 concluído (mesma faixa, variação normal do mapa). No mapa 3 novo
  (**Miragens do Palmeiral**) a caça também funciona: 1 scan concluído com carga de 2983ms.
- Prints: `docs/img/banco-120-mapa-v227.png` · `banco-120-carta-v227.png` · `banco-120-portal-v227.png` ·
  `banco-120-scanner-v227.png`.

### 10.4 O que NÃO mudou (de propósito)

- A **Lagoa Negra M’arrillian** (5ª tribo) segue com o pool clássico — o banco não tem M’arrillians.
- A **arena do Dromo** sorteia espécies de todo o `ENEMY_TYPES`: como o banco entrou na lista, a arena
  passou a mostrar as criaturas novas **sem nenhuma mudança de código**.
- O **scan** (3s · 96px · 160px · o herói para para escanear · RARA −50% de velocidade **na hora do
  scan**), a **vida de 20s**, a **Caverna 2x**, os **itens a 10%**, o **auto-move automático** e o
  **MASTER** continuam exatamente como estavam na v2.26.

---

## 11. v2.28 — O banco de 120 na BATALHA + a COLEÇÃO das 120 dentro do jogo

### 11.1 O pedido

*"Pode integrar o banco de 120 criaturas."* — o banco já nascia nos mapas desde a v2.27; agora ele
fecha o ciclo **em todos os lugares em que a criatura aparece**:

1. **na BATALHA** (Dromo contra os 7 Mestres do Código e **PVP** contra outros jogadores);
2. na **COLEÇÃO** — as 120 fichas viram um **álbum jogável dentro do jogo**.

### 11.2 O ELEMENTO da criatura decide como ela luta

Cada espécie do banco tem **elementos** (Fogo 🔥, Água 💧, Terra 🌍, Ar 🌪️). Ao entrar na arena, o
elemento escolhe **um dos 6 arquétipos de luta** que o jogo já tinha — em vez de a arena sortear um
arquétipo qualquer:

| Elemento da espécie | Arquétipo na arena | Como ele briga |
|---|---|---|
| 🔥 Fogo | **Pyrodonte** | briga na frente, dano físico alto |
| 💧 Água | **Aquarion** | controle/velocidade (espécie **RARA** vira **Noctumbra**, o controle pesado) |
| 🌍 Terra | **Terramole** | tanque, vida alta (criatura **mística** vira **Sibilora**) |
| 🌪️ Ar | **Voltrax** | dano em área, mágico |

E os atributos deixam de ser sorteados: **saem da própria ficha do banco**.

```
   vida da arena ..... 0,85 + (HP da ficha   - 30) / 220     (piso 0,85 · teto 1,35)
   dano da arena ..... 0,85 + (ATK da ficha  -  5) / 100     (piso 0,85 · teto 1,35)
   velocidade ........ 0,90 + (vel da ficha  - 124) / 400    (piso 0,90 · teto 1,20)
```

A calibragem foi feita nas **faixas reais do banco** (HP 30–152 · ATK 5–49 · velocidade 124–225), e não
na média das cartas — foi assim que os multiplicadores deixaram de cair todos no piso. Exemplo medido:

```
   Falcão Carbonizado [Fogo] → Pyrodonte    HP 379 (base 330)   ·   fís 38 (base 34)
   multiplicadores reais medidos:  0,95–1,15 em vida  ·  0,91–1,12 em dano
```

- O **duelo leva a ficha consigo**: o jogo de batalha recebe `banco` no payload e mostra
  **“Habilidade de carta (banco): …”** na descrição da criatura, junto de **tribo**, **raridade** e
  **Mugic** — os Code Masters continuam com os decks que já tinham.
- O **Scan clássico** (as criaturas antigas, inclusive os M’arrillians) continua funcionando pelo
  mesmo caminho de antes — nada foi removido.

### 11.3 A COLEÇÃO das 120 dentro do jogo

No **acervo do Scanner** apareceu um botão novo que abre o painel **COLEÇÃO**:

| O que tem | Como é |
|---|---|
| **Abas** | **Todas** + as 4 tribos (OverWorld, UnderWorld, Danian, Mipedian) — **30 espécies** por tribo |
| **Progresso** | **x/30** em cada tribo e **x/120** no total (as **✓** vêm do seu scan real, por mapa) |
| **Filtro** | **Todas · Escaneadas · Faltando** — dá para caçar exatamente o que falta |
| **Cada espécie** | arte da carta · nível · **elementos** · **passiva ou agressiva** · **Mugic** · **em qual mapa do jogo ela vive** · **habilidade** · ✓ (se você já escaneou) |

- Só existe a **✓** quando a espécie está registrada no seu banco de scans (**o mesmo contador** que
  conta o `%` dos mapas) — o álbum é honesto: não “desbloqueia” nada sozinho.
- Medido no jogo rodando: as **120** espécies são listadas, **30** por tribo, **3/120** marcadas com a
  mesma conta de scans, filtro “Faltando” mostrando **117**, e o painel **fecha** sem travar nada.

### 11.4 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v228_batalha.js` — 16 ✅ · 0 ❌**: o elemento do banco escolhendo o arquétipo; os
  multiplicadores de vida/dano/velocidade dentro das faixas; o **Falcão Carbonizado [Fogo] → Pyrodonte**
  com **HP 379** e **fís 38**; o payload do Dromo **e** o do PVP levando a ficha; a arena (iframe real do
  Dromo) com **5 scans** de elementos fogo/terra/ar, mostrando a **habilidade do banco** na descrição e
  os Code Masters com o deck intacto; e as **120** abrindo no painel de Coleção (com as provas da seção
  11.3).
- **Regressões verdes na mesma build**: `test_v227_banco.js` **24 ✅** (pools 5/10/15, peso da rara,
  velocidade por espécie, carta com ficha, MASTER, Caverna, Portal) · `test_v226.js` **22 ✅** ·
  `test_v226_itens.js` **7 ✅** · `test_v227_portal.js` **3 ✅** · `test_banco.js` **146 OK** ·
  **0 erros de página** em todos.

Prints desta rodada: `colecao-120-v228.png` (a **Coleção das 120** aberta no jogo, com 5 espécies já
escaneadas em verde) · `colecao-120-mipedian-v228.png` (a aba **Mipedian**, com *Miragens do Palmeiral*) ·
`batalha-banco-v228.png` (a **Sala de Preparação** do Dromo: os Scans do jogador com o **elemento** de
cada espécie — Terra, Ar, Fogo, Água — e a **Habilidade de carta (banco)** na ficha).

### 11.5 O que NÃO mudou (de propósito)

- O **scan**: 3s de carga, alvo a ≤**96px**, perseguição a ≤**160px**, o herói **para** para escanear, a
  criatura RARA perde **50% da velocidade** (pode escapar e o scan falhar), **vida de 20s**, Caverna 2x
  com o recuo de 44px. O jogo continua **difícil de propósito**.
- Os **pools por mapa** (5/10/15), o **Mapa 3 dos Mipedians**, os **itens a 10%**, o **auto-move
  automático**, o **MASTER**, o rio de ponta a ponta com **3 pontes** e o fim dos quadrados escuros.
- O **servidor, o `server.js` e o site** — nada mudou neles. Só o jogo (`chaotic_idleworld_v123.html`).

---

## 12. v2.29 — O banco de 120 no jogo INTEIRO (Roleta, Leilão, Drome, Mestres)

### 12.1 O pedido

*"Pode integrar o banco de 120 criaturas."* — a v2.27 pôs as 120 **nos mapas** e a v2.28 **na batalha e
na Coleção**. Faltavam os sistemas que ainda sorteavam o **elenco antigo** do jogo. Agora **toda
criatura que aparece em qualquer lugar vem das 120 do banco**.

### 12.2 O que mudou (v166)

| Sistema | Antes | Agora |
|---|---|---|
| 🎰 **Roleta** — a lista "Monstros na Roleta" | o elenco antigo **+** as 120 | **só as 120 do banco** (com *Tribo · M1/M2/M3* e ★ na rara) |
| 💠 **Leilão** — ofertas de Scan | qualquer criatura do jogo | **só as 120** (preço por nível e raridade do banco) |
| 💠 **Leilão** — a lista de "pedidos" de criatura | todo o elenco (~50 nomes) | **só as 120** |
| 💠 **MASTER** — +1 Scan aleatório | qualquer criatura | **só as 120** (e continua creditando o mapa da espécie) |
| ⚔️ **Duelos aleatórios do Dromo** | qualquer criatura | **só as 120**, no nível compatível com o seu |
| 🌀 **Drome** (arena de ondas) | qualquer criatura | **só as 120** |
| 🎁 **Códigos promocionais** (+N Scans) | qualquer criatura | **só as 120** |

E os **7 Mestres do Código** deixaram de lutar com monstros antigos — cada um agora tem um **deck do
banco** da sua tribo:

| Mestre | Nível base | Deck (banco) |
|---|---|---|
| **Crellan** | 10 | Falcão Carbonizado · Tartaruga Flamejante · Texugo Escaldado *(OverWorld m2)* |
| **Hotekk** | 18 | Píton Tempestuosa · Feneco Célere · Verme-da-areia Pedregoso *(Mipedian m2 — os ancestrais)* |
| **Amzen** | 26 | Sapo Neblinoso · Cascudo Fuliginoso · Basilisco Ondeante *(UnderWorld m2)* |
| **Oron** | 34 | Feneco Pedregoso · Gênio Fluido · Jerboa Trovejante *(Mipedian m3)* |
| **Tirasis** | 42 | Javali Titânico · Castor Granítico · Cervo Vulcânico *(OverWorld m3)* |
| **Imthor** | 52 | Lagarta Titânica · Broca Tempestuosa · Centopeia Terrosa *(Danian m3 — as feras)* |
| **Chirrul** | 62 | **Lagartixa Férrea (★ RARA)** · Imp Flamejante · Gafanhoto Etéreo *(mapa 3 das tribos)* |

### 12.3 O banco agora aparece no Portal

No topo do **Portal de Viagem** entrou a faixa
**“🧬 Banco de 120 criaturas — X/120 escaneadas · abrir a Coleção 📖”** — um clique abre o painel da
Coleção (o mesmo da v2.28), então dá para conferir o banco sem procurar no Scanner.

### 12.4 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v229_banco_total.js` — 17 ✅ · 0 ❌**: as 120 na lista da Roleta (nenhum nome fora do banco);
  **300 ofertas** do Leilão sorteadas (todas com a ficha do banco); a lista de pedidos com
  **120 opções** do banco; **30** scans do MASTER (todos do banco e creditando o mapa certo);
  **80 duelos** aleatórios (só banco); os **7 decks** dos Mestres conferidos um por um; a faixa do
  Portal com o progresso (25/120 na medição) e abrindo a Coleção; e as regressões (Lagoa Negra com as
  6 M’arrillian clássicas; os 12 mapas do banco em 5/10/15).
- **`test_v229_drome.js` — 2 ✅ · 0 ❌**: entrando na Drome de verdade (com 1 Drome Key) — a onda 1/5
  nasceu com **Jerboa Trovejante, Carneiro Mineral, Basilisco Férreo e Caracol Vulcânico** (4/4 do banco).
- **Regressões na mesma build**: `test_v228_batalha.js` **16 ✅** · `test_v227_banco.js` **24 ✅** ·
  `test_v227_portal.js` **3 ✅** · `test_v226.js` **22 ✅** · `test_v226_itens.js` **7 ✅** ·
  `test_banco.js` **146 OK** · **0 erros de página**.

Prints desta rodada: `portal-banco-v229.png` (a faixa do banco no Portal) · `roleta-120-v229.png`
("Monstros na Roleta — as 120 do banco") · `leilao-banco-v229.png` (o Leilão vendendo scans do banco) ·
`drome-banco-v229.png` (a Drome com a onda do banco).

### 12.5 O que NÃO mudou (de propósito)

- A **Lagoa Negra M’arrillian** segue com o **pool clássico** — o banco não tem criaturas M’arrillian
  (e essa é a tribo daquele mapa).
- As **cartas que você já tinha no inventário continuam aí** — nada é apagado; a regra nova vale para
  tudo o que for **sorteado** de agora em diante.
- O **scan** (3s · 96px · 160px · o herói para · rara −50%), a **vida de 20s**, os **pools 5/10/15**, a
  **batalha com a ficha do banco**, a **Coleção**, os **itens a 10%**, o **auto-move automático**, o
  **MASTER**, o rio de ponta a ponta com 3 pontes e o servidor/site.

---

## 13. v2.30 — A CARTA DE SCAN NOVA + a qualidade em 50 pontos

### 13.1 O pedido (com a carta de referência em anexo)

1. *"Preciso que você refatore o componente visual da carta seguindo estas regras: apague 'OverWorld • Mapa
   2 • Passiva', 'Água • Mugic: 2' e a habilidade — a carta não deve ter textos explicativos soltos; só o
   nome, a raridade, os números dos status, o mugic e o código."*
2. *"Os 4 círculos centrais: o elemento em um dos círculos (2 elementos = 2 círculos) e o símbolo da tribo
   no meio."*
3. *"O teto dos atributos não é mais 31 e sim 50"* — com os pesos por faixa
   (Fraco 60% · Médio 25% · Bom 10% · Excelente 4,9% · Perfeito 0,1%).

### 13.2 A CARTA NOVA (a da captura e a do Scanner — um só componente)

| O que SAIU | O que FICOU |
|---|---|
| o bloco `OverWorld · Mapa 2 · Passiva` | **Nome** (topo, à esquerda) |
| o texto de elementos e `Água · Mugic: 2` | **Raridade** (topo, à direita, na cor da raridade) |
| a habilidade inventada (`Seiva Curativa`) e a linha "Habilidade" do painel | **4 caixas de status**: ❤️ vida · ⚔️ poder · 🎯 (IV **Estratégia**) · 🛡️ (IV **Vitalidade**) |
| os elementos em texto | **4 círculos centrais**: os **elementos** (1 ou 2 — os outros ficam vazios) em volta do **símbolo da tribo** no meio |
| — | **caixinha de Mugic** (🎵 + contador) |
| — | **QUALIDADE DO SCAN: X%** com a barrinha de 10 blocos |
| — | **STATUS: FRACO/MEDIO/BOM/EXCELENTE/PERFEITO** (na cor da faixa) |
| — | **CÓDIGO de 12 letras** na base (como sempre) |

- A raridade (o "RARO"/"ÉPICO"/"LENDÁRIO" do canto) continua sendo **a da carta** — a espécie RARA do banco
  segue valendo como **piso** (nunca sai abaixo de Raro).
- O **símbolo da tribo** no círculo do meio: 🌲 OverWorld · 🌋 UnderWorld · 🐝 Danian · 🏜️ Mipedian ·
  🌊 M'arrillian (e 🌀 para o que vier sem ficha do banco).
- A mesma carta abre em **três lugares**: na **captura** (ao completar o scan), no **acervo do Scanner**
  (clicando na miniatura) e ela é a referência do componente — não existe mais carta com layout antigo.

### 13.3 A ESCALA DE 50 PONTOS COM PESOS

`generateCreatureScan()` foi reescrita: em vez de sortear 4 números de 0 a 31 (média ≈ 15), ela **sorteia
a faixa primeiro (Weighted Random)** e depois gera os 4 atributos **dentro** dela, cada atributo de
**0 a 50**:

| Faixa | Média dos 4 IVs | Vira a raridade | Chance (pedido) | **Medido (120.000 scans)** |
|---|---|---|---|---|
| **FRACO** | 0 a 12 | Comum | 60,0% | **59,83%** |
| **MÉDIO** | 13 a 22 | Incomum | 25,0% | **25,15%** |
| **BOM** | 23 a 35 | Raro | 10,0% | **9,98%** |
| **EXCELENTE** | 36 a 45 | Épico | 4,9% | **4,95%** |
| **PERFEITO** | 46 a 50 | Lendário | 0,1% | **0,09%** |

- O **padrão das cartas mudou de figura**: agora **6 em cada 10 scans saem FRACO** — "Perfeito" é
  **1 em 1.000** (antes era 1 em 576). O teto de 50 pontos dá espaço para os atributos altos existirem de
  verdade quando a faixa é boa.
- O **STATUS** da carta é exatamente a faixa: a mesma função que sorteia também classifica (0 divergências
  medidas em 3.000 cartas), e o **%** mostrado é `média ÷ 50`.
- A **Roleta**, o **Leilão** e tudo o que gera carta de criatura usam **a mesma escala** (medido: 40.000
  cartas → 59,6% / 25,1% / 10,1% / 5,1% / 0,1%, 0 fora de faixa).
- O painel do **Scanner** (barras STR/DEX/VIT/INT) também passou a medir em 50, e a antiga linha
  "Habilidade" saiu de lá.

### 13.4 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v230_carta.js` — 26 ✅ · 0 ❌**: a distribuição por peso (5 faixas, tolerância apertada);
  todos os IVs em 0–50; a média sempre dentro da faixa sorteada; a carta sem `Mapa/Passiva`, sem
  elementos em texto, sem Mugic em texto e sem a habilidade; os 4 status; os círculos dos elementos com a
  tribo no meio (conferido numa espécie de **2 elementos**: 🌍 💧 + 🌲); a caixinha de Mugic; QUALIDADE +
  STATUS + RARIDADE + CÓDIGO; a carta guardada no acervo; a carta do **Scanner** com o mesmo componente; e
  as regressões (IVs 0–50 nas criaturas do mapa, Roleta/Leilão com STATUS, save preservando 1–4 elementos).
- **Regressões na mesma build**: `test_v228_batalha.js` **16 ✅** · `test_v229_banco_total.js` **17 ✅** ·
  `test_v229_drome.js` **2 ✅** · `test_v227_banco.js` **24 ✅** · `test_v227_portal.js` **3 ✅** ·
  `test_v226.js` **22 ✅** · `test_v226_itens.js` **7 ✅** · `test_banco.js` **146 OK** · **0 erros de página**.

Prints desta rodada: `carta-scan-v230.png` (a carta da captura: Pato Gélido, RARO, 47/11/23/40, 💧 +
🌲, Mugic 2, QUALIDADE 64% · BOM) · `carta-rara-v230.png` (uma **ÉPICO**, com QUALIDADE 84% · EXCELENTE) ·
`carta-scanner-v230.png` (a mesma carta aberta no acervo do Scanner).

> ℹ️ **Cartas antigas** (de antes desta versão) continuam abrindo normalmente: o **STATUS** delas é
> recalculado pelas faixas novas na hora de exibir, e os elementos já salvos são mantidos.

### 13.5 O que NÃO mudou (de propósito)

- As **raridades** e o que elas valem (Comum ×1,0 · Incomum ×1,3 · Raro ×1,7 · Épico ×2,3 · Lendário ×3,0
  nos atributos; ×1/×1,6/×2,6/×4,5/×9 no preço do Leilão).
- Os **pisos** da v164 (espécie RARA ★ → no mínimo Raro; muito-forte → no mínimo Incomum; Chefe →
  Lendária), o **scan** (3s · 96px · 160px · o herói para · rara −50%), a **vida de 20s**, os pools
  5/10/15, a **batalha** com a ficha do banco, a **Coleção** e o banco como fonte de criatura do jogo
  inteiro (v2.29) — só o **número do IV** das cartas mudou de escala.

---

## 14. v2.31 — O elemento TERRA virou MONTANHA ⛰️

### 14.1 O pedido

*"Poderia mudar o ícone de planeta terra para uma montanha se possível."* — Sim. O 🌍 (planeta) foi o
ícone do elemento **Terra** desde o começo, e realmente confundia (parecia "mundo/globo" e não "terra").
Foi trocado por **⛰️ (montanha)**.

### 14.2 Onde mudou

| Lugar | Antes | Agora |
|---|---|---|
| Círculos da **carta de scan** (captura e Scanner) | 🌍 | **⛰️** |
| **Painel do Scanner** (linha "Elementos") | 🌍 Terra | **⛰️ Terra** |
| **Coleção das 120** (ficha de cada espécie) | 🌍 | **⛰️** |
| Cartas **clássicas** (Lagoa Negra etc.), que sorteiam o emoji de uma lista | 🌍 | **⛰️** |
| **Cartas antigas salvas** com o 🌍 no save | 🌍 | convertidas para **⛰️** na hora de exibir |

Os outros três elementos **não mudaram**: 🔥 **Fogo** · 💧 **Água** · 🌪️ **Ar**.

> ℹ️ O símbolo do meio da carta continua sendo a **tribo** (🌲 OverWorld · 🌋 UnderWorld · 🐝 Danian ·
> 🏜️ Mipedian · 🌊 M'arrillian) — ele não é um elemento.

### 14.3 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v231_montanha.js` — 13 ✅ · 0 ❌**: o mapa de elementos e o tradutor devolvendo ⛰️ para Terra;
  🔥/💧/🌪️ intactos; a carta do **Texugo Escaldado** (Fogo + Terra, o caso do seu print) com os círculos
  **🔥 ⛰️** e **zero** planetas; a tribo 🌲 no meio; a **carta antiga** do save (gravada com 🌍) exibindo
  ⛰️; o acervo do Scanner sem planeta; **4.000** sorteios de elementos clássicos com 0 planetas; e o painel
  do Scanner mostrando **⛰️ Terra**.
- **Regressões na mesma build**: `test_v230_carta.js` **26 ✅** · `test_v228_batalha.js` **16 ✅** ·
  `test_v229_banco_total.js` **17 ✅** · `test_v229_drome.js` **2 ✅** · `test_v227_banco.js` **24 ✅** ·
  `test_v227_portal.js` **3 ✅** · `test_v226.js` **22 ✅** · `test_v226_itens.js` **7 ✅** ·
  `test_banco.js` **146 OK** · **0 erros de página**.

Prints desta rodada: `carta-terra-montanha-v231.png` (a carta do Texugo Escaldado com 🔥 + ⛰️) ·
`carta-terra-pura-v231.png` (uma criatura só de Terra, com um único círculo cheio).

### 14.4 O que NÃO mudou (de propósito)

- Os **nomes** dos elementos na ficha do banco (continuam "Terra", "Água", "Fogo", "Ar") — mudou só o
  **desenho** do Terra na carta.
- A carta nova (nome, raridade, 4 status, círculos, mugic, qualidade/status e código), a escala de **50
  pontos com pesos**, as raridades e os pisos, o scan, a batalha e a Coleção.

---

## 15. v2.32 — Materiais por nível + a COSTURA-11 holográfica

### 15.1 O que você pediu (com as 4 imagens de referência)

1. *"Reduzir os tipos de material para 5, mas a quantidade para 10 de cada… os 5 tipos exclusivos dos mapas
   de lvl 1 de todas as tribos; upg2 = 20 dos mesmos; upg3 = 10 itens exclusivos do mapa 2 (10 de cada);
   upg4 = os mesmos com 20; upg5 = 15 itens exclusivos do mapa 3 com 10 de cada."*
2. *"Mudar a estética da COSTURA-UPGRADE"* — no estilo das imagens (mesa holográfica, mochila em wireframe
   com as conexões, cartões de material e a bancada com braços robóticos).

### 15.2 Os 15 MATERIAIS em 3 NÍVEIS (tiers) de 5

| Tier | Onde dropa | Materiais |
|---|---|---|
| **1** | mapas de **nível 1** das 4 tribos (Bosque Verdejante, Cavernas de Brasas, Túneis do Monte Pillar, Oásis Enfumaçado) | Couro Escamoso de Dractyl 🟫 · Teia Reforçada de Mandiblor 🕸️ · Cipó da Floresta da Vida 🌿 · Dente Lascado de um Magmon 🦷 · Garra Caída de um Mipediano 🪝 |
| **2** | mapas de **nível 2** (Prado Verde, Caverna de Lava, Pântano Nebuloso, Ruínas do Tempo) | Fragmento de Cristal do Monte Pillar 💠 · Fio da Túnica de Najarin 🧵 · Musgo do Abismo Prexxor 🍃 · Retalho da Capa de Chaor 🌑 · Pena de um Phelpor 🪶 |
| **3** | mapas de **nível 3** (Floresta Sombria, Picos de Cinza, Borda do Vazio, Miragens do Palmeiral) **e a Lagoa Negra** | **Gema Estelar 💎** · **Escama Brilhante de LeViathã 🐉** · **Essência de Fogo de Vulcano 🔥** · **Núcleo Pulsante de Reator ⚙️** · **Penas de Fênix Prismática 🪶** *(os 5 novos)* |

- O material que nasce no chão **é sempre do tier do mapa** (medido: 2.000 sorteios por mapa, 0 fora do
  tier) — inclusive nos drops do scan e na recompensa da Drome (que paga **tier 3**).
- A Caverna Secreta (fora do jogo de mapas por nível) ficou no tier 1.

### 15.3 O CUSTO DO UPGRADE DA MOCHILA (do jeito que você definiu)

| Upgrade | Materiais | Quantidade de cada | Bits | Slots |
|---|---|---|---|---|
| **1** | os **5** do nível 1 | **10** | 250 | 5 → 7 |
| **2** | os **5** do nível 1 | **20** | 500 | 7 → 9 |
| **3** | os **10** dos níveis 1 + 2 | **10** | 750 | 9 → 11 |
| **4** | os **10** dos níveis 1 + 2 | **20** | 1.000 | 11 → 13 |
| **5** | os **15** dos níveis 1 + 2 + 3 | **10** | 1.250 | 13 → 15 |

(Antes: 1 unidade de cada um dos 10 materiais em **todos** os upgrades — era por isso que o painel ficava
uma lista longa e "sem graça".)

### 15.4 O PAINEL NOVO (mesma função, cara nova)

- **Mesa holográfica** com cantos cortados, borda de neon, **scanlines** e **circuitos verdes nos 4 cantos**
  (com nós que piscam), como nas imagens de referência;
- **anel holográfico** atrás da mochila: dois círculos com arcos girando devagar (um no sentido contrário do
  outro), igual às referências;
- **mochila em wireframe** no centro, flutuando, com fios de luz que saem de **cada material** até ela
  (no nível máximo são 15 conexões: 5 de cada lado + **5 na fila de baixo**);
- **cartão por material**: ícone, nome e **barra de progresso** `x/10` (verde quando completo, azul quando
  falta, vermelho no número);
- **cabeçalho** com o robô, `ROBÔ COSTURA-11 v.3`, o nível, os slots e a fala dele;
- **bancada** no rodapé com **2 braços robóticos de garras rosas**, a plaquinha `ROBÔ COSTURA-11 · v.3` com o
  LED verde ligado, o selo do próximo upgrade
  (`UPGRADE 3/5 — 10 TIPOS DE 10 · MAPAS 1 + MAPAS 2 · 💠 750 bits`) e o botão **🧵 FAZER UPGRADE**;
- **no celular** o rodapé é uma **barra fixa** (o conteúdo rola por trás) e o **CHAT sai da frente** enquanto
  o painel está aberto — nos 15 cartões nada fica escondido;
- no **nível máximo** aparece `✓ MOCHILA NO MÁXIMO — 15 slots` no lugar do botão (e o selo do rodapé
  vira `NÍVEL MÁXIMO — TODOS OS BOLSOS COSTURADOS · 💠 1.250 bits (níveis já pagos)`);
- o painel do **FORJA-7** (craft da Drome Key) continua no layout antigo — mudou só o do COSTURA-11.

### 15.5 Provas (Chrome real, no jogo servido pelo `server.js`)

- **`test_v232_costura.js` — 27 ✅ · 0 ❌**: os 15 materiais com 5 por tier e textura própria; o tier de
  cada mapa (mapas 1 → tier 1, mapas 2 → tier 2, mapas 3 + Lagoa Negra → tier 3) e **2.000 sorteios por
  mapa sem nenhum material do tier errado**; o custo dos 5 upgrades conferido um por um
  (`5×10 · 5×20 · 10×10 · 10×20 · 15×10`); o painel com 5 / 10 / 15 cartões conforme o nível, mochila em
  wireframe, 2 braços, selo do upgrade, botão e o selo de máximo; **o upgrade funcionando de verdade**
  (nível 0→1, slots 5→7, os 10 de cada consumidos, e o nível 2 **travando** sem os 20); a Drome pagando
  tier 3; **o FORJA-7 intacto (mesmo painel, mesma receita) e agora com a etiqueta de nível em cada
  material da receita**; e os materiais novos entrando na mochila.
- **`test_v232_fluxo.js` — 12 ✅ · 0 ❌ (o fluxo do jogador)**: o herói **anda até o balcão no Pátio
  Central e o painel abre pelo `[E]`** (sem chamar função), **clique de mouse de verdade no botão**
  (nível 0→1, slots 5→7, −250 bits, os 10 de cada consumidos e o painel se redesenhando no nível 1),
  **coletar material do chão passando por cima** (tier 3 na Borda do Vazio), o aviso de "mochila
  melhorada" — e o painel **no celular** (390×844, modo mobile): cabe na tela, não vaza para o lado, os 15
  cartões em blocos de 2, o **rodapé fixo** com o selo/botão sempre visível (o conteúdo rola por trás) e o
  **CHAT saindo da frente** enquanto o painel está aberto (e voltando ao fechar).
- **`test_v232_e2e.js` — 19 ✅ · 0 ❌ (a prova "no jogo de verdade")**: em **3 sessões de Chrome** ele viaja
  pelos mapas e mede o **spawn real**: Bosque, Túneis Danian (nível 1) → só tier 1; Prado (nível 2) → só
  tier 2; Floresta Sombria e Borda do Vazio (nível 3) → só tier 3, **30 spawns por mapa, 0 errado** e os 5
  tipos de cada nível aparecendo. Depois: **o drop do scan em 6 mapas (6 scans cada, 36 unidades ganhas,
  0 do tier errado)**; os **bloqueios do botão** (9 de 10 trava; sem bits trava e o aviso cobra os bits;
  faltando 1 material o aviso cobra o material); **o Depósito pagando o upgrade** (mochila vazia, tudo no
  Depósito, nível 0→1 e os 10 de cada consumidos); e **os 5 upgrades em sequência** — 50/100/100/200/150
  unidades cobradas e consumidas, **sem tocar em nenhum material fora da lista**, terminando em **nível 5
  com 15 slots**, 15 cartões, selo de máximo e sem botão.
- **Regressões na mesma build**: `test_v231_montanha.js` **13 ✅** · `test_v230_carta.js` **26 ✅** ·
  `test_v229_banco_total.js` **17 ✅** · `test_v228_batalha.js` **16 ✅** · `test_v229_drome.js` **2 ✅** ·
  `test_v227_banco.js` **24 ✅** · `test_v227_portal.js` **3 ✅** · `test_v226.js` **22 ✅** ·
  `test_v226_itens.js` **7 ✅** · **0 erros de página** em todos (o banco de 120 criaturas é coberto pelo
  `test_v229_banco_total.js` e pelo `test_v227_banco.js`).

Prints desta rodada: `costura-celular-v232.png` (o painel no celular, 15 cartões, rodapé fixo) ·
`costura-nv1-v232.png` (upgrade 1: 5 materiais ×10) · `costura-nv3-v232.png`
(upgrade 3: 10 materiais, tiers 1 + 2) · `costura-max-v232.png` (nível máximo: 15 materiais, 5 + 5 + 5, com
os fios em leque e o selo `✓ MOCHILA NO MÁXIMO — 15 slots`) · `materiais-no-mapa-v232.png` (os sprites
novos no chão do Bosque Verdejante, ao lado do herói).

### 15.6 O FORJA-7 fala a mesma língua

A receita do FORJA-7 (craft da Drome Key) **não mudou de custo** — continua `cristal 2 · dente 1 ·
retalho 1` + 400 bits —, mas cada linha agora mostra **de que nível de mapa vem o material**
(`MAPAS 1` / `MAPAS 2` / `MAPAS 3`), igual ao painel do COSTURA-11. O painel do FORJA continua no layout
antigo (não recebeu a mesa holográfica).

### 15.7 O que NÃO mudou (de propósito)

- O **COSTURA-11 continua aceitando material da mochila OU do Depósito**, os **+2 slots por upgrade** e os
  **bits** por nível (250/500/750/1.000/1.250).
- O **FORJA-7** (craft de Drome Key) e o resto do jogo (scan 3s/96px/160px, criaturas, carta nova com a
  qualidade em 50 pontos, Terra ⛰️, banco de 120 no jogo inteiro, Coleção, batalha, itens a 10%).
- **Materiais antigos que você já tinha** continuam valendo: os 10 primeiros materiais são exatamente os
  mesmos, só organizados em tiers 1 e 2.

---

## 16. v2.33 — A FORJA-7 nova: os 3 fragmentos da Drome Key 🔑

### 16.1 O que mudou

A **Drome Key** (a chave que abre a Drome) deixou de ser feita de material + fragmentos soltos e passou a ser
forjada com **3 fragmentos diferentes**, um de cada canto do jogo — e a FORJA-7 ganhou o painel da sua
referência (print `image-1`):

| Fragmento | Quanto | De onde vem |
|---|---|---|
| 🧭 **Fragmento da Exploração** | **×1** | o **primeiro 100% de escaneamento** de um mapa (cada mapa dá 1; repetir o mesmo mapa não dá) |
| ⚔️ **Fragmento de Batalha** | **×5** | **1 por vitória**: Dromo de mestre, PVP online ou Arena do Chefe |
| ⚙️ **Fragmento do Tempo** | **×7** | **1 a cada 10 minutos de jogo** (com o jogo fechado, conta até **3** por ausência) |

Custo adicional: **💠 400 bits** (como na referência).

### 16.2 O painel novo (mesma cara do COSTURA, na cor da FORJA)

- **A chave do Drome no centro**, desenhada em SVG (cristal + engrenagem + lâminas + cabo), com halo e brilho;
- **os 3 fragmentos em cartões** com o ícone, a **origem escrita** ("1 por vitória", "mapa 100%…", "10 min de
  jogo"), o **contador x/qtd** e **barra de progresso** (verde cheio, azul faltando, número vermelho);
- **os 3 tiles laterais** com o total de cada fragmento, iguais aos da referência;
- **bancada holográfica verde**, com os circuitos nos 4 cantos, a plaquinha `ROBÔ FORJA-7 · v.3` e o LED;
- o rodapé é **fixo** (não sai da tela, nem no celular): o botão **🛠 Forjar Drome Key** só libera com os
  **3 fragmentos + 400 bits**, e o aviso diz o que falta;
- abaixo ficam os caminhos secundários: **🧩 montar com os 5 fragmentos do scan** (o caminho antigo continua
  valendo) e **🌀 entrar na Drome** (com 1 chave).

### 16.3 O que NÃO mudou

- O **COSTURA-11** (upgrade da mochila) está exatamente igual — a mudança foi só na FORJA;
- os **fragmentos antigos 🧩 do scan** continuam existindo e ainda montam uma chave (botão secundário);
- os **400 bits**, o preço e a Câmara do Drome seguem iguais — a Câmara até **mostra os 3 fragmentos novos**
  junto do contador de chaves.

### 16.4 Provas

- **`test_v233_forja.js` — 21 ✅ · 0 ❌**: a receita (🧭1 · ⚔️5 · ⚙️7), o painel (chave, halo, tiles, 3 cartões
  com os contadores, circuitos, plaquinha, custo, avisos), os **bloqueios** (faltando fragmento trava ·
  sem 400 bits trava), as **3 fontes** medidas no jogo (vitória no Dromo, no PVP e na Arena do Chefe ·
  mapa 80%→100% dá 1 🧭 e repetir não dá · 10 min de jogo dão 1 ⚙️ · 1h com o jogo fechado dá 3 ⚙️),
  o **forjar de verdade** (clique → chave +1, −400 bits, fragmentos zerados, painel redesenhado, botão da
  Drome libera) e o **save/reload** (os 3 contadores, o relógio e os mapas 100% voltam).
- Regressões na mesma build: `test_v232_costura.js` **26 ✅** · `test_v232_e2e.js` **19 ✅** ·
  `test_v232_fluxo.js` **12 ✅** · `test_v231_montanha.js` **13 ✅** · `test_v230_carta.js` **26 ✅** ·
  `test_v229_banco_total.js` **17 ✅** · `test_v228_batalha.js` **16 ✅** · `test_v227_banco.js` **24 ✅** ·
  `test_v227_portal.js` **3 ✅** · `test_v226.js` **22 ✅** · `test_v226_itens.js` **7 ✅** ·
  `test_v229_drome.js` **2 ✅** · **0 erros de página**.

Prints desta rodada: `forja-faltando-v233.png` (faltando 1 de batalha e 1 de tempo) ·
`forja-pronta-v233.png` (tudo pronto, botão verde liberado).

---

## 17. Arquivos

| Arquivo | O que é |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo com tudo** (v2.33: FORJA-7 nova com os 3 fragmentos, com a v2.32 dos materiais por nível + COSTURA-11 nova, com a v2.31/v2.30/v2.29/v2.28/v2.27/v2.26/v2.25/v2.24/v2.23 e tudo o que já existia) |
| `LEIA-ME-MAPAS-E-SCAN.md` | este guia |
| `QUALIDADES-E-RARIDADES.md` | qualidades/raridades (escala 50) **e a seção 7 nova: os 15 materiais por nível + o custo do upgrade da mochila** |
| `LEIA-ME-JANELINHA-PIP.md` | guia da janelinha flutuante / modo fora da aba (v2.20) |
| `LEIA-ME-CORRECAO-NOMES-DE-MAPA.md` | guia dos nomes de mapa (v2.18) |
| `patch_mapas_separados.py` | script que aplica esta mudança (histórico reproduzível) |
| `patch_pontes_e_caverna.py` | script da v2.22: pontes por último + caverna caçando agressivos |
| `patch_rio_e_3pontes.py` | script da v2.23: rio de ponta a ponta + só 3 pontes (só no rio) |
| `patch_scan_colado_caverna.py` | script da v2.23: recuo na caverna com o bicho colado (scan fecha) |
| `patch_quadrados_escuros.py` | script da v2.24: re-assa grama decorada + barrancos ao trocar de mapa |
| `patch_agressivo_safezone.py` | script da v2.25: em SAFE ZONE o raio 0 desliga só a fuga — a caça (perseguir + escanear) vale para todo mundo |
| `patch_scan_nao_encosta.py` | script da v2.25: colado (<44px) o herói recua andando sem largar o scan (fim do laço de cancelamentos) |
| `patch_body_guard.py` | script da v2.25: blindagem — nunca mexer em `corpo.enable` de um corpo que já não existe (update nunca congela) |
| `patch_alvo_inalcancavel.py` | script da v2.25 (v160): largar alvo inalcançável (parede no meio) ou que disparou para 300px+, em vez de perseguir para sempre |
| `patch_opcoes_automove.py` | script da v2.26 (v161): tira a tecla P, limpa o painel de Opções e liga/desliga o auto-move por cena |
| `patch_itens_10.py` | script da v2.26 (v162): itens do mapa a 10% (nasce com 2, teto 6, caverna 1) |
| `patch_master_dromos.py` | script da v2.26 (v163): o NPC MASTER da Ilha dos Dromos com os 5 botões |
| `patch_banco_120.py` | script da v2.27 (v164): integra o banco de 120 criaturas (pools por tribo/mapa, spawn ponderado, velocidade por espécie, ficha nas cartas e o Mapa 3 dos Mipedians) |
| `patch_banco_batalha_165.py` | script da v2.28 (v165): leva o banco para a BATALHA (elemento → arquétipo, vida/dano/velocidade pela ficha) e planta a COLEÇÃO das 120 no acervo do Scanner |
| `patch_banco_total_166.py` | script da v2.29 (v166): o banco de 120 vira a fonte de criaturas do jogo inteiro (Roleta, Leilão, Drome, duelos, MASTER, códigos, decks dos 7 Mestres) + a faixa do banco no Portal |
| `patch_carta_e_iv50_167.py` | script da v2.30 (v167): carta de scan refeita (captura + Scanner) e escala de qualidade em 50 pontos com pesos (60/25/10/4,9/0,1) |
| `patch_elemento_terra_168.py` | script da v2.31 (v168): o elemento TERRA troca o ícone 🌍 (planeta) por ⛰️ (montanha) na carta, no Scanner e na Coleção |
| `patch_costura_169.py` | script da v2.32 (v169): materiais divididos em 3 níveis (15 tipos), custo do upgrade 5×10/5×20/10×10/10×20/15×10 e o painel holográfico do COSTURA-11 |
| `patch_forja_170.py` | script da v2.33 (v170): a Drome Key passa a ser forjada com os 3 fragmentos (🧭×1 · ⚔️×5 · ⚙️×7), as 3 fontes de fragmento e o painel novo da FORJA-7 |
| `test_v233_forja.js` | prova da v2.33: a receita, o painel, os bloqueios, as 3 fontes de fragmento, o forjar e o save/reload (21 ✅) |
| `test_v232_costura.js` / `test_v232_e2e.js` / `test_v232_fluxo.js` | provas da v2.32: o painel, o custo e a forja (27 ✅) · o jogo de verdade ponta a ponta — spawn nos mapas, drop do scan, Depósito e os 5 upgrades (19 ✅) · o fluxo do jogador com [E], clique e celular (12 ✅) |

### Publicar
Suba o `chaotic_idleworld_v123.html` por cima do antigo no GitHub/Render (o `server.js` busca
esse nome exato) e faça o deploy. **Só o jogo mudou** — o `site/index.html` e o servidor continuam
iguais aos da v2.20. Depois de subir, abra o jogo com Ctrl+F5 (ou aba anônima) para o navegador
não usar a versão antiga do arquivo. O título interno passa a mostrar **v2.33**.

> ℹ️ Se você já tinha jogado antes, o **progresso é preservado** (save no navegador + conta).
> O que muda é o desenho dos mapas a partir de agora — e o fato de cada mapa ter criaturas próprias.
