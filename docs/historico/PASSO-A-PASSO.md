# 🎮 CHAOTIC.IDLEWORLD ONLINE — guia passo a passo

Este pacote tem o servidor do jogo (site + contas + chat + PVP + save na nuvem).
**Sem dependências**: só precisa do Node.js 18+ no servidor.

```
chaotic-online.zip
├── package.json                  ← diz ao servidor como iniciar
├── server/
│   ├── server.js                 ← o servidor completo (Node puro)
│   ├── fem.json                  ← skin feminina
│   └── README.md                 ← documentação técnica
├── site/
│   └── index.html                ← site (JOGUE AGORA / CRIAR CONTA)
└── chaotic_idleworld_v123.html   ← o jogo
```

---

## OPÇÃO A — Hospedar GRÁTIS na internet (Render.com) ← recomendada

Em ~15 minutos o jogo fica num link público que você manda pro amigo.

### 1. Junte os arquivos num repositório do GitHub
1. Crie conta em **github.com** (se não tiver);
2. Clique em **+** (canto superior direito) → **New repository**;
3. Nome: `chaotic-online` · marque **Public** · **Create repository**;
4. Na tela do repositório, clique em **uploading an existing file**;
5. Arraste **o conteúdo da pasta extraída** (package.json, a pasta `server/`,
   a pasta `site/` e `chaotic_idleworld_v123.html`) e clique em **Commit changes**.

> ⚠️ Importante: o `package.json` e as pastas `server/` e `site/` precisam ficar
> na **raiz** do repositório (não dentro de outra pasta).

### 2. Crie o servidor no Render
1. Crie conta em **render.com** (pode entrar com o GitHub);
2. **New +** → **Web Service**;
3. **Connect** o repositório `chaotic-online`;
4. Confira os ajustes:
   - **Language / Runtime:** Node
   - **Build Command:** (deixe em branco, ou `echo ok`)
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. **Create Web Service** e aguarde ~2 min o deploy.

### 3. Pronto — seu link existe!
O Render mostra a URL, algo como:
```
https://chaotic-online.onrender.com
```
Abra no navegador (ou no celular) → **CRIAR CONTA** → personagem → **JOGAR**.
Esse link é o que você manda pro seu amigo. 💜

> 💡 No plano grátis o servidor "dorme" após 15 min sem uso (a primeira visita
> demora ~50s pra acordar) e **as contas/chats são apagadas a cada reinício**
> (o disco é temporário). Pra jogar com amigos isso funciona bem; se quiser
> manter os dados permanentes, no Render é possível anexar um **Disk** pago
> apontando pra pasta `server/data`.

### 4. Pra duelar com seu amigo (PVP)
1. Cada um cria a **própria conta** no link;
2. Cada um entra no mundo com o próprio personagem;
3. Cada um clica no **Pórtico central** → painel de missões → **⚔️ DUELO PVP**;
4. O pareio é automático: moeda, escolha de confronto e batalha nos dois.
   (dica: combinem no chat global a hora do duelo!)

---

## OPÇÃO B — Rodar no seu computador (só na rede local)

1. Instale o **Node.js 18+** (nodejs.org);
2. Extraia o zip e, na pasta, rode:
   ```
   npm start
   ```
3. Quem estiver na **mesma rede Wi-Fi** abre `http://SEU-IP:8901`
   (seu IP aparece com `ipconfig` no Windows / `ifconfig` no Mac/Linux).
4. Pra amigos de fora, seria preciso expor a porta do seu roteador
   (avançado — por isso a Opção A é mais fácil).

---

## Como saber que está na versão certa
O painel de chat do jogo tem **3 abas**: 📍 PERTO · 🌐 GLOBAL · ✉️ PRIVADO
e o selo **v123** no cabeçalho. Se aparecer só "CHAT GLOBAL" sem abas, é
versão antiga → recarregue a página com cache limpo (Ctrl+Shift+R).

## Turnstile (anti-bot)
O servidor usa as **chaves de teste oficiais** do Cloudflare Turnstile —
sempre passam. Quando quiser o widget real de produção, troque
`SITEKEY`/`SECRET` no topo do `server/server.js` pelas chaves do seu
domínio (dashboard do Cloudflare).
