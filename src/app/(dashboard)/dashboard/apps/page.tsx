'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useApps, useDeleteApp } from '@/lib/hooks/use-apps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateAppDialog } from '@/components/dashboard/create-app-dialog'
import { Plus, FolderKanban, Trash2, ArrowRight } from 'lucide-react'

export default function AppsPage() {
  const searchParams = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: apps, isLoading } = useApps()
  const deleteApp = useDeleteApp()

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setDialogOpen(true)
    }
  }, [searchParams])

  const handleDelete = async (appId: string, appName: string) => {
    if (confirm(`Seguro que deseas eliminar "${appName}"? Esta accion no se puede deshacer.`)) {
      await deleteApp.mutateAsync(appId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Apps</h1>
          <p className="text-muted-foreground">Gestiona tus aplicaciones</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva App
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando apps...</p>
        </div>
      ) : apps && apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id} className="group relative">
              <Link href={`/dashboard/apps/${app.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <CardDescription>
                          {new Date(app.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.description || 'Sin descripcion'}
                  </p>
                </CardContent>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(app.id, app.name)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes apps</h3>
            <p className="text-muted-foreground mb-4">Crea tu primera app para comenzar</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear App
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateAppDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
