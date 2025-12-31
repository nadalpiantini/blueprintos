import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const artifactId = url.searchParams.get("id");
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
        if (artifactId) {
          const { data, error } = await supabase
            .from("artifacts")
            .select("*")
            .eq("id", artifactId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("artifacts")
          .select("*")
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
          .from("artifacts")
          .insert({
            project_id: body.project_id,
            artifact_type: body.artifact_type,
            title: body.title,
            content: body.content,
            ai_generated: body.ai_generated || false,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!artifactId) return errorResponse("Artifact ID required");

        const body = await req.json();
        const { data, error } = await supabase
          .from("artifacts")
          .update({
            artifact_type: body.artifact_type,
            title: body.title,
            content: body.content,
            ai_generated: body.ai_generated,
          })
          .eq("id", artifactId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!artifactId) return errorResponse("Artifact ID required");

        const { error } = await supabase
          .from("artifacts")
          .delete()
          .eq("id", artifactId);

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
