-- ==============================================================================
-- ORYVA AI SUPPLY PLANNING WORKBENCH - COMPLETE SUPABASE SCHEMA
-- Supports Clerk Authentication & 3rd-Party User IDs
-- Paste and Run in Supabase SQL Editor: https://supabase.com/dashboard/project/prwvauiebihaugutsnlh/sql/new
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS & MEMBERSHIP
CREATE TABLE IF NOT EXISTS public.organizations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  join_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_by text NOT NULL DEFAULT 'planner',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_members (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Planner',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. WORKFLOW TABLES
CREATE TABLE IF NOT EXISTS public.shortage_status (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shortage_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN','MITIGATING','RESOLVED')),
  updated_by text NOT NULL DEFAULT 'planner',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, shortage_id)
);

CREATE TABLE IF NOT EXISTS public.shortage_comments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shortage_id text NOT NULL,
  author_id text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_shortage ON public.shortage_comments(org_id, shortage_id, created_at);

CREATE TABLE IF NOT EXISTS public.mitigation_reviews (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mitigation_id text NOT NULL,
  shortage_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 500),
  decided_by text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, mitigation_id)
);

CREATE TABLE IF NOT EXISTS public.saved_scenarios (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  sku_id text NOT NULL,
  location_id text NOT NULL,
  params jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scenarios_org ON public.saved_scenarios(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  action text NOT NULL,
  entity_id text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_org ON public.activity_log(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.org_datasets (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  row_count int NOT NULL,
  uploaded_by text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, kind)
);

-- 4. RELATIONAL PLANNING TABLES
CREATE TABLE IF NOT EXISTS public.plan_locations (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id text NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  PRIMARY KEY (org_id, location_id)
);

CREATE TABLE IF NOT EXISTS public.plan_suppliers (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id text NOT NULL,
  name text NOT NULL,
  reliability_score numeric(4,2) NOT NULL DEFAULT 0.95,
  capacity_per_week integer NOT NULL DEFAULT 1000,
  PRIMARY KEY (org_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS public.plan_skus (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku_id text NOT NULL,
  description text NOT NULL,
  uom text NOT NULL,
  PRIMARY KEY (org_id, sku_id)
);

CREATE TABLE IF NOT EXISTS public.plan_sku_substitutes (
  org_id text NOT NULL,
  sku_id text NOT NULL,
  substitute_sku_id text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  approved_on date,
  PRIMARY KEY (org_id, sku_id, substitute_sku_id)
);

CREATE TABLE IF NOT EXISTS public.plan_bom (
  org_id text NOT NULL,
  parent_sku_id text NOT NULL,
  component_sku_id text NOT NULL,
  qty_per_parent numeric NOT NULL DEFAULT 1,
  uom text NOT NULL,
  PRIMARY KEY (org_id, parent_sku_id, component_sku_id)
);

CREATE TABLE IF NOT EXISTS public.plan_forecast_demand (
  org_id text NOT NULL,
  demand_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  week smallint NOT NULL,
  forecast_qty integer NOT NULL,
  is_spike boolean NOT NULL DEFAULT false,
  PRIMARY KEY (org_id, demand_id)
);

CREATE TABLE IF NOT EXISTS public.plan_inventory (
  org_id text NOT NULL,
  inventory_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  on_hand_qty integer NOT NULL,
  as_of_date date NOT NULL,
  PRIMARY KEY (org_id, inventory_id)
);

CREATE TABLE IF NOT EXISTS public.plan_supplier_capacity (
  org_id text NOT NULL,
  capacity_id text NOT NULL,
  supplier_id text NOT NULL,
  sku_id text NOT NULL,
  capacity_per_week integer NOT NULL,
  min_order_qty integer NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  PRIMARY KEY (org_id, capacity_id)
);

CREATE TABLE IF NOT EXISTS public.plan_lead_times (
  org_id text NOT NULL,
  lead_time_id text NOT NULL,
  supplier_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  lead_time_days integer NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  PRIMARY KEY (org_id, lead_time_id)
);

CREATE TABLE IF NOT EXISTS public.plan_purchase_orders (
  org_id text NOT NULL,
  po_id text NOT NULL,
  supplier_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  ordered_qty integer NOT NULL,
  uom text NOT NULL,
  order_date date NOT NULL,
  promised_date date NOT NULL,
  actual_receipt_date date,
  status text NOT NULL,
  transport_delay_days integer NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, po_id)
);

CREATE TABLE IF NOT EXISTS public.plan_po_events (
  org_id text NOT NULL,
  event_id text NOT NULL,
  po_id text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  occurred_on date NOT NULL,
  actor_role text NOT NULL,
  PRIMARY KEY (org_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.plan_production_plans (
  org_id text NOT NULL,
  plan_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  week smallint NOT NULL,
  planned_qty integer NOT NULL,
  capacity_qty integer NOT NULL,
  status text NOT NULL,
  PRIMARY KEY (org_id, plan_id)
);

CREATE TABLE IF NOT EXISTS public.plan_shortages (
  org_id text NOT NULL,
  shortage_id text NOT NULL,
  sku_id text NOT NULL,
  location_id text NOT NULL,
  week smallint NOT NULL,
  shortage_qty integer NOT NULL,
  cause_code text NOT NULL,
  priority_score numeric(6,2) NOT NULL,
  priority_components jsonb NOT NULL,
  lead_time_basis_days integer NOT NULL,
  status text NOT NULL,
  demand_id text NOT NULL,
  supplier_id text NOT NULL,
  PRIMARY KEY (org_id, shortage_id)
);

CREATE TABLE IF NOT EXISTS public.plan_shortage_po_refs (
  org_id text NOT NULL,
  shortage_id text NOT NULL,
  po_id text NOT NULL,
  PRIMARY KEY (org_id, shortage_id, po_id)
);

CREATE TABLE IF NOT EXISTS public.plan_shortage_events (
  org_id text NOT NULL,
  event_id text NOT NULL,
  shortage_id text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  occurred_on date NOT NULL,
  actor_role text NOT NULL,
  PRIMARY KEY (org_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.plan_mitigation_options (
  org_id text NOT NULL,
  mitigation_id text NOT NULL,
  shortage_id text NOT NULL,
  type text NOT NULL,
  cost_usd numeric(14,2) NOT NULL,
  lead_time_days integer NOT NULL,
  recovered_units integer NOT NULL,
  service_level_after numeric(6,4) NOT NULL,
  policy_compliant boolean NOT NULL,
  policy_notes text NOT NULL DEFAULT '',
  PRIMARY KEY (org_id, mitigation_id)
);

CREATE TABLE IF NOT EXISTS public.plan_ground_truth (
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  record_ref text NOT NULL,
  expected_detection text NOT NULL,
  PRIMARY KEY (org_id, issue_type, record_ref)
);

CREATE TABLE IF NOT EXISTS public.plan_generation_runs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  seed integer NOT NULL,
  scale text NOT NULL,
  row_counts jsonb NOT NULL,
  checksums jsonb NOT NULL,
  detection jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. SEED DEFAULT DEMO ORGANIZATION
INSERT INTO public.organizations (id, name, join_code, created_by)
VALUES ('org_northwind_default', 'Northwind Supply Chain', 'NW-SUPPLY-2026', 'system')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, display_name)
VALUES
  ('usr_clerk_planner_demo_01', 'Alex Vance (Lead Planner)'),
  ('usr_demo_02', 'Sarah Jenkins (Supply Chain Dir)'),
  ('usr_demo_03', 'David Chen (Procurement Specialist)')
ON CONFLICT (id) DO NOTHING;

-- 6. GRANT PERMISSIONS & ROW LEVEL SECURITY
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations', 'org_members', 'profiles', 'shortage_status', 'shortage_comments',
    'mitigation_reviews', 'saved_scenarios', 'activity_log', 'org_datasets',
    'plan_locations', 'plan_suppliers', 'plan_skus', 'plan_sku_substitutes',
    'plan_bom', 'plan_forecast_demand', 'plan_inventory', 'plan_supplier_capacity',
    'plan_lead_times', 'plan_purchase_orders', 'plan_po_events', 'plan_production_plans',
    'plan_shortages', 'plan_shortage_po_refs', 'plan_shortage_events',
    'plan_mitigation_options', 'plan_ground_truth', 'plan_generation_runs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated, service_role;', tbl);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'allow_all_workbench', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', 'allow_all_workbench', tbl);
  END LOOP;
END $$;
