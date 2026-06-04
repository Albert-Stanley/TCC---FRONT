# KravConnect — Frontend (KravApp)

Mobile-first web client for the **KravConnect** martial-arts gym management system.
Built with **React + TypeScript + Vite + Tailwind CSS**, consuming the Node.js RESTful API.

## Stack

- **React 18 + TypeScript** — UI and type safety
- **Vite** — dev server and build
- **Tailwind CSS v3** — styling (black / white / primary red `#E60000`)
- **React Router v6** — routing
- **Zustand** (with `persist`) — session + RBAC state
- **Axios** — HTTP client with JWT interceptors
- **lucide-react** — icons

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if your API isn't on :3000
npm run dev            # http://localhost:5173
```

Build for production:

```bash
npm run build          # type-checks then bundles into dist/
npm run preview        # serves the production build locally
```

## Homologação (modo preview)

Esta é uma **versão de homologação**: ela roda com **dados mockados**, sem
backend. O flag `PREVIEW_MODE` em `src/lib/preview.ts` está **`true`**, o que:

- resolve toda chamada `api.*` contra o mock em memória (`src/lib/mock.ts`),
  incluindo o catálogo da loja em `src/lib/shop.ts`;
- semeia uma sessão demo e **ignora os guardas de autenticação/RBAC**, para que
  todas as telas (aluno + professor) sejam navegáveis sem servidor.

Nenhum segredo é necessário ou armazenado no repositório — o `PREVIEW_USER` é
fictício e o `VITE_API_URL` aponta para `localhost` por padrão.

### Antes de ir para produção

1. Defina `PREVIEW_MODE = false` em `src/lib/preview.ts` (restaura auth + RBAC reais).
2. Configure `VITE_API_URL` no `.env` apontando para a API real (nunca commite o `.env`).
3. Garanta que o backend valide o JWT e o RBAC no servidor — o gate do frontend é apenas de UX.

## Project structure

```
src/
  components/
    layout/   AppLayout (mobile frame), BottomNav, NavLayout, ProtectedRoute
    ui/       Button, Input
  lib/        api (Axios + interceptors), jwt, format (CPF/CEP masks)
  pages/      Login, Register, Home, Placeholder
  store/      authStore (Zustand, session + RBAC)
  types/      shared domain types
  App.tsx     routing
  main.tsx    entry
```

## Design system

- **Frame:** entire app constrained to `max-width: 400px`, centered, full height — mimics a native app.
- **Colors:** pure black `#000000`, pure white `#FFFFFF`, primary red `#E60000` (`primary` / `primary-dark`).
- **Type:** bold, uppercase headings; clean sans-serif body.
- **Buttons:** block-level; solid red (primary) or transparent with black border (secondary).
- **Nav:** fixed bottom bar with icons (Início, Academias, Convites, Perfil).

## API wiring (implemented so far)

| Screen        | Method & endpoint           | Notes                                            |
| ------------- | --------------------------- | ------------------------------------------------ |
| Login         | `POST /Auth`                | Body `{ email, password }` → returns JWT         |
| Registration  | `POST /users/registration`  | Single-step. Body `{ name, email, password, cpf, cep }` |

The JWT is attached automatically to every request via an Axios interceptor
(`Authorization: Bearer <token>`). A `401` response clears the session.

> Endpoint names follow the **task brief**. The TCC document uses some
> alternative names (e.g. `/auth/login`, `/gyms`); align these with the backend
> before integration.

## Roadmap (next screens)

Profile edit (`PUT /users/update`), gym creation (`POST /Gym/Create`), invite
generation/approval, student management, class management, attendance and
payments — all scaffolded behind the bottom navigation.
