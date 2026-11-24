export const MIN_WEEK = 1;
export const MAX_WEEK = 52;
export const DEFAULT_PAGE_SIZE = 25;
export const RECONCILIATION_PAGE_SIZE = 13;
export const MAX_COMBOBOX_RESULTS = 50;
export const SEARCH_DEBOUNCE_MS = 200;
export const TOP_SHORTAGES_LIMIT = 10;
export const RETRY_QUERY_COUNT = 1;
export const COPY_FEEDBACK_MS = 1600;
export const THEME_STORAGE_KEY = 'orbit-theme';
export const DATA_BASE_PATH = '/data';

export const ROUTE_PATHS = {
  COMMAND_CENTER: '/dashboard',
  ACTIVITY: '/activity',
  SCENARIOS: '/scenarios',
  ASSISTANT: '/assistant',
  DATA_SOURCES: '/data-sources',
  ORGANIZATION: '/organization',
  SHORTAGES: '/shortages',
  PROJECTED_BALANCE: '/projected-balance',
  SIMULATOR: '/simulator',
  PURCHASE_ORDERS: '/purchase-orders',
  SUPPLIERS: '/suppliers',
  PRODUCTION_BOM: '/production-bom',
  DATA_QUALITY: '/data-quality',
} as const;

export const QUERY_PARAM_KEYS = {
  SEARCH: 'q',
  STATUS: 'status',
  CAUSE: 'cause',
  WEEK_MIN: 'wMin',
  WEEK_MAX: 'wMax',
  PAGE: 'page',
  SORT_BY: 'sort',
  SORT_DIR: 'dir',
  SELECTED_SHORTAGE: 'shortageId',
  SELECTED_PO: 'poId',
  SKU: 'sku',
  LOCATION: 'location',
  SUPPLIER: 'supplier',
  PO_STATUS: 'poStatus',
  DELAYED_ONLY: 'delayed',
  MISMATCH_ONLY: 'mismatches',
  DEMAND_MULT: 'demand',
  DELAY_WEEKS: 'delay',
  CAPACITY_MULT: 'capacity',
  ON_HAND_DELTA: 'onHand',
  MITIGATION_ID: 'mitigation',
  DATA_QUALITY_TAB: 'tab',
  PARENT_SKU: 'parentSku',
} as const;

export const SIMULATION_DEFAULTS = {
  demandMultiplier: 1,
  inboundDelayWeeks: 0,
  supplierCapacityMultiplier: 1,
  onHandDelta: 0,
} as const;

export const SIMULATION_BOUNDS = {
  demandMultiplier: { min: 0.5, max: 2, step: 0.05 },
  inboundDelayWeeks: { min: 0, max: 8, step: 1 },
  supplierCapacityMultiplier: { min: 0.5, max: 1.5, step: 0.05 },
  onHandDelta: { min: -2000, max: 2000, step: 50 },
} as const;

export const PRIORITY_THRESHOLDS = {
  CRITICAL: 80,
  WARNING: 55,
} as const;

export const UTILISATION_THRESHOLDS = {
  CONSTRAINED: 0.9,
  OVER_CAPACITY: 1.0,
} as const;

export const CAUSE_CODE_LABELS = {
  DEMAND_SPIKE: 'Demand Spike',
  LATE_INBOUND: 'Late Inbound',
  SUPPLIER_CAPACITY: 'Supplier Capacity',
  LEAD_TIME_GAP: 'Lead Time Gap',
} as const;

export const CAUSE_CODE_COLORS = {
  DEMAND_SPIKE: 'var(--cause-demand-spike)',
  LATE_INBOUND: 'var(--cause-late-inbound)',
  SUPPLIER_CAPACITY: 'var(--cause-supplier-capacity)',
  LEAD_TIME_GAP: 'var(--cause-lead-time-gap)',
} as const;

export const CAUSE_CODE_EXPLANATIONS = {
  DEMAND_SPIKE:
    'Customer demand in this week exceeded the baseline forecast beyond available safety stock.',
  LATE_INBOUND:
    'Scheduled purchase order receipts were delayed into a later planning bucket, creating a temporary net deficit.',
  SUPPLIER_CAPACITY:
    'Confirmed supplier weekly allocation could not cover total planned replenishment orders.',
  LEAD_TIME_GAP:
    'Order release occurred inside the supplier quoted lead-time window, preventing timely replenishment.',
} as const;

export const SHORTAGE_STATUS_LABELS = {
  OPEN: 'Open',
  MITIGATING: 'Mitigating',
  RESOLVED: 'Resolved',
} as const;

export const PO_STATUS_LABELS = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  DELAYED: 'Delayed',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
} as const;

export const ACTOR_ROLE_LABELS = {
  PLANNER: 'Planner',
  LOGISTICS_ANALYST: 'Logistics Analyst',
  OPERATIONS_MANAGER: 'Operations Manager',
  SYSTEM: 'System',
} as const;

export const MITIGATION_TYPE_LABELS = {
  EXPEDITE: 'Expedite Freight',
  ALT_SUPPLIER: 'Alternate Supplier',
  SUBSTITUTE: 'Approved Substitute',
  TRANSFER: 'Inter-Site Transfer',
} as const;

export const ISSUE_TYPE_LABELS = {
  DOUBLE_COUNTED_INBOUND: 'Double-Counted Inbound',
  UNAPPROVED_SUBSTITUTE: 'Unapproved Substitute',
  CAPACITY_EXCEEDED: 'Capacity Exceeded',
  NO_LEAD_TIME: 'Missing Lead Time',
  UOM_MISMATCH: 'UOM Mismatch',
} as const;

export const DATA_QUALITY_TABS = {
  VALIDATION: 'validation',
  EDGE_CASES: 'edge-cases',
  PROVENANCE: 'provenance',
} as const;
