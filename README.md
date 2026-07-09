# Planning Poker XCL

Ferramenta interna de estimativa colaborativa (Planning Poker) para times
ágeis da XCL. Múltiplos Scrum Masters podem rodar sessões em paralelo, cada
uma em uma sala isolada, sem necessidade de login.

Stack: Next.js (App Router) + Supabase (Postgres só para identidade da sala +
Realtime para tudo que é sessão de votação) + Zustand + Tailwind/shadcn.
Deploy recomendado no free tier (Vercel Hobby + Supabase Free), com caminho
de migração para self-hosted (Docker Compose do Supabase + build standalone
do Next.js, ver "Deploy") e para AWS (ver "Preparação para AWS") já
documentados.

O plano completo de arquitetura original está em
`C:\Users\pferr\.claude\plans\polished-launching-hanrahan.md`.

## Arquitetura de dados (importante — mudou na Fase 7)

Só a tabela `rooms` existe no Postgres hoje: é identidade da sala (nome do
projeto, nome do Scrum Master, baralho, token do SM, `last_activity_at` para
o expurgo por inatividade). **Rodadas e votos não são persistidos em nenhum
banco** — vivem só no canal Realtime da sala (`room:{roomId}`), via Presence
(quem está na sala, se já votou, e o valor da carta *depois* de revelado) e
Broadcast (sinalização de início de rodada / reveal / encerramento). Ver
"Fase 7" abaixo para o raciocínio completo e os trade-offs assumidos.

## Status do projeto

- [x] **Fase 0 — Plano.** Arquitetura, schema, contratos de eventos e ordem
      de implementação definidos e aprovados.
- [x] **Fase 1 — Fundação.** Projeto Next.js + Tailwind + shadcn/ui;
      Supabase configurado (`.env.local`); schema aplicado
      (`supabase/migrations/0001_init.sql`); `config/decks.ts`; criação de
      sala funcionando (`POST /api/rooms` → redirect para `/sala/{roomId}`
      com token de Scrum Master capturado e removido da URL). Verificado
      ponta a ponta (build, typecheck, lint e navegador real).
- [x] **Fase 2 — Sala e presença.** Form de entrada (nome/cargo, incl.
      "Outro"); identidade persistida em `sessionStorage` por sala
      (`lib/identity.ts` + `store/useIdentityStore.ts`); mesa renderizando
      participantes via Supabase Presence em tempo real
      (`lib/realtime/channel.ts`, `lib/realtime/use-room-channel.ts`,
      `components/room/VotingTable.tsx`); identidade visual placeholder da
      XCL aplicada nos tokens de tema (`app/globals.css`) e no header
      (`components/layout/`).
- [x] **Fase 3 — Votação.** `DeckFooter` + `Card` (flip 3D em CSS puro);
      seleção/retirada de voto; destaque da própria carta restaurado via
      `sessionStorage` (`lib/vote-storage.ts`) sem nunca trafegar o valor
      pelo servidor; reveal restrito ao Scrum Master (`lib/sm-auth.ts`,
      `x-sm-token`) com cálculo de stats (`lib/stats.ts`); `ResultsPanel`
      com distribuição, média/mediana/mín/máx (só Fibonacci) e indicador de
      consenso.
- [x] **Fase 4 — Rodadas e histórico.** Nova rodada/revote/próximo ticket
      pelo Scrum Master; histórico de rodadas reveladas na sala.
      **Removido na Fase 7** — ver abaixo.
- [x] **Fase 5 — Polimento.** Monograma "XCL" no verso da carta; `DeckFooter`
      rolável no celular; `useRoomChannel` expõe `connectionStatus`
      (`connecting`/`connected`/`disconnected`) com `ConnectionBanner`;
      resync ao reconectar; guia de deploy no README.
- [x] **Fase 6 — Redução de dados trafegados.** Removidos os campos de link
      do ticket (Jira) e descrição da história do formulário, API e schema
      (`supabase/migrations/0002_remove_ticket_url_description.sql`).
