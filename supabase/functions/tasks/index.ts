import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const taskId = url.searchParams.get("id");
  const projectId = url.searchParams.get("project_id");

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    switch (req.method) {
      case "GET": {
        if (taskId) {
          const { data, error } = await supabase
            .from("tasks")
            .select("*, depends_on:depends_on_task_id(*)")
            .eq("id", taskId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();

        if (!body.project_id) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("tasks")
          .insert({
            project_id: body.project_id,
            title: body.title,
            description: body.description,
            status: body.status || "todo",
            depends_on_task_id: body.depends_on_task_id,
            assigned_to: body.assigned_to,
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!taskId) return errorResponse("Task ID required");

        const body = await req.json();

        // Check if blocking task is done if task has dependency
        if (body.status === "in_progress") {
          const { data: task, error: fetchError } = await supabase
            .from("tasks")
            .select("depends_on_task_id")
            .eq("id", taskId)
            .single();

          if (fetchError) return errorResponse(fetchError.message);

          if (task?.depends_on_task_id) {
            const { data: blockingTask, error: blockingError } = await supabase
              .from("tasks")
              .select("status")
              .eq("id", task.depends_on_task_id)
              .single();

            if (blockingError) return errorResponse(blockingError.message);

            if (blockingTask?.status !== "done") {
              return errorResponse(
                "Cannot start task: blocking task not completed",
                400
              );
            }
          }
        }

        const { data, error } = await supabase
          .from("tasks")
          .update({
            title: body.title,
            description: body.description,
            status: body.status,
            depends_on_task_id: body.depends_on_task_id,
            blocked_reason: body.blocked_reason,
            assigned_to: body.assigned_to,
          })
          .eq("id", taskId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!taskId) return errorResponse("Task ID required");

        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", taskId);

        if (error) return errorResponse(error.message);
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
