# 📺 Janelinha flutuante (Picture-in-Picture) + jogo fora da aba

**Chaotic.IdleWorld · v152 / v2.19** · aplicado em `chaotic_idleworld_v123.html`
(continua com o mesmo nome do arquivo — é só substituir o antigo)

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
`pipFechar152`, `bgSet152`, `bgTick152`, todas marcadas com `v152` no código.

---

## 5. Testes (Chrome real, headless, no arquivo final)

```
1) Ligar pela engrenagem .... janelinha criada como janela própria ✓ / 2º plano ligado junto ✓
2) Aba escondida (rAF parado, 6s):
      personagem andou ............ SIM ✓ (Δ 199,-68)
      bateria drenou .............. SIM ✓ (98.77% → 96.81%)
      janelinha atualizou .......... SIM ✓ (comparação de pixels)
      cabeçalho .................... "Bosque Verdejante | Lv.99 · 🔋 96% · 💤 auto-move off · 🌙 2º plano"
3) Fechar a janelinha ........ devolveu o 2º plano ao estado anterior ✓
4) 2º plano ligado na mão .... continua ligado depois de fechar a janelinha ✓
5) Preferência salva ......... religou sozinho ao recarregar o jogo ✓
6) Regressão (nomes de mapa) .. "Bosque Verdejante | Prado Verde | Caverna de Lava | Lagoa Negra M'arrillian" ✓
   Erros de página: nenhum
```

Prints desta sessão: `print_engrenagem_pip.png` (a engrenagem com os botões novos) e
`print_janelinha_pip.png` (a janelinha mostrando o Bosque Verdejante ao vivo).

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

---

## 7. Arquivos

| Arquivo | O que é |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo com tudo** (nomes de mapa v151 + janelinha/segundo plano v152) |
| `LEIA-ME-JANELINHA-PIP.md` | este guia |
| `LEIA-ME-CORRECAO-NOMES-DE-MAPA.md` | guia da correção anterior (nomes de mapa) |
| `patch_pip.py` + `patch_mapnames.py` | scripts que aplicam as duas mudanças (histórico reproduzível) |
| `print_engrenagem_pip.png` · `print_janelinha_pip.png` | prints dos testes |
| `preview_nomes_mapa.html` | preview clicável dos nomes de mapa |

### Publicar no Render/GitHub
O `server.js` busca o arquivo pelo **nome exato** `chaotic_idleworld_v123.html` — suba este por cima
do antigo e pronto, nada mais precisa mudar.
