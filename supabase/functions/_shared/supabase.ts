import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      apps: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          app_id: string;
          name: string;
          description: string | null;
          current_state: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          name: string;
          description?: string | null;
          current_state?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          current_state?: string;
        };
      };
      artifacts: {
        Row: {
          id: string;
          project_id: string;
          artifact_type: string;
          title: string;
          content: string | null;
          ai_generated: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          artifact_type: string;
          title: string;
          content?: string | null;
          ai_generated?: boolean;
          created_by?: string | null;
        };
        Update: {
          artifact_type?: string;
          title?: string;
          content?: string | null;
          ai_generated?: boolean;
        };
      };
      topics: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          question: string;
          research_notes: string | null;
          status: string;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          question: string;
          research_notes?: string | null;
          status?: string;
        };
        Update: {
          title?: string;
          question?: string;
          research_notes?: string | null;
          status?: string;
          resolved_at?: string | null;
        };
      };
      adrs: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          context: string;
          decision: string;
          consequences: string | null;
          status: string;
          decision_date: string;
          locked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          context: string;
          decision: string;
          consequences?: string | null;
          status?: string;
        };
        Update: {
          title?: string;
          context?: string;
          decision?: string;
          consequences?: string | null;
          status?: string;
          locked_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: string;
          depends_on_task_id: string | null;
          blocked_reason: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: string;
          depends_on_task_id?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: string;
          depends_on_task_id?: string | null;
          blocked_reason?: string | null;
          assigned_to?: string | null;
        };
      };
      tests: {
        Row: {
          id: string;
          project_id: string;
          test_type: string;
          title: string;
          description: string | null;
          expected_result: string | null;
          actual_result: string | null;
          status: string;
          executed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          test_type: string;
          title: string;
          description?: string | null;
          expected_result?: string | null;
          status?: string;
        };
        Update: {
          test_type?: string;
          title?: string;
          description?: string | null;
          expected_result?: string | null;
          actual_result?: string | null;
          status?: string;
          executed_at?: string | null;
        };
      };
      risks: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          title: string;
          description: string | null;
          level: string;
          mitigation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          title: string;
          description?: string | null;
          level: string;
          mitigation?: string | null;
        };
        Update: {
          category?: string;
          title?: string;
          description?: string | null;
          level?: string;
          mitigation?: string | null;
        };
      };
      activity_log: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          description: string | null;
          metadata: Record<string, unknown> | null;
          actor_type: string;
          severity: string;
          is_rollback: boolean;
          rollback_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          description?: string | null;
          metadata?: Record<string, unknown> | null;
          actor_type?: string;
          severity?: string;
          is_rollback?: boolean;
          rollback_reason?: string | null;
        };
        Update: never;
      };
    };
  };
};

export function createSupabaseClient(req: Request): SupabaseClient<Database> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const authHeader = req.headers.get("Authorization");

  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