- [x] **Fase 7 — Sem persistência de votação, expurgo de salas e
      preparação para AWS.**

      **Por quê.** Depois da aprovação do time, três decisões: (1) reduzir
      ainda mais o dado retido — rounds/votes deixam de existir em banco,
      sobrevivendo só enquanto a sessão de votação está ativa no Realtime;
      (2) implementar o expurgo automático de salas inativas (>1h) e um
      encerramento manual pelo Scrum Master, ambos já citados como "risco em
      aberto" desde a Fase 0; (3) preparar o código e a documentação para
      uma futura migração de Vercel para AWS, sem migrar de fato agora.

      **O que mudou.**
      - `supabase/migrations/0003_remove_rounds_votes.sql` remove as tabelas
        `rounds` e `votes` e os triggers que dependiam delas. `rooms`
        continua igual (é identidade da sala, não "informação de votação").
      - Protocolo novo de **"presence gossip"**: cada participante carrega,
        na própria presence, um espelho da rodada atual (`id`, `ticketCode`,
        `status`, `createdAt`, `revealedAt` — ver `types/realtime.ts`,
        `RoundMirror`). Um client que entra ou reconecta reconstrói o
        estado lendo a presence de quem já está na sala
        (`lib/round-gossip.ts`, critério: maior `createdAt`; `revealed`
        sempre vence `voting` para a mesma rodada) — não há mais nenhuma
        consulta ao servidor para isso.
      - Votar/retirar voto viraram **puramente client-side**
        (`channel.track()` direto, sem rota de API): a presence do
        participante mostra só `hasVoted`, nunca o valor da carta. O valor
        fica só no navegador de quem votou (`lib/vote-storage.ts`) até o
        reveal.
      - Revelar continua exigindo o Scrum Master (`POST
        /api/rooms/[roomId]/reveal`, `x-sm-token`) — mas o servidor nunca
        teve os valores dos votos, então ele só dispara um sinal leve
        (`reveal_requested`). Cada client, ao recebê-lo, publica o próprio
        valor (guardado só localmente) na própria presence; estatísticas
        (`lib/stats.ts`) são calculadas em cada client a partir do que a
        presence mostra, nunca no servidor.
      - Histórico de rodadas (Fase 4) foi **removido**: sem uma fonte
        central persistida, não dava para reconstruir com confiança para
        quem entrou depois. `GET /api/rooms/[roomId]/history` e
        `RoundHistory.tsx` saíram do projeto.
      - **Expurgo automático de salas inativas** (`lib/purge.ts`,
        `app/api/internal/purge-inactive-rooms/route.ts`, protegido por
        `CRON_SECRET`): varre `rooms` com `last_activity_at` > 1h, avisa
        quem estiver conectado via broadcast `room_closed` e apaga a sala.
        Sem writes em `votes`/`rounds` para disparar um trigger como antes,
        `last_activity_at` agora é mantido por um heartbeat
        (`POST /api/rooms/[roomId]/heartbeat`, sem auth, chamado
        periodicamente pelo client) e pelas ações do Scrum Master.
      - **Encerrar sala manualmente**: botão do Scrum Master
        (`components/room/CloseRoomButton.tsx`) chama
        `DELETE /api/rooms/[roomId]`, mesmo mecanismo de expurgo (broadcast
        `room_closed` + delete), só que imediato.
      - `lib/rooms.ts` passa a ser o único ponto de acesso à tabela `rooms`
        — fronteira pensada para a futura troca de backend (ver "Preparação
        para AWS").

      **Trade-offs aceitos** (o time foi avisado e optou por eles em troca
      de zero persistência de dado de votação):
      - O estado de uma rodada em andamento (quem votou, o ticket, se já foi
        revelada) só existe enquanto pelo menos um participante está
        conectado à sala. Se todo mundo sair ao mesmo tempo no meio de uma
        rodada, esse estado se perde.
      - Mais amplo que só "a sala esvaziar": **qualquer desconexão real do
        socket** de um participante entre votar e o reveal acontecer (Wi-Fi
        instável, celular indo para segundo plano por tempo suficiente)
        derruba a entrada de presence dele — o voto some, mesmo que ele
        volte segundos depois, se isso for depois do reveal. Um refresh de
        aba normal não tem esse problema (o próprio voto é restaurado do
        `sessionStorage` local).
      - Sem tabela para validar, carta inválida para o baralho ou
        "Observador" votando deixaram de ter qualquer checagem no servidor
        — hoje é só a UI que esconde a ação. Ver "Segurança" abaixo.

      *Critério de saída verificado:* build, typecheck e lint limpos;
      end-to-end contra o projeto Supabase real (não mock) cobrindo, via
      dois "clients" simulados com o mesmo `@supabase/supabase-js` que o
      browser usa: bootstrap da rodada por um participante novo via presence
      sync, voto oculto (sem `cardValue`) até o reveal, broadcast de
      `reveal_requested` recebido, revelação do próprio valor na presence,
      um terceiro client entrando *depois* do reveal e reconstruindo o
      estado revelado inteiro só via presence sync (sem nenhuma chamada ao
      servidor), e encerramento manual disparando `room_closed` para quem
      está conectado. Rotas de API testadas via HTTP real: autorização por
      `x-sm-token` (403 sem token/com token errado, 200 com o certo) em
      reveal/nova rodada/encerrar sala, e o endpoint de expurgo rejeitando
      chamadas sem o `CRON_SECRET` correto.
      **Limite conhecido:** a verificação não incluiu clique real em
      navegador (sem ferramenta de automação de browser disponível nesta
      sessão) — foi via chamadas HTTP reais às rotas e um script Node
      abrindo canais Realtime reais com o SDK do browser, contra o projeto
      Supabase de verdade. Recomenda-se um passe manual em duas abas antes
      do próximo deploy.
      **Ação pendente:** rodar
      `supabase/migrations/0003_remove_rounds_votes.sql` no SQL Editor do
      projeto Supabase de produção — `drop table` é destrutivo, sem
      rollback automático (mesma observação já feita para a 0002). Também é
      preciso configurar `CRON_SECRET` nas variáveis de ambiente de
      produção e um scheduler batendo em
      `POST /api/internal/purge-inactive-rooms` (ver "Deploy").

## Segurança

Revisão de segurança feita antes da apresentação do projeto (Fases 0–6),
cobrindo o código-fonte completo por auditoria manual guiada por OWASP Top
10, gestão de segredos e o modelo de ameaça específico deste app. A Fase 7
mudou o modelo de confiança de "servidor autoritativo" para "presence
gossip entre clients" para tudo relacionado a votação — os itens abaixo
foram atualizados para refletir isso.

### Corrigido nesta revisão

- **XSS via link do ticket.** `ticketUrl` era validado só com `z.string().url()`,
  que aceita qualquer esquema — inclusive `javascript:` — e era renderizado
  direto como `<a href>` em `RoomHeader`. Corrigido em duas camadas
  (validação `https` + allowlist de host, e um guard de defesa em
  profundidade); na Fase 6 o campo foi removido do app por completo, então
  hoje o vetor nem existe mais.
- **Content-Security-Policy e headers de segurança.** Adicionados em
  `next.config.ts`: CSP (restringe scripts/estilos/conexões a `'self'` + host
  do Supabase), `X-Frame-Options: DENY` / `frame-ancestors 'none'`
  (clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy` e `Strict-Transport-Security`.

### Riscos aceitos (baixo impacto dado o objetivo funcional da ferramenta)

Nenhum dado sensível trafega pelo app (só nome, cargo e voto de estimativa,
sem login/PII). Os pontos abaixo foram identificados mas não corrigidos por
não colocarem em risco dados sensíveis nem o sistema como um todo:

- Participante consegue votar/retirar voto de outro participante da mesma
  sala (`participantId` é visível via Presence a todos da sala; nada
  verifica posse). Afeta só a integridade da estimativa dentro de uma
  sessão, não expõe dado de fora dela.
- Eventos de Realtime (`round_started`, `reveal_requested`, `room_closed`)
  são aceitos pelo client com checagem de formato (Zod) mas sem verificar
  se vieram mesmo do servidor — ver "Configuração adicional" abaixo.
- Sem rate limiting em `/api/rooms` (criação de sala) — permite spam de
  salas por um script, sem autenticação.
- Token de Scrum Master fica em `localStorage` (não expira ao fechar a aba).
- **Novo na Fase 7 — voto sem enforcement de servidor.** Como votar virou
  puramente `channel.track()` no client (sem rota de API), não existe mais
  nenhum ponto que valide carta pertencente ao baralho da sala ou impeça
  "Observador" de votar — hoje isso é só a UI escondendo a ação. Um client
  alterado pode publicar qualquer string como `cardValue` ou votar sendo
  Observador; o pior caso é distorcer a distribuição/estatística exibida
  para a própria sala, sem vazar nem persistir nada.
- **Novo na Fase 7 — heartbeat sem autenticação.** `POST
  /api/rooms/[roomId]/heartbeat` não exige token — qualquer um que saiba o
  `roomId` (público, está no link compartilhável) pode chamar em loop e
  impedir o expurgo por inatividade daquela sala indefinidamente. Impacto
  baixo (no máximo mantém uma sala vazia "viva" mais tempo).
- **Novo na Fase 7 — estado de rodada é honor-system entre clients.** Sem
  Postgres para corrigir divergências, um client malicioso que force uma
  presence/broadcast forjados (ex.: se passando por Scrum Master) não tem
  mais nenhuma fonte de verdade externa pra ser contradito — diferente de
  antes, quando o próximo resync via Postgres corrigia qualquer evento
  forjado. Mesma superfície de ataque documentada no item de Realtime
  Authorization abaixo, só que agora vale também para o conteúdo da
  votação, não só para eventos de controle.

### Configuração adicional recomendada no Supabase

- **Realtime Authorization (canais privados).** Hoje o canal
  `room:{roomId}` é público: qualquer cliente com a anon key (pública, vai no
  bundle do browser) pode se conectar e, em tese, publicar eventos forjados
  nele. Dá pra reduzir isso configurando canais como `private: true` +
  policies de RLS na tabela `realtime.messages` (ver
  [docs do Supabase sobre Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)).
  Como este app não usa Supabase Auth, a policy não consegue diferenciar
  participantes entre si — o ganho seria bloquear clientes totalmente fora
  do app, não impersonação entre participantes da mesma sala. Ainda não
  implementado.
- **Limpeza automática de salas antigas — feito na Fase 7.** Expurgo por
  inatividade (>1h) e encerramento manual pelo Scrum Master já estão
  implementados (ver acima). Falta só configurar `CRON_SECRET` e o
  scheduler em produção (ver "Deploy").
- **Network Restrictions** (planos pagos do Supabase): restringe o acesso
  ao Postgres por IP.
- Confirmar que a `SUPABASE_SERVICE_ROLE_KEY` de produção fica só no cofre
  de secrets da plataforma de hosting, nunca em chat/e-mail — o `Dockerfile`
  já garante que ela não é embutida na imagem de build.

### Pontos que dependem de política da empresa — levar ao time de segurança

Estes pontos não são visíveis a partir só deste repositório; dependem de
como a infraestrutura da empresa é configurada como um todo:

- **Escopo de cookies do domínio pai.** Se algum outro sistema da empresa
  usa cookies com `Domain=.xcl.digital` sem `HttpOnly`, um XSS neste app
  (mesmo que hoje mitigado) poderia, em tese, ler/usar cookies de sessão de
  outros sistemas.
- **Confiança em wildcard de subdomínio.** Verificar se outros apps em
  `*.xcl.digital` usam `document.domain` relaxado ou CSP/CORS que confiam
  no domínio pai inteiro.
- **Higiene de DNS / subdomain takeover.** Quando este app for desativado
  ou trocar de hosting, remover o registro DNS (CNAME) do subdomínio.
- **Sala compartilhável sem login como vetor de phishing interno.** O app
  permite a qualquer pessoa sem login criar uma sala e compartilhar o link
  — hospedado num domínio da empresa, isso aumenta a credibilidade
  percebida por quem recebe.

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com as credenciais do
   seu projeto Supabase (Project Settings → API), mais um `CRON_SECRET`
   qualquer (ex.: `openssl rand -hex 32`) para testar o endpoint de expurgo
   localmente:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   CRON_SECRET=...
   ```

3. Rode as migrações, em ordem, no SQL Editor do projeto Supabase:
   `0001_init.sql` (cria `rooms`, `rounds`, `votes` e as policies de RLS),
   `0002_remove_ticket_url_description.sql` (remove campos de ticket) e
   `0003_remove_rounds_votes.sql` (remove `rounds`/`votes` — a partir daqui
   só `rooms` existe em banco; ver "Fase 7" acima).

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Deploy

### Vercel + Supabase (recomendado)

É o caminho mais simples e o alvo original do projeto (free tier dos dois).

1. **Supabase**: crie o projeto, rode as três migrações em
   `supabase/migrations/` no SQL Editor (ver "Rodando localmente") e
   confirme em *Project Settings → API* que Realtime está habilitado (vem
   ligado por padrão — Presence e Broadcast não dependem de replicação de
   tabela, só `postgres_changes` dependeria, e este projeto não usa).
2. **Vercel**: importe o repositório do GitHub
   (`https://github.com/PedFerreira/planning-poker-xcl`) — framework
   detectado automaticamente, `output: 'standalone'` já configurado.
3. Em *Project Settings → Environment Variables*, adicione as quatro
   variáveis do `.env.local` (as três de sempre + `CRON_SECRET`).
4. **Expurgo automático**: `vercel.json` já define um cron apontando para
   `/api/internal/purge-inactive-rooms` a cada hora. **Atenção**: o plano
   **Hobby da Vercel limita cron a 1x/dia**, o que não atinge o TTL de ~1h
   deste app nesse tier. Enquanto estiver no Hobby, use um workflow do
   **GitHub Actions** agendado (`schedule: cron: '*/15 * * * *'`) chamando
   o endpoint com `Authorization: Bearer $CRON_SECRET` como mecanismo
   principal; o `vercel.json` passa a valer sozinho se/quando migrarem para
   o plano Pro. `pg_cron` do Supabase (via `pg_net` batendo no mesmo
   endpoint) é outra alternativa — confirme disponibilidade no seu plano
   antes de depender dele.
5. Deploy automático a cada push em `main`.

### Self-hosted (Docker Compose)

Para portar para infraestrutura própria: Supabase roda via o
Docker Compose oficial deles, e este app roda como um container separado a
partir do `Dockerfile` do repo (build `standalone` do Next.js).

1. **Suba o Supabase self-hosted** seguindo o guia oficial
   ([supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker)).
2. Rode as três migrações de `supabase/migrations/` contra o Postgres
   subido (via Studio ou `psql` direto).
3. **Build da imagem do app**, passando as chaves públicas como build args:

   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=http://<host-do-kong>:8000 \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-do-self-host> \
     -t planning-poker-xcl .
   ```

4. **Rode o container**, com `SERVICE_ROLE_KEY` e `CRON_SECRET` reais só em
   runtime:

   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=http://<host-do-kong>:8000 \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-do-self-host> \
     -e SUPABASE_SERVICE_ROLE_KEY=<service-role-key-do-self-host> \
     -e CRON_SECRET=<secret-aleatorio> \
     planning-poker-xcl
   ```

   Em produção, coloque este container na mesma rede Docker do Compose do
   Supabase e/ou por trás de um reverse proxy (nginx/Caddy/Traefik) para TLS.
5. **Expurgo automático**: sem Vercel Cron aqui, use um `cron`/systemd timer
   batendo em `POST /api/internal/purge-inactive-rooms` com o header
   `Authorization: Bearer <CRON_SECRET>` a cada 10–15 minutos.

## Preparação para AWS

O time confirmou que, após validação, o projeto deve rodar em AWS. O código
já está estruturado para essa troca ser localizada, mas **nada foi
provisionado ou migrado nesta fase** — isto é só o mapa do caminho.

| Hoje (Vercel + Supabase) | Equivalente AWS | Observação |
|---|---|---|
| Vercel (host do Next.js) | ECS Fargate ou App Runner | Reaproveita o `Dockerfile` existente (`output: standalone`) sem mudança — já era pensado para portabilidade (ver Fase 5/self-hosted). |
| Supabase Postgres (só tabela `rooms`) | RDS for PostgreSQL ou Aurora PostgreSQL Serverless v2 | Migrações em `supabase/migrations/` são SQL puro (usa só a extensão `pgcrypto`, disponível no RDS); só `lib/rooms.ts` precisa mudar de tripas — é o único ponto de acesso à tabela. |
| Supabase Realtime (Presence + Broadcast) | AWS AppSync Events | Analógo gerenciado mais próximo do modelo pub/sub usado aqui. Alternativa com mais código próprio: API Gateway WebSocket API + Lambda, com DynamoDB para o estado de presence. Ponto de troca no código: tudo em `lib/realtime/`. |
| Vercel Cron / GitHub Actions (expurgo) | EventBridge Scheduler | Chama o mesmo endpoint HTTP (`/api/internal/purge-inactive-rooms`, mesmo `CRON_SECRET`) via API destination, ou invoca uma Lambda equivalente. |
| Variáveis de ambiente da Vercel | AWS Secrets Manager / SSM Parameter Store | Injetadas na task definition do ECS/App Runner em runtime — mesma distinção de hoje entre `NEXT_PUBLIC_*` (precisam ser build args, resolvidos no build da imagem) e `SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` (runtime-only, nunca embutidos na imagem). |

Fronteiras de código já existentes que tornam essa troca incremental:
`lib/rooms.ts` (única porta de entrada pro Postgres), `lib/realtime/`
(única porta de entrada pro Realtime), `lib/purge.ts`/`lib/activity.ts`
(lógica de expurgo/atividade, agnóstica de onde os dados moram).

## Estrutura

```
config/decks.ts          # baralhos de votação (Fibonacci, Camisetas, Semáforo)
types/                    # tipos de domínio + zod schemas (API e realtime)
lib/                      # clients Supabase, rooms.ts, activity.ts, purge.ts,
                          # round-gossip.ts, round-cache.ts, ids, helpers
supabase/migrations/      # schema SQL (0001 init, 0002/0003 reduções de dado)
app/                      # rotas (landing, /sala/[roomId], API routes)
components/               # UI (shadcn em components/ui, features em create-room/ e room/)
vercel.json               # cron do expurgo de salas inativas
Dockerfile, .dockerignore # build standalone do Next.js para self-hosted
```
