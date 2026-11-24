CREATE TYPE public.app_role AS ENUM ('planner', 'admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

INSERT INTO public.user_roles (user_id, role) SELECT id, 'planner' FROM auth.users ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Planner'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'planner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP POLICY "team read decisions" ON public.mitigation_decisions;
DROP POLICY "team update decisions" ON public.mitigation_decisions;
DROP POLICY "team delete decisions" ON public.mitigation_decisions;
DROP POLICY "team insert decisions" ON public.mitigation_decisions;
CREATE POLICY "planners read decisions" ON public.mitigation_decisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'planner'));
CREATE POLICY "planners insert decisions" ON public.mitigation_decisions FOR INSERT TO authenticated WITH CHECK (decided_by = auth.uid() AND public.has_role(auth.uid(), 'planner'));
CREATE POLICY "decider updates decision" ON public.mitigation_decisions FOR UPDATE TO authenticated USING (decided_by = auth.uid()) WITH CHECK (decided_by = auth.uid());
CREATE POLICY "decider deletes decision" ON public.mitigation_decisions FOR DELETE TO authenticated USING (decided_by = auth.uid());

DROP POLICY "team read workflow" ON public.shortage_workflow;
DROP POLICY "team update workflow" ON public.shortage_workflow;
DROP POLICY "team insert workflow" ON public.shortage_workflow;
CREATE POLICY "planners read workflow" ON public.shortage_workflow FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'planner'));
CREATE POLICY "planners insert workflow" ON public.shortage_workflow FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid() AND public.has_role(auth.uid(), 'planner'));
CREATE POLICY "planners update workflow" ON public.shortage_workflow FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'planner')) WITH CHECK (updated_by = auth.uid() AND public.has_role(auth.uid(), 'planner'));

DROP POLICY "team read comments" ON public.shortage_comments;
DROP POLICY "author insert comment" ON public.shortage_comments;
CREATE POLICY "planners read comments" ON public.shortage_comments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'planner'));
CREATE POLICY "planner author insert comment" ON public.shortage_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'planner'));

DROP POLICY "team read activity" ON public.activity_log;
DROP POLICY "self insert activity" ON public.activity_log;
CREATE POLICY "planners read activity" ON public.activity_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'planner'));
CREATE POLICY "planner self insert activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND public.has_role(auth.uid(), 'planner'));

DROP POLICY "profiles readable by team" ON public.profiles;
CREATE POLICY "profiles readable by planners" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'planner'));