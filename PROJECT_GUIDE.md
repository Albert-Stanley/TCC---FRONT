# KravConnect — Frontend Project Guide

This file is the source of truth for work on this repo. Read it before
making changes. **Do not invent endpoints, routes, or styles** — follow what's here.

## Project

Mobile-first web client ("KravApp") for KravConnect, a martial-arts gym management
system. Backend is a separate Node.js RESTful API. The frontend mimics a native app.

## Stack & conventions

- React 18 + TypeScript (strict), Vite, Tailwind CSS v3, React Router v6.
- State: **Zustand** (`src/store/authStore.ts`) with `persist`. No Redux/Context for session.
- HTTP: single Axios instance in `src/lib/api.ts`. Always import `api` from there —
  never call `axios` directly in components (interceptors attach the JWT).
- Path alias `@/` → `src/`.
- Components are function components; type-only imports use `import type`.
- Keep screens in `src/pages`, shared UI in `src/components/ui`, layout in
  `src/components/layout`.

## Design system (enforce strictly)

**Full spec + palette: see `DESIGN.md`. Reference mockups: `design/mockups/`.**
The design system was extracted from the real TCC mockups — match it exactly so the
whole app is one cohesive, high-quality, native-style product (this is a TCC).

- **Frame:** entire app constrained to `max-w-app` (400px), centered, full height.
- **Colors (Tailwind tokens, never hardcode hex):** `primary` `#E10000` (red accent),
  `ink` `#0A0A0A` (near-black), `white`, `canvas` `#F5F5F5` (page bg), `muted`
  `#5C5C5C` (secondary text), `line` `#E5E5E5` (borders). Palette may change later.
- **Type:** bold, UPPERCASE headings; clean sans-serif body.
- **Buttons:** block-level (`w-full`), `rounded-lg`. Primary = solid red. Secondary =
  white with 2px `ink` border. Use the `<Button>` component.
- **Cards:** white, `rounded-xl`, `border-line` + subtle shadow.
- **Header:** `bg-ink` bar, white UPPERCASE title, optional red badge.
- **Bottom nav:** white bg, active item in `primary`, inactive `muted`.
- **Inputs:** clean border, large touch targets (h-14), focus ring `primary`. Use `<Input>`.

## RBAC

Two main roles drive views: `student` and `teacher` (`monitor` reserved). Role comes
from the JWT (`useAuthStore().user.role`). Gate teacher-only routes with
`<ProtectedRoute allow={['teacher']} />`.

## Endpoint map (AUTHORITATIVE — from the task brief)

Use these exact paths. (The TCC document uses some alternative names like
`/auth/login` and `/gyms`; the brief below wins. Confirm with backend before integrating.)

| Feature                  | Method & path                       | Body / notes                          |
| ------------------------ | ----------------------------------- | ------------------------------------- |
| Login                    | `POST /Auth`                        | `{ email, password }` → JWT           |
| Registration             | `POST /users/registration`          | `{ name, email, password, cpf, cep }` |
| Profile edit             | `PUT /users/update`                 | user details                          |
| Create gym (teacher)     | `POST /Gym/Create`                  | `{ cpf, cnpj }`; backend verifies CNPJ vs token CPF |
| Generate invite          | `POST /Gym/Invite/Generate`         | UUID + expiration                     |
| List invite requests     | `GET /Gym/Invite/Requests`          | pending/active requests               |
| Approve request          | `POST /Gym/Invite/Approvation`      | `{ id_aluno }`                        |
| Join gym (student)       | `POST /Gym/Invite/Join/{token}`     | 400 → invalid token; logs a request   |
| List students            | `GET /Gym/Students/Select`          | enrolled students                     |
| Remove student           | `POST /Gym/Students/Remove`         | `{ id_aluno }`                        |
| Create class             | `POST /Gym/Classes/Creation`        | class must exist before attendance    |
| Add class content        | `POST /Gym/Classes/Information`     |                                       |
| Add class videos         | `POST /Gym/Classes/Videos`          |                                       |
| Confirm attendance       | `POST /Student/Presence`            | requires an existing class            |
| Monthly payment          | `POST /Student/Payment`             | Abacate Pay integration               |

## How to add a screen

1. Create `src/pages/<Name>.tsx` (default UPPERCASE heading, mobile padding).
2. Call the API via `api.<method>('<exact endpoint above>')`; surface errors with
   `getErrorMessage`.
3. Add the route in `src/App.tsx` (inside `<ProtectedRoute>`/`<NavLayout>` if authed).
4. Reuse `<Button>` / `<Input>`; never hardcode colors outside the Tailwind theme.

## Verify before declaring done

```bash
npm run build   # tsc (strict) + vite build — must pass with no errors
```

## Status

Done: scaffold, auth store + interceptors, all 15 endpoints wired across student +
teacher screens.

Design language is **Wellhub-inspired**: warm cream neutrals, Plus Jakarta Sans
(display) + Inter (body), pill buttons (`rounded-full`), big `rounded-3xl` cards,
soft layered shadows, gradient dark heroes, route animations. Keep this language on
new screens (DESIGN.md describes the earlier sharp/red v1 and is partly superseded).

Responsive shell: phone/tablet (`< lg`) = full-screen app with bottom nav; desktop
(`lg+`) = persistent left `Sidebar` + roomy centred content (normal web layout).

Light/dark theme: class-based (`darkMode: 'class'`) with CSS-variable semantic
tokens (`canvas`/`surface`/`content`/`muted`/`line` in `src/index.css`); `ink`/
`white` stay literal for always-dark heroes. State in `src/store/themeStore.ts`,
no-flash init script in `index.html`, toggles in Sidebar, Perfil, and the mobile
home top bars. Use semantic tokens (not `bg-white`/`text-ink`) on new screens.

Admin/students (`/students`): summary stats, search, payment filters, and an
expandable per-student detail (belt, plano, presenças, last presence, etc.) — all
rendered from optional fields on the `GET /Gym/Students/Select` payload.

> ⚠️ **PREVIEW MODE IS ON.** `src/lib/preview.ts` exports `PREVIEW_MODE = true`,
> which bypasses `ProtectedRoute` auth/RBAC and seeds a demo session so every
> screen is browsable without a backend (role switch lives in the Perfil tab).
> **Set `PREVIEW_MODE = false` to restore real authentication before deploy.**

## Build order (one flow per pass; `npm run build` must pass after each)

0. **Design pass:** align `Button`/`Input`/`BottomNav` and existing screens to
   `DESIGN.md` (rounded cards/buttons, white nav, tokens) before adding screens.
1. **Auth polish:** Profile edit screen → `PUT /users/update` (Perfil tab).
2. **Student journey:** Início do aluno (`GET` my gyms), Inserir convite + Join
   (`POST /Gym/Invite/Join/{token}`, 400 → invalid), attendance (`POST /Student/Presence`),
   payment (`POST /Student/Payment`).
3. **Teacher flow:** Create gym (`POST /Gym/Create`), invites generate/list/approve
   (`/Gym/Invite/Generate`, `/Gym/Invite/Requests`, `/Gym/Invite/Approvation`),
   students list/remove (`/Gym/Students/Select`, `/Gym/Students/Remove`),
   classes (`/Gym/Classes/Creation|Information|Videos`).
4. **Polish:** loading/empty/error states, RBAC route guards, responsiveness QA.
5. **Deploy — LAST.** Prepare config/build, then confirm before any deploy.

Rules: work through steps 0–4 in order; use the exact
endpoints in the table above; verify with `npm run build` after every flow; keep the
design cohesive per `DESIGN.md`.
