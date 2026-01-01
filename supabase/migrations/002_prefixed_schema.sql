-- Blueprint OS - Database Schema with blueprintos_ prefix
-- Sprint 1: Initial Schema Migration (Prefixed)
-- Supabase/PostgreSQL

-- ================================================
-- ENUMS (with prefix)
-- ================================================

CREATE TYPE blueprintos_project_state AS ENUM (
    'planning',
    'research',
    'decisions_locked',
    'building',
    'testing',
    'ready_to_ship',
    'live'
);

CREATE TYPE blueprintos_artifact_type AS ENUM (
    'prd',
    'technical_spec',
    'architecture_diagram',
    'user_stories',
    'wireframes',
    'api_spec',
    'other'
);

CREATE TYPE blueprintos_adr_status AS ENUM (
    'draft',
    'proposed',
    'accepted',
    'locked',
    'deprecated',
    'superseded'
);

CREATE TYPE blueprintos_risk_category AS ENUM (
    'technical',
    'business',
    'security',
    'legal',
    'operational'
);

CREATE TYPE blueprintos_risk_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE blueprintos_task_status AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'done'
);

CREATE TYPE blueprintos_test_status AS ENUM (
    'pending',
    'passed',
    'failed'
);

CREATE TYPE blueprintos_event_type AS ENUM (
    'created',
    'updated',
    'deleted',
    'state_changed',
    'comment_added',
    'artifact_uploaded',
    'adr_locked',
    'task_completed',
    'test_result',
    'rollback'
);

CREATE TYPE blueprintos_entity_type AS ENUM (
    'project',
    'artifact',
    'topic',
    'adr',
    'risk',
    'task',
    'test',
    'assumption'
);

CREATE TYPE blueprintos_skill_level AS ENUM (
    'none',
    'beginner',
    'intermediate',
    'advanced',
    'expert'
);

CREATE TYPE blueprintos_member_role AS ENUM (
    'owner',
    'admin',
    'editor',
    'viewer'
);

CREATE TYPE blueprintos_assumption_status AS ENUM (
    'valid',
    'invalid',
    'unverified'
);

-- ================================================
-- TABLES (with prefix)
-- ================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.blueprintos_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps (top-level container)
CREATE TABLE public.blueprintos_apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.blueprintos_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE public.blueprintos_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID REFERENCES public.blueprintos_apps(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    current_state blueprintos_project_state DEFAULT 'planning' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members
CREATE TABLE public.blueprintos_project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role blueprintos_member_role DEFAULT 'viewer' NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, user_id)
);

-- Artifacts
CREATE TABLE public.blueprintos_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    artifact_type blueprintos_artifact_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics (Research Items)
CREATE TABLE public.blueprintos_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    research_notes TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'researching', 'resolved')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topic References
CREATE TABLE public.blueprintos_topic_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.blueprintos_topics(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
    added_by_ai BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADRs (Architecture Decision Records)
CREATE TABLE public.blueprintos_adrs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    consequences TEXT,
    status blueprintos_adr_status DEFAULT 'draft' NOT NULL,
    decision_date DATE DEFAULT CURRENT_DATE,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risks
CREATE TABLE public.blueprintos_risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    category blueprintos_risk_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    level blueprintos_risk_level NOT NULL,
    mitigation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assumptions
CREATE TABLE public.blueprintos_assumptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    entity_type blueprintos_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    description TEXT NOT NULL,
    status blueprintos_assumption_status DEFAULT 'unverified' NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.blueprintos_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status blueprintos_task_status DEFAULT 'todo' NOT NULL,
    depends_on_task_id UUID REFERENCES public.blueprintos_tasks(id) ON DELETE SET NULL,
    blocked_reason TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests
CREATE TABLE public.blueprintos_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('unit', 'integration', 'e2e', 'manual')),
    title TEXT NOT NULL,
    description TEXT,
    expected_result TEXT,
    actual_result TEXT,
    status blueprintos_test_status DEFAULT 'pending' NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log
CREATE TABLE public.blueprintos_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type blueprintos_event_type NOT NULL,
    entity_type blueprintos_entity_type,
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'ai')),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_rollback BOOLEAN DEFAULT FALSE,
    rollback_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Gates
CREATE TABLE public.blueprintos_project_gates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE NOT NULL,
    from_state blueprintos_project_state NOT NULL,
    to_state blueprintos_project_state NOT NULL,
    gate_passed BOOLEAN DEFAULT FALSE,
    passed_at TIMESTAMP WITH TIME ZONE,
    required_artifact_types TEXT[] DEFAULT '{}',
    required_adr_count INTEGER DEFAULT 0,
    can_accept_risk BOOLEAN DEFAULT FALSE,
    blocking_reason_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, from_state, to_state)
);

