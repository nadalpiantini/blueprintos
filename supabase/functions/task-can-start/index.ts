import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { TaskCanStartResult } from '../_shared/types.ts';

interface RequestBody {
  task_id: string;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient(req);
    const { task_id }: RequestBody = await req.json();

    if (!task_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'task_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get task with dependency info
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status, depends_on_task_id, blocked_reason, project_id')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ success: false, error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if task is already done or in progress
    if (task.status === 'done') {
      const result: TaskCanStartResult = {
        can_start: false,
        blocking_reason: 'Task is already completed',
      };
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (task.status === 'in_progress') {
      const result: TaskCanStartResult = {
        can_start: false,
        blocking_reason: 'Task is already in progress',
      };
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if task has explicit blocked status
    if (task.status === 'blocked') {
      const result: TaskCanStartResult = {
        can_start: false,
        blocking_reason: task.blocked_reason || 'Task is blocked',
      };
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check project state - tasks can only be started in 'building' or later states
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('current_state')
      .eq('id', task.project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowedStates = ['building', 'testing', 'ready_to_ship', 'live'];
    if (!allowedStates.includes(project.current_state)) {
      const result: TaskCanStartResult = {
        can_start: false,
        blocking_reason: `Project must be in building phase or later to start tasks. Current state: ${project.current_state}`,
      };
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check dependency if exists
    if (task.depends_on_task_id) {
      const { data: dependencyTask, error: depError } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('id', task.depends_on_task_id)
        .single();

      if (depError || !dependencyTask) {
        // Dependency task doesn't exist, can start
        const result: TaskCanStartResult = {
          can_start: true,
        };
        return new Response(JSON.stringify({ success: true, ...result }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if dependency is completed
      if (dependencyTask.status !== 'done') {
        const result: TaskCanStartResult = {
          can_start: false,
          blocking_reason: `Depends on task "${dependencyTask.title}" which is not completed`,
          depends_on_task: {
            id: dependencyTask.id,
            title: dependencyTask.title,
            status: dependencyTask.status,
          },
        };
        return new Response(JSON.stringify({ success: true, ...result }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // No blockers - task can start
    const result: TaskCanStartResult = {
      can_start: true,
    };

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
