import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const adrId = url.searchParams.get("id");
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
        if (adrId) {
          const { data, error } = await supabase
            .from("adrs")
            .select("*")
            .eq("id", adrId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("adrs")
          .select("*")
          .eq("project_id", projectId)
          .order("decision_date", { ascending: false });

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "POST": {
        const body = await req.json();

        if (!body.project_id) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("adrs")
          .insert({
            project_id: body.project_id,
            title: body.title,
            context: body.context,
            decision: body.decision,
            consequences: body.consequences,
            status: body.status || "draft",
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!adrId) return errorResponse("ADR ID required");

        const body = await req.json();

        // Check if ADR is locked
        const { data: existingAdr, error: fetchError } = await supabase
          .from("adrs")
          .select("status, locked_at")
          .eq("id", adrId)
          .single();

        if (fetchError) return errorResponse(fetchError.message);

        if (existingAdr?.status === "locked") {
          return errorResponse("Cannot modify locked ADR", 403);
        }

        const updateData: Record<string, unknown> = {
          title: body.title,
          context: body.context,
          decision: body.decision,
          consequences: body.consequences,
          status: body.status,
        };

        if (body.status === "locked") {
          updateData.locked_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from("adrs")
          .update(updateData)
          .eq("id", adrId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!adrId) return errorResponse("ADR ID required");

        // Check if ADR is locked before deletion
        const { data: existingAdr, error: fetchError } = await supabase
          .from("adrs")
          .select("status")
          .eq("id", adrId)
          .single();

        if (fetchError) return errorResponse(fetchError.message);

        if (existingAdr?.status === "locked") {
          return errorResponse("Cannot delete locked ADR", 403);
        }

        const { error } = await supabase.from("adrs").delete().eq("id", adrId);

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
