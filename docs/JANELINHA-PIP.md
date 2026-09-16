# 📺 Janelinha flutuante (Picture-in-Picture) + jogo fora da aba

**Chaotic.IdleWorld · v152 → v2.20** · aplicado em `chaotic_idleworld_v123.html`
(continua com o mesmo nome do arquivo — é só substituir o antigo)

> **Novidade v2.20 (importante se você entra pelo *site*):** o navegador **não permite** abrir a
> janelinha flutuante quando o jogo está **dentro de outra página** (iframe). Mensagem que aparecia:
> *"Opening a PiP window is only allowed from a top-level browsing context"*. Resolvido nos dois lados:
>
> * **No site:** o botão **▶ JOGAR** agora **abre o jogo em página própria** (sem iframe). Se você ainda
>   vir o jogo "dentro" do site, suba também o `site/index.html` atualizado para o Render/GitHub.
> * **No jogo:** se por algum motivo ele estiver num iframe (site antigo, preview, etc.), em vez de
>   mostrar erro ele oferece alternativas na engrenagem: **🪟 Abrir o jogo em janela própria** (abre uma
>   janela nova já "armada" para a janelinha) e **🌙 Ligar modo fora da aba**.

---

## 1. Por que o jogo "parava" fora da aba

Não era bug do jogo: **o navegador desliga o `requestAnimationFrame` quando a aba sai de foco**
(economia de bateria). O Phaser dirige o mundo por esse loop — sem quadros, o Caçador congelava.

Então a feature tem duas metades:

| Metade | O que resolve |
|---|---|
| **📺 Janelinha flutuante** | você *vê* o jogo rodando numa janelinha que fica por cima das outras janelas/apps |
| **🌙 Modo fora da aba** | a simulação *continua de verdade* (andar, escanear, coletar, gastar bateria) com a aba escondida |

Uma só faz sentido com a outra — por isso **ligar a janelinha liga o modo fora da aba junto**
(e, ao fechar a janelinha, ele volta ao que estava antes; se você ligou na mão, continua ligado).

---

## 2. Como usar (dentro da engrenagem ⚙️)

```
⚙️ (canto superior direito) → 📺 JANELA FLUTUANTE (PICTURE-IN-PICTURE)
   ├─ 📺 Janelinha flutuante (PiP) ...... abre/fecha a janelinha
   └─ 🌙 Fora da aba .................... liga/desliga o modo segundo plano
```

1. Abra a **engrenagem** e toque em **📺 Janelinha flutuante** (o navegador exige um toque — regra de segurança dele, não escolha nossa);
2. A janelinha abre **já ligando o modo fora da aba**;
3. Aperte **P** (Auto-Move) se ainda estiver desligado — o jogo avisa isso numa dica;
4. Troque de janela/app normalmente: o Caçador segue andando, escaneando e juntando Scan Cards;
5. Fechar é no **✕ fechar** do cabeçalho da própria janelinha (ou no mesmo botão da engrenagem);
6. Quando você volta para a aba, aparece o aviso: *"🌙 Você ficou ~X min fora — o Caçador continuou farmando sozinho."*

A janelinha tem um cabeçalho com **nome do mapa**, **nível**, **bateria** e se o **Auto-Move** está
farmando — assim você acompanha de relance sem precisar clicar.

### 2.1 Jogando pelo site (jeito novo)

```
Site (chaotic.idleworld) → escolher personagem
   ├─ ▶ JOGAR ................. o jogo abre NA MESMA ABA, como página própria
   └─ 🪟 JANELA PRÓPRIA ....... abre o jogo já numa janela separada do navegador
                                 (se o navegador bloquear pop-up, ele avisa e abre na aba)
```

Com o jogo em página própria, **📺 Janelinha flutuante funciona normalmente** (era o iframe que
atrapalhava). Se o pop-up do 🪟 for bloqueado, o site mostra o aviso em português e abre o jogo na
própria aba — de lá a janelinha também funciona.

Depois de usar o 🪟, a aba do site **não fica mais vazia**: aparece o cartão

```
🪟 O jogo abriu em outra janela
   ├─ ▶ JOGAR NESTA ABA ...... traz o jogo para cá (mesma aba)
   └─ ↩ VOLTAR AO SITE ....... volta para a lista de personagens
```

(é o plano B para quando a janela nova abre atrás desta: nada de tela escura sem saída).

---

## 3. Compatibilidade

