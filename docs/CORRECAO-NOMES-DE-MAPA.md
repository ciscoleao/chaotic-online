# 🗺️ Correção dos nomes de mapa — Chaotic.IdleWorld

**Arquivo corrigido:** `chaotic_idleworld_v123.html` (mesmo nome do seu arquivo — basta substituir)
**Versão interna:** v151 / v2.18 · 12 mapas + Caverna + Ilha + Drome testados no navegador

---

## 1. O que estava acontecendo

O nome do topo não vinha do **mapa**, vinha do **tipo de cena**. A função `updateTopBar()` fazia:

```js
GameState.location === 'perim' ? 'Perim' : ...
```

Como **todos os mapas do mundo** usam `GameState.location = 'perim'` (a região de verdade fica em
`GameState.currentRegion`), o resultado era literalmente `Perim` em qualquer mapa: Bosque Verdejante,
Caverna de Lava, Oásis Enfumaçado… todos apareciam como "Perim". O nome correto da região **já existia**
no arquivo (`REGIONS[].name`), só não era usado no HUD.

---

## 2. O que mudou

| Onde | Antes | Agora |
|---|---|---|
| Topo da tela (`#map-name`) | `Perim` fixo | **nome real do mapa** (`REGIONS[].name`) |
| Linha nova abaixo do nome (`#map-sub`) | não existia | tribo · mapa N da tribo · 🛡 Safe Zone (na cor da tribo) |
| Painel do Caçador → "🗺️ Local" | `Perim` fixo | nome real do mapa |
| Minimapa do Scanner (título) | `MAPA — Perim` | `MAPA — <nome do mapa> · X% explorado` |
| Ao entrar no mapa | nada | **banner de 2,6 s** com o nome do mapa + tribo |
| Aviso de Fast Travel (Portal) | `Fast Travel: Pantano Nebuloso` | `🗺️ Fast Travel → Pantano Nebuloso · Danian` |

Tudo passa por **uma única fonte de verdade**: `placeName151()` / `placeSub151()` (bloco marcado com `v151`
no arquivo). Renomear um mapa em um lugar só muda o topo, o Scanner, o minimapa, o Portal e o banner.

**Também corrigido de brinde (dois bugs encontrados durante o teste):**

1. **A Drome não abria** — `DromeScene.create()` quebrava com `ReferenceError: type is not defined`
   (a variável `type` não existe nessa cena). Agora a Drome entra normalmente.
2. **Ilha dos Dromos** podia aparecer como "Drome" se a cena fosse iniciada direto (ex.: F5 na Ilha) —
   agora ela marca `GameState.location = 'exterior'`.

---

## 3. Nomes que o jogo mostra hoje (todos vindos do próprio arquivo)

| id | Nome exibido | Tribo | Mapa | Nível | Criaturas |
|---|---|---|---|---|---|
| `ow_grove` | **Bosque Verdejante** | 🌿 OverWorld | 1 | livre | 🛡 Safe Zone |
| `uw_ember` | **Cavernas de Brasas** | 🔥 UnderWorld | 1 | livre | 🛡 Safe Zone |
| `dan_hive` | **Túneis do Monte Pillar** | 🐝 Danian | 1 | livre | 🛡 Safe Zone |
| `mip_oasis` | **Oásis Enfumaçado** | 🏜️ Mipedian | 1 | livre | 🛡 Safe Zone |
| `meadow` | **Prado Verde** | 🌿 OverWorld | 2 | Lv.10 | ⚠️ criaturas atacam |
| `forest` | **Floresta Sombria** | 🌿 OverWorld | 3 | Lv.20 | ⚠️ criaturas atacam |
| `lava_cave` | **Caverna de Lava** | 🔥 UnderWorld | 2 | Lv.10 | ⚠️ criaturas atacam |
| `mountain` | **Picos de Cinza** | 🔥 UnderWorld | 3 | Lv.20 | ⚠️ criaturas atacam |
| `swamp` | **Pantano Nebuloso** | 🐝 Danian | 2 | Lv.10 | ⚠️ criaturas atacam |
| `void_rim` | **Borda do Vazio** | 🐝 Danian | 3 | Lv.20 | ⚠️ criaturas atacam |
| `time_ruins` | **Ruinas do Tempo** | 🏜️ Mipedian | 2 | Lv.10 | ⚠️ criaturas atacam |
| `lac_black` | **Lagoa Negra M’arrillian** | 🌊 M’arrillian | 5 | Lv.40 | ⚠️ criaturas atacam |

