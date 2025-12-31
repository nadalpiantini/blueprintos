import { createSupabaseClient, createServiceClient } from "shared/supabase.ts";
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
}

const defaultGateRequirements: GateRequirements[] = [
  {
    from_state: "planning",
    to_state: "research",
    required_artifact_types: ["prd"],
    required_adr_count: 0,
    can_accept_risk: true,
  },
  {
    from_state: "research",
    to_state: "decisions_locked",
    required_artifact_types: ["technical_spec"],
    required_adr_count: 1,
    can_accept_risk: false,
  },
  {
    from_state: "decisions_locked",
    to_state: "building",
    required_artifact_types: ["architecture_diagram"],
    required_adr_count: 0,
    can_accept_risk: false,
  },
  {
    from_state: "building",
    to_state: "testing",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: true,
  },
  {
    from_state: "testing",
    to_state: "ready_to_ship",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: false,
  },
  {
    from_state: "ready_to_ship",
    to_state: "live",
    required_artifact_types: [],
    required_adr_count: 0,
    can_accept_risk: false,
  },
];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createSupabaseClient(req);
  const serviceClient = createServiceClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { project_id, force } = body;

    if (!project_id) {
      return errorResponse("project_id is required");
    }

    // Get current project state
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, artifacts(*), adrs(*), risks(*)")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found", 404);
    }

    const currentState = project.current_state as ProjectState;
    const currentIndex = stateOrder.indexOf(currentState);

    if (currentIndex === stateOrder.length - 1) {
      return errorResponse("Project is already at final state");
    }

    const nextState = stateOrder[currentIndex + 1];

    // Check gate requirements
    const gateReq = defaultGateRequirements.find(
      (g) => g.from_state === currentState && g.to_state === nextState
    );

    if (gateReq && !force) {
      const blockers: string[] = [];

      // Check required artifacts
      for (const artifactType of gateReq.required_artifact_types) {
        const hasArtifact = project.artifacts?.some(
          (a: { artifact_type: string }) => a.artifact_type === artifactType
        );
        if (!hasArtifact) {
          blockers.push(`Missing required artifact: ${artifactType}`);
        }
      }

      // Check required ADR count
      const lockedAdrs =
        project.adrs?.filter(
          (a: { status: string }) =>
            a.status === "accepted" || a.status === "locked"
        )?.length ?? 0;
      if (lockedAdrs < gateReq.required_adr_count) {
        blockers.push(
          `Need at least ${gateReq.required_adr_count} locked/accepted ADRs (have ${lockedAdrs})`
        );
      }

      // Check high-risk items
      if (!gateReq.can_accept_risk) {
        const highRisks =
          project.risks?.filter(
            (r: { level: string }) =>
              r.level === "high" || r.level === "critical"
          )?.length ?? 0;
        if (highRisks > 0) {
          blockers.push(
            `Cannot advance with ${highRisks} high/critical risks unmitigated`
          );
        }
      }

      if (blockers.length > 0) {
        return jsonResponse(
          {
            success: false,
            blockers,
            can_force: true,
          },
          400
        );
      }
    }

    // Update project state
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({ current_state: nextState })
      .eq("id", project_id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(updateError.message);
    }

    // Log activity
    await serviceClient.from("activity_log").insert({
      project_id,
      user_id: user.id,
      event_type: "state_changed",
      entity_type: "project",
      entity_id: project_id,
      description: `Project advanced from ${currentState} to ${nextState}`,
      metadata: { from_state: currentState, to_state: nextState, forced: force },
    });

    // Update gate status
    await serviceClient
      .from("project_gates")
      .upsert({
        project_id,
        from_state: currentState,
        to_state: nextState,
        gate_passed: true,
        passed_at: new Date().toISOString(),
      });

    return jsonResponse({
      success: true,
      project: updatedProject,
      previous_state: currentState,
      new_state: nextState,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
