"use client";

import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase";

export type AIAction =
  | "generate_prd"
  | "generate_spec"
  | "research"
  | "chat"
  | "suggest_adr";

export interface AIRequest {
  action: AIAction;
  prompt: string;
  project_id?: string;
  context?: string;
}

export interface AIResponse {
  success: boolean;
  action: AIAction;
  response: string;
}

async function callAIAssistant(request: AIRequest): Promise<AIResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-assistant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "AI request failed");
  }

  return response.json();
}

export function useAI() {
  return useMutation({
    mutationFn: callAIAssistant,
  });
}

export function useGeneratePRD() {
  const mutation = useAI();

  return {
    ...mutation,
    generatePRD: (prompt: string, projectId?: string) =>
      mutation.mutateAsync({
        action: "generate_prd",
        prompt,
        project_id: projectId,
      }),
  };
}

export function useGenerateSpec() {
  const mutation = useAI();

  return {
    ...mutation,
    generateSpec: (prompt: string, projectId?: string) =>
      mutation.mutateAsync({
        action: "generate_spec",
        prompt,
        project_id: projectId,
      }),
  };
}

export function useResearch() {
  const mutation = useAI();

  return {
    ...mutation,
    research: (prompt: string, projectId?: string) =>
      mutation.mutateAsync({
        action: "research",
        prompt,
        project_id: projectId,
      }),
  };
}

export function useSuggestADR() {
  const mutation = useAI();

  return {
    ...mutation,
    suggestADR: (prompt: string, projectId?: string) =>
      mutation.mutateAsync({
        action: "suggest_adr",
        prompt,
        project_id: projectId,
      }),
  };
}

export function useChat() {
  const mutation = useAI();

  return {
    ...mutation,
    chat: (prompt: string, projectId?: string, context?: string) =>
      mutation.mutateAsync({
        action: "chat",
        prompt,
        project_id: projectId,
        context,
      }),
  };
}
