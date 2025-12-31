import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ProjectState, STATE_ORDER, GateStatus, GATE_REQUIREMENTS } from './types.ts';

export function getStateIndex(state: ProjectState): number {
  return STATE_ORDER.indexOf(state);
}

export function getNextState(currentState: ProjectState): ProjectState | null {
  const currentIndex = getStateIndex(currentState);
  if (currentIndex === -1 || currentIndex >= STATE_ORDER.length - 1) {
    return null;
  }
  return STATE_ORDER[currentIndex + 1];
}

export function getPreviousState(currentState: ProjectState): ProjectState | null {
  const currentIndex = getStateIndex(currentState);
  if (currentIndex <= 0) {
    return null;
  }
  return STATE_ORDER[currentIndex - 1];
}

export async function checkGateRequirement(
  supabase: SupabaseClient,
  projectId: string,
  fromState: ProjectState,
  toState: ProjectState
): Promise<GateStatus> {
  const requirement = GATE_REQUIREMENTS.find(
    (r) => r.from === fromState && r.to === toState
  );

  if (!requirement) {
    return {
      from_state: fromState,
      to_state: toState,
      can_advance: true,
      requirement: 'No specific requirement',
      current_count: 0,
      required_count: 0,
    };
  }

  let current_count = 0;
  let required_count = 1;
  let can_advance = false;

  switch (requirement.check) {
    case 'has_prd_artifact': {
      // planning -> research: requires PRD artifact
      const { count } = await supabase
        .from('artifacts')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('artifact_type', 'prd');
      current_count = count || 0;
      required_count = 1;
      can_advance = current_count >= required_count;
      break;
    }

    case 'has_3_resolved_topics': {
      // research -> decisions_locked: requires 3+ resolved topics
      const { count } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'resolved');
      current_count = count || 0;
      required_count = 3;
      can_advance = current_count >= required_count;
      break;
    }

    case 'has_accepted_adr': {
      // decisions_locked -> building: requires 1+ accepted ADR
      const { count } = await supabase
        .from('adrs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .in('status', ['accepted', 'locked']);
      current_count = count || 0;
      required_count = 1;
      can_advance = current_count >= required_count;
      break;
    }

    case 'has_done_task': {
      // building -> testing: requires 1+ done task
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'done');
      current_count = count || 0;
      required_count = 1;
      can_advance = current_count >= required_count;
      break;
    }

    case 'has_passed_test': {
      // testing -> ready_to_ship: requires 1+ passed test
      const { count } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'passed');
      current_count = count || 0;
      required_count = 1;
      can_advance = current_count >= required_count;
      break;
    }

    case 'always_pass': {
      // ready_to_ship -> live: always allowed
      can_advance = true;
      current_count = 1;
      required_count = 1;
      break;
    }
  }

  return {
    from_state: fromState,
    to_state: toState,
    can_advance,
    requirement: requirement.description,
    current_count,
    required_count,
    blocking_reason: can_advance
      ? undefined
      : `${requirement.description} (${current_count}/${required_count})`,
  };
}

export async function logStateChange(
  supabase: SupabaseClient,
  projectId: string,
  userId: string | null,
  previousState: ProjectState,
  newState: ProjectState,
  isRollback: boolean = false,
  rollbackReason?: string
) {
  await supabase.from('activity_log').insert({
    project_id: projectId,
    user_id: userId,
    event_type: isRollback ? 'rollback' : 'state_changed',
    entity_type: 'project',
    entity_id: projectId,
    description: isRollback
      ? `Project rolled back from ${previousState} to ${newState}`
      : `Project advanced from ${previousState} to ${newState}`,
    metadata: { previous_state: previousState, new_state: newState },
    actor_type: 'user',
    severity: isRollback ? 'warning' : 'info',
    is_rollback: isRollback,
    rollback_reason: rollbackReason,
  });
}
