import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Mitigation, Shortage } from '@/data/schemas';
import { ShortageDetailSheet } from './ShortageDetailSheet';

const mockShortage: Shortage = {
  shortage_id: 'SHORT-2026-000001',
  sku_id: 'SKU-000001',
  location_id: 'LOC-NA-01',
  week: 12,
  shortage_qty: 600,
  cause_code: 'DEMAND_SPIKE',
  priority_score: 84.5,
  priority_components: {
    severity: 0.9,
    urgency: 0.85,
    service_impact: 0.8,
    supplier_risk: 0.75,
  },
  lead_time_basis_days: 14,
  status: 'OPEN',
  source_refs: {
    demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W12',
    po_ids: ['PO-2026-000001'],
    supplier_id: 'SUP-0001',
  },
};

const mockMitigations: Mitigation[] = [
  {
    mitigation_id: 'MIT-SHORT-2026-000001-01',
    shortage_id: 'SHORT-2026-000001',
    type: 'EXPEDITE',
    cost_usd: 2200,
    lead_time_days: 5,
    recovered_units: 600,
    service_level_after: 0.99,
    policy_compliant: true,
    policy_notes: 'Approved carrier expedite within weekly allocation.',
  },
  {
    mitigation_id: 'MIT-SHORT-2026-000001-02',
    shortage_id: 'SHORT-2026-000001',
    type: 'ALT_SUPPLIER',
    cost_usd: 3500,
    lead_time_days: 7,
    recovered_units: 900,
    service_level_after: 1,
    policy_compliant: true,
    policy_notes: 'Approved alternate supplier.',
  },
  {
    mitigation_id: 'MIT-SHORT-2026-000001-03',
    shortage_id: 'SHORT-2026-000001',
    type: 'SUBSTITUTE',
    cost_usd: 900,
    lead_time_days: 3,
    recovered_units: 600,
    service_level_after: 0.98,
    policy_compliant: false,
    policy_notes: 'Substitute SKU-000008 is not engineering approved.',
  },
];

vi.mock('@/features/workflow/ShortageWorkflowPanel', () => ({ ShortageWorkflowPanel: () => null }));

vi.mock('@/data/queries', () => ({
  usePabShardQuery: () => ({
    data: {
      sku_id: 'SKU-000001',
      location_id: 'LOC-NA-01',
      pab_weekly: [
        {
          sku_id: 'SKU-000001',
          location_id: 'LOC-NA-01',
          week: 12,
          opening: 200,
          inbound: 400,
          demand: 1200,
          closing: -600,
        },
      ],
      forecast_demand: [
        {
          demand_id: 'DEM-SKU-000001-LOC-NA-01-2026W12',
          sku_id: 'SKU-000001',
          location_id: 'LOC-NA-01',
          week: 12,
          forecast_qty: 1200,
          is_spike: true,
        },
      ],
    },
  }),
  useSuppliersQuery: () => ({
    data: [
      {
        supplier_id: 'SUP-0001',
        name: 'Apex Precision Parts',
        reliability_score: 0.92,
        capacity_per_week: 1000,
      },
    ],
  }),
  usePurchaseOrdersQuery: () => ({
    data: [
      {
        po_id: 'PO-2026-000001',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        ordered_qty: 400,
        uom: 'units',
        order_date: '2026-03-01',
        promised_date: '2026-03-25',
        actual_receipt_date: '2026-03-25',
        status: 'RECEIVED',
        transport_delay_days: 0,
      },
    ],
  }),
  useLeadTimesQuery: () => ({
    data: [
      {
        lead_time_id: 'LT-000001',
        supplier_id: 'SUP-0001',
        sku_id: 'SKU-000001',
        location_id: 'LOC-NA-01',
        lead_time_days: 14,
        effective_from: '2026-01-01',
        effective_to: null,
      },
    ],
  }),
  useShortageEventsQuery: () => ({
    data: [
      {
        event_id: 'EVT-000001',
        entity_id: 'SHORT-2026-000001',
        from_status: null,
        to_status: 'OPEN',
        occurred_on: '2026-03-20',
        actor_role: 'SYSTEM',
      },
    ],
  }),
  useManifestQuery: () => ({
    data: {
      seed: 20260401,
      generated_at_label: 'Deterministic Fixture',
      priority_weights: {
        severity: 0.4,
        urgency: 0.25,
        service_impact: 0.2,
        supplier_risk: 0.15,
      },
      row_counts: {},
      checksums: {},
    },
  }),
}));

describe('ShortageDetailSheet', () => {
  it('renders non-compliant and over-capacity mitigations visibly but keeps their radio inputs disabled', () => {
    render(
      <ShortageDetailSheet
        shortage={mockShortage}
        mitigations={mockMitigations}
        onClose={vi.fn()}
      />,
    );

    // Remaining supplier capacity = 1000 - 400 = 600 units
    const compliantRadio = screen.getByRole('radio', {
      name: 'Select mitigation MIT-SHORT-2026-000001-01',
    });
    const overCapacityRadio = screen.getByRole('radio', {
      name: 'Select mitigation MIT-SHORT-2026-000001-02',
    });
    const policyViolationRadio = screen.getByRole('radio', {
      name: 'Select mitigation MIT-SHORT-2026-000001-03',
    });

    expect(compliantRadio).toBeEnabled();
    expect(overCapacityRadio).toBeDisabled();
    expect(policyViolationRadio).toBeDisabled();

    expect(screen.getByText('Policy Violation')).toBeInTheDocument();
    expect(screen.getByText('Exceeds Capacity')).toBeInTheDocument();
    expect(
      screen.getByText(/Substitute SKU-000008 is not engineering approved/),
    ).toBeInTheDocument();
  });
});
