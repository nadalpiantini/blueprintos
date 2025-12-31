import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { checkGateRequirement, getNextState } from '../_shared/state-machine.ts';
import { ProjectState, GateStatus, STATE_ORDER } from '../_shared/types.ts';

interface RequestBody {
  project_id: string;
  target_state?: ProjectState; // Optional: check specific transition
}

interface ResponseBody {
  success: boolean;
  project_id: string;
  current_state: ProjectState;
  gates: GateStatus[];
  next_available_state: ProjectState | null;
  can_advance: boolean;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseClient(req);
    const { project_id, target_state }: RequestBody = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current project state
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, current_state')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentState = project.current_state as ProjectState;
    const gates: GateStatus[] = [];

    if (target_state) {
      // Check specific transition
      const gateStatus = await checkGateRequirement(
        supabase,
        project_id,
        currentState,
        target_state
      );
      gates.push(gateStatus);
    } else {
      // Check all remaining transitions from current state
      const currentIndex = STATE_ORDER.indexOf(currentState);
      for (let i = currentIndex; i < STATE_ORDER.length - 1; i++) {
        const fromState = STATE_ORDER[i];
        const toState = STATE_ORDER[i + 1];
        const gateStatus = await checkGateRequirement(supabase, project_id, fromState, toState);
        gates.push(gateStatus);
      }
    }

    const nextState = getNextState(currentState);
    const canAdvance = gates.length > 0 && gates[0].can_advance;

    const response: ResponseBody = {
      success: true,
      project_id,
      current_state: currentState,
      gates,
      next_available_state: canAdvance ? nextState : null,
      can_advance: canAdvance,
    };

    return new Response(JSON.stringify(response), {
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
