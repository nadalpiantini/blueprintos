"use client";

import Link from "next/link";
import { Card, CardContent, Badge, getStateVariant } from "./ui";
import type { Project, ProjectState } from "@/lib/supabase";

interface ProjectCardProps {
  project: Project;
}

const stateLabels: Record<ProjectState, string> = {
  planning: "Planificacion",
  research: "Investigacion",
  decisions_locked: "Decisiones Bloqueadas",
  building: "Construyendo",
  testing: "Probando",
  ready_to_ship: "Listo para Enviar",
  live: "En Produccion",
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h3>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <Badge variant={getStateVariant(project.current_state)}>
              {stateLabels[project.current_state]}
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span>
              Actualizado:{" "}
              {new Date(project.updated_at).toLocaleDateString("es-ES")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