Locais fora do mundo: **Pátio Central** (HUB), **Ilha dos Dromos**, **Caverna Secreta** (mostra
"sob <nome do mapa>") e **Drome** (arena).

---

## 4. Quer RENOMEAR um mapa? É 1 linha

No arquivo, ache a lista `const REGIONS = [` (perto do comentário `v147 — REGIONS`) e mude o campo
**`name`** do mapa desejado:

```js
{ id: 'forest', name: 'Floresta Sombria', tribe: 'overworld', mapLevel: 3, ... }
                     ↑ só trocar o texto entre as duas primeiras aspas
```

Salve e recarregue o jogo (Ctrl+F5). O topo, o Scanner, o minimapa, o Portal **e** o banner passam a mostrar
o novo nome na hora — não precisa mexer em mais nada.
⚠️ Não mude o `id` (é ele que vai salvo no save do jogador e usado pelo servidor) e mantenha as vírgulas.

---

## 5. Como eu testei (navegador de verdade)

Rodei o arquivo num Chrome headless, entrando em cada mapa pelo caminho normal do jogo
(Portal → `travelTo`) e lendo o texto que aparece no HUD:

```
01 boot (Pátio Central)  -> topo: "Pátio Central"            | sub: "🌐 HUB · zona segura"
02 travelTo ow_grove     -> topo: "Bosque Verdejante"        | sub: "🌿 OverWorld · Mapa 1 da tribo · 🛡 SAFE ZONE"
02 travelTo meadow       -> topo: "Prado Verde"              | sub: "🌿 OverWorld · Mapa 2 da tribo"
02 travelTo lava_cave    -> topo: "Caverna de Lava"          | sub: "🔥 UnderWorld · Mapa 2 da tribo"
02 travelTo lac_black    -> topo: "Lagoa Negra M’arrillian"  | sub: "🌊 M’arrillian · Mapa 5 da tribo"
... (os 12 mapas, um por um) ...
03 CaveScene             -> topo: "Caverna Secreta"          | sub: "🏜️ Mipedian · sob Oásis Enfumaçado · scan 2x"
04 DromeScene            -> topo: "Drome"                    | sub: "🌀 arena de batalha"
05 ExteriorScene         -> topo: "Ilha dos Dromos"          | sub: "🏝️ zona segura · 7 Mestres do Código"
07 banner ao entrar      -> "Floresta Sombria" / "🌿 OverWorld · Mapa 3 da tribo"   (some depois de 2,6 s)
10 minimapa do Scanner   -> "MAPA — Ruinas do Tempo · 1% explorado"
```

Antes da correção, a mesma bateria de testes devolvia `Perim` em **todos** os mapas do mundo.
Os prints da sessão final estão em `print_teste_meadow.png` e `print_teste_lac_black.png`
(HUD no Prado Verde e na Lagoa Negra M’arrillian).

---

## 6. Arquivos desta correção

| Arquivo | Para que serve |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo corrigido** — mesmo nome do original, só substituir |
| `preview_nomes_mapa.html` | preview clicável (abre no navegador) mostrando o HUD novo em cada mapa |
| `patch_mapnames.py` | o script que aplicou a correção (histórico do que foi alterado) |
| `print_teste_*.png` | prints do jogo rodando depois da correção |

### Para publicar (GitHub / Render)
O `server.js` procura o jogo pelo **nome exato** `chaotic_idleworld_v123.html` — então basta subir este
arquivo por cima do antigo no repositório e o deploy atualiza sozinho. Nada no servidor (nem no
`index.html` do site) precisa mudar.
