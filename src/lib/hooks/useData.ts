"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type App,
  type Project,
  type Artifact,
  type Topic,
  type ADR,
  type Task,
  type Test,
  type Risk,
} from "../supabase";

export interface ProjectWithDetails extends Project {
  quick_stats?: unknown;
  artifacts?: Artifact[];
  topics?: Topic[];
  adrs?: ADR[];
  tasks?: Task[];
  tests?: Test[];
  risks?: Risk[];
}

export function useApps() {
  return useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as App[];
    },
  });
}

export function useApp(id: string) {
  return useQuery({
    queryKey: ["apps", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*, projects(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as App & { projects: Project[] };
    },
    enabled: !!id,
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (app: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("apps")
        .insert({ ...app, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useProjects(appId?: string) {
  return useQuery({
    queryKey: ["projects", appId],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, quick_stats(*)")
        .order("updated_at", { ascending: false });

      if (appId) {
        query = query.eq("app_id", appId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async (): Promise<ProjectWithDetails> => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          quick_stats(*),
          artifacts(*),
          topics(*),
          adrs(*),
          tasks(*),
          tests(*),
          risks(*)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ProjectWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: {
      app_id: string;
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      current_state?: string;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
    },
  });
}
