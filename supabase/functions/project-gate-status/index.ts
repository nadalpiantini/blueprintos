import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

const stateOrder = [
  "planning",
  "research",
  "decisions_locked",
  "building",
  "testing",
  "ready_to_ship",
  "live",
] as const;

type ProjectState = (typeof stateOrder)[number];

interface GateRequirements {
  from_state: ProjectState;
  to_state: ProjectState;
  required_artifact_types: string[];
  required_adr_count: number;
  can_accept_risk: boolean;
  description: string;
}

const defaultGateRequirements: GateRequirements[] = [
  {
    from_state: "planning",
    to_state: "research",
    required_artifact_types: ["prd"],
    required_adr_count: 0,
    can_accept_risk: true,
    description: "Define product requirements before starting research",
  },
  {
    from_state: "research",
    to_state: "decisions_locked",
    required_artifact_types: ["technical_spec"],
    required_adr_count: 1,
    can_accept_risk: false,
    description: "Complete technical specification and key architecture decisions",
  },
  {
    from_state: "decisions_locked",
    to_state: "building",
    required_artifact_types: ["architecture_diagram"],
    required_adr_count: 0,
    can_accept_risk: false,
    description: "Finalize architecture before building",
  },
  {
    from_state: "building",
    to_state: "testing",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: true,
    description: "Complete implementation before testing",
  },
  {
    from_state: "testing",
    to_state: "ready_to_ship",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: false,
    description: "All tests must pass with no critical risks",
  },
  {
    from_state: "ready_to_ship",
    to_state: "live",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: false,
    description: "Final review before going live",
  },
];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const projectId = url.searchParams.get("project_id");

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!projectId) {
      return errorResponse("project_id is required");
    }

    // Get project with related data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, artifacts(*), adrs(*), risks(*), tasks(*), tests(*)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found", 404);
    }

    const currentState = project.current_state as ProjectState;
    const currentIndex = stateOrder.indexOf(currentState);

    // Get next state requirements
    const nextState =
      currentIndex < stateOrder.length - 1
        ? stateOrder[currentIndex + 1]
        : null;

    const gateReq = nextState
      ? defaultGateRequirements.find(
          (g) => g.from_state === currentState && g.to_state === nextState
        )
      : null;

    // Calculate gate status
    const blockers: string[] = [];
    const completed: string[] = [];

    if (gateReq) {
      // Check artifacts
      for (const artifactType of gateReq.required_artifact_types) {
        const hasArtifact = project.artifacts?.some(
          (a: { artifact_type: string }) => a.artifact_type === artifactType
        );
        if (hasArtifact) {
          completed.push(`Has ${artifactType} artifact`);
        } else {
          blockers.push(`Missing required artifact: ${artifactType}`);
        }
      }

      // Check ADRs
      const lockedAdrs =
        project.adrs?.filter(
          (a: { status: string }) =>
            a.status === "accepted" || a.status === "locked"
        )?.length ?? 0;
      if (lockedAdrs >= gateReq.required_adr_count) {
        if (gateReq.required_adr_count > 0) {
          completed.push(`Has ${lockedAdrs} locked/accepted ADRs`);
        }
      } else {
        blockers.push(
          `Need ${gateReq.required_adr_count} locked/accepted ADRs (have ${lockedAdrs})`
        );
      }

      // Check risks
      if (!gateReq.can_accept_risk) {
        const highRisks =
          project.risks?.filter(
            (r: { level: string }) =>
              r.level === "high" || r.level === "critical"
          )?.length ?? 0;
        if (highRisks === 0) {
          completed.push("No high/critical risks");
        } else {
          blockers.push(`${highRisks} high/critical risks need mitigation`);
        }
      }
    }

    // Calculate overall stats
    const stats = {
      artifacts: project.artifacts?.length ?? 0,
      adrs: {
        total: project.adrs?.length ?? 0,
        locked:
          project.adrs?.filter(
            (a: { status: string }) =>
              a.status === "locked" || a.status === "accepted"
          )?.length ?? 0,
      },
      risks: {
        total: project.risks?.length ?? 0,
        high:
          project.risks?.filter(
            (r: { level: string }) =>
              r.level === "high" || r.level === "critical"
          )?.length ?? 0,
      },
      tasks: {
        total: project.tasks?.length ?? 0,
        done:
          project.tasks?.filter((t: { status: string }) => t.status === "done")
            ?.length ?? 0,
      },
      tests: {
        total: project.tests?.length ?? 0,
        passed:
          project.tests?.filter(
            (t: { status: string }) => t.status === "passed"
          )?.length ?? 0,
        failed:
          project.tests?.filter(
            (t: { status: string }) => t.status === "failed"
          )?.length ?? 0,
      },
    };

    return jsonResponse({
      project_id: projectId,
      current_state: currentState,
      next_state: nextState,
      can_advance: blockers.length === 0 && nextState !== null,
      can_rollback: currentIndex > 0,
      gate_requirements: gateReq
        ? {
            description: gateReq.description,
            required_artifacts: gateReq.required_artifact_types,
            required_adr_count: gateReq.required_adr_count,
            can_accept_risk: gateReq.can_accept_risk,
          }
        : null,
      blockers,
      completed,
      stats,
      state_progress: {
        current_index: currentIndex,
        total_states: stateOrder.length,
        percentage: Math.round((currentIndex / (stateOrder.length - 1)) * 100),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
