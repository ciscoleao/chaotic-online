# 🧬 Sistema de Criaturas — Chaotic.IdleWorld (v1)
> ✅ **Integrado no jogo na v2.27 (v164).** As 120 criaturas deste banco agora nascem nos mapas de Perim
> (pools por tribo e nível, spawn ponderado, velocidade por espécie, ficha nas cartas) — veja
> `docs/MAPAS-E-SCAN.md` seção 10 no pacote do jogo. O `patch_banco_120.py` é o script que fez a integração.
>
> ✅ **E desde a v2.28 (v165) o banco também vale na BATALHA e na COLEÇÃO.** Na arena (Dromo e PVP) o
> **elemento** da espécie escolhe o arquétipo de luta e a vida/dano/velocidade saem da ficha; e o painel
> **COLEÇÃO** (no acervo do Scanner) lista as 120 com progresso x/120 e filtro Escaneadas/Faltando —
> veja `docs/MAPAS-E-SCAN.md` seção 11. Script: `patch_banco_batalha_165.py`.
>
> ✅ **Na v2.29 (v166) o banco virou a fonte de TODA criatura do jogo**: a Roleta, o Leilão (ofertas e
> pedidos), o MASTER, os duelos aleatórios, as ondas da Drome, os códigos promocionais e os **decks dos
> 7 Mestres do Código** passaram a sortear só as 120 — e o Portal de Viagem mostra o progresso do banco.
> Veja `docs/MAPAS-E-SCAN.md` seção 12. Script: `patch_banco_total_166.py`.
>
> 🎴 **Na v2.30 (v167) as cartas ficaram no formato novo** (nome, raridade, 4 status, círculos de elemento
> com a tribo no meio, mugic e código) e a **qualidade passou para 0–50 com pesos** (Fraco 60% · Médio 25%
> · Bom 10% · Excelente 4,9% · Perfeito 0,1%). Script: `patch_carta_e_iv50_167.py`.


Banco de **120 criaturas** (4 tribos × 30, distribuídas em 3 mapas por tribo), o **modelo de dados da carta**,
a **regra de contadores de mugic** e o **SpawnManager** que decide o que nasce em cada mapa.

Tudo é **determinístico**: rodar o gerador de novo produz exatamente o mesmo banco (mesmas sementes).
Nenhum arquivo do jogo foi alterado — este é um subsistema novo, pronto para plugar.

---

## 1. O modelo da criatura (`src/creature.js`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | ex.: `uw_m2_07` (tribo + mapa + índice) |
| `name` | string | nome único no banco (PT-BR, com concordância de gênero) |
| `tribe` | enum | `OverWorld` · `UnderWorld` · `Danian` · `Mipedian` |
| `tribeId` | string | `ow` · `uw` · `dn` · `mp` |
| `mapLevel` | 1·2·3 | qual dos 3 mapas da tribo |
| `level` | number | nível da criatura (dentro da faixa do mapa) |
| `elements` | array | 1 ou 2 elementos: **Fogo, Terra, Água, Ar** |
| `elementKind` | enum | `principal` (afinidade da tribo) ou `excecao` (fora da curva, lore) |
| `tint` | hex | cor do elemento dominante (para tint de sprite/minimapa) |
| `isAggressive` | bool | caça o jogador |
| `isRare` | bool | criatura rara (**+20%** em `baseSpeed` e `baseDamage`) |
| `stats.courage` | int | **COR — Coragem = HP máximo** |
| `stats.power` | int | **POD — Poder = dano físico (valor de carta)** |
| `stats.wisdom` | int | **SAB — Sabedoria = mana** |
| `stats.speed` | int | **VEL — Velocidade = iniciativa / movimentação** |
| `archetype` | enum | `bruto` · `equilibrado` · `mistico` (chassi de status) |
| `powerTier` | enum | `muito-forte` · `mediana` · `fraca` |
| `mugicCounters` | 0·1·2 | quantas mágicas a carta pode equipar |
| `totalStats` | int | soma dos 4 atributos (a "força bruta") |
| `baseSpeed` | int | px/s no mapa (fórmula, já com o +20% se rara) |
| `baseDamage` | int | dano por golpe (fórmula, já com o +20% se rara) |
| `ability` | objeto | `{ name, type, manaCost, desc }` — tipo: dano · controle · buff · cura |
| `rewards` | objeto | `{ xp, bits: [min, max] }` |
| `art` | string | sprite do jogo usado como arte provisória |
| `desc` | string | frase de lore |
| `spawnProfile` | enum | `passiva` · `agressiva` · `rara-agressiva` |
| `spawnWeight` | int | peso de sorteio (34 / 26 / 12) |
| `runtime` | objeto | bloco pronto para combate: `{ hp, atk, mana, initiative, moveSpeed }` |
| `gameCompat` | objeto | no formato do `ENEMY_TYPES` atual do jogo (integração drop-in) |

### Contadores de Mugic (regra exata)

A carta recebe mugic **inversamente proporcional à força bruta** — e isso é garantido por construção:
cada arquétipo tem um **orçamento fixo de status totais** por mapa (com folga de 25+ pontos entre eles).

