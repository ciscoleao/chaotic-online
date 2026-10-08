# 🎴 Qualidades, Raridades e Materiais no Chaotic.IdleWorld (v2.32)

> ⚠️ **Atualizado na v2.30:** a escala mudou — cada atributo agora vai de **0 a 50** (antes 0 a 31) e o
> sorteio é por **pesos de faixa** (ver a seção 1). O resto (raridades, pisos, preços, equipamentos)
> continua igual.

---

## 1. Qualidade da CARTA = "IV Grade" (5 níveis) — escala de 50 pontos

O scan sorteia **4 atributos** (Coragem, Poder, Sabedoria, Velocidade — internamente
`str · dex · vit · int`), **cada um de 0 a 50**. `generateCreatureScan()` sorteia primeiro a **faixa**
(Weighted Random) e depois gera os 4 valores dentro dela. A qualidade é a **média dos 4**:

| Qualidade (STATUS) | Média dos 4 atributos | Vira a raridade | Chance (pedido) | Medido (120.000 scans) |
|---|---|---|---|---|
| **Perfeito** | 46 a 50 | **Lendário** | 0,1% | 0,09% (~1 em 1.000) |
| **Excelente** | 36 a 45 | **Épico** | 4,9% | 4,95% (~1 em 20) |
| **Bom** | 23 a 35 | **Raro** | 10,0% | 9,98% (~1 em 10) |
| **Médio** | 13 a 22 | **Incomum** | 25,0% | 25,15% (~1 em 4) |
| **Fraco** | 0 a 12 | **Comum** | 60,0% | 59,83% (~6 em 10) |

- O **%** que aparece na carta é `média dos 4 ÷ 50` (ex.: média 32 → **64%**).
- Onde ver: na **carta da captura**, na **carta do Scanner** (clique numa miniatura) e no **filtro do
  acervo** (`Todas · Fraco · Medio · Bom · Excelente · Perfeito`).
- A **Roleta e o Leilão** usam exatamente a mesma escala (medido em 40.000 cartas: 59,6 / 25,1 / 10,1 /
  5,1 / 0,1 %).

---

## 2. Raridade da carta (5 degraus) e o que ela vale

| Raridade | Nome no jogo | Cor | Multiplicador de atributos | Preço no Leilão |
|---|---|---|---|---|
| `common` | Comum | cinza | ×1,0 | ×1 |
| `uncommon` | Incomum | ciano | ×1,3 | ×1,6 |
| `rare` | Raro | roxo | ×1,7 | ×2,6 |
| `epic` | Épico | rosa | ×2,3 | ×4,5 |
| `legendary` | Lendário | dourado | ×3,0 | ×9 |

---

## 3. Pisos de raridade (v164) — quando a nota NÃO vem só da média

| Caso | Piso garantido |
|---|---|
| Espécie **RARA (★)** do banco — 12 das 120 | no mínimo **Raro** |
| Espécie de perfil **muito-forte** — 40 das 120 | no mínimo **Incomum** |
| **Chefe** escaneado (`isBoss`) | **carta LENDÁRIA** exclusiva |

Uma espécie rara com média fraca **ainda sai como "Raro"** — o piso segura a carta.

---

## 4. Perfil de força das 120 espécies (o "tier" do banco)

| Perfil | Quantas | Efeito |
|---|---|---|
| `fraca` | 36 | sem piso |
| `mediana` | 44 | sem piso |
| `muito-forte` | 40 | piso **Incomum** na carta |
| **rara (★)** | **12** | piso **Raro** + 20% de velocidade no mapa |

(das 120: 48 agressivas e 72 passivas)

---

## 5. Equipamentos (forja / Balconista) — qualidade por SORTEIO, não por atributo

| Raridade | Chance do sorteio |
|---|---|
| **Lendário** | 2% |
| **Épico** | 6% |
| **Raro** | 12% |
| **Incomum** | 25% |
| **Comum** | o resto (~57%) |

E a raridade multiplica os atributos do item (mesma tabela do item 2) e o preço no Leilão.

---

## 6. Como melhorar a qualidade (e o que NÃO muda)

- **É sorteio puro:** cada criatura nasce com os 4 atributos sorteados na faixa. Não existe item, poção,
  gadget ou upgrade que aumente atributo.
- **O que ajuda:** mais scans · **Caverna Secreta** (scan 2× mais rápido → o dobro de tentativas no mesmo
  tempo, mesma chance por scan) · escanear espécie **RARA (★)** garante o piso Raro.
- **Re-scan** de espécie conhecida **não dá carta nova** — só reduz em 10 pontos a penalidade do mapa.
- **Cartas antigas** (de antes da v2.30, com atributos até 31) continuam válidas: o STATUS é recalculado
  pelas faixas novas ao abrir a carta.

