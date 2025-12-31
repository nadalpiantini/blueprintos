export type ProjectState =
  | 'planning'
  | 'research'
  | 'decisions_locked'
  | 'building'
  | 'testing'
  | 'ready_to_ship'
  | 'live'

export type ArtifactType =
  | 'prd'
  | 'technical_spec'
  | 'architecture_diagram'
  | 'user_stories'
  | 'wireframes'
  | 'api_spec'
  | 'other'

export type AdrStatus = 'draft' | 'proposed' | 'accepted' | 'locked' | 'deprecated' | 'superseded'
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'
export type TestStatus = 'pending' | 'passed' | 'failed'
export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      apps: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          app_id: string
          name: string
          description: string | null
          current_state: ProjectState
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          app_id: string
          name: string
          description?: string | null
          current_state?: ProjectState
        }
        Update: {
          name?: string
          description?: string | null
          current_state?: ProjectState
        }
      }
      artifacts: {
        Row: {
          id: string
          project_id: string
          artifact_type: ArtifactType
          title: string
          content: string | null
          ai_generated: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          artifact_type: ArtifactType
          title: string
          content?: string | null
          ai_generated?: boolean
          created_by?: string | null
        }
        Update: {
          title?: string
          content?: string | null
        }
      }
      topics: {
        Row: {
          id: string
          project_id: string
          title: string
          question: string
          research_notes: string | null
          status: 'open' | 'researching' | 'resolved'
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          question: string
          research_notes?: string | null
          status?: 'open' | 'researching' | 'resolved'
        }
        Update: {
          title?: string
          question?: string
          research_notes?: string | null
          status?: 'open' | 'researching' | 'resolved'
          resolved_at?: string | null
        }
      }
      adrs: {
        Row: {
          id: string
          project_id: string
          title: string
          context: string
          decision: string
          consequences: string | null
          status: AdrStatus
          decision_date: string
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          context: string
          decision: string
          consequences?: string | null
          status?: AdrStatus
        }
        Update: {
          title?: string
          context?: string
          decision?: string
          consequences?: string | null
          status?: AdrStatus
          locked_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: TaskStatus
          depends_on_task_id: string | null
          blocked_reason: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: TaskStatus
          depends_on_task_id?: string | null
          assigned_to?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          status?: TaskStatus
          blocked_reason?: string | null
          assigned_to?: string | null
        }
      }
      tests: {
        Row: {
          id: string
          project_id: string
          test_type: 'unit' | 'integration' | 'e2e' | 'manual'
          title: string
          description: string | null
          expected_result: string | null
          actual_result: string | null
          status: TestStatus
          executed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          test_type: 'unit' | 'integration' | 'e2e' | 'manual'
          title: string
          description?: string | null
          expected_result?: string | null
          status?: TestStatus
        }
        Update: {
          title?: string
          description?: string | null
          expected_result?: string | null
          actual_result?: string | null
          status?: TestStatus
          executed_at?: string | null
        }
      }
      quick_stats: {
        Row: {
          id: string
          project_id: string
          artifact_count: number
          topic_count: number
          resolved_topic_count: number
          adr_count: number
          locked_adr_count: number
          risk_count: number
          high_risk_count: number
          task_count: number
          completed_task_count: number
          test_count: number
          passed_test_count: number
          failed_test_count: number
          last_activity_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
        }
        Update: {
          artifact_count?: number
          topic_count?: number
          resolved_topic_count?: number
          adr_count?: number
          locked_adr_count?: number
          risk_count?: number
          high_risk_count?: number
          task_count?: number
          completed_task_count?: number
          test_count?: number
          passed_test_count?: number
          failed_test_count?: number
          last_activity_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
