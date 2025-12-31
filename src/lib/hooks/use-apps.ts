'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, InsertTables } from '@/lib/types/database'

export function useApps() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tables<'apps'>[]
    },
  })
}

export function useApp(appId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['apps', appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('id', appId)
        .single()

      if (error) throw error
      return data as Tables<'apps'>
    },
    enabled: !!appId,
  })
}

export function useCreateApp() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (app: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('apps')
        .insert({ ...app, owner_id: user.id } as InsertTables<'apps'>)
        .select()
        .single()

      if (error) throw error
      return data as Tables<'apps'>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useDeleteApp() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.from('apps').delete().eq('id', appId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}
