# Validation summary (starter, seed 20261022)

Reproducible: **YES** (two runs, 17 files, identical SHA-256)

| Group | Check | Status | Rows | Details |
|---|---|---|---|---|
| CLEAN_BASELINE | PK Uniqueness | PASS | 1262 | All primary keys across SKUs, locations, suppliers, shortages, mitigations, and POs are unique. |
| CLEAN_BASELINE | FK Integrity | PASS | 8028 | All SKU, location, supplier, shortage, and purchase order foreign keys resolve cleanly. |
| CLEAN_BASELINE | Allowed Enums | PASS | 1164 | All cause codes, statuses, and mitigation types belong to permitted schema enums. |
| CLEAN_BASELINE | Date Ordering | PASS | 498 | All purchase orders satisfy order_date <= promised_date and receipt >= order_date. |
| CLEAN_BASELINE | Lifecycle Transitions | PASS | 1445 | All PO and shortage status events follow valid state-machine transitions. |
| CLEAN_BASELINE | ID Patterns | PASS | 1262 | All entity identifiers match required canonical regex formats. |
| CLEAN_BASELINE | Shortage Lead-Time Basis | FAIL | 174 | 2 shortages lack a positive lead-time basis. |
| INJECTED_ANOMALY | PAB Weekly Reconciliation Check | FAIL | 6864 | 26 row failed closing balance arithmetic (SKU-000014@LOC-AP-01:W40 (delta -289), SKU-000014@LOC-AP-01:W41 (delta -289), SKU-000014@LOC-AP-01 |
| INJECTED_ANOMALY | Duplicate Records & Inbound Receipts Check | FAIL | 7362 | 26 anomaly flagged (0 key duplicates, 26 double-counted inbound receipt mismatch). |
| INJECTED_ANOMALY | Substitute Approval Policy Check | FAIL | 497 | 2 substitute mitigation (MIT-SHORT-2026-000018-04, MIT-SHORT-2026-000123-03) references an unapproved substitute SKU. |
| INJECTED_ANOMALY | Supplier Weekly Capacity Check | FAIL | 174 | 2 shortage allocation (SHORT-2026-000033, SHORT-2026-000109) exceeds supplier weekly capacity. |
| INJECTED_ANOMALY | Mitigation Lead Time Bounds Check | PASS | 492 | All mitigation options satisfy minimum >= 1 day transit lead time. |
| INJECTED_ANOMALY | SKU Unit of Measure Consistency Check | FAIL | 60 | 2 SKU (SKU-000009, SKU-000052) uses non-base UOM while PAB buckets expect "units". |

Ground truth: 10/10 injected anomalies detected (recall 1.00), unexpected failures: 0.