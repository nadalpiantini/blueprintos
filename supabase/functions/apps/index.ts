import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const appId = url.searchParams.get("id");

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
        if (appId) {
          const { data, error } = await supabase
            .from("apps")
            .select("*, projects(*)")
            .eq("id", appId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        const { data, error } = await supabase
          .from("apps")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();
        const { data, error } = await supabase
          .from("apps")
          .insert({
            owner_id: user.id,
            name: body.name,
            description: body.description,
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!appId) return errorResponse("App ID required");

        const body = await req.json();
        const { data, error } = await supabase
          .from("apps")
          .update({
            name: body.name,
            description: body.description,
          })
          .eq("id", appId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!appId) return errorResponse("App ID required");

        const { error } = await supabase.from("apps").delete().eq("id", appId);

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
