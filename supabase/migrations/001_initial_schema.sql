-- Blueprint OS - Database Schema
-- Sprint 1: Initial Schema Migration
-- Supabase/PostgreSQL

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE project_state AS ENUM (
    'planning',
    'research', 
  'decisions_locked',
    'building',
    'testing',
    'ready_to_ship',
    'live'
  );

CREATE TYPE artifact_type AS ENUM (
    'prd',
    'technical_spec',
    'architecture_diagram',
    'user_stories',
    'wireframes',
    'api_spec',
    'other'
  );

CREATE TYPE adr_status AS ENUM (
    'draft',
    'proposed',
    'accepted',
    'locked',
    'deprecated',
    'superseded'
  );

CREATE TYPE risk_category AS ENUM (
    'technical',
    'business',
    'security',
    'legal',
    'operational'
  );

CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );

CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'done'
  );

CREATE TYPE test_status AS ENUM (
    'pending',
    'passed',
    'failed'
  );

CREATE TYPE event_type AS ENUM (
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

CREATE TYPE entity_type AS ENUM (
    'project',
    'artifact',
    'topic',
    'adr',
    'risk',
    'task',
    'test',
    'assumption'
  );

CREATE TYPE skill_level AS ENUM (
    'none',
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  );

CREATE TYPE member_role AS ENUM (
    'owner',
    'admin',
    'editor',
    'viewer'
  );

CREATE TYPE assumption_status AS ENUM (
    'valid',
    'invalid',
    'unverified'
  );

-- ================================================
-- TABLES
-- ================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Apps (top-level container)
CREATE TABLE public.apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Projects
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    current_state project_state DEFAULT 'planning' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Project Members
CREATE TABLE public.project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role member_role DEFAULT 'viewer' NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, user_id)
  );

-- Artifacts
CREATE TABLE public.artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    artifact_type artifact_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Topics (Research Items)
CREATE TABLE public.topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    research_notes TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'researching', 'resolved')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Topic References
CREATE TABLE public.topic_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
    added_by_ai BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- ADRs (Architecture Decision Records)
CREATE TABLE public.adrs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    consequences TEXT,
    status adr_status DEFAULT 'draft' NOT NULL,
    decision_date DATE DEFAULT CURRENT_DATE,
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Risks
CREATE TABLE public.risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category risk_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    level risk_level NOT NULL,
    mitigation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Assumptions
CREATE TABLE public.assumptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    description TEXT NOT NULL,
    status assumption_status DEFAULT 'unverified' NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Tasks
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo' NOT NULL,
    depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    blocked_reason TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Tests
CREATE TABLE public.tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('unit', 'integration', 'e2e', 'manual')),
    title TEXT NOT NULL,
    description TEXT,
    expected_result TEXT,
    actual_result TEXT,
    status test_status DEFAULT 'pending' NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Activity Log
CREATE TABLE public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type event_type NOT NULL,
    entity_type entity_type,
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
CREATE TABLE public.project_gates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    from_state project_state NOT NULL,
    to_state project_state NOT NULL,
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
CREATE TABLE public.quick_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
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
CREATE TABLE public.skills_assessment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    skill_name TEXT NOT NULL,
    current_level skill_level DEFAULT 'none' NOT NULL,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, skill_name)
  );

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_projects_app_id ON public.projects(app_id);
CREATE INDEX idx_projects_state ON public.projects(current_state);
CREATE INDEX idx_artifacts_project_id ON public.artifacts(project_id);
CREATE INDEX idx_topics_project_id ON public.topics(project_id);
CREATE INDEX idx_adrs_project_id ON public.adrs(project_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tests_project_id ON public.tests(project_id);
CREATE INDEX idx_activity_log_project_id ON public.activity_log(project_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_assessment ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Apps policies
CREATE POLICY "Users can view their own apps" ON public.apps
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create apps" ON public.apps
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own apps" ON public.apps
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own apps" ON public.apps
  FOR DELETE USING (owner_id = auth.uid());

-- Projects policies (based on membership)
CREATE POLICY "Project members can view projects" ON public.projects
  FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.apps a
        WHERE a.id = projects.app_id AND a.owner_id = auth.uid()
      )
    );

-- ================================================
-- TRIGGERS
-- ================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create quick_stats for new project
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.quick_stats (project_id) VALUES (NEW.id);

  -- Add owner as project member
  INSERT INTO public.project_members (project_id, user_id, role, accepted_at)
  SELECT NEW.id, a.owner_id, 'owner', NOW()
  FROM public.apps a WHERE a.id = NEW.app_id;

  -- Log activity
  INSERT INTO public.activity_log (project_id, user_id, event_type, entity_type, entity_id, description)
  SELECT NEW.id, a.owner_id, 'created', 'project', NEW.id, 'Project created: ' || NEW.name
  FROM public.apps a WHERE a.id = NEW.app_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ================================================
-- END OF MIGRATION
-- ================================================
