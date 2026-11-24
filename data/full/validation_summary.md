# Validation summary (full, seed 20261022)

Reproducible: **YES** (two runs, 17 files, identical SHA-256)

| Group | Check | Status | Rows | Details |
|---|---|---|---|---|
| CLEAN_BASELINE | PK Uniqueness | PASS | 29686 | All primary keys across SKUs, locations, suppliers, shortages, mitigations, and POs are unique. |
| CLEAN_BASELINE | FK Integrity | PASS | 340008 | All SKU, location, supplier, shortage, and purchase order foreign keys resolve cleanly. |
| CLEAN_BASELINE | Allowed Enums | PASS | 26136 | All cause codes, statuses, and mitigation types belong to permitted schema enums. |
| CLEAN_BASELINE | Date Ordering | PASS | 13634 | All purchase orders satisfy order_date <= promised_date and receipt >= order_date. |
| CLEAN_BASELINE | Lifecycle Transitions | PASS | 45158 | All PO and shortage status events follow valid state-machine transitions. |
| CLEAN_BASELINE | ID Patterns | PASS | 29686 | All entity identifiers match required canonical regex formats. |
| CLEAN_BASELINE | Shortage Lead-Time Basis | FAIL | 3206 | 10 shortages lack a positive lead-time basis. |
| INJECTED_ANOMALY | PAB Weekly Reconciliation Check | FAIL | 313872 | 318 row failed closing balance arithmetic (SKU-000148@LOC-ME-07:W31 (delta -1004), SKU-000148@LOC-ME-07:W32 (delta -1004), SKU-000148@LOC-ME |
| INJECTED_ANOMALY | Duplicate Records & Inbound Receipts Check | FAIL | 327506 | 318 anomaly flagged (0 key duplicates, 318 double-counted inbound receipt mismatch). |
| INJECTED_ANOMALY | Substitute Approval Policy Check | FAIL | 9657 | 8 substitute mitigation (MIT-SHORT-2026-000492-04, MIT-SHORT-2026-002359-03, MIT-SHORT-2026-002707-04, MIT-SHORT-2026-000140-04, MIT-SHORT-2 |
| INJECTED_ANOMALY | Supplier Weekly Capacity Check | FAIL | 3206 | 10 shortage allocation (SHORT-2026-000320, SHORT-2026-000816, SHORT-2026-001202, SHORT-2026-001332, SHORT-2026-002058, SHORT-2026-002302, SH |
| INJECTED_ANOMALY | Mitigation Lead Time Bounds Check | PASS | 9296 | All mitigation options satisfy minimum >= 1 day transit lead time. |
| INJECTED_ANOMALY | SKU Unit of Measure Consistency Check | FAIL | 3000 | 10 SKU (SKU-000518, SKU-000568, SKU-001169, SKU-002050, SKU-002232, SKU-002285, SKU-002369, SKU-002496, SKU-002642, SKU-002966) uses non-bas |

Ground truth: 48/48 injected anomalies detected (recall 1.00), unexpected failures: 0.