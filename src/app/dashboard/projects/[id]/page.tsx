"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useProject, useUpdateProject } from "@/lib/hooks/useData";
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  getStateVariant,
  Button,
} from "@/components/ui";
import type { ProjectState } from "@/lib/supabase";

const stateOrder: ProjectState[] = [
  "planning",
  "research",
  "decisions_locked",
  "building",
  "testing",
  "ready_to_ship",
  "live",
];

const stateLabels: Record<ProjectState, string> = {
  planning: "Planificacion",
  research: "Investigacion",
  decisions_locked: "Decisiones Bloqueadas",
  building: "Construyendo",
  testing: "Probando",
  ready_to_ship: "Listo para Enviar",
  live: "En Produccion",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();

  const currentState = project?.current_state as ProjectState | undefined;
  const currentStateIndex = currentState
    ? stateOrder.indexOf(currentState)
    : 0;

  const canAdvance =
    project && currentStateIndex < stateOrder.length - 1;
  const canRollback = project && currentStateIndex > 0;

  const handleAdvance = async () => {
    if (!project || !canAdvance) return;
    const nextState = stateOrder[currentStateIndex + 1];
    await updateProject.mutateAsync({
      id: project.id,
      current_state: nextState,
    });
  };

  const handleRollback = async () => {
    if (!project || !canRollback) return;
    const prevState = stateOrder[currentStateIndex - 1];
    await updateProject.mutateAsync({
      id: project.id,
      current_state: prevState,
    });
  };

  if (isLoading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  if (!project) {
    return <p className="text-red-500">Proyecto no encontrado</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/projects"
          className="text-gray-500 hover:text-gray-700"
        >
          &larr; Proyectos
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <Badge variant={getStateVariant(currentState!)}>
              {stateLabels[currentState!]}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRollback}
            disabled={!canRollback || updateProject.isPending}
          >
            &larr; Retroceder
          </Button>
          <Button
            onClick={handleAdvance}
            disabled={!canAdvance || updateProject.isPending}
          >
            Avanzar &rarr;
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {project.artifacts?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Artefactos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {project.adrs?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">ADRs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {project.tasks?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Tareas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {project.risks?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Riesgos</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Temas de Investigacion</h2>
          </CardHeader>
          <CardContent>
            {project.topics?.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay temas todavia.</p>
            ) : (
              <ul className="space-y-2">
                {project.topics?.map((topic) => (
                  <li key={topic.id} className="text-sm">
                    <span className="font-medium">{topic.title}</span>
                    <Badge
                      variant={
                        topic.status === "resolved" ? "success" : "default"
                      }
                      className="ml-2"
                    >
                      {topic.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Tests</h2>
          </CardHeader>
          <CardContent>
            {project.tests?.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay tests todavia.</p>
            ) : (
              <ul className="space-y-2">
                {project.tests?.map((test) => (
                  <li key={test.id} className="text-sm">
                    <span className="font-medium">{test.title}</span>
                    <Badge
                      variant={
                        test.status === "passed"
                          ? "success"
                          : test.status === "failed"
                          ? "danger"
                          : "default"
                      }
                      className="ml-2"
                    >
                      {test.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
