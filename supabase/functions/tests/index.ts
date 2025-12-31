import { createSupabaseClient } from "shared/supabase.ts";
import { handleCors, jsonResponse, errorResponse } from "shared/cors.ts";

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseClient(req);
  const url = new URL(req.url);
  const testId = url.searchParams.get("id");
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
        if (testId) {
          const { data, error } = await supabase
            .from("tests")
            .select("*")
            .eq("id", testId)
            .single();

          if (error) return errorResponse(error.message);
          return jsonResponse(data);
        }

        if (!projectId) {
          return errorResponse("project_id is required");
        }

        const { data, error } = await supabase
          .from("tests")
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
          .from("tests")
          .insert({
            project_id: body.project_id,
            test_type: body.test_type,
            title: body.title,
            description: body.description,
            expected_result: body.expected_result,
            status: "pending",
          })
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data, 201);
      }

      case "PUT": {
        if (!testId) return errorResponse("Test ID required");

        const body = await req.json();
        const updateData: Record<string, unknown> = {
          test_type: body.test_type,
          title: body.title,
          description: body.description,
          expected_result: body.expected_result,
          actual_result: body.actual_result,
          status: body.status,
        };

        if (body.status === "passed" || body.status === "failed") {
          updateData.executed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from("tests")
          .update(updateData)
          .eq("id", testId)
          .select()
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse(data);
      }

      case "DELETE": {
        if (!testId) return errorResponse("Test ID required");

        const { error } = await supabase
          .from("tests")
          .delete()
          .eq("id", testId);

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
