"use client";

export const dynamic = "force-dynamic";

import { useApps, useProjects } from "@/lib/hooks/useData";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { ProjectCard, AppCard } from "@/components";

export default function DashboardPage() {
  const { data: apps, isLoading: appsLoading } = useApps();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Bienvenido a Blueprint OS. Gestiona tus apps y proyectos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-blue-600">
              {apps?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Apps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-green-600">
              {projects?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Proyectos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-purple-600">
              {projects?.filter((p) => p.current_state === "live").length ?? 0}
            </div>
            <div className="text-sm text-gray-500">En Produccion</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Apps Recientes</h2>
          </CardHeader>
          <CardContent>
            {appsLoading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : apps?.length === 0 ? (
              <p className="text-gray-500">No hay apps todavia.</p>
            ) : (
              <div className="space-y-4">
                {apps?.slice(0, 3).map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Proyectos Recientes</h2>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : projects?.length === 0 ? (
              <p className="text-gray-500">No hay proyectos todavia.</p>
            ) : (
              <div className="space-y-4">
                {projects?.slice(0, 3).map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
