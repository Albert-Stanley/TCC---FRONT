# KravConnect — Frontend

Cliente web **mobile-first** do **KravConnect**, uma plataforma de gestão para
academias de **Krav Maga**. Conecta **professores**, **instrutores** e **alunos**
em um único app: gestão da academia, aulas, **presença por GPS**, mensalidade e
loja de equipamentos.

- **Produção:** https://kravconnect.vercel.app (deploy na Vercel, branch `main`)
- **API (backend em Go):** https://api-krav-maga-app.onrender.com

## Stack

- **React 18 + TypeScript** — UI e segurança de tipos
- **Vite** — dev server e build
- **Tailwind CSS v3** — estilização (preto / branco / vermelho `#E60000`)
- **React Router v6** — roteamento com rotas protegidas por papel
- **Zustand** (com `persist`) — estado global, sessão e RBAC persistidos
- **Axios** — cliente HTTP com interceptors (injeta JWT, trata expiração de sessão)
- **lucide-react** — ícones

O backend é um serviço **Go (net/http)** com **MySQL/GORM**, **JWT**, **Redis**
(cache de cadastro/códigos), **MongoDB** (logs), **Stripe** (pagamentos) e envio
de e-mail (códigos de confirmação/recuperação). Front e back se comunicam por um
contrato REST.

## Como rodar

```bash
npm install
cp .env.example .env    # ajuste VITE_API_URL se o backend não estiver no padrão
npm run dev             # http://localhost:5173
```

Build de produção:

```bash
npm run build           # type-check (tsc) + bundle em dist/
npm run preview         # serve o build de produção localmente
```

`VITE_API_URL` define a base da API. Quando ausente, o cliente usa a API de
produção no Render (ver `src/lib/api.ts`). Nenhum segredo é armazenado no
repositório.

## Funcionalidades por papel

- **Professor** — cria a academia (`POST /Gyms/Creation`, que o promove a
  professor), define a localização para o check-in (`PUT /Gyms/Location`), gera
  convites, aprova solicitações de entrada, gerencia alunos e faixas
  (`PUT /Gyms/Students/{id}/Belt`), promove alunos a instrutor, cria/edita aulas
  e administra o catálogo da loja.
- **Instrutor** — aluno promovido pelo professor; passa a exibir o vínculo de
  instrutor no perfil e em "Minhas academias".
- **Aluno** — entra na academia com um convite, vê as aulas do dia, faz
  **check-in por GPS** (precisa estar a até 500 m da academia), paga a
  mensalidade (Stripe) e navega na loja da academia.

Um mesmo usuário pode ter **múltiplos vínculos** (professor de uma academia,
aluno/instrutor de outra). O front deduplica as academias por id mantendo o
vínculo de maior privilégio (`src/lib/auth.ts`).

## Contrato de autenticação

- `POST /Users/Auth` (corpo `{ email, senha }`) retorna o **JWT cru** (string).
- O token é anexado a cada requisição via interceptor no header
  `Authorization` — **sem** o prefixo `Bearer` (`src/lib/api.ts`).
- `GET /Users/Me` resolve papel (professor/aluno), faixa e academias do usuário.
- O backend responde erros como **string JSON** com status **400** (inclusive
  para JWT inválido/ausente); o interceptor encerra a sessão nesses casos.

O gate de rotas/RBAC do front é apenas de UX — a validação de JWT e de permissões
é responsabilidade do servidor.

## Integrações externas

- **Correios / BrasilAPI** — consulta de CEP (com fallback para o ViaCEP).
- **OpenStreetMap / Nominatim** — geocodificação de endereço (nível da casa) e
  mapa embutido, sem chave de API.
- **Stripe** — pagamento da mensalidade do aluno.

## Estrutura do projeto

```
src/
  components/
    layout/   AppLayout, Header, BottomNav, Sidebar, NavLayout, ProtectedRoute, ...
    ui/       Button, Input, Card, Badge, MapView, NotificationsMenu, ...
    shop/     ProductCard, CartButton, QuantityStepper, ...
  lib/        api (Axios + interceptors), auth, jwt, geo (GPS/CEP/geocoding),
              format (máscaras CPF/CEP/CNPJ), shopApi, roster, mailer
  pages/      Login, Register, ForgotPassword, Home, Profile,
              student/ (MyGyms, Presence, Payment, Classes, InsertInvite),
              teacher/ (TeacherHome, Students, Invites, Requests, Classes, CreateGym),
              shop/ (Store, ProductDetail, Cart, Checkout, ManageProducts)
  store/      Zustand stores (auth, gym, cart, theme, notifications, ...)
  types/      tipos de domínio compartilhados
  App.tsx     roteamento     main.tsx  entrada
```

## Modo de visualização (preview) — opcional

Há um flag `PREVIEW_MODE` em `src/lib/preview.ts` (atualmente **`false`**). Quando
ligado, ele resolve toda chamada `api.*` contra um mock em memória
(`src/lib/mock.ts`) e ignora os guardas de auth/RBAC, permitindo navegar por todas
as telas (aluno + professor) **sem backend** — útil para demonstração offline.
Em produção ele permanece `false` para usar a API real.

## Design

- **Mobile-first e responsivo:** no celular, navegação inferior fixa; no desktop
  (`lg+`), uma sidebar persistente e conteúdo em coluna centrada — o mesmo código.
- **Tema claro/escuro** aplicado antes da primeira pintura (sem flash), com
  persistência e respeito à preferência do sistema.
- **Acessibilidade:** rótulos ARIA, papéis semânticos, anéis de foco e áreas de
  toque adequadas; respeito às *safe-area insets* (notch).
- **Cores:** preto, branco e o vermelho primário `#E60000`.
