// Project States (must match database enum)
export type ProjectState =
  | 'planning'
  | 'research'
  | 'decisions_locked'
  | 'building'
  | 'testing'
  | 'ready_to_ship'
  | 'live';

// State Machine Order
export const STATE_ORDER: ProjectState[] = [
  'planning',
  'research',
  'decisions_locked',
  'building',
  'testing',
  'ready_to_ship',
  'live',
];

// Gate Requirements
export interface GateRequirement {
  from: ProjectState;
  to: ProjectState;
  check: string;
  description: string;
}

export const GATE_REQUIREMENTS: GateRequirement[] = [
  {
    from: 'planning',
    to: 'research',
    check: 'has_prd_artifact',
    description: 'Requires at least 1 PRD artifact',
  },
  {
    from: 'research',
    to: 'decisions_locked',
    check: 'has_3_resolved_topics',
    description: 'Requires at least 3 resolved topics',
  },
  {
    from: 'decisions_locked',
    to: 'building',
    check: 'has_accepted_adr',
    description: 'Requires at least 1 accepted ADR',
  },
  {
    from: 'building',
    to: 'testing',
    check: 'has_done_task',
    description: 'Requires at least 1 completed task',
  },
  {
    from: 'testing',
    to: 'ready_to_ship',
    check: 'has_passed_test',
    description: 'Requires at least 1 passed test',
  },
  {
    from: 'ready_to_ship',
    to: 'live',
    check: 'always_pass',
    description: 'Manual approval to go live',
  },
];

// API Response types
export interface GateStatus {
  from_state: ProjectState;
  to_state: ProjectState;
  can_advance: boolean;
  requirement: string;
  current_count: number;
  required_count: number;
  blocking_reason?: string;
}

export interface StateTransitionResult {
  success: boolean;
  previous_state: ProjectState;
  current_state: ProjectState;
  message: string;
  gate_status?: GateStatus;
}

export interface TaskCanStartResult {
  can_start: boolean;
  blocking_reason?: string;
  depends_on_task?: {
    id: string;
    title: string;
    status: string;
  };
}
