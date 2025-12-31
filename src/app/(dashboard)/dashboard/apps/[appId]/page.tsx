'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/hooks/use-apps'
import { useProjects } from '@/lib/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'
import { Plus, FolderKanban, ArrowLeft, ArrowRight } from 'lucide-react'
import type { ProjectState } from '@/lib/types/database'

const STATE_LABELS: Record<ProjectState, string> = {
  planning: 'Planificacion',
  research: 'Investigacion',
  decisions_locked: 'Decisiones',
  building: 'Desarrollo',
  testing: 'Testing',
  ready_to_ship: 'Listo',
  live: 'Produccion',
}

const STATE_COLORS: Record<ProjectState, 'default' | 'secondary' | 'success' | 'warning'> = {
  planning: 'secondary',
  research: 'secondary',
  decisions_locked: 'warning',
  building: 'default',
  testing: 'warning',
  ready_to_ship: 'success',
  live: 'success',
}

export default function AppDetailPage({ params }: { params: { appId: string } }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: app, isLoading: appLoading } = useApp(params.appId)
  const { data: projects, isLoading: projectsLoading } = useProjects(params.appId)

  if (appLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">App no encontrada</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/apps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Apps
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/apps">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground">{app.description || 'Sin descripcion'}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Proyectos</h2>
        {projectsLoading ? (
          <p className="text-muted-foreground">Cargando proyectos...</p>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group">
                <Link href={`/dashboard/apps/${params.appId}/projects/${project.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>
                            {new Date(project.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description || 'Sin descripcion'}
                      </p>
                      <Badge variant={STATE_COLORS[project.current_state]}>
                        {STATE_LABELS[project.current_state]}
                      </Badge>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground mb-4">Crea tu primer proyecto</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Proyecto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateProjectDialog appId={params.appId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
