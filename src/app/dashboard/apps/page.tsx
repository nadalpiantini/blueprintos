"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useApps, useCreateApp } from "@/lib/hooks/useData";
import { AppCard } from "@/components";
import { Button, Card, CardContent, Input } from "@/components/ui";

export default function AppsPage() {
  const { data: apps, isLoading } = useApps();
  const createApp = useCreateApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApp.mutateAsync({ name, description });
      setName("");
      setDescription("");
      setShowForm(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apps</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona tus aplicaciones
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Nueva App"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Descripcion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" disabled={createApp.isPending}>
                {createApp.isPending ? "Creando..." : "Crear App"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : apps?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No tienes apps todavia.</p>
            <p className="text-sm text-gray-400 mt-1">
              Crea tu primera app para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps?.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
