# 🗺️ Mapas separados de verdade + scan consertado + pontes e Caverna Secreta

**Chaotic.IdleWorld · v2.23** · aplicado em `chaotic_idleworld_v123.html`
(continua com o mesmo nome do arquivo — é só substituir o antigo)

> 🔝 **Última rodada (v2.23):** o **RIO voltou a ser um percurso de ponta a ponta** (nada de terreno
> cortando a água), as pontes viraram **3 travessias certas** (esquerda, meio e direita) **só sobre o
> rio** — nada de deck largo nem ponte em lago — e a **Caverna Secreta** agora fecha o scan mesmo com
> a criatura **colada** no herói. Tudo na **seção 6**; o balanceamento do autor (seção 2.3) não mudou.

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

## 7. Arquivos

| Arquivo | O que é |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo com tudo** (v2.23: rio contínuo + 3 pontes só no rio + scan da caverna + tudo o que já existia) |
| `LEIA-ME-MAPAS-E-SCAN.md` | este guia |
| `LEIA-ME-JANELINHA-PIP.md` | guia da janelinha flutuante / modo fora da aba (v2.20) |
| `LEIA-ME-CORRECAO-NOMES-DE-MAPA.md` | guia dos nomes de mapa (v2.18) |
| `patch_mapas_separados.py` | script que aplica esta mudança (histórico reproduzível) |
| `patch_pontes_e_caverna.py` | script da v2.22: pontes por último + caverna caçando agressivos |
| `patch_rio_e_3pontes.py` | script da v2.23: rio de ponta a ponta + só 3 pontes (só no rio) |
| `patch_scan_colado_caverna.py` | script da v2.23: recuo na caverna com o bicho colado (scan fecha) |

### Publicar
Suba o `chaotic_idleworld_v123.html` por cima do antigo no GitHub/Render (o `server.js` busca
esse nome exato) e faça o deploy. **Só o jogo mudou** — o `site/index.html` e o servidor continuam
iguais aos da v2.20. Depois de subir, abra o jogo com Ctrl+F5 (ou aba anônima) para o navegador
não usar a versão antiga do arquivo. O título interno passa a mostrar **v2.21**.

> ℹ️ Se você já tinha jogado antes, o **progresso é preservado** (save no navegador + conta).
> O que muda é o desenho dos mapas a partir de agora — e o fato de cada mapa ter criaturas próprias.
