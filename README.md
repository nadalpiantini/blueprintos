# Blueprint OS

Sistema operativo para la creacion metodica de SaaS/Apps con AI.

## Stack Tecnologico

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- - **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
  - - **Styling**: Tailwind CSS + shadcn/ui
    - - **State**: Zustand + React Query
      - - **AI**: OpenAI GPT-4o (primary) + Claude 3.5 (fallback)
        - - **Vector**: Supabase pgvector
         
          - ## Estructura del Proyecto
         
          - ```
            /supabase
              /migrations       -- SQL migrations
              /functions        -- Edge Functions (Deno)
            /src
              /app              -- Next.js App Router pages
              /components       -- React components
              /lib              -- Utilities, hooks, types
            ```

            ## Documentacion

            Las especificaciones tecnicas completas estan en Google Drive:
            - [Blueprint OS - Especificaciones Tecnicas](https://docs.google.com/document/d/1aL1B3k3knP31022_4VeVxni6nvzk-PkEqqsgAKtEGDg)
           
            - ## Estado del Proyecto
           
            - - [x] Sprint 1: Database Schema
              - [ ] - [x] Sprint 2: API Endpoints
              - [ ] - [x] Sprint 3: Wireframes/UI
              - [ ] - [x] Sprint 4: User Flows
              - [ ] - [x] Sprint 5: LLM Integration
              - [ ] - [ ] Implementacion
             
              - [ ] ## Licencia
             
              - [ ] MIT
