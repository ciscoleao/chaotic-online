# Chaotic Online

Jogo HTML com servidor Node.js para contas, personagens, chat, duelos e progresso salvo.

## Organização

| Caminho | Conteúdo |
|---|---|
| `game/index.html` | Versão atual do jogo, com imagens e scripts embutidos |
| `site/index.html` | Página inicial, login e seleção de personagem |
| `server/` | Servidor, dados das skins e personagem feminina |
| `tools/` | Editores, laboratório de música e ferramentas de criação |
| `tools/assets/` | Referências necessárias às ferramentas |
| `creatures/` | Banco, fontes e ferramentas das criaturas |
| `tests/` | Verificações do servidor atual e do editor |
| `docs/` | Publicação e persistência |
| `docs/historico/` | Anotações, patches e testes de versões anteriores |

## Executar

Requer Node.js 18 ou superior. O servidor não usa dependências externas.

```bash
npm start
```

Abra `http://localhost:8901`. A página inicial está em `/`; o jogo autenticado está em `/game`.
O servidor lê `game/index.html`. Ao atualizar o jogo, substitua esse arquivo e mantenha o mesmo caminho.

## Verificar

```bash
npm test
```

Os testes usam dados temporários e não acessam as contas reais nem o Supabase.
Os arquivos em `docs/historico/` são referências antigas e não fazem parte desta suíte.

## Render e Supabase

O serviço existente usa `npm start` na raiz do repositório. Alterações na branch `main` acionam o deploy automático.
As variáveis `PORT`, `SUPABASE_URL`, `SUPABASE_KEY` e `SUPABASE_TABLE` continuam sendo lidas pelo servidor.
Consulte [PUBLICAR.md](docs/PUBLICAR.md) antes de atualizar um serviço com jogadores.
O arquivo local `server/data/db.json` é criado durante a execução e não deve ser enviado ao GitHub.

## Ferramentas

- Abra `tools/editor-mapa-patio.html` para usar o editor de mapa.
- Abra `tools/Testar_Musicas.html` para testar as faixas.
- `python3 tools/build_music_lab.py` regenera o laboratório na pasta `tools/`.
- As ferramentas Python de imagens precisam de Pillow; a extração de drones também usa NumPy.
- Prévias geradas ficam em `previews/` e não são versionadas.
- Geradores antigos que pedem um clone ou HTML de versão anterior são referências de desenvolvimento; revise os caminhos antes de executá-los.

## Copyright

© 2026 Francisco de Arêa Leão — Todos os direitos reservados.

Código aberto para visualização, mas não pode ser usado, comercializado ou modificado sem autorização.
Este repositório está licenciado sob a Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International.
