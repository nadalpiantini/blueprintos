'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject, useProjectStats, useGateStatus, useAdvanceProjectState, useRollbackProjectState } from '@/lib/hooks/use-projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StateMachine } from '@/components/dashboard/state-machine'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  FileText,
  BookOpen,
  GitBranch,
  CheckSquare,
  TestTube,
  AlertTriangle,
} from 'lucide-react'
import type { ProjectState } from '@/lib/types/database'

const STATE_LABELS: Record<ProjectState, string> = {
  planning: 'Planificacion',
  research: 'Investigacion',
  decisions_locked: 'Decisiones Bloqueadas',
  building: 'Desarrollo',
  testing: 'Testing',
  ready_to_ship: 'Listo para Produccion',
  live: 'En Produccion',
}

export default function ProjectPage({
  params,
}: {
  params: { appId: string; projectId: string }
}) {
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false)
  const [rollbackReason, setRollbackReason] = useState('')

  const { data: project, isLoading: projectLoading } = useProject(params.projectId)
  const { data: stats } = useProjectStats(params.projectId)
  const { data: gateStatus } = useGateStatus(params.projectId)
  const advanceState = useAdvanceProjectState()
  const rollbackState = useRollbackProjectState()

  const handleAdvance = async () => {
    try {
      await advanceState.mutateAsync({ projectId: params.projectId })
    } catch (error: any) {
      alert(error.message || 'Error al avanzar estado')
    }
  }

  const handleRollback = async () => {
    if (!rollbackReason.trim()) return
    try {
      await rollbackState.mutateAsync({
        projectId: params.projectId,
        reason: rollbackReason,
      })
      setRollbackDialogOpen(false)
      setRollbackReason('')
    } catch (error: any) {
      alert(error.message || 'Error al retroceder estado')
    }
  }

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Proyecto no encontrado</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/apps/${params.appId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>
    )
  }

  const canAdvance = gateStatus?.can_advance && project.current_state !== 'live'
  const canRollback = project.current_state !== 'planning'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/apps/${params.appId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description || 'Sin descripcion'}</p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-3">
          {STATE_LABELS[project.current_state]}
        </Badge>
      </div>

      {/* State Machine Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Proyecto</CardTitle>
          <CardDescription>Progreso a traves del ciclo de desarrollo</CardDescription>
        </CardHeader>
        <CardContent>
          <StateMachine currentState={project.current_state} gateStatus={gateStatus} />

          <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              disabled={!canRollback || rollbackState.isPending}
              onClick={() => setRollbackDialogOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retroceder
            </Button>
            <Button
              disabled={!canAdvance || advanceState.isPending}
              onClick={handleAdvance}
            >
              {advanceState.isPending ? 'Avanzando...' : 'Avanzar Estado'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {!canAdvance && project.current_state !== 'live' && gateStatus?.gates?.[0] && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Requisito no cumplido</p>
                <p className="text-sm text-amber-700">
                  {gateStatus.gates[0].requirement} ({gateStatus.gates[0].current_count}/
                  {gateStatus.gates[0].required_count})
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Artifacts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.artifact_count}</div>
              <p className="text-xs text-muted-foreground">documentos creados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.resolved_topic_count}/{stats.topic_count}
              </div>
              <Progress
                value={stats.topic_count > 0 ? (stats.resolved_topic_count / stats.topic_count) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ADRs</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.locked_adr_count}/{stats.adr_count}
              </div>
              <p className="text-xs text-muted-foreground">decisiones bloqueadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completed_task_count}/{stats.task_count}
              </div>
              <Progress
                value={stats.task_count > 0 ? (stats.completed_task_count / stats.task_count) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.passed_test_count}/{stats.test_count}
              </div>
              {stats.failed_test_count > 0 && (
                <p className="text-xs text-red-500">{stats.failed_test_count} fallidos</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retroceder Estado</DialogTitle>
            <DialogDescription>
              Esta accion retrocederá el proyecto al estado anterior. Por favor indica la razon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razon del rollback</Label>
              <Input
                id="reason"
                placeholder="Ej: Se encontraron problemas en la fase anterior"
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rollbackReason.trim() || rollbackState.isPending}
              onClick={handleRollback}
            >
              {rollbackState.isPending ? 'Retrocediendo...' : 'Confirmar Rollback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