| Arquétipo | Força | Status totais (m1/m2/m3) | `mugicCounters` |
|---|---|---|---|
| **Bruto** | muito forte | 170 / 240 / 330 | **0** |
| **Equilibrado** | mediana | 145 / 205 / 285 | **1** |
| **Místico** | fraca (suporte/mágica) | 115 / 165 / 230 | **2** |

Teste que comprova: *em cada mapa/tribo*, `max(total dos mugic 2) < min(total dos mugic 1) < max(… mugic 1) < min(total dos mugic 0)`.

### Fórmulas (fonte única de verdade)

```
baseSpeed  = round( (118|130|145 + speed × 0,35|0,45|0,55) × (rara ? 1,2 : 1) )     → px/s
baseDamage = round( power × multDano(tribo) × 0,35 × (rara ? 1,2 : 1) )            → dano/golpe
multDano   = UnderWorld 1,10 · Mipedian 1,05 · OverWorld 1,00 · Danian 1,00
```

- `speed` cruza com o **`MONSTER_WANDER_SPEED` do jogo (155 px/s)**: uma criatura mediana de mapa 2 fica em ~155.
- O fator **0,35** é a escala de combate: sem ele um bruto tiraria num golpe mais vida do que possui e a luta acabaria em 1 turno. Com ele, um bruto precisa de **3 a 4 golpes** contra um alvo do mesmo porte (e a rara, de 3).

---

## 2. Distribuição elemental (lore constraint)

| Tribo | Principal | Exceções (20% do banco) | Onde as exceções foram usadas (real) |
|---|---|---|---|
| **OverWorld** | Terra · Água · Fogo | Ar | 6 de 30 |
| **UnderWorld** | Fogo · Terra | Água · Ar | 6 de 30 |
| **Danian** | Terra · Água | Fogo · Ar | 6 de 30 |
| **Mipedian** | Ar · Terra | Fogo · Água | 6 de 30 |

Quotas por mapa (iguais nas 4 tribos): **1 exceção no mapa 1 · 2 no mapa 2 · 3 no mapa 3**.
Cada exceção **precisa** carregar pelo menos um elemento de exceção (o validador cobra isso), e quem é `principal`
nunca usa elemento de exceção. Contagem final de elementos:

```
OverWorld:  Fogo 13 · Água 11 · Terra 10 · Ar  6
UnderWorld: Terra 19 · Fogo 17 · Água  6 · Ar  5
Danian:     Terra 21 · Água 20 · Fogo  3 · Ar  4
Mipedian:   Ar   19 · Terra 18 · Água 5 · Fogo 3
```

---

## 3. Matemática de spawn por mapa (vale para as 4 tribos)

| Mapa | Nível exigido | Criaturas | Passivas | Agressivas | Raras |
|---|---|---|---|---|---|
| **Mapa 1** | 1 | **5** | 5 (100%) | 0 | 0 |
| **Mapa 2** | 10 | **10** | 6 | 4 | **1** |
| **Mapa 3** | 20 | **15** | 7 | 8 | **2** |
| Total | — | **30 por tribo** | — | — | **12 raras no jogo** |

- Toda rara é agressiva; nenhuma rara no mapa 1.
- As raras ocupam, de preferência, o chassi **bruto** — é o "chefão" do mapa: chassi forte **+ 20%** de velocidade e dano.
- `SpawnManager.getPoolSettings()` deriva do próprio pool: chance de agressiva (**mapa 2 = 40%**, **mapa 3 = 53%**),
  chance de rara (10% / 13%) e teto de criaturas vivas no mapa (60% do pool: 3 / 6 / 9).

---

## 4. Amostra pedida: **UnderWorld · Mapa 2** (`data/underworld_mapa2.json`)

10 criaturas, **6 passivas + 4 agressivas**, **1 rara** — maioria **Fogo/Terra** (7+5 de 10 cartas), minoria **Água/Ar**.

| Criatura | Nv. | Elementos | COR | POD | SAB | VEL | mugic | vel/dano | perfil |
|---|---|---|---|---|---|---|---|---|---|
| Bode Carbonizado | 9 | Fogo | 49 | 22 | 69 | 26 | 2 | 142 / 8 | passiva |
| Touro Férreo | 9 | Terra/Fogo | 47 | 22 | 71 | 26 | 2 | 142 / 8 | passiva |
| Lacraia Mineral | 10 | Terra | 47 | 21 | 71 | 27 | 2 | 142 / 8 | passiva |
| Aranha Ardente | 11 | Fogo | 76 | 46 | 48 | 38 | 1 | 147 / 18 | passiva |
| Diabrete Rochoso | 11 | Terra/Fogo | 74 | 46 | 47 | 37 | 1 | 147 / 18 | passiva |
| Imp Pedregoso | 11 | Terra/Fogo | 61 | 56 | 38 | 47 | 1 | 151 / 22 | **agressiva** |
| Brutamontes Cristalino | 12 | Terra | 77 | 44 | 48 | 37 | 1 | 147 / 17 | passiva |
| Cascudo Fuliginoso | 12 | Fogo | 95 | 80 | 10 | 55 | 0 | 155 / 31 | **agressiva** |
| Sapo Neblinoso | 12 | Ar/Fogo | 98 | 81 | 10 | 55 | 0 | 155 / 31 | **agressiva** · exceção de lore |
| **Basilisco Ondeante** | 12 | **Água** | 98 | 79 | 10 | 54 | 0 | **185 / 36** | **RARA** · agressiva · exceção de lore |

