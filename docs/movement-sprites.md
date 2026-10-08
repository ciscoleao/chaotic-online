# Sprites de movimento

Os personagens atuais usam os GIFs `Idle_walk_*` (feminino) e
`Idle_walking_*` (masculino), preservados em `tools/assets/movement`.
Cada arquivo contém seis quadros, com 200 ms por quadro.

Os atlas têm 512×448 pixels: oito colunas (S, SE, E, NE, N, NW, W, SW)
e sete linhas (repouso, seis quadros de caminhada). Cada célula é 64×64.
O repouso utiliza a primeira pose da própria sequência para não mudar
as proporções ao começar/parar. Os GIFs de rotação continuam nas vitrines.

A animação sul feminina veio em 84×84, com dez pixels vazios ao redor.
Somente essa margem é retirada; a imagem do personagem não é reduzida.
O alinhamento usa translações inteiras pelo topo e centro da cabeça,
preservando as variações naturais dos pés. Não se redimensionam poses
individualmente e não se aplica compressão com perda ao atlas PNG.

As texturas no jogo mantêm 64×64 e filtragem NEAREST, sem passar primeiro
por uma redução para 48×48. A escala 0,9375 mantém a tela do personagem
em 60×60 unidades do mundo, com a colisão anterior (20×15).
O pátio mantém seu multiplicador de escala. A skin feminina VIP clássica
continua compatível com os atlas antigos de 48×48.

## Verificação

```sh
python tools/build_movement_assets.py --check
npm test
```

Pillow é necessário para reconstruir/conferir os assets. A conferência
valida duração, seis poses distintas por direção, transparência e que
nenhum pixel opaco foi cortado. Os testes JavaScript conferem os recortes,
oito setores de direção, ciclo/repouso, temporização, manutenção da fase
ao trocar direção, dimensão visual e colisão.

Para reconstruir: `python tools/build_movement_assets.py`.
O importador `build_character_assets.py` também usa esse gerador e não
substitui as animações por repetições de uma pose parada.

Na verificação visual manual, caminhar nas oito direções, alternar
rapidamente esquerda/direita e diagonal, parar/recomeçar e comparar os
dois personagens no pátio e no mapa. Testar ainda a exibição dos retratos.
