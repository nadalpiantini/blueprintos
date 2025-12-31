import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const projectId = url.searchParams.get("id");
  const appId = url.searchParams.get("app_id");

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
        if (projectId) {
          const { data, error } = await supabase
            .from("projects")
            .select(
              `
              *,
              quick_stats(*),
              artifacts(count),
              topics(count),
              adrs(count),
              tasks(count),
              tests(count),
              risks(count)
            `
            )
            .eq("id", projectId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        let query = supabase
          .from("projects")
          .select("*, quick_stats(*)")
          .order("updated_at", { ascending: false });

        if (appId) {
          query = query.eq("app_id", appId);
        }

        const { data, error } = await query;

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();

        if (!body.app_id) {
          return errorResponse("app_id is required");
        }

        const { data, error } = await supabase
          .from("projects")
          .insert({
            app_id: body.app_id,
            name: body.name,
            description: body.description,
            current_state: body.current_state || "planning",
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!projectId) return errorResponse("Project ID required");

        const body = await req.json();
        const { data, error } = await supabase
          .from("projects")
          .update({
            name: body.name,
            description: body.description,
            current_state: body.current_state,
          })
          .eq("id", projectId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!projectId) return errorResponse("Project ID required");

        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId);

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
