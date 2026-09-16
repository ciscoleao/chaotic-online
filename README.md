# 🎮 Chaotic.IdleWorld — Online

MMO **idle** ambientado no universo de **Chaotic**: você é um portador de Scanner que explora os
mapas de **Perim**, escaneia criaturas (que viram **Scan Cards** colecionáveis), forja equipamentos,
duela contra os **7 Mestres do Código** e outros jogadores no **Dromo** — tudo direto no navegador,
com contas reais, chat, PVP e save na nuvem.

![Gameplay](docs/img/gameplay.png)

**Rodando com Node puro (zero dependências).** Contas com senha (scrypt), sessão por cookie HttpOnly,
captcha anti-bot, chat global/privado, PVP online em tempo real e progresso salvo por conta.

---

## ✨ O que tem no jogo

| | |
|---|---|
| 🗺️ **Mapas por tribo** | 12 regiões (OverWorld, UnderWorld, Danian, Mipedian, M'arrillian) + Pátio Central, Ilha dos Dromos, Caverna Secreta e a arena do Dromo |
| 📡 **Scanner** | mais de 30 criaturas, Scan Cards com raridade, IVs e código único |
| 🤖 **Idle de verdade** | Auto-Move (tecla **P**) farma sozinho: anda, escaneia e coleta materiais |
| 🌫️ **Fog of war** | o mapa vai sendo revelado conforme você explora (salvo por região, com minimapa ao vivo) |
| ⚔️ **Dromo** | batalha em tempo real (3 Scans + Battlegear/Mugic + 3 mapas, roleta e moeda cara/coroa) |
| 🧑‍🤝‍🧑 **Online** | chat global/privado, presença no mapa, PVP pareado pelo servidor |
| 👑 **Progressão** | 5ª tribo (M'arrillian) no Lv.40, 100% de escaneamento libera o chefe de cada mapa |
| 📺 **Janelinha (PiP)** | o jogo numa janela flutuante sempre na frente + modo "fora da aba" (o Caçador continua farmando com a aba escondida) |
| 🗺️ **Mapas de verdade** | cada região é uma sala própria (online, chat PERTO e relevo separados) com criaturas exclusivas |

---

## ▶ Como rodar na sua máquina

```bash
node server/server.js
# → http://localhost:8901
```

Só precisa de **Node.js 18+**. O site fica em `/`, o jogo em `/game` (exige login).

---

## ☁️ Publicar de graça (Render.com)

1. Suba este repositório no GitHub;
2. **render.com → New + → Web Service → Connect** o repositório;
3. Confira: **Runtime** Node · **Build Command** *(em branco)* · **Start Command** `npm start` · **Instance** Free;
4. **Create Web Service** e aguarde o deploy (~2 min).

> ⚠️ O plano free perde o `server/data/db.json` a cada deploy/restart. Para o progresso sobreviver,
> configure **Supabase** (`SUPABASE_URL` + `SUPABASE_KEY`) — passo a passo em
> [`docs/SUPABASE.md`](docs/SUPABASE.md).

Antes de abrir para o público, troque as chaves **Turnstile** de teste pelas suas (no topo de
`server/server.js`): as atuais são as chaves oficiais de teste da Cloudflare e sempre deixam passar.

---

## 📁 Estrutura

```
chaotic-online/
├── package.json                  ← como o servidor inicia (npm start)
├── chaotic_idleworld_v123.html   ← O JOGO (v2.21 — mapas separados de verdade, scan consertado,
│                                    janelinha PiP, jogo fora da aba, nomes de mapa corretos)
├── server/
│   ├── server.js                 ← servidor completo (Node puro)
│   ├── fem.json · skins.json     ← assets das skins
│   └── README.md                 ← documentação técnica detalhada
├── site/
│   └── index.html                ← site: ▶ JOGAR abre o jogo em página própria (sem iframe)
│                                    + botão 🪟 JANELA PRÓPRIA por personagem
└── docs/
    ├── PASSO-A-PASSO.md          ← guia de hospedagem para leigos
    ├── SUPABASE.md               ← save na nuvem que sobrevive a redeploy
    ├── MAPAS-E-SCAN.md           ← cada mapa é um mapa (online/terreno/criaturas) + scan (v2.21)
    ├── CORRECAO-NOMES-DE-MAPA.md ← o que mudou no HUD dos mapas (v2.18)
    ├── JANELINHA-PIP.md          ← janelinha flutuante + fora da aba + correção do iframe (v2.20)
    ├── patches/                  ← scripts que aplicam cada mudança (histórico reproduzível)
    └── img/                      ← prints usados nestes documentos
```

---

## 🆕 Novidades

**v2.21 — cada mapa é um mapa (e o scan voltou a funcionar)**
Dois bugs sérios relatados por jogadores: **(1)** quem estava no Bosque Verdejante via — e conversava no
chat **PERTO** — com quem estava nas Cavernas de Brasas; **(2)** as criaturas não davam para escanear
(morriam em 20 s, o herói andava contra a borda do mapa e o alvo fugia no meio da barra). Agora:
o online usa o **id da região** como sala (nada de `'perim'` valendo para todos os mapas), o chat PERTO
separa por mapa, **6 a 22 criaturas por mapa** vivendo **45 s**, a criatura **para enquanto é escaneada**
(alcance 130 px) e o **terreno é semeado pelo mapa** — cada região tem o seu relevo e é sempre igual a
si mesma. → detalhes em [`docs/MAPAS-E-SCAN.md`](docs/MAPAS-E-SCAN.md)

![Bosque](docs/img/mapa-bosque.png)

**v2.20 — a janelinha funcionando de verdade quando você joga pelo site**
O navegador **proíbe** abrir a janelinha flutuante a partir de uma página que está dentro de outra
(*"Opening a PiP window is only allowed from a top-level browsing context"*) — era isso que fazia a
janelinha falhar em quem entrava pelo site. Corrigido nos dois lados:
**[1] no site**, o **▶ JOGAR** deixa de usar iframe e abre o jogo como **página própria** (e há um
botão **🪟 JANELA PRÓPRIA** para quem quiser o jogo já numa janela separada);
**[2] no jogo**, se ele se encontrar dentro de um iframe (site antigo, preview…) em vez de mostrar
erro ele usa a janelinha de vídeo e oferece na engrenagem **🪟 Abrir o jogo em janela própria** e
**🌙 Fora da aba**. A janela aberta com `?pip=1` já vem "armada": no primeiro clique ela abre a
janelinha e avisa a aba antiga para parar de rodar/salvar (nunca mais dois saves brigando).
→ detalhes em [`docs/JANELINHA-PIP.md`](docs/JANELINHA-PIP.md)

> Publique **o jogo e o `site/index.html`** juntos — se só o jogo for trocado, o site antigo continua
> abrindo o jogo dentro de iframe (aí o jogo cai no plano B: janelinha de vídeo + atalhos).

**v2.19 — janelinha flutuante (PiP) + jogo fora da aba**
Botão **⚙️ Opções → 📺 Janelinha flutuante**: o canvas vai para uma janela que fica **sempre na frente**
(no Chrome/Edge 116+ é janela própria, arrastável) com cabeçalho mostrando mapa, nível, bateria e se o
Auto-Move está farmando. Junto liga o modo **🌙 Fora da aba**, que mantém a simulação viva quando você
troca de aba (o navegador suspende o `requestAnimationFrame` — daí o jogo "parar"): o jogo assume o loop,
um áudio inaudível evita o throttling de timers e, ao voltar, ele avisa quanto tempo você ficou fora.
→ detalhes em [`docs/JANELINHA-PIP.md`](docs/JANELINHA-PIP.md)

![Janelinha](docs/img/janelinha-pip.png)

**v2.18 — nome do mapa correto no HUD (v151)**
Antes o rótulo do topo mostrava **"Perim"** em todos os mapas (o texto vinha do tipo de cena, não da
região). Agora ele mostra o **nome real do mapa**, com uma linha de **tribo · mapa N · Safe Zone**, banner
de entrada, título do minimapa e aviso de Fast Travel — tudo a partir de uma fonte única (`REGIONS[].name`).
→ detalhes em [`docs/CORRECAO-NOMES-DE-MAPA.md`](docs/CORRECAO-NOMES-DE-MAPA.md)

![Opções](docs/img/engrenagem-opcoes.png)

---

## 🧭 Controles rápidos

| Ação | Tecla / onde |
|---|---|
| Auto-Move (farmar sozinho) | **P** |
| Inventário · Scanner · Chat | **I** · **Q** · **TAB** |
| Modo Foto (HUD limpo) | ⚙️ Opções |
| Trocar mapa (Fast Travel) | Portal / Pátio Central |
| Janelinha flutuante | ⚙️ Opções |
| Jogo em janela separada | site → **🪟 JANELA PRÓPRIA** (no card do personagem) |

---

## ⚖️ Aviso

Projeto **de fã**, sem fins comerciais. *Chaotic* e seus personagens são marcas de seus respectivos
donos; este jogo é uma homenagem feita pela comunidade, com arte própria em pixel art.
