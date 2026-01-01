import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface AIRequest {
  action: "generate_prd" | "generate_spec" | "research" | "chat" | "suggest_adr";
  project_id?: string;
  context?: string;
  prompt: string;
}

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  generate_prd: `Eres un Product Manager experto. Genera PRDs (Product Requirements Documents) claros y estructurados.
Incluye siempre:
- Resumen ejecutivo
- Problema a resolver
- Objetivos y métricas de éxito
- Usuarios objetivo
- Requerimientos funcionales
- Requerimientos no funcionales
- Criterios de aceptación
- Riesgos y mitigaciones
Responde en español.`,

  generate_spec: `Eres un Arquitecto de Software experto. Genera especificaciones técnicas detalladas.
Incluye siempre:
- Arquitectura propuesta
- Stack tecnológico recomendado
- Diseño de base de datos
- APIs y endpoints
- Consideraciones de seguridad
- Plan de implementación
- Estimaciones de esfuerzo
Responde en español.`,

  research: `Eres un Research Analyst experto en tecnología. Investiga y proporciona información detallada sobre temas técnicos.
- Presenta múltiples opciones cuando sea relevante
- Incluye pros y contras
- Cita fuentes o frameworks conocidos
- Sugiere mejores prácticas
Responde en español.`,

  suggest_adr: `Eres un Arquitecto de Software experto. Genera Architecture Decision Records (ADRs) bien estructurados.
Sigue el formato:
- Título
- Estado (propuesto/aceptado/deprecado)
- Contexto
- Decisión
- Consecuencias (positivas y negativas)
- Alternativas consideradas
Responde en español.`,

  chat: `Eres un asistente de desarrollo de software experto. Ayudas a los usuarios a construir SaaS y aplicaciones de manera metódica.
- Responde preguntas técnicas
- Sugiere mejores prácticas
- Ayuda con debugging
- Proporciona ejemplos de código cuando sea útil
Responde en español.`,
};

async function callDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  const baseUrl = Deno.env.get("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";
  const model = Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function getProjectContext(supabase: any, projectId: string): Promise<string> {
  const { data: project } = await supabase
    .from("blueprintos_projects")
    .select(`
      *,
      blueprintos_artifacts(*),
      blueprintos_topics(*),
      blueprintos_adrs(*)
    `)
    .eq("id", projectId)
    .single();

  if (!project) return "";

  let context = `Proyecto: ${project.name}\n`;
  context += `Descripción: ${project.description || "Sin descripción"}\n`;
  context += `Estado actual: ${project.current_state}\n\n`;

  if (project.blueprintos_artifacts?.length > 0) {
    context += "Artefactos existentes:\n";
    for (const artifact of project.blueprintos_artifacts) {
      context += `- ${artifact.artifact_type}: ${artifact.title}\n`;
    }
    context += "\n";
  }

  if (project.blueprintos_adrs?.length > 0) {
    context += "ADRs existentes:\n";
    for (const adr of project.blueprintos_adrs) {
      context += `- ${adr.title} (${adr.status})\n`;
    }
    context += "\n";
  }

  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AIRequest = await req.json();
    const { action, project_id, context: userContext, prompt } = body;

    if (!action || !prompt) {
      return new Response(
        JSON.stringify({ error: "action and prompt are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.chat;

    let fullContext = "";
    if (project_id) {
      fullContext = await getProjectContext(supabaseClient, project_id);
    }
    if (userContext) {
      fullContext += `\nContexto adicional:\n${userContext}\n`;
    }

    const messages: DeepSeekMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    if (fullContext) {
      messages.push({
        role: "user",
        content: `Contexto del proyecto:\n${fullContext}`,
      });
    }

    messages.push({ role: "user", content: prompt });

    const response = await callDeepSeek(messages);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        response,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
