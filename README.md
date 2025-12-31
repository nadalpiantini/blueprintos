# Blueprint OS

Sistema operativo para la creacion metodica de SaaS/Apps con AI.

## Stack Tecnologico

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **AI**: OpenAI GPT-4o (primary) + Claude 3.5 (fallback)
- **Vector**: Supabase pgvector

## Estructura del Proyecto

```
/supabase
  /migrations       -- SQL migrations
  /functions        -- Edge Functions (Deno)
/src
  /app              -- Next.js App Router pages
  /components       -- React components
  /lib              -- Utilities, hooks, types
```

## Configuracion

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar las variables de Supabase
3. Ejecutar `npm install`
4. Ejecutar `npm run dev` para desarrollo local

## Edge Functions

Las siguientes Edge Functions estan disponibles:

- `apps` - CRUD para aplicaciones
- `projects` - CRUD para proyectos
- `artifacts` - CRUD para artefactos (PRD, specs, etc.)
- `topics` - CRUD para temas de investigacion
- `adrs` - CRUD para Architecture Decision Records
- `tasks` - CRUD para tareas
- `tests` - CRUD para tests
- `risks` - CRUD para riesgos

## Documentacion

Las especificaciones tecnicas completas estan en Google Drive:
- [Blueprint OS - Especificaciones Tecnicas](https://docs.google.com/document/d/1aL1B3k3knP31022_4VeVxni6nvzk-PkEqqsgAKtEGDg)

## Estado del Proyecto

- [x] Sprint 1: Database Schema
- [x] Sprint 2: API Endpoints (Edge Functions)
- [ ] Sprint 3: Wireframes/UI
- [ ] Sprint 4: User Flows
- [ ] Sprint 5: LLM Integration
- [ ] Implementacion

## Licencia

MIT
