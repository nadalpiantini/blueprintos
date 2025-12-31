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
  /components       -- React components (shadcn/ui)
  /lib              -- Utilities, hooks, types
```

## State Machine

El proyecto sigue un flujo de estados definido:

```
planning -> research -> decisions_locked -> building -> testing -> ready_to_ship -> live
```

### Gates (Requisitos para avanzar)

| Transicion | Requisito |
|------------|-----------|
| planning → research | 1+ PRD artifact |
| research → decisions_locked | 3+ topics resolved |
| decisions_locked → building | 1+ ADR accepted |
| building → testing | 1+ task completed |
| testing → ready_to_ship | 1+ test passed |

## Edge Functions

- `project-gate-status` - Verifica requisitos de gates
- `project-advance-state` - Avanza el estado del proyecto
- `project-rollback-state` - Retrocede el estado con razon
- `task-can-start` - Verifica si una tarea puede iniciar

## Instalacion

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## Documentacion

Las especificaciones tecnicas completas estan en Google Drive:
- [Blueprint OS - Especificaciones Tecnicas](https://docs.google.com/document/d/1aL1B3k3knP31022_4VeVxni6nvzk-PkEqqsgAKtEGDg)

## Estado del Proyecto

- [x] Sprint 1: Database Schema
- [x] Sprint 2: Edge Functions (State Machine)
- [x] Sprint 3: Frontend Base (Auth, Dashboard, Apps, Projects)
- [ ] Sprint 4: LLM Integration
- [ ] Sprint 5: Full Implementation

## Licencia

MIT
