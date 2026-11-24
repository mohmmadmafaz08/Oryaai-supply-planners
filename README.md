# Oryva AI — Enterprise Supply Planning & Shortage Intelligence Workbench

An enterprise-grade supply chain intelligence platform designed to catch shortages before they hit production lines. Oryva models weekly demand forecasts against multi-echelon inventory, supplier capacity, lead times, purchase orders, and bill-of-materials (BOM) to **identify, explain, prioritize, and resolve supply chain risks** with policy-checked mitigations and auditable governance.

---

## Architecture & Technology Stack

- **Frontend Core**: React 19, TanStack Router (type-safe file-based routing), TanStack Query, Tailwind CSS v4, Lucide Icons, Recharts.
- **Identity & Authentication**: Clerk (`@clerk/react`) featuring enterprise single sign-on (SSO), Google OAuth, multi-factor authentication, and user profile synchronization.
- **Database & Persistence**: Cloud PostgreSQL powered by Supabase (`@supabase/supabase-js`), featuring 27 relational planning tables with composite primary/foreign keys, check constraints, and row-level security (RLS).
- **Offline & Optimistic Cache**: High-performance resilient repository (`src/lib/storage-repository.ts`) guaranteeing instant sub-millisecond reads and offline fault tolerance.
- **AI Planning Copilot**: Domain-grounded Gemini intelligence engine (`src/lib/ai.functions.ts`) with zero hallucination risk, performing root-cause analysis, mitigation trade-off optimizations, and multi-tier recovery plans.

---

## Key Capabilities

1. **Deterministic Shortage Triage**:
   - Computes 52-week projected available balance (PAB) across 3,000 SKUs and 50 distribution locations.
   - Diagnoses root causes automatically: `LATE_INBOUND`, `DEMAND_SPIKE`, `CAPACITY_EXCEEDED`, or `LEAD_TIME_GAP`.
   - Priority scoring based on severity, urgency, service-level impact, and supplier reliability.

2. **Policy-Checked Mitigation Decision Engine**:
   - Compares expedited orders, alternate approved suppliers, sister-site inventory transfers, and bill-of-materials substitutions.
   - Validates supplier capacity limits and lead-time constraints prior to planner approval.
   - Requires formal mitigation approval and rationale before shortages can transition to `RESOLVED`.

3. **Grounded AI Assistant**:
   - Context-grounded in the active organization's real shortages, delayed POs, supplier contracts, and BOM components.
   - Provides structured markdown tables, executive summaries, and action plans.

4. **Multi-Tenant Organization Workspaces**:
   - Strictly enforced tenancy boundaries: all planning data, statuses, reviews, and activity logs are scoped by `org_id`.
   - Team invite codes with role-based governance (`owner` vs. `member`).

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Setup & Run
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
# Running on http://localhost:5173

# Execute Vitest test suite (17 test files, 65 tests)
npm test

# Production build
npm run build
```

### Environment Configuration (`.env`)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://prwvauiebihaugutsnlh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Optional external Gemini API Key
GEMINI_API_KEY=...
```

---

## Data Generator & Reproducibility

The workbench includes a deterministic, pure-TypeScript seeded generator (`src/generator/generate.ts`) ensuring reproducible benchmarks across development, staging, and demo environments:

```bash
# Generate starter dataset
npm run generate

# Generate full enterprise scale (3,000 SKUs · 50 locations · 500 suppliers · 10,000+ POs)
npm run generate:full
```

Each generation verifies dual runs and enforces bitwise consistency via SHA-256 checksums (`reproducibility.json`), achieving **1.00 recall and 1.00 precision** against ground-truth anomaly detection.

---

## Quality & Test Coverage

- **Unit & Integration Tests**: 65 unit tests covering projected balance reconciliation, lead-time variance, mitigation ranking, anomaly detection, and permission guards.
- **Type Safety**: End-to-end TypeScript with Zod runtime validation on every domain entity and mutation input.
- **Production Bundle**: Modular code-splitting, tree-shaking, and minified Nitro SSR bundles verified via Vite production builds.
