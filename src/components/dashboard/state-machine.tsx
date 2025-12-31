'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Lock, Circle, ChevronRight } from 'lucide-react'
import type { ProjectState } from '@/lib/types/database'

const STATES: { key: ProjectState; label: string; description: string }[] = [
  { key: 'planning', label: 'Planificacion', description: 'Define el PRD y objetivos' },
  { key: 'research', label: 'Investigacion', description: 'Investiga topics y opciones' },
  { key: 'decisions_locked', label: 'Decisiones', description: 'Bloquea las decisiones (ADRs)' },
  { key: 'building', label: 'Desarrollo', description: 'Construye la solucion' },
  { key: 'testing', label: 'Testing', description: 'Prueba el producto' },
  { key: 'ready_to_ship', label: 'Listo', description: 'Preparado para produccion' },
  { key: 'live', label: 'Produccion', description: 'En vivo para usuarios' },
]

const GATE_REQUIREMENTS: Record<ProjectState, string> = {
  planning: 'Crear PRD para avanzar',
  research: 'Resolver 3+ topics para avanzar',
  decisions_locked: 'Aceptar 1+ ADR para avanzar',
  building: 'Completar 1+ tarea para avanzar',
  testing: 'Pasar 1+ test para avanzar',
  ready_to_ship: 'Aprobacion manual para ir a produccion',
  live: 'Estado final',
}

interface StateMachineProps {
  currentState: ProjectState
  gateStatus?: {
    can_advance: boolean
    gates: Array<{
      from_state: ProjectState
      to_state: ProjectState
      can_advance: boolean
      requirement: string
      current_count: number
      required_count: number
    }>
  }
}

export function StateMachine({ currentState, gateStatus }: StateMachineProps) {
  const currentIndex = STATES.findIndex((s) => s.key === currentState)

  const getStateStatus = (index: number) => {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'current'
    return 'upcoming'
  }

  const getGateInfo = (fromState: ProjectState) => {
    if (!gateStatus?.gates) return null
    return gateStatus.gates.find((g) => g.from_state === fromState)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STATES.map((state, index) => {
          const status = getStateStatus(index)
          const gate = getGateInfo(state.key)

          return (
            <div key={state.key} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        status === 'completed' && 'border-green-500 bg-green-500 text-white',
                        status === 'current' && 'border-primary bg-primary text-primary-foreground',
                        status === 'upcoming' && 'border-muted-foreground/30 bg-muted text-muted-foreground'
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : status === 'current' ? (
                        <Circle className="h-3 w-3 fill-current" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center max-w-[80px]',
                        status === 'current' && 'text-primary',
                        status === 'upcoming' && 'text-muted-foreground'
                      )}
                    >
                      {state.label}
                    </span>
                    {status === 'current' && gate && (
                      <Badge
                        variant={gate.can_advance ? 'success' : 'secondary'}
                        className="mt-1 text-[10px]"
                      >
                        {gate.current_count}/{gate.required_count}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{state.label}</p>
                  <p className="text-xs text-muted-foreground">{state.description}</p>
                  {status === 'current' && (
                    <p className="text-xs mt-1 text-primary">{GATE_REQUIREMENTS[state.key]}</p>
                  )}
                </TooltipContent>
              </Tooltip>

              {index < STATES.length - 1 && (
                <ChevronRight
                  className={cn(
                    'mx-1 h-5 w-5 flex-shrink-0',
                    index < currentIndex ? 'text-green-500' : 'text-muted-foreground/30'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
