CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Planner',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by team" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Planner'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.shortage_workflow (
  shortage_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('OPEN','MITIGATING','RESOLVED')),
  owner_id uuid,
  due_week int CHECK (due_week BETWEEN 1 AND 52),
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shortage_workflow TO authenticated;
GRANT ALL ON public.shortage_workflow TO service_role;
ALTER TABLE public.shortage_workflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read workflow" ON public.shortage_workflow FOR SELECT TO authenticated USING (true);
CREATE POLICY "team insert workflow" ON public.shortage_workflow FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid());
CREATE POLICY "team update workflow" ON public.shortage_workflow FOR UPDATE TO authenticated USING (true) WITH CHECK (updated_by = auth.uid());

CREATE TABLE public.shortage_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortage_id text NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.shortage_comments (shortage_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.shortage_comments TO authenticated;
GRANT ALL ON public.shortage_comments TO service_role;
ALTER TABLE public.shortage_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read comments" ON public.shortage_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "author insert comment" ON public.shortage_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete comment" ON public.shortage_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TABLE public.mitigation_decisions (
  mitigation_id text PRIMARY KEY,
  shortage_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 500),
  decided_by uuid NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mitigation_decisions TO authenticated;
GRANT ALL ON public.mitigation_decisions TO service_role;
ALTER TABLE public.mitigation_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read decisions" ON public.mitigation_decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "team insert decisions" ON public.mitigation_decisions FOR INSERT TO authenticated WITH CHECK (decided_by = auth.uid());
CREATE POLICY "team update decisions" ON public.mitigation_decisions FOR UPDATE TO authenticated USING (true) WITH CHECK (decided_by = auth.uid());
CREATE POLICY "team delete decisions" ON public.mitigation_decisions FOR DELETE TO authenticated USING (true);

CREATE TABLE public.saved_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  sku_id text NOT NULL,
  location_id text NOT NULL,
  params jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.saved_scenarios TO authenticated;
GRANT ALL ON public.saved_scenarios TO service_role;
ALTER TABLE public.saved_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scenarios read" ON public.saved_scenarios FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own scenarios insert" ON public.saved_scenarios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own scenarios delete" ON public.saved_scenarios FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_id text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity_log (created_at DESC);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team read activity" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "self insert activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());