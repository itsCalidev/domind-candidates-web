# DOMIND Candidates — Frontend

Panel administrativo y portal del candidato para DOMIND Candidates Platform.
Consume la API REST de `domind-candidates-api` (NestJS + Prisma + PostgreSQL).

## Stack

- React 19 + TypeScript
- Vite
- Material UI
- React Router (con lazy loading por ruta)
- Axios

## Estructura de carpetas

```
src/
├── app/            App raíz: ThemeProvider, BrowserRouter
├── features/       Un folder por dominio de negocio (auth, dashboard, candidates)
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── shared/         UI y utilidades reutilizables, sin lógica de negocio
├── layouts/        Sidebar, Header, AdminLayout (Fase 3)
├── theme/          Paleta, tipografía y tema MUI corporativo
├── lib/            Cliente HTTP y utilidades transversales
├── routes/         Definición de rutas (paths.ts) y router (AppRouter.tsx)
├── config/         Acceso centralizado a variables de entorno
└── types/          Tipos globales compartidos
```

**Por qué por feature y no por tipo:** el backend ya está organizado por
módulo (Auth, Users, Candidates, Chat, Drive). El frontend refleja el mismo
lenguaje de dominio, así el código de cada módulo crece de forma aislada sin
ensuciar carpetas compartidas.

## Alias de imports

Se usa `@/` como alias de `src/`, configurado en `tsconfig.app.json` y
`vite.config.ts`.

```ts
import { theme } from '@/theme';
```

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar según el entorno:

```
VITE_API_BASE_URL=http://localhost:3000
```

Todo acceso a variables de entorno pasa por `src/config/env.ts`, nunca
directamente por `import.meta.env`.

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción (tsc -b && vite build)
npm run preview   # preview del build
npm run lint      # oxlint
```

## Estado del proyecto

- [x] Fase 1 — Setup del proyecto y arquitectura base
- [ ] Fase 2 — Login
- [ ] Fase 3 — Layout del Panel Administrativo
- [ ] Fase 4 — Dashboard con datos simulados
- [ ] Fase 5 — Módulo de Candidatos (listado + detalle)
