# Artes, personagens e autenticação

## Alterações

- Logo original Chaotic Idle World na navegação e na capa.
- Música de abertura enviada, volume inicial de 35%, botão para ouvir/pausar e pausa ao abrir o jogo. O navegador pode exigir a primeira interação para liberar o áudio.
- GIFs de 64 × 64 em oito direções, preservando a arte pixel por pixel e usando o verde sólido como chave de transparência. Os arquivos originais estão em `tools/assets/`. O atlas do jogo mantém o contrato de 48 × 48 do motor; as poses enviadas são rotações, não uma caminhada nova.
- Nova personagem feminina `nova-rosa`. As skins femininas anteriores são exclusivas para VIP. IDs, contas e saves existentes são preservados. Uma conta sem VIP usa o novo visual ao abrir um personagem feminino antigo; o registro antigo não é apagado. O VIP segue o estado já usado pelo jogo (`player.vip` ou `player.vipUntil`) e os campos equivalentes da conta, se presentes.
- Três imagens de preparação/confronto/arena na aba Dromos, com ampliação e fechamento por Escape.
- Fundo azul enviado no login/cadastro, com letras em movimento. A preferência de movimento reduzido desliga a animação.
- Google OAuth usa HTTPS no Render, `state` vinculado ao cookie e perfil confirmado pelo Google. Uma conta já existente com o mesmo email verificado mantém seu progresso.
- Turnstile usa validação no servidor, confere domínio e ação e não libera o formulário por simulação em produção. Tokens consumidos são renovados após falha de login/cadastro.

## Configurar no serviço existente do Render

Não colocar segredos no código ou no GitHub.

| Variável | Valor |
| --- | --- |
| `PUBLIC_URL` | `https://chaotic-online.onrender.com` (opcional se `RENDER_EXTERNAL_URL` já estiver disponível) |
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth do Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Segredo do mesmo cliente OAuth |
| `GOOGLE_REDIRECT_URI` | `https://chaotic-online.onrender.com/auth/google/callback` (opcional; este retorno já é calculado pelo servidor) |
| `TURNSTILE_SITE_KEY` | Chave pública real do widget Turnstile |
| `TURNSTILE_SECRET_KEY` | Segredo real do mesmo widget |
| `SUPABASE_URL` / `SUPABASE_KEY` | Manter as configurações existentes de persistência |

No Google Cloud, autorizar exatamente o retorno HTTPS acima. O fluxo usa o Google diretamente; ativar um provedor Google no Supabase não substitui essas credenciais. Configurar a tela de consentimento e os usuários de teste enquanto o app estiver em modo de testes.

No Cloudflare, autorizar `chaotic-online.onrender.com` no widget. O cliente envia as ações `create` e `login`; o servidor verifica ambas. Chaves de teste não são aceitas no Render. Sem as chaves reais, os formulários ficam indisponíveis até a configuração.

Não há migração do banco. O comando continua `npm start`. As novas integrações exigem as variáveis acima; a afirmação da entrega anterior de que nenhuma variável precisava mudar não se aplica a elas.

## Antes de publicar na main

1. Confirmar que o serviço usa a branch `main` e que o commit atual foi salvo no Supabase.
2. Entrar no jogo com uma conta existente, fazer uma alteração de progresso e aguardar o salvamento.
3. No Supabase, atualizar `game_state` e confirmar mudança de `updated_at`. Se houver `Supabase inacessível` ou `falha ao salvar` no Render, corrigir antes de redeploy.
4. Configurar Google/Turnstile sem disparar um deploy antes da verificação de persistência.
5. Executar `npm test`, publicar o commit e aguardar Deploy succeeded.
6. Conferir cinco abas, música, imagens ampliadas, criação/login com senha e Google, VIP e progresso após F5.

Os testes locais usam contas fictícias e serviços simulados. Não comprovam a configuração das credenciais reais nem o salvamento do serviço publicado.

## Regenerar artes

```bash
python3 tools/build_site_assets.py
npm test
```

O exportador usa Pillow e mantém as novas prévias de GIF. Logo, fundo e screenshots enviados são arquivos independentes. Não substituir `game/index.html` pela prévia HTML.

Referências: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/reference), [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