| Navegador | Janelinha | Observação |
|---|---|---|
| **Chrome / Edge 116+ (PC)** | ✅ janela própria (Document PiP) | arrasta, redimensiona, fica **sempre na frente** |
| Chrome / Edge antigos, Opera, Brave | ⚠️ PiP de vídeo | o navegador decide tamanho e posição (canto da tela) |
| **Safari (macOS)** | ⚠️ PiP de vídeo | idem, via `webkitSetPresentationMode` |
| **Android (Chrome)** | ⚠️ PiP de vídeo | funciona; a janelinha costuma aparecer em miniatura |
| **iPhone/iPad** | ❌ | a Apple não permite PiP de canvas em navegador |
| Modo fora da aba | ✅ **qualquer navegador** | é um recurso interno do jogo, não depende do PiP |
| Jogo dentro de iframe (site antigo) | ⚠️ PiP de vídeo + atalhos | a janela própria é proibida pelo navegador; use 🪟 ou 🌙 |

> Mesmo sem janelinha nenhuma, o botão **🌙 Fora da aba** sozinho já resolve "o jogo parou":
> você volta na aba depois e vê o progresso que rendeu.

---

## 4. Como foi feito (resumo técnico)

```
📺 JANELINHA
   1. game.canvas.captureStream(30)      → transforma o canvas do jogo em vídeo ao vivo
   2. documentPictureInPicture.requestWindow({...})  → janela própria (Chrome/Edge 116+),
      com um cabeçalho em DOM (mapa · Lv · bateria · auto-move) que atualiza 1x por segundo
   3. fallback: <video srcObject=stream> + requestPictureInPicture()
      (o <video> fica escondido no canto, invisível, só servindo o PiP)

   v2.20 — DETECÇÃO DE IFRAME
   • pipEmIframe152() diz se estamos dentro de outra página; nesse caso a janela própria
     nem é tentada (o navegador a proíbe) → vai direto ao PiP de vídeo e mostra, na
     engrenagem, 🪟 (abrir o jogo em janela própria) e 🌙 (fora da aba)

   v2.20 — JANELA NOVA "ARMADA" (?pip=1)
   • o site abre a janela do jogo com ?pip=1
   • o jogo mostra um banner: "Clique em qualquer lugar para abrir a janelinha"
     (o navegador só libera a janelinha depois de um clique do usuário)
   • ao abrir a janelinha, ele avisa a instância antiga (aba/iframe do site) para
     PARAR de rodar e de salvar → assim dois jogos abertos nunca brigam pelo mesmo save;
     a aba antiga mostra "O jogo está rodando na janela própria"
   • BLINDAGEM v2.20b: tudo isso é opcional e fica dentro de try/catch; o aviso à
     instância antiga só sai ~0,9 s depois (com o jogo novo já de pé) e o banner só
     entra na página depois que o documento carrega — nada aqui pode atrapalhar o
     carregamento do jogo

🌙 FORA DA ABA ("co-piloto")
   • setInterval a 20 Hz chama game.step(agora, delta) SÓ quando não há quadros reais;
     o rAF marca cada quadro real (evento 'poststep') e o co-piloto se cala por 120 ms
     após cada um  → impossível dar passo duplo (testado: 0 passos extras com a aba visível)
   • o delta é travado em 140 ms: mesmo que o navegador atrase o timer, nada "teleporta"
   • um áudio inaudível (oscilador 40 Hz com gain 0,0002) mantém a página como
     "tocando áudio" — é o que impede o navegador de estrangular o timer para 1x/minuto
   • a preferência fica salva: ao abrir o jogo o modo religa sozinho (sem novo toque)
```

Arquivos/handles novos: `PIP152` (janelinha) e `BG152` (segundo plano), funções `pipToggle152`,
`pipFechar152`, `bgSet152`, `bgTick152`, `pipArme152`, todas marcadas com `v152`/`v153` no código.

---

## 5. Testes (Chrome real, headless, no arquivo final)

