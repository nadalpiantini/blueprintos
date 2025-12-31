'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ProjectState } from '@/lib/types/database'

export interface Project {
  id: string
  app_id: string
  name: string
  description: string | null
  current_state: ProjectState
  created_at: string
  updated_at: string
}

export interface QuickStats {
  id: string
  project_id: string
  artifact_count: number
  topic_count: number
  resolved_topic_count: number
  adr_count: number
  locked_adr_count: number
  risk_count: number
  high_risk_count: number
  task_count: number
  completed_task_count: number
  test_count: number
  passed_test_count: number
  failed_test_count: number
  last_activity_at: string
  updated_at: string
}

export function useProjects(appId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['projects', appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
    enabled: !!appId,
  })
}

export function useProject(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['projects', 'detail', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!projectId,
  })
}

export function useProjectStats(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['projects', 'stats', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_stats')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error) throw error
      return data as QuickStats
    },
    enabled: !!projectId,
  })
}

export function useCreateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (project: { app_id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', data.app_id] })
    },
  })
}

export function useAdvanceProjectState() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId?: string }) => {
      const { data, error } = await supabase.functions.invoke('project-advance-state', {
        body: { project_id: projectId, user_id: userId },
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'stats', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['gate-status', variables.projectId] })
    },
  })
}

export function useRollbackProjectState() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      reason,
      userId,
    }: {
      projectId: string
      reason: string
      userId?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('project-rollback-state', {
        body: { project_id: projectId, reason, user_id: userId },
      })

      if (error) throw error
      if (!data.success) throw new Error(data.message)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['gate-status', variables.projectId] })
    },
  })
}

export function useGateStatus(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['gate-status', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('project-gate-status', {
        body: { project_id: projectId },
      })

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}
