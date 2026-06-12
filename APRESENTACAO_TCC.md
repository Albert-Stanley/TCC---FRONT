# KravConnect — Roteiro de Apresentação do TCC

Plataforma de gestão para academias de **Krav Maga**: conecta **professores**, **instrutores** e **alunos** em um único app (gestão da academia, aulas, presença por GPS, mensalidade e loja).

A apresentação segue a hierarquia de papéis: **Professor → Instrutor → Aluno**.

---

## 0. Abertura (contexto + login)

- App **mobile-first** (PWA), feito para celular mas roda no navegador.
- **Cadastro** com validação de **CPF** e **CEP** e **confirmação por e-mail** (código de autenticação).
- **Login** com **JWT**; a sessão guarda o token e os dados do perfil (`GET /Users/Me`).
- Recuperação de senha por código enviado no e-mail.

> Dica de demo: já entrar logado como professor para não gastar tempo no cadastro.

---

## 1. Fluxo do PROFESSOR

O professor é o administrador da academia. É ele quem cria a academia e gerencia tudo.

1. **Criar academia** (`POST /Gyms/Creation`)
   - Informa **nome** e **CNPJ**; ao criar, o usuário é **promovido a professor**.
   - **Endereço + mapa**: digita o **CEP** (consulta dos **Correios**) que autopreenche logradouro/bairro/cidade/UF; com o **número da rua** o ponto é **geocodificado no nível exato da casa** e fixado no mapa (OpenStreetMap).

2. **Localização da academia** (`PUT /Gyms/Location`)
   - Define o pino usado no **check-in por GPS** dos alunos (pode usar a posição atual ou buscar pelo endereço estruturado).

3. **Convites** (`POST /Gyms/Invites/Creation`, `GET /Gyms/Invites/List`)
   - Gera **links/códigos de convite** para os alunos entrarem; copia e compartilha.

4. **Solicitações de entrada** (`GET /Gyms/Requests/Join/List`, `POST .../Approve`)
   - Aprova quem pediu para entrar com o convite.

5. **Alunos e graduação** (`GET /Gyms/Students/List`, `PUT /Gyms/Students/{id}/Belt`)
   - Lista de alunos, busca por nome/faixa/CPF, **atualização de faixa**, remoção.

6. **Tornar instrutor** (`POST /Gyms/Instructors/Creation`)
   - Promove um aluno a **instrutor** da academia → *gancho para o próximo fluxo*.

7. **Aulas** (`POST /Gyms/Classes/Creation`, `PUT /Gyms/Classes/Update`, `GET /Gyms/Classes`)
   - Cria/edita aulas (conteúdo, data/hora, faixa-alvo); filtro por data.

8. **Loja / catálogo** (`/Gyms/Catalog` CRUD)
   - Cadastra produtos da academia; vitrine identificada por academia na URL (`/store/:id`).

**Características técnicas em destaque:** autenticação JWT, geocodificação precisa (Correios + OpenStreetMap), CRUD completo de academia/aulas/loja.

---

## 2. Fluxo do INSTRUTOR

O instrutor é um **aluno promovido pelo professor** — papel de apoio na operação da academia.

- **Criação:** vem do botão **"Tornar instrutor"** do professor (`POST /Gyms/Instructors/Creation`).
- **Vínculo:** passa a aparecer com o **badge "Instrutor"** no perfil e em "Minhas academias" (`GET /Users/Me` retorna os vínculos do usuário, que podem ser **vários** — professor de uma academia, aluno de outra, instrutor de outra).
- **Operação:** compartilha o contexto da academia com o professor (apoio em aulas/graduação/presença).

**Característica técnica em destaque:** um mesmo usuário pode ter **múltiplos vínculos** (professor/instrutor/aluno) em academias diferentes — o backend resolve papéis por vínculo, e o front **deduplica** academias por id para evitar repetição.

---

## 3. Fluxo do ALUNO

O aluno é o usuário final que treina na academia.

1. **Entrar na academia** (`POST /Gyms/Requests/Join`)
   - Cola o **convite** recebido do professor; a solicitação fica pendente de aprovação.
   - Tratamento de erros amigável (convite inválido, já é aluno/professor, já solicitou).

2. **Minhas academias** (`GET /Users/Me`)
   - Lista as academias e o vínculo; atalhos para presença, aulas e mensalidade.

3. **Aulas do dia** (`GET /Gyms/Classes/Day`)
   - Vê conteúdo, horário e faixa das aulas de hoje.

4. **Presença com GPS** (`POST /Student/Presence`)
   - **Check-in geolocalizado**: só confirma se estiver a até **500 m** da academia (cálculo de distância **haversine** + mapa com o pino).
   - Contagem de presenças (`GET /Student/Presence/Count`).

5. **Mensalidade** (`POST /Student/Payment`)
   - Pagamento via **Stripe**.

6. **Loja** (`GET /Gyms/Catalog`)
   - Vitrine de produtos; o aluno **escolhe de qual academia** quer ver a loja (id na URL); carrinho e sinalização de interesse (`POST /Student/Interest`).

7. **Perfil** (`GET /Users/Me`)
   - Dados da conta (nome, e-mail, CPF, **CEP**, faixa) e academias.

**Características técnicas em destaque:** geofencing/check-in por GPS (500 m), pagamento com Stripe, catálogo por academia.

---

## 4. Principais características técnicas (resumo)

### Frontend
- **React 18 + TypeScript** com **Vite**.
- **React Router 6** (rotas por papel, rotas protegidas).
- **Zustand** para estado global, com **persistência** local da sessão.
- **Axios** com **interceptors** (injeta JWT, trata expiração de sessão).
- **TailwindCSS** + **lucide-react**; UI mobile-first responsiva.
- Deploy na **Vercel**.

### Backend
- **Go (net/http)** com roteamento por método, organizado em camadas (**Entities / UsersCase / InterfaceAdapters / Repository / Presentation**).
- **GORM + MySQL** como persistência.
- **JWT** para autenticação; **validator** para validação de DTOs.
- **Redis** (cache de cadastro/códigos e *throttle*) e **MongoDB** (logs).
- **Stripe** (pagamentos) e **envio de e-mail** (códigos de confirmação/reset, com DKIM).
- Deploy na **Render**.

### Integrações externas
- **Correios / BrasilAPI** — consulta de CEP.
- **OpenStreetMap (Nominatim)** — geocodificação de endereço e mapa.
- **APIs de CPF/CEP** na validação do cadastro.
- **Stripe** — cobrança de mensalidade.

### Pontos de engenharia a citar
- Separação clara **front ↔ back** via contrato de API REST.
- **Múltiplos vínculos** por usuário e dedupe defensivo no front.
- **Geofencing** (haversine, raio de 500 m) para a presença.
- Tratamento consistente de erros vindos do backend (mensagens amigáveis).

---

## 5. Roteiro sugerido de demonstração (curto)

1. **Professor:** cria/abre academia → ajusta localização pelo CEP/número → gera convite → cria uma aula → cadastra um produto.
2. **Professor → Instrutor:** aprova um aluno e usa **"Tornar instrutor"**; mostra o vínculo "Instrutor" no perfil.
3. **Aluno:** entra com o convite → vê a aula do dia → faz **check-in por GPS** → abre a **loja** da academia → mostra a **mensalidade (Stripe)**.

> Mensagem final: uma plataforma única que cobre **gestão, ensino, presença e financeiro** de uma academia de Krav Maga, com papéis bem definidos e integrações reais (mapa, CEP, pagamento).