```
A) NA ENGrenagem (jogo servido pelo próprio servidor, http://localhost):
   • ligar a janelinha ...... modo "document" (janela própria) ✓ segunda aba em branco do navegador não aparece
   • janelinha ao vivo ...... pixels mudam a cada 2 s ✓
   • modo fora da aba ....... ligado junto ✓
   • aba escondida (rAF parado, 6s):
        personagem andou ............ SIM ✓ (Δ 199,-68)
        bateria drenou .............. SIM ✓ (98.77% → 96.81%)
        cabeçalho ................... "Bosque Verdejante | Lv.99 · 🔋 96% · 💤 auto-move off · 🌙 2º plano"
   • fechar a janelinha ..... devolveu o 2º plano ao estado anterior ✓
   • preferência salva ...... religou sozinho ao recarregar o jogo ✓

B) PELO SITE (mesmo servidor, fluxo completo com cadastro/login):
   • ▶ JOGAR (mesma aba) .... URL virou /game?char=… → cena "Pátio Central" ✓ sem iframe ✓
   • engrenagem ............. janelinha abre no modo janela própria ✓ (painel de alternativas nem aparece)
   • 🪟 JANELA PRÓPRIA ...... janela separada abriu o jogo ✓ (cena Pátio Central, nick certo)
   • cartão na aba antiga ... "O jogo abriu em outra janela" com ▶ JOGAR NESTA ABA (leva o jogo
                              para esta aba ✓) e ↩ VOLTAR AO SITE (volta aos personagens ✓)
   • erros de página ........ nenhum ✓

C) JOGO DENTRO DE IFRAME (site antigo / preview):
   • detecção ................ emIframe:true → PiP de vídeo, sem erro na tela ✓
   • engrenagem .............. botão "🪟 Abrir o jogo em janela própria (resolve)" + aviso em PT-BR ✓
   • 🪟 ...................... abre janela nova com ?pip=1 (banner de clique, 2º plano ligado) ✓
   • 1º clique na janela nova  janelinha abre; a aba antiga recebe o aviso e para de salvar ✓
   • aba antiga .............. para de simular, mostra "O jogo está rodando na janela própria" ✓

   Regressão (nomes de mapa): "Bosque Verdejante | Prado Verde | Caverna de Lava | Lagoa Negra M'arrillian" ✓
```

Prints desta sessão: `print_janelinha_pip.png` e `print_engrenagem_pip.png` (janelinha/engrenagem),
`print_site_botoes.png` (os dois botões no card do personagem), `print_jogo_pagina_propria.png`
(o jogo como página própria, sem iframe), `print_pip_servidor.png` (janelinha ligada nesse fluxo) e
`print_aba_antiga_aviso.png` (aviso na aba antiga depois da transferência).

---

## 6. Dicas e limitações honestas

- **Deixe a janelinha pequena** (ela é redimensionável): o jogo renderiza no tamanho real da tela
  e depois encolhe para a janelinha — a economia é pequena, mas existe.
- **Auto-Move (P) é o que faz render**: sem ele o personagem só fica parado (a bateria ainda drena).
- Às vezes o navegador **congela timers** em abas de fundo muito tempo (economia de energia do
  Windows/macOS). O áudio silencioso reduz muito isso, mas em notebooks em modo "economia de energia"
  pode cair para ~10 quadros/s — o jogo continua, só mais devagar. O botão mostra `🌙 2º plano` para
  você saber que está ativo.
- A janelinha é **espelho** da tela (não é um segundo jogo): a resolução é a do canvas.
- Fechou a aba principal? A janelinha fecha junto (é a mesma página).
- **Celular**: em iPhone não existe PiP de canvas; no Android funciona em miniatura. Se você quiser,
  dá para fazer uma versão pensada para celular (com controles mínimos dentro da janelinha) — só pedir.
- **Não abra o jogo duas vezes de propósito** (duas abas/janelas com o mesmo personagem): a estrutura
  nova da janela ?pip=1 já evita que as duas salvem por cima uma da outra, mas o normal é jogar numa só.

---

## 7. Arquivos

| Arquivo | O que é |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo com tudo** (nomes de mapa v151 + janelinha/2º plano v152 + correção do iframe v2.20) |
| `site/index.html` | o site: **▶ JOGAR abre o jogo em página própria** + botão 🪟 JANELA PRÓPRIA por personagem |
| `LEIA-ME-JANELINHA-PIP.md` | este guia |
| `LEIA-ME-CORRECAO-NOMES-DE-MAPA.md` | guia da correção anterior (nomes de mapa) |
| `patch_mapnames.py` · `patch_pip.py` · `patch_pip_iframe.py` · `patch_pip_arme_blindada.py` · `patch_site_pip.py` · `patch_site_aviso_janela.py` | scripts que aplicam as mudanças em ordem (histórico reproduzível) |
| `print_engrenagem_pip.png` · `print_janelinha_pip.png` · `print_site_botoes.png` · `print_jogo_pagina_propria.png` · `print_site_janela_aberta.png` | prints dos testes |
| `preview_nomes_mapa.html` | preview clicável dos nomes de mapa |

### Publicar no Render/GitHub
O `server.js` busca o arquivo pelo **nome exato** `chaotic_idleworld_v123.html` — suba este por cima
do antigo **e também o `site/index.html`** (é ele que deixa de usar iframe). Depois de subir, abra o
site com Ctrl+F5 (ou aba anônima) para o navegador não usar o HTML antigo do cache.

> ※ O título interno do jogo já aparece como **v2.20** — é a mesma versão que este guia descreve
> (`v152`/`v153` são os nomes internos dos patches; o número visível ao jogador é v2.20).
