"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp, useCreateProject } from "@/lib/hooks/useData";
import { ProjectCard } from "@/components";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";

export default function AppDetailPage() {
  const params = useParams();
  const appId = params.id as string;
  const { data: app, isLoading } = useApp(appId);
  const createProject = useCreateProject();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({ app_id: appId, name, description });
      setName("");
      setDescription("");
      setShowForm(false);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  if (!app) {
    return <p className="text-red-500">App no encontrada</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/apps"
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Apps
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
          {app.description && (
            <p className="mt-1 text-sm text-gray-600">{app.description}</p>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nuevo Proyecto"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nombre del Proyecto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Descripcion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creando..." : "Crear Proyecto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Proyectos</h2>
        </CardHeader>
        <CardContent>
          {app.projects?.length === 0 ? (
            <p className="text-gray-500">No hay proyectos en esta app.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {app.projects?.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
