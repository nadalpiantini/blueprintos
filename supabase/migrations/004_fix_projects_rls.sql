-- Fix: Add missing RLS policies for blueprintos_projects
-- This migration adds INSERT, UPDATE, DELETE policies

-- INSERT: Users can create projects in apps they own
CREATE POLICY "blueprintos_users_create_projects" ON public.blueprintos_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blueprintos_apps a
      WHERE a.id = app_id AND a.owner_id = auth.uid()
    )
  );

-- UPDATE: App owners and project admins/editors can update
CREATE POLICY "blueprintos_users_update_projects" ON public.blueprintos_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.blueprintos_apps a
      WHERE a.id = blueprintos_projects.app_id AND a.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.blueprintos_project_members pm
      WHERE pm.project_id = blueprintos_projects.id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Only app owners can delete projects
CREATE POLICY "blueprintos_users_delete_projects" ON public.blueprintos_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.blueprintos_apps a
      WHERE a.id = blueprintos_projects.app_id AND a.owner_id = auth.uid()
    )
  );

-- Also add missing policies for related tables

-- Quick stats: same as projects
CREATE POLICY "blueprintos_quick_stats_view" ON public.blueprintos_quick_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.blueprintos_projects p
      JOIN public.blueprintos_apps a ON a.id = p.app_id
      WHERE p.id = blueprintos_quick_stats.project_id AND a.owner_id = auth.uid()
    )
  );

-- Activity log: view for app owners
CREATE POLICY "blueprintos_activity_log_view" ON public.blueprintos_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.blueprintos_projects p
      JOIN public.blueprintos_apps a ON a.id = p.app_id
      WHERE p.id = blueprintos_activity_log.project_id AND a.owner_id = auth.uid()
    )
  );

-- Project members: app owners can manage
CREATE POLICY "blueprintos_project_members_view" ON public.blueprintos_project_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.blueprintos_projects p
      JOIN public.blueprintos_apps a ON a.id = p.app_id
      WHERE p.id = blueprintos_project_members.project_id AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "blueprintos_project_members_insert" ON public.blueprintos_project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blueprintos_projects p
      JOIN public.blueprintos_apps a ON a.id = p.app_id
      WHERE p.id = project_id AND a.owner_id = auth.uid()
    )
  );
