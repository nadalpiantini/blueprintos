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
    const { project_id, reason } = body;

    if (!project_id) {
      return errorResponse("project_id is required");
    }

    if (!reason) {
      return errorResponse("reason is required for rollback");
    }

    // Get current project state
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return errorResponse("Project not found", 404);
    }

    const currentState = project.current_state as ProjectState;
    const currentIndex = stateOrder.indexOf(currentState);

    if (currentIndex === 0) {
      return errorResponse("Project is already at initial state");
    }

    const previousState = stateOrder[currentIndex - 1];

    // Check if rolling back from live state (needs confirmation)
    if (currentState === "live") {
      const confirmHeader = req.headers.get("X-Confirm-Rollback");
      if (confirmHeader !== "true") {
        return jsonResponse(
          {
            success: false,
            warning: "Rolling back from 'live' state requires confirmation",
            requires_confirmation: true,
          },
          400
        );
      }
    }

    // Update project state
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({ current_state: previousState })
      .eq("id", project_id)
      .select()
      .single();

    if (updateError) {
      return errorResponse(updateError.message);
    }

    // Log activity with rollback flag
    await serviceClient.from("activity_log").insert({
      project_id,
      user_id: user.id,
      event_type: "state_changed",
      entity_type: "project",
      entity_id: project_id,
      description: `Project rolled back from ${currentState} to ${previousState}`,
      metadata: {
        from_state: currentState,
        to_state: previousState,
        rollback_reason: reason,
      },
      is_rollback: true,
      rollback_reason: reason,
      severity: currentState === "live" ? "critical" : "warning",
    });

    return jsonResponse({
      success: true,
      project: updatedProject,
      previous_state: currentState,
      new_state: previousState,
      rollback_reason: reason,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
