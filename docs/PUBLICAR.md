# Publicação da versão atual

O Render inicia o servidor com `npm start`. O jogo fica em `game/index.html` e a página inicial em `site/index.html`.

## Atualizar o jogo

1. Teste o HTML novo antes de substituir a versão publicada.
2. Substitua `game/index.html`, mantendo o nome e a pasta.
3. Rode `npm test`.
4. Confirme que o servidor está conseguindo carregar e salvar no Supabase antes de publicar na branch `main`.
5. Depois do deploy, confira os logs e abra o jogo com uma conta para verificar a versão.

## Dados dos jogadores

As contas e o progresso estão no banco, não dentro do HTML.
As configurações do Supabase ficam nas variáveis de ambiente do Render, nunca em arquivos públicos.
O servidor também mantém `server/data/db.json` durante a execução.
O disco local do serviço não garante recuperação após um redeploy.

Se os logs mostrarem `Supabase inacessível` ou `falha ao salvar`, resolva a conexão antes de reiniciar ou publicar.
A mensagem `Persistência: SUPABASE` sozinha informa que as variáveis estão configuradas; ela não comprova que a gravação funcionou.

## Recuperar arquivos removidos na organização

A versão anterior à limpeza foi preservada no GitHub na branch `backup/antes-limpeza-2026-10-07`.
O histórico normal de commits também guarda os arquivos retirados.
Os patches e testes em `docs/historico/` podem citar caminhos e imagens antigos: use-os como referência, não como comandos de atualização da versão atual.