---

## 7. Materiais e o upgrade da mochila (v2.32)

### 7.1 Os 15 materiais em 3 NÍVEIS (5 tipos cada)

| Nível | Onde dropa | Materiais |
|---|---|---|
| **1** | mapas de **nível 1** (Bosque Verdejante, Cavernas de Brasas, Túneis do Monte Pillar, Oásis Enfumaçado) | Couro Escamoso de Dractyl 🟫 · Teia Reforçada de Mandiblor 🕸️ · Cipó da Floresta da Vida 🌿 · Dente Lascado de um Magmon 🦷 · Garra Caída de um Mipediano 🪝 |
| **2** | mapas de **nível 2** (Prado Verde, Caverna de Lava, Pântano Nebuloso, Ruínas do Tempo) | Fragmento de Cristal do Monte Pillar 💠 · Fio da Túnica de Najarin 🧵 · Musgo do Abismo Prexxor 🍃 · Retalho da Capa de Chaor 🌑 · Pena de um Phelpor 🪶 |
| **3** | mapas de **nível 3** (Floresta Sombria, Picos de Cinza, Borda do Vazio, Miragens do Palmeiral) **e a Lagoa Negra** | Gema Estelar 💎 · Escama Brilhante de LeViathã 🐉 · Essência de Fogo de Vulcano 🔥 · Núcleo Pulsante de Reator ⚙️ · Penas de Fênix Prismática 🪶 |

- O material que nasce no chão **é sempre do nível do mapa** (inclusive nos drops do scan). A **Drome**
  paga materiais do nível 3 e a **Caverna Secreta** continua no nível 1.
- Materiais **clássicos** (Sucata 2 · Circuito 5 · Cristal Bruto 12 · Fragmento 20 · Núcleo 50 · Geodo 45
  bits) continuam caindo no chão em paralelo e são os que o **Leilão** compra — eles nunca entram na costura.

### 7.2 Custo do upgrade (ROBÔ COSTURA-11)

| Upgrade | Materiais | Qtd. de cada | Bits | Slots da mochila |
|---|---|---|---|---|
| 1 | 5 do nível 1 | 10 | 250 | 5 → 7 |
| 2 | 5 do nível 1 | 20 | 500 | 7 → 9 |
| 3 | 10 dos níveis 1 + 2 | 10 | 750 | 9 → 11 |
| 4 | 10 dos níveis 1 + 2 | 20 | 1.000 | 11 → 13 |
| 5 | 15 dos níveis 1 + 2 + 3 | 10 | 1.250 | 13 → 15 |

- **Total da jornada:** 600 unidades (5×10 + 5×20 + 10×10 + 10×20 + 15×10) e 3.750 bits.
- O COSTURA aceita material da **mochila OU do Depósito** (contas separadas por pilha).
- Nível 0: mochila 5 slots + Depósito 10 = 15 pilhas — por isso já dá para juntar os 10 tipos do upgrade 3
  guardando o excedente no Depósito.
- Forja (**FORJA-7**, craft da Drome Key) não usa a escada de níveis como custo: a receita é
  **cristal 2 · dente 1 · retalho 1** (bits + 400), e cada linha agora mostra de que nível de mapa vem
  cada material.

---

## 8. Os fragmentos da Drome Key (v2.33)

A chave que abre a Drome é forjada na **FORJA-7** (Pátio Central) com **3 fragmentos + 💠 400 bits**:

| Fragmento | Quanto | Como ganhar |
|---|---|---|
| 🧭 **Fragmento da Exploração** | 1 | **primeiro 100% de escaneamento de um mapa** (1 por mapa; repetir o mesmo mapa não dá outro) |
| ⚔️ **Fragmento de Batalha** | 5 | **1 por vitória**: Dromo de mestre · PVP online · Arena do Chefe |
| ⚙️ **Fragmento do Tempo** | 7 | **1 a cada 10 minutos de jogo**; com o jogo fechado conta até **3** por ausência |

- O **caminho antigo** (🧩 5 fragmentos que caem do scan) **continua valendo** — vira uma chave pelo botão
  secundário do painel (ou na sala da Câmara do Drome).
- Os 3 fragmentos **ficam no save**: fechar o jogo não perde nada e o relógio do tempo continua contando
  (até o teto de 3 por ausência).
- Números de referência: **7 chaves** exigem 7× tudo (7 🧭 · 35 ⚔️ · 49 ⚙️ · 2.800 bits); a exploração sozinha
  dá 13 (um por mapa do jogo) — o gargalo é o **tempo** (70 min por chave) e as **vitórias**.
