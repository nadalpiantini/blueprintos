import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const riskId = url.searchParams.get("id");
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
        if (riskId) {
          const { data, error } = await supabase
            .from("risks")
            .select("*")
            .eq("id", riskId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("risks")
          .select("*")
          .eq("project_id", projectId)
          .order("level", { ascending: false });

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();

        if (!body.project_id) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("risks")
          .insert({
            project_id: body.project_id,
            category: body.category,
            title: body.title,
            description: body.description,
            level: body.level,
            mitigation: body.mitigation,
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!riskId) return errorResponse("Risk ID required");

        const body = await req.json();
        const { data, error } = await supabase
          .from("risks")
          .update({
            category: body.category,
            title: body.title,
            description: body.description,
            level: body.level,
            mitigation: body.mitigation,
          })
          .eq("id", riskId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!riskId) return errorResponse("Risk ID required");

        const { error } = await supabase
          .from("risks")
          .delete()
          .eq("id", riskId);

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
