import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ProjectState =
  | "planning"
  | "research"
  | "decisions_locked"
  | "building"
  | "testing"
  | "ready_to_ship"
  | "live";

export type ArtifactType =
  | "prd"
  | "technical_spec"
  | "architecture_diagram"
  | "user_stories"
  | "wireframes"
  | "api_spec"
  | "other";

export type ADRStatus =
  | "draft"
  | "proposed"
  | "accepted"
  | "locked"
  | "deprecated"
  | "superseded";

export type RiskCategory =
  | "technical"
  | "business"
  | "security"
  | "legal"
  | "operational";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type TestStatus = "pending" | "passed" | "failed";

export interface App {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  app_id: string;
  name: string;
  description: string | null;
  current_state: ProjectState;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  artifact_type: ArtifactType;
  title: string;
  content: string | null;
  ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  project_id: string;
  title: string;
  question: string;
  research_notes: string | null;
  status: "open" | "researching" | "resolved";
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ADR {
  id: string;
  project_id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string | null;
  status: ADRStatus;
  decision_date: string;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  depends_on_task_id: string | null;
  blocked_reason: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  project_id: string;
  test_type: "unit" | "integration" | "e2e" | "manual";
  title: string;
  description: string | null;
  expected_result: string | null;
  actual_result: string | null;
  status: TestStatus;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Risk {
  id: string;
  project_id: string;
  category: RiskCategory;
  title: string;
  description: string | null;
  level: RiskLevel;
  mitigation: string | null;
  created_at: string;
  updated_at: string;
}
