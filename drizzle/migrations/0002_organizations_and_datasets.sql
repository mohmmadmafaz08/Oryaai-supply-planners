CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  join_code text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.org_members (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX ON public.org_members (user_id);

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id = _org AND user_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_org_owner(_org uuid, _user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id = _org AND user_id = _user AND role = 'owner')
$$;

GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read org" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id, auth.uid()));
CREATE POLICY "owners update org" ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_owner(id, auth.uid())) WITH CHECK (public.is_org_owner(id, auth.uid()));
CREATE POLICY "members read members" ON public.org_members FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "leave or owner removes" ON public.org_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_org_owner(org_id, auth.uid()));

-- Org creation and joining go through these functions so membership rows are never client-written.
CREATE OR REPLACE FUNCTION public.create_organization(_name text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF char_length(trim(_name)) < 2 OR char_length(trim(_name)) > 80 THEN RAISE EXCEPTION 'Name must be 2-80 characters'; END IF;
  INSERT INTO public.organizations (name, created_by) VALUES (trim(_name), auth.uid()) RETURNING id INTO _id;
  INSERT INTO public.org_members (org_id, user_id, role) VALUES (_id, auth.uid(), 'owner');
  RETURN _id;
END $$;
CREATE OR REPLACE FUNCTION public.join_organization(_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _id FROM public.organizations WHERE join_code = lower(trim(_code));
  IF _id IS NULL THEN RAISE EXCEPTION 'Invite code not found'; END IF;
  INSERT INTO public.org_members (org_id, user_id, role) VALUES (_id, auth.uid(), 'member') ON CONFLICT DO NOTHING;
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_organization(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.join_organization(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_organization(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_organization(text) TO authenticated;

CREATE TABLE public.org_datasets (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('skus','locations','suppliers','pab_weekly','forecast_demand','inventory','supplier_capacity','lead_times','purchase_orders','po_events','shortages','shortage_events','mitigations','sku_substitutes','production_plans','bom')),
  payload jsonb NOT NULL,
  row_count int NOT NULL,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_datasets TO authenticated;
GRANT ALL ON public.org_datasets TO service_role;
ALTER TABLE public.org_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read datasets" ON public.org_datasets FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "owners insert datasets" ON public.org_datasets FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid() AND public.is_org_owner(org_id, auth.uid()));
CREATE POLICY "owners update datasets" ON public.org_datasets FOR UPDATE TO authenticated USING (public.is_org_owner(org_id, auth.uid())) WITH CHECK (uploaded_by = auth.uid() AND public.is_org_owner(org_id, auth.uid()));
CREATE POLICY "owners delete datasets" ON public.org_datasets FOR DELETE TO authenticated USING (public.is_org_owner(org_id, auth.uid()));

CREATE TABLE public.shortage_status (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shortage_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN','MITIGATING','RESOLVED')),
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, shortage_id)
);
GRANT SELECT, INSERT, UPDATE ON public.shortage_status TO authenticated;
GRANT ALL ON public.shortage_status TO service_role;
ALTER TABLE public.shortage_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read status" ON public.shortage_status FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members insert status" ON public.shortage_status FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid() AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members update status" ON public.shortage_status FOR UPDATE TO authenticated USING (public.is_org_member(org_id, auth.uid())) WITH CHECK (updated_by = auth.uid() AND public.is_org_member(org_id, auth.uid()));

CREATE TABLE public.mitigation_reviews (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mitigation_id text NOT NULL,
  shortage_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 500),
  decided_by uuid NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, mitigation_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mitigation_reviews TO authenticated;
GRANT ALL ON public.mitigation_reviews TO service_role;
ALTER TABLE public.mitigation_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read reviews" ON public.mitigation_reviews FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "members insert review" ON public.mitigation_reviews FOR INSERT TO authenticated WITH CHECK (decided_by = auth.uid() AND public.is_org_member(org_id, auth.uid()));
CREATE POLICY "reviewer updates review" ON public.mitigation_reviews FOR UPDATE TO authenticated USING (decided_by = auth.uid()) WITH CHECK (decided_by = auth.uid());
CREATE POLICY "reviewer deletes review" ON public.mitigation_reviews FOR DELETE TO authenticated USING (decided_by = auth.uid());

ALTER TABLE public.shortage_comments ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.saved_scenarios ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.activity_log ADD COLUMN org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX ON public.shortage_comments (org_id, shortage_id);
CREATE INDEX ON public.activity_log (org_id, created_at DESC);

DROP POLICY "planners read comments" ON public.shortage_comments;
DROP POLICY "planner author insert comment" ON public.shortage_comments;
CREATE POLICY "members read comments" ON public.shortage_comments FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "member author insert comment" ON public.shortage_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.is_org_member(org_id, auth.uid()));

DROP POLICY "own scenarios insert" ON public.saved_scenarios;
CREATE POLICY "own scenarios insert in org" ON public.saved_scenarios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_org_member(org_id, auth.uid()));

DROP POLICY "planners read activity" ON public.activity_log;
DROP POLICY "planner self insert activity" ON public.activity_log;
CREATE POLICY "members read activity" ON public.activity_log FOR SELECT TO authenticated USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "member self insert activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND public.is_org_member(org_id, auth.uid()));

DROP POLICY "profiles readable by planners" ON public.profiles;
CREATE POLICY "profiles readable by org peers" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.org_members a JOIN public.org_members b ON a.org_id = b.org_id
    WHERE a.user_id = auth.uid() AND b.user_id = profiles.id
  )
);

-- Retire the pre-organization tables: no app access any more.
DROP POLICY "planners read workflow" ON public.shortage_workflow;
DROP POLICY "planners insert workflow" ON public.shortage_workflow;
DROP POLICY "planners update workflow" ON public.shortage_workflow;
DROP POLICY "planners read decisions" ON public.mitigation_decisions;
DROP POLICY "planners insert decisions" ON public.mitigation_decisions;
DROP POLICY "decider updates decision" ON public.mitigation_decisions;
DROP POLICY "decider deletes decision" ON public.mitigation_decisions;
COMMENT ON TABLE public.shortage_workflow IS 'DEPRECATED: replaced by shortage_status (org-scoped)';
COMMENT ON TABLE public.mitigation_decisions IS 'DEPRECATED: replaced by mitigation_reviews (org-scoped)';