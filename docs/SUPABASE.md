# ☁️ Supabase — contas permanentes (sobrevivem às atualizações)

Com este passo (único, ~10 minutos), as **contas, saves, chat e códigos
resgatados ficam guardados no Supabase**. A partir daí, atualizar o jogo
(subir arquivos novos no GitHub → Render redeploya) **NÃO apaga mais nada**.

O servidor já está pronto: se as variáveis `SUPABASE_URL` e `SUPABASE_KEY`
estiverem definidas, ele carrega e salva o estado lá automaticamente.
Sem elas, funciona como antes (só disco local).

O servidor também é **resistente a queda da nuvem**: se o Supabase estiver
fora do ar em algum momento (ou a URL estiver errada), o jogo continua
funcionando e, quando a nuvem voltar, ele **mescla tudo sozinho** — contas
criadas nesse período não se perdem.

---

## 1. Criar o projeto no Supabase

1. Acesse **supabase.com** → **Start your project** (conta grátis);
2. **New project**:
   - Name: `chaotic-online`
   - Database Password: escolha uma e **guarde** (não usaremos, mas pede)
   - Region: `South America (São Paulo)` (mais perto do Brasil)
   - Wait ~2 min.

## 2. Criar a tabela (1 comando)

1. No menu lateral: **SQL Editor** → **New query**;
2. Cole isto e clique em **Run**:

```sql
create table if not exists game_state (
  id bigint primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
```

## 3. Copiar as 2 chaves

1. Menu: **Project Settings** (⚙️) → **API**;
2. Copie:
   - **Project URL** (algo como `https://xxxxx.supabase.co` — **SEM** `/rest/v1` no final!)
   - **service_role** secret (em "Project API Keys" — ⚠️ é a `service_role`,
     **NÃO** a `anon` — porque o servidor é quem escreve, sem restrições).

## 4. Ligar no Render

1. Abra **render.com** → seu Web Service (`chaotic-online`);
2. Aba **Environment** → **Add Environment Variable** (duas vezes):
   - Key: `SUPABASE_URL` · Value: a Project URL
   - Key: `SUPABASE_KEY` · Value: a service_role
3. **Save Changes** → o Render redeploya sozinho (~2 min);
4. Abra os **Logs** do serviço e procure a linha:

```
Persistência: SUPABASE (sobrevive a redeploys) ✓
```

Pronto! ✅ A partir desse momento **toda conta criada, save, mensagem e
resgate de código vão para o Supabase** e sobrevivem a redeploys e sleeps.

---

## 🔄 Como atualizar o jogo DEPOIS disso (sem perder contas)

1. Baixe o `chaotic-online.zip` novo (quando eu publicar atualização);
2. GitHub → seu repositório → **Add file → Upload files** → arraste o
   conteúdo e **substitua** os arquivos → Commit;
3. Render redeploya sozinho. Contas, saves e chat **continam lá**.

> 💡 Dica: o **sleep de 15 min** do plano grátis do Render continua (a 1ª
> visita após um tempo demora ~1 minuto pra acordar). Isso é do Render, não
> do jogo. Se um dia incomodar muito, a solução é o plano pago do Render.

## 🩺 Checklist rápido de problemas

| Sintoma | Causa provável |
|---|---|
| Nos logs do Supabase aparece `/rest/v1/rest/v1/game_state` (404) | A `SUPABASE_URL` foi colada **com o sufixo `/rest/v1`** — use só `https://SEU-PROJETO.supabase.co`. (Servidores novos toleram isso sozinhos, mas o ideal é corrigir a variável.) |
|---|---|
| Log mostra `disco local (redeploys apagam)` | Variáveis de ambiente não salvas no Render (confira os nomes: `SUPABASE_URL` e `SUPABASE_KEY`) |
| Log mostra `Supabase inacessível` | URL errada ou projeto pausado (7 dias sem uso — reative no painel do Supabase) |
| `HTTP 404` nos logs de nuvem | A tabela `game_state` não foi criada (refaça o passo 2) |
| `HTTP 401` | Chave errada (tem que ser a **service_role**, não a anon) |

Enquanto o Supabase estiver OK, o servidor grava lá a cada poucos segundos
(debounce) e também **no encerramento** (quando o Render redeploya, o
processo recebe SIGTERM e salva antes de sair).
