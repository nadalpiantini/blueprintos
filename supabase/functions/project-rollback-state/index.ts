import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { getPreviousState, logStateChange } from '../_shared/state-machine.ts';
import { ProjectState, StateTransitionResult } from '../_shared/types.ts';

interface RequestBody {
  project_id: string;
  user_id?: string;
  reason: string; // Rollback reason is required
  target_state?: ProjectState; // Optional: rollback to specific state (must be earlier than current)
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient(req);
    const { project_id, user_id, reason, target_state }: RequestBody = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'reason is required for rollback' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current project state
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, current_state')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentState = project.current_state as ProjectState;

    // Determine target state for rollback
    let newState: ProjectState | null;

    if (target_state) {
      // Validate target state is earlier than current
      const { STATE_ORDER } = await import('../_shared/types.ts');
      const currentIndex = STATE_ORDER.indexOf(currentState);
      const targetIndex = STATE_ORDER.indexOf(target_state);

      if (targetIndex >= currentIndex) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Target state must be earlier than current state',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      newState = target_state;
    } else {
      // Default: rollback to previous state
      newState = getPreviousState(currentState);
    }

    // Check if already at initial state
    if (!newState) {
      const result: StateTransitionResult = {
        success: false,
        previous_state: currentState,
        current_state: currentState,
        message: 'Project is already at the initial state (planning)',
      };
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update project state
    const { error: updateError } = await supabase
      .from('projects')
      .update({ current_state: newState })
      .eq('id', project_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log rollback with reason
    await logStateChange(
      supabase,
      project_id,
      user_id || null,
      currentState,
      newState,
      true,
      reason
    );

    const result: StateTransitionResult = {
      success: true,
      previous_state: currentState,
      current_state: newState,
      message: `Project "${project.name}" rolled back from ${currentState} to ${newState}. Reason: ${reason}`,
    };

    return new Response(JSON.stringify(result), {
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
