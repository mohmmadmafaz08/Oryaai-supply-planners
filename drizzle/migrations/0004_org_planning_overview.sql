CREATE OR REPLACE FUNCTION public.org_planning_overview(_org uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE WHEN NOT public.is_org_member(_org, auth.uid()) THEN NULL ELSE jsonb_build_object(
    'counts', jsonb_build_object(
      'skus', (SELECT count(*) FROM plan_skus WHERE org_id=_org),
      'locations', (SELECT count(*) FROM plan_locations WHERE org_id=_org),
      'suppliers', (SELECT count(*) FROM plan_suppliers WHERE org_id=_org),
      'demand_rows', (SELECT count(*) FROM plan_forecast_demand WHERE org_id=_org),
      'purchase_orders', (SELECT count(*) FROM plan_purchase_orders WHERE org_id=_org),
      'shortages', (SELECT count(*) FROM plan_shortages WHERE org_id=_org),
      'mitigations', (SELECT count(*) FROM plan_mitigation_options WHERE org_id=_org)),
    'total_demand', (SELECT coalesce(sum(forecast_qty),0) FROM plan_forecast_demand WHERE org_id=_org),
    'units_at_risk', (SELECT coalesce(sum(shortage_qty),0) FROM plan_shortages WHERE org_id=_org AND status<>'RESOLVED'),
    'open_shortages', (SELECT count(*) FROM plan_shortages WHERE org_id=_org AND status='OPEN'),
    'delayed_pos', (SELECT count(*) FROM plan_purchase_orders WHERE org_id=_org AND transport_delay_days>0),
    'with_compliant_mitigation', (SELECT count(DISTINCT shortage_id) FROM plan_mitigation_options WHERE org_id=_org AND policy_compliant),
    'by_cause', (SELECT coalesce(jsonb_agg(jsonb_build_object('cause',cause_code,'count',n,'units',u) ORDER BY u DESC),'[]') FROM (SELECT cause_code, count(*) n, sum(shortage_qty) u FROM plan_shortages WHERE org_id=_org GROUP BY 1) c),
    'by_week', (SELECT coalesce(jsonb_agg(jsonb_build_object('week',week,'units',u) ORDER BY week),'[]') FROM (SELECT week, sum(shortage_qty) u FROM plan_shortages WHERE org_id=_org GROUP BY 1) w),
    'top', (SELECT coalesce(jsonb_agg(t ORDER BY t.priority_score DESC, t.shortage_qty DESC),'[]') FROM (SELECT shortage_id, sku_id, location_id, week, shortage_qty, cause_code, priority_score, status FROM plan_shortages WHERE org_id=_org ORDER BY priority_score DESC, shortage_qty DESC LIMIT 10) t),
    'last_run', (SELECT to_jsonb(r) FROM (SELECT seed, scale, detection, row_counts, checksums, created_at FROM plan_generation_runs WHERE org_id=_org ORDER BY created_at DESC LIMIT 1) r)
  ) END
$$;
REVOKE ALL ON FUNCTION public.org_planning_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_planning_overview(uuid) TO authenticated;