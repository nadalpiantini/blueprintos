import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const topicId = url.searchParams.get("id");
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
        if (topicId) {
          const { data, error } = await supabase
            .from("topics")
            .select("*, topic_references(*)")
            .eq("id", topicId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("topics")
          .select("*, topic_references(count)")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();

        if (!body.project_id) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("topics")
          .insert({
            project_id: body.project_id,
            title: body.title,
            question: body.question,
            research_notes: body.research_notes,
            status: body.status || "open",
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!topicId) return errorResponse("Topic ID required");

        const body = await req.json();
        const updateData: Record<string, unknown> = {
          title: body.title,
          question: body.question,
          research_notes: body.research_notes,
          status: body.status,
        };

        if (body.status === "resolved") {
          updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from("topics")
          .update(updateData)
          .eq("id", topicId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!topicId) return errorResponse("Topic ID required");

        const { error } = await supabase
          .from("topics")
          .delete()
          .eq("id", topicId);

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
