import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const taskId = url.searchParams.get("task_id");

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    if (!taskId) {
      return errorResponse("task_id is required");
    }

    // Get task with dependency info
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*, depends_on:depends_on_task_id(*)")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return errorResponse("Task not found", 404);
    }

    const blockers: string[] = [];
    const warnings: string[] = [];

    // Check if already done or in progress
    if (task.status === "done") {
      return jsonResponse({
        task_id: taskId,
        can_start: false,
        reason: "Task is already completed",
        blockers: [],
        warnings: [],
      });
    }

    if (task.status === "in_progress") {
      return jsonResponse({
        task_id: taskId,
        can_start: false,
        reason: "Task is already in progress",
        blockers: [],
        warnings: [],
      });
    }

    // Check blocking task
    if (task.depends_on_task_id && task.depends_on) {
      const blockingTask = task.depends_on as {
        id: string;
        title: string;
        status: string;
      };

      if (blockingTask.status !== "done") {
        blockers.push(
          `Blocked by task "${blockingTask.title}" (status: ${blockingTask.status})`
        );
      }
    }

    // Check if task is explicitly blocked
    if (task.status === "blocked") {
      blockers.push(task.blocked_reason || "Task is marked as blocked");
    }

    // Get project state for additional context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("current_state")
      .eq("id", task.project_id)
      .single();

    if (!projectError && project) {
      // Add warnings based on project state
      if (project.current_state === "planning") {
        warnings.push("Project is still in planning phase");
      }
      if (project.current_state === "live") {
        warnings.push("Project is already live - ensure changes are tested");
      }
    }

    // Check if task is assigned
    if (!task.assigned_to) {
      warnings.push("Task is not assigned to anyone");
    }

    return jsonResponse({
      task_id: taskId,
      task_title: task.title,
      task_status: task.status,
      can_start: blockers.length === 0,
      blockers,
      warnings,
      depends_on: task.depends_on
        ? {
            id: (task.depends_on as { id: string }).id,
            title: (task.depends_on as { title: string }).title,
            status: (task.depends_on as { status: string }).status,
          }
        : null,
      assigned_to: task.assigned_to,
      project_state: project?.current_state,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
