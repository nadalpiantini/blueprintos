'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables, ProjectState } from '@/lib/types/database'

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
      return data as Tables<'projects'>[]
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
      return data as Tables<'projects'>
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
      return data as Tables<'quick_stats'>
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
        .insert(project as InsertTables<'projects'>)
        .select()
        .single()

      if (error) throw error
      return data as Tables<'projects'>
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