> A rara é a mais rápida (185 px/s) e a que mais machuca (36) — e é uma exceção de lore (Água num domínio de Fogo/Terra).

---

## 5. API

```js
// Node
const { getMapSpawns, SpawnManager, getPoolSettings } = require('./src/spawn_manager.js');

getMapSpawns('UnderWorld', 2);                       // → as 10 criaturas do mapa (com metadados de spawn)
getMapSpawns('uw', 'm2', { only: 'agressivas' });    // aceita id curto e mapa como texto
getMapSpawns('Mipedian', 3, { element: 'Ar' });      // filtra por elemento
getMapSpawns('ow', 1, { only: 'passivas' });         // 5 criaturas, 100% passivas

getPoolSettings('UnderWorld', 2);
// { requiredLevel: 10, total: 10, passive: 6, aggressive: 4, rare: 1,
//   aggressiveRatio: 0.40, rareChance: 0.10, maxLive: 6, elements: {...} }

const sm = new SpawnManager();                       // usa o CreatureDB embutido
sm.rollSpawn('UnderWorld', 2, { aggressive: true }); // 1 criatura agressiva sorteada por peso
sm.rollSpawn('UnderWorld', 2, { allowRare: false }); // nunca traz rara
sm.rollWave('UnderWorld', 3, 9);                     // leva para encher o mapa, sem repetir criatura
sm.describe('UnderWorld', 2);                        // tabela pronta para o log/tela de debug
```

No navegador (o jogo é um HTML único): basta carregar os 3 scripts e usar `window.ChaoticSpawn`.

```html
<script src="creatures/src/creature.js"></script>
<script src="creatures/src/creature_db.js"></script>
<script src="creatures/src/spawn_manager.js"></script>
<script>
  const pool = ChaoticSpawn.getMapSpawns(GameState.currentRegion === 'uw_ember' ? 'UnderWorld' : 'OverWorld', 2);
</script>
```

**Como plugar no jogo atual:** cada criatura já traz `gameCompat` no formato do `ENEMY_TYPES`
(`{ name, hp, atk, xp, bits, level, art, isAggressive, isRare }`), ou seja, é trocar
`ENEMY_TYPES.filter(e => e.regions.indexOf(regiao) !== -1)` por `getMapSpawns(tribo, mapLevelDoMapa)`.
A arte continua vindo dos sprites que já existem (`art`) até existirem sprites próprios.

---

## 6. Arquivos

```
creatures/
├── src/creature.js          modelo + fórmulas (nada de número mágico espalhado)
├── src/creature_db.js       banco gerado (120) + consultas: byId/byTribe/byMap/byElement/rares/resumo
├── src/spawn_manager.js     SpawnManager + getMapSpawns + rollSpawn + rollWave + describe
├── data/creatures.json      banco completo (120 cartas, versionável e diffável)
├── data/underworld_mapa2.json  amostra pedida (10 cartas do UnderWorld mapa 2)
├── data/resumo.json         contagens por tribo/mapa/elemento/mugic
├── tools/gerar_banco.js     gera o banco (determinístico por semente)
├── tools/gerar_cartas.js    gera o visualizador cartas.html
├── cartas.html              VISUALIZADOR: as 120 cartas com filtros (arquivo único, offline)
└── test/test_banco.js       146 verificações: sempre que mexer no banco/tools, rode isto
```

Comandos:

```bash
node tools/gerar_banco.js     # regera data/*.json + src/creature_db.js
node tools/gerar_cartas.js    # regera cartas.html
node test/test_banco.js       # valida TUDO (volume, matemática dos mapas, rara +20%, mugic, lore, spawn)
```

---

## 7. Nomes

Cada tribo tem 30 espécies (léxico próprio) e o epíteto vem do elemento dominante, com **concordância de
gênero** ("Serpente Pedregosa", "Rato Choroso", "Mariposa Etérea"). Nomes repetidos entre tribos
(ex.: Crocodilo existe em UnderWorld e Mipedian) recebem um qualificador de tribo — todos os 120 nomes são únicos.

## 8. Ajustes de balanceamento que fiz (e por quê)

1. **Escala de dano 0,35** — sem ela o dano por golpe ficava acima do HP e qualquer duelo terminava em 1 turno.
2. **HP acima do dano no chassi bruto** (pesos COR 0,44 / POD 0,30) — bruto tem ~96 de vida e aplica ~31.
3. **Raras no chassi bruto** — a rara do mapa precisa ser o maior desafio dele (chassi forte + bônus de raridade).
4. **Tolerância de ±3%** nos atributos (jitter por semente) — dá variedade sem furar a regra do mugic.
