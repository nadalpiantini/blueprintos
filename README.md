# Blueprint OS

Sistema operativo para la creacion metodica de SaaS/Apps con AI.

Blueprint OS es una plataforma que guia el desarrollo de aplicaciones a traves de un proceso estructurado con estados, gates (puntos de control), y documentacion automatizada.

## Stack Tecnologico

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Realtime)
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **AI**: OpenAI GPT-4o (primary) + Claude 3.5 (fallback)
- **Vector Search**: Supabase pgvector

## Requisitos Previos

- Node.js 18+
- npm 9+
- Cuenta de Supabase (gratuita en [supabase.com](https://supabase.com))
- Supabase CLI (opcional, para desarrollo local)

## Instalacion Rapida

### 1. Clonar el repositorio

```bash
git clone https://github.com/nadalpiantini/blueprintos.git
cd blueprintos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales de Supabase:

```bash
cp .env.example .env
```

Edita `.env` con tus valores de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Puedes encontrar estos valores en tu dashboard de Supabase:
- Ve a Settings > API
- Copia "Project URL" y "anon public" key

### 4. Configurar la base de datos

Ejecuta las migraciones en tu proyecto de Supabase:

1. Ve a tu dashboard de Supabase
2. Navega a SQL Editor
3. Copia y ejecuta el contenido de `supabase/migrations/001_initial_schema.sql`

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
blueprintos/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard y paginas protegidas
│   │   │   ├── apps/           # Gestion de apps
│   │   │   └── projects/       # Gestion de proyectos
│   │   ├── login/              # Pagina de login
│   │   └── register/           # Pagina de registro
│   ├── components/             # Componentes React
│   │   └── ui/                 # Componentes UI reutilizables
│   └── lib/                    # Utilidades, hooks, tipos
│       ├── auth.tsx            # Context de autenticacion
│       ├── hooks/              # Custom hooks
│       ├── providers.tsx       # Providers de la app
│       └── supabase.ts         # Cliente y tipos de Supabase
├── supabase/
│   ├── migrations/             # Migraciones SQL
│   ├── functions/              # Edge Functions (Deno)
│   │   ├── _shared/            # Utilidades compartidas
│   │   ├── apps/               # CRUD de apps
│   │   ├── projects/           # CRUD de proyectos
│   │   ├── artifacts/          # CRUD de artefactos
│   │   ├── topics/             # CRUD de temas de investigacion
│   │   ├── adrs/               # CRUD de ADRs
│   │   ├── tasks/              # CRUD de tareas
│   │   ├── tests/              # CRUD de tests
│   │   ├── risks/              # CRUD de riesgos
│   │   ├── project-advance-state/   # Avanzar estado del proyecto
│   │   ├── project-rollback-state/  # Retroceder estado del proyecto
│   │   ├── project-gate-status/     # Verificar status de gate
│   │   └── task-can-start/          # Verificar si tarea puede iniciar
│   └── config.toml             # Configuracion de Supabase
└── package.json
```

## Edge Functions

### CRUD Functions

| Function | Descripcion | Metodos |
|----------|-------------|---------|
| `apps` | Gestion de aplicaciones | GET, POST, PUT, DELETE |
| `projects` | Gestion de proyectos | GET, POST, PUT, DELETE |
| `artifacts` | Artefactos (PRD, specs, etc.) | GET, POST, PUT, DELETE |
| `topics` | Temas de investigacion | GET, POST, PUT, DELETE |
| `adrs` | Architecture Decision Records | GET, POST, PUT, DELETE |
| `tasks` | Tareas del proyecto | GET, POST, PUT, DELETE |
| `tests` | Casos de prueba | GET, POST, PUT, DELETE |
| `risks` | Riesgos del proyecto | GET, POST, PUT, DELETE |

### Workflow Functions

| Function | Descripcion | Metodo |
|----------|-------------|--------|
| `project-advance-state` | Avanzar proyecto al siguiente estado | POST |
| `project-rollback-state` | Retroceder proyecto al estado anterior | POST |
| `project-gate-status` | Verificar requisitos para avanzar | GET |
| `task-can-start` | Verificar si una tarea puede comenzar | GET |

## Estados del Proyecto

Un proyecto pasa por los siguientes estados:

1. **Planning** - Definicion inicial del proyecto
2. **Research** - Investigacion y recopilacion de informacion
3. **Decisions Locked** - Decisiones arquitectonicas bloqueadas
4. **Building** - Desarrollo activo
5. **Testing** - Pruebas y QA
6. **Ready to Ship** - Listo para lanzamiento
7. **Live** - En produccion

Cada transicion entre estados tiene un "gate" con requisitos especificos:

| Transicion | Requisitos |
|------------|------------|
| Planning → Research | PRD creado |
| Research → Decisions Locked | Spec tecnica + 1 ADR aprobado |
| Decisions Locked → Building | Diagrama de arquitectura |
| Building → Testing | - |
| Testing → Ready to Ship | Sin riesgos criticos |
| Ready to Ship → Live | - |

## Comandos Disponibles

```bash
# Desarrollo
npm run dev           # Iniciar servidor de desarrollo
npm run build         # Build de produccion
npm run start         # Iniciar servidor de produccion
npm run lint          # Ejecutar ESLint
npm run type-check    # Verificar tipos TypeScript

# Supabase (requiere Supabase CLI)
npm run supabase:start           # Iniciar Supabase local
npm run supabase:stop            # Detener Supabase local
npm run supabase:functions:serve # Servir Edge Functions localmente
npm run supabase:functions:deploy # Desplegar Edge Functions
```

## Despliegue de Edge Functions

Para desplegar las Edge Functions a Supabase:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-project-ref

# Desplegar todas las funciones
supabase functions deploy
```

## Despliegue del Frontend

El frontend puede desplegarse en cualquier plataforma compatible con Next.js:

### Vercel (Recomendado)

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Configura las variables de entorno
3. Despliega

### Otras opciones

- Netlify
- Railway
- Docker
- Self-hosted

## Estado del Proyecto

- [x] Sprint 1: Database Schema
- [x] Sprint 2: API Endpoints (Edge Functions)
- [x] Sprint 3: Dashboard UI
- [ ] Sprint 4: User Flows
- [ ] Sprint 5: LLM Integration

## Documentacion Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

Las especificaciones tecnicas completas estan disponibles en:
- [Blueprint OS - Especificaciones Tecnicas](https://docs.google.com/document/d/1aL1B3k3knP31022_4VeVxni6nvzk-PkEqqsgAKtEGDg)

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

MIT
