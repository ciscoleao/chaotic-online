# Pátio Central — lobby espacial (v2.36)

O Pátio Central usa o cenário preparado a partir da referência enviada pelo autor, com a praça circular, corredores e oito setores. O personagem é o sprite real do jogo; o fundo não contém HUD, personagem do jogador ou balão de interação fixos.

## Acessos

| Setor | Ação existente |
| --- | --- |
| Roleta | Roleta de Scan |
| Portal | Seleção de regiões e viagem para Perim |
| Shop | Loja de pilhas e materiais |
| Forja | FORJA-7 e fabricação de Drome Keys |
| Leilão | Compra, venda e ofertas do leilão |
| Depósito | Armazenamento do jogador |
| Missões | Quadro de missões |
| Comunicação | Abre o chat |
| Costura, dentro da Forja | Upgrade da mochila |
| Bebidas, dentro do Shop | Vending Machine |
| Saída sul | Ilha dos Dromos |

## Controles

- WASD/setas ou o joystick existente para andar.
- E ou o botão de interação por proximidade.
- Clique/toque nas placas e balcões para abrir os serviços, como no jogo anterior.
- Clique/toque no chão para seguir uma rota pelos corredores.
- F8 ou o botão “Ver pátio”/“Aproximar” alterna a visão completa e a câmera que acompanha o jogador.
- Computadores abrem com a visão completa. Telas pequenas abrem acompanhando o jogador.
- O Scanner mostra o mesmo cenário, os oito setores, a saída e a posição do jogador.

A Forja e a Costura continuam usando os painéis existentes e seus custos. Loja, leilão, inventário, missões, contas, skins e progresso continuam usando os sistemas existentes. O mundo do Pátio mantém as coordenadas de 3200 × 2400 usadas pela presença online. O servidor expõe somente os três arquivos públicos do lobby, por uma lista explícita.

## Arquivos

- `assets/lobby/patio-central.webp`: cenário, 1448 × 1086, aproximadamente 526 KiB.
- `assets/lobby/central-lobby.js`: geometria, colisões, navegação, câmera, interações e minimapa.
- `assets/lobby/central-lobby.css`: controles e ajustes visuais do HUD durante a cena.
- `chaotic_idleworld_v123.html`: conecta a cena e o minimapa existentes ao novo módulo.
- `server/server.js`: entrega os arquivos públicos do lobby.
- `tests/lobby.test.cjs`: testes sem dependências extras.
- `tests/lobby.browser.cjs`: roteiro opcional de teste com Playwright.

O fundo é uma imagem única. As colisões e pontos de interação são camadas programadas separadamente. Móveis e NPCs pintados no cenário não são sprites animados independentes; o herói, luzes e interações são dinâmicos. Em caso de falha no download do fundo, o jogo desenha o piso de navegação e sinaliza o problema.

## Validação

Executados:

```sh
npm test
node docs/patches/test_v234_painel.js
node docs/patches/test_v235_presence.js
```

Resultados: 3 testes do lobby, 24 verificações dos painéis e 23 da presença online aprovados. Os testes do lobby cobrem a ligação de todos os serviços com a praça, a correspondência entre navegação e colisões, acesso HTTP aos assets, proteção dos arquivos do servidor, montagem do jogo autenticado e sintaxe dos scripts servidos.

As verificações antigas do título foram ajustadas para aceitar a versão que introduziu a correção ou uma posterior. As verificações funcionais continuam presentes.

**Limitação desta entrega:** o teste visual/end-to-end em navegador não foi concluído. A instalação do navegador de teste não ficou disponível e o navegador remoto bloqueou a abertura da prévia local por política de acesso. O teste histórico da Forja depende do arquivo externo `/tmp/pptr/lib_chaos.js`, que não acompanha o repositório. A conferência visual e das interações em navegador deve ser feita antes de integrar a alteração à versão publicada.

Com Playwright e um Chromium disponíveis, o roteiro opcional é:

```sh
npm run test:lobby:browser
```

O roteiro cria servidor, contas e saves temporários. Ele não usa dados reais em `server/data`. Aceita `CHROMIUM_EXECUTABLE` para indicar um navegador instalado e `LOBBY_SCREENSHOTS` para salvar as capturas. `PHASER_TEST_FILE` permite usar uma cópia local da mesma versão 3.60.0 do Phaser durante o teste.

## Origem da arte

Preparada com a ferramenta integrada de geração de imagens, em modo de edição da referência do autor. Depois, o resultado foi convertido para WebP para uso no jogo. Arquivo final: `assets/lobby/patio-central.webp`.

Prompt usado:

```text
Use case: precise-object-edit
Asset type: playable Phaser game environment background, landscape 4:3, 1536x1152.
Input image: EDIT TARGET, the supplied pixel-art space station lobby.
Primary request: preserve the exact space-station lobby and remove ONLY the gameplay overlays and the central player, making a clean background for an actual game. Remove the top-left PLAYER1 portrait, health and mana bars; reconstruct the underlying wall naturally. Remove the upper-right small backpack/inventory UI button and its E badge; reconstruct wall. Remove the black interaction tooltip "Pressione E para Roleta" at the center and remove the single player standing on the central glowing cyan circle; reconstruct the circle and floor flawlessly. Leave the center circle EMPTY.
Keep all eight room signs and their exact words as environmental signage: ROLETA upper left, PORTAL top center, SHOP upper right, FORJA middle left, LEILÃO middle right, DEPÓSITO lower left, MISSÕES lower center, COMUNICAÇÃO lower right.
Preserve EXACTLY the existing geometry, room positions, floor, circular plaza, corridors, stairs, all lighting, consoles, existing NPCs inside shops, props, vegetation, planet, starfield, pixel-art style and viewpoint. No rearrangement, no new rooms, no extra HUD, no new characters. Keep the same full-map framing with all eight rooms and bottom entrance visible. Rich crisp detailed pixels as in source, not vector art. This is the literal playable background, not a mockup or screenshot.
```

