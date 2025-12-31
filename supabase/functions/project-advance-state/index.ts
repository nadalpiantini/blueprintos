import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import {
  checkGateRequirement,
  getNextState,
  logStateChange,
} from '../_shared/state-machine.ts';
import { ProjectState, StateTransitionResult } from '../_shared/types.ts';

interface RequestBody {
  project_id: string;
  user_id?: string;
  force?: boolean; // Allow advancing even if gate requirements not met (admin only)
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient(req);
    const { project_id, user_id, force = false }: RequestBody = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'project_id is required' }),
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
    const nextState = getNextState(currentState);

    // Check if already at final state
    if (!nextState) {
      const result: StateTransitionResult = {
        success: false,
        previous_state: currentState,
        current_state: currentState,
        message: 'Project is already at the final state (live)',
      };
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check gate requirements
    const gateStatus = await checkGateRequirement(
      supabase,
      project_id,
      currentState,
      nextState
    );

    if (!gateStatus.can_advance && !force) {
      const result: StateTransitionResult = {
        success: false,
        previous_state: currentState,
        current_state: currentState,
        message: `Cannot advance: ${gateStatus.blocking_reason}`,
        gate_status: gateStatus,
      };
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update project state
    const { error: updateError } = await supabase
      .from('projects')
      .update({ current_state: nextState })
      .eq('id', project_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create project gate record
    await supabase.from('project_gates').upsert({
      project_id,
      from_state: currentState,
      to_state: nextState,
      gate_passed: true,
      passed_at: new Date().toISOString(),
    }, {
      onConflict: 'project_id,from_state,to_state',
    });

    // Log state change
    await logStateChange(supabase, project_id, user_id || null, currentState, nextState);

    const result: StateTransitionResult = {
      success: true,
      previous_state: currentState,
      current_state: nextState,
      message: `Project "${project.name}" advanced from ${currentState} to ${nextState}`,
      gate_status: gateStatus,
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