-- Quick Stats (cached/computed)
CREATE TABLE public.blueprintos_quick_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.blueprintos_projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    artifact_count INTEGER DEFAULT 0,
    topic_count INTEGER DEFAULT 0,
    resolved_topic_count INTEGER DEFAULT 0,
    adr_count INTEGER DEFAULT 0,
    locked_adr_count INTEGER DEFAULT 0,
    risk_count INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    task_count INTEGER DEFAULT 0,
    completed_task_count INTEGER DEFAULT 0,
    test_count INTEGER DEFAULT 0,
    passed_test_count INTEGER DEFAULT 0,
    failed_test_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills Assessment
CREATE TABLE public.blueprintos_skills_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_name TEXT NOT NULL,
    current_level blueprintos_skill_level DEFAULT 'none' NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, skill_name)
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_blueprintos_projects_app_id ON public.blueprintos_projects(app_id);
CREATE INDEX idx_blueprintos_projects_state ON public.blueprintos_projects(current_state);
CREATE INDEX idx_blueprintos_artifacts_project_id ON public.blueprintos_artifacts(project_id);
CREATE INDEX idx_blueprintos_topics_project_id ON public.blueprintos_topics(project_id);
CREATE INDEX idx_blueprintos_adrs_project_id ON public.blueprintos_adrs(project_id);
CREATE INDEX idx_blueprintos_tasks_project_id ON public.blueprintos_tasks(project_id);
CREATE INDEX idx_blueprintos_tests_project_id ON public.blueprintos_tests(project_id);
CREATE INDEX idx_blueprintos_activity_log_project_id ON public.blueprintos_activity_log(project_id);
CREATE INDEX idx_blueprintos_activity_log_created_at ON public.blueprintos_activity_log(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE public.blueprintos_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_topic_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_adrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_project_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_quick_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprintos_skills_assessment ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "blueprintos_users_view_own_profile" ON public.blueprintos_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "blueprintos_users_update_own_profile" ON public.blueprintos_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Apps policies
CREATE POLICY "blueprintos_users_view_own_apps" ON public.blueprintos_apps
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "blueprintos_users_create_apps" ON public.blueprintos_apps
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "blueprintos_users_update_own_apps" ON public.blueprintos_apps
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "blueprintos_users_delete_own_apps" ON public.blueprintos_apps
  FOR DELETE USING (owner_id = auth.uid());

-- Projects policies (based on membership)
CREATE POLICY "blueprintos_project_members_view" ON public.blueprintos_projects
  FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.blueprintos_project_members pm
        WHERE pm.project_id = blueprintos_projects.id AND pm.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.blueprintos_apps a
        WHERE a.id = blueprintos_projects.app_id AND a.owner_id = auth.uid()
      )
  );

-- ================================================
-- TRIGGERS
-- ================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.blueprintos_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.blueprintos_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER blueprintos_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_handle_new_user();

-- Auto-create quick_stats for new project
CREATE OR REPLACE FUNCTION public.blueprintos_handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.blueprintos_quick_stats (project_id) VALUES (NEW.id);

  -- Add owner as project member
  INSERT INTO public.blueprintos_project_members (project_id, user_id, role, accepted_at)
  SELECT NEW.id, a.owner_id, 'owner', NOW()
  FROM public.blueprintos_apps a WHERE a.id = NEW.app_id;

  -- Log activity
  INSERT INTO public.blueprintos_activity_log (project_id, user_id, event_type, entity_type, entity_id, description)
  SELECT NEW.id, a.owner_id, 'created', 'project', NEW.id, 'Project created: ' || NEW.name
  FROM public.blueprintos_apps a WHERE a.id = NEW.app_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER blueprintos_on_project_created
  AFTER INSERT ON public.blueprintos_projects
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_handle_new_project();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.blueprintos_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blueprintos_update_profiles_updated_at
  BEFORE UPDATE ON public.blueprintos_profiles
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_update_updated_at();

CREATE TRIGGER blueprintos_update_apps_updated_at
  BEFORE UPDATE ON public.blueprintos_apps
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_update_updated_at();

CREATE TRIGGER blueprintos_update_projects_updated_at
  BEFORE UPDATE ON public.blueprintos_projects
  FOR EACH ROW EXECUTE FUNCTION public.blueprintos_update_updated_at();

-- ================================================
-- END OF MIGRATION
-- ================================================
