"use client";

import Link from "next/link";
import { Card, CardContent } from "./ui";
import type { App } from "@/lib/supabase";

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/dashboard/apps/${app.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
          {app.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {app.description}
            </p>
          )}
          <div className="mt-4 text-xs text-gray-500">
            Creado: {new Date(app.created_at).toLocaleDateString("es-ES")}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
