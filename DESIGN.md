# KravConnect — Design System

Derived directly from the TCC mockups (`design/mockups/`). Every new screen must
match this language so the whole app feels like one cohesive, native-style product.

## Color palette (extracted from the mockups)

Sampled across all 11 mockup screens. The accent is a vivid **pure red** (hue 0°,
~100% saturation), clustering between `#D80000` and `#E40000`. Backgrounds are
near-white grays; text/structure is near-black.

| Token             | Hex       | Tailwind          | Use                                            |
| ----------------- | --------- | ----------------- | ---------------------------------------------- |
| Primary red       | `#E10000` | `primary`         | Primary buttons, active states, badges, accents |
| Primary red dark  | `#B80000` | `primary-dark`    | Pressed/active button state                     |
| Primary red light | `#FF2A2A` | `primary-light`   | Hover / subtle highlights                       |
| Ink (near-black)  | `#0A0A0A` | `ink`             | Header bar, avatars, headings, body text        |
| White             | `#FFFFFF` | `white`           | Cards, primary surfaces                         |
| Canvas            | `#F5F5F5` | `canvas`          | Page background behind cards                     |
| Muted gray        | `#5C5C5C` | `muted`           | Secondary text, captions, inactive labels       |
| Line              | `#E5E5E5` | `line`            | Card borders, dividers                           |
| Mid gray          | `#A8A8A8` | `neutral-400`     | Inactive nav icons, placeholders                 |

Pure black `#000000` and pure white `#FFFFFF` are allowed; `ink`/`canvas` are the
softened defaults the mockups actually use. The palette may change later — keep all
colors as Tailwind tokens (never hardcode hex in components) so a future reskin is one file.

## Typography

- Headings: **bold/black, UPPERCASE**, tight tracking (page titles, section labels).
- Body: clean sans-serif, normal case.
- Section labels & captions: small, uppercase, `muted`, wide tracking.

## Layout

- Whole app constrained to a **400px centered column** (`max-w-app`), full height.
- Page padding ~`px-6`; generous vertical rhythm.

## Components (match the mockups)

- **Top header bar:** full-width `bg-ink`, white UPPERCASE title centered; optional
  red count badge; menu/search icons in white. Used on inner/list screens.
- **Bottom nav:** **white** background, top `line` divider, 4–5 icon+label items.
  Active = `primary` (icon + label) with optional red count badge; inactive =
  `muted`/`ink`. Labels UPPERCASE, tiny.
- **Cards:** white, `rounded-xl`, thin `border border-line` + subtle shadow,
  comfortable padding. List items are cards.
- **Primary button:** `bg-primary` white text, `rounded-lg`, block-level `w-full`,
  bold UPPERCASE, optional leading icon; pressed → `primary-dark`.
- **Secondary button:** white, `border-2 border-ink`, ink text, `rounded-lg`, bold
  UPPERCASE, optional leading icon.
- **Inputs:** large touch target (`h-14`), clean border, focus ring in `primary`.
- **Avatars:** `bg-ink` circle, white initial, bold.
- **Filter chips:** active = `bg-primary` white; inactive = white + `border-ink`.
- **Status badges:** small uppercase pills — red for active/pending counts, neutral
  for "USADO"/"RECUSADA", etc.
- **Hero / info card:** some screens use a solid **black** (`bg-ink`) card to feature
  invite metadata (gym name, teacher, CNPJ) in white.

> NOTE: the v1 components committed so far (`Button`, `Input`, `BottomNav`) use sharp
> borders and a black nav. Align them to this spec (rounded corners, white nav, the
> tokens above) as part of the next build pass so the whole app is consistent.

## Mockup index

See `design/mockups/`. The set covers: Login, Cadastro (Etapa 01 Dados, Etapa 02
Confirmação), Início do Aluno, Inserir Convite, Cadastrar Academia, Painel do
Professor, Convites do Professor, Solicitações Pendentes — plus two diagrams
(use cases and the entity-relationship model) which are reference, not UI.
