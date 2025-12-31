"use client";

export const dynamic = "force-dynamic";

import { useProjects } from "@/lib/hooks/useData";
import { ProjectCard } from "@/components";
import { Card, CardContent } from "@/components/ui";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Todos tus proyectos en un solo lugar
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : projects?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No tienes proyectos todavia.</p>
            <p className="text-sm text-gray-400 mt-1">
              Crea una app primero y luego agrega proyectos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
