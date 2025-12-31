'use client'

import Link from 'next/link'
import { useApps } from '@/lib/hooks/use-apps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Boxes, FolderKanban, Plus, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { data: apps, isLoading } = useApps()

  const totalApps = apps?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido a Blueprint OS</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '-' : totalApps}</div>
            <p className="text-xs text-muted-foreground">Aplicaciones creadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inicio Rapido</CardTitle>
            <CardDescription>Acciones comunes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/apps">
                <Boxes className="mr-2 h-4 w-4" />
                Ver todas las Apps
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/apps?create=true">
                <Plus className="mr-2 h-4 w-4" />
                Crear nueva App
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apps Recientes</CardTitle>
            <CardDescription>Tus ultimas aplicaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : apps && apps.length > 0 ? (
              <div className="space-y-3">
                {apps.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/apps/${app.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.description || 'Sin descripcion'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  No tienes apps todavia
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/apps?create=true">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear tu primera App
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
