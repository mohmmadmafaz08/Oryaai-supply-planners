import { parseCsv } from '@/lib/csv';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DATASETS, type DatasetKind, validateDataset } from '@/data/datasets';
import { resetDataset, uploadDataset } from '@/lib/datasets.functions';
import { getCurrentOrgId, requireOrgId } from '@/lib/org-store';
import { storageRepo } from '@/lib/storage-repository';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function useDatasetStatus() {
  const orgId = getCurrentOrgId();
  return useQuery({
    queryKey: ['wf', 'datasets', orgId],
    staleTime: 0,
    queryFn: async () => {
      if (!orgId) return new Map<DatasetKind, any>();
      const map = new Map<DatasetKind, any>();

      // Check local uploaded datasets first
      const local = storageRepo.getUploadedDatasets(orgId);
      for (const [kind, rows] of Object.entries(local)) {
        map.set(kind as DatasetKind, {
          kind,
          row_count: rows.length,
          uploaded_at: new Date().toISOString(),
          uploaded_by: 'local',
        });
      }

      try {
        const { data, error } = await supabase
          .from('org_datasets')
          .select('kind,row_count,uploaded_at,uploaded_by')
          .eq('org_id', orgId);
        if (!error && data) {
          for (const d of data) {
            map.set(d.kind as DatasetKind, d);
          }
        }
      } catch {
        // fallback to local
      }

      return map;
    },
  });
}

/** Reads and pre-validates a file in the browser (fast feedback); validates again before saving. */
export async function readDatasetFile(kind: DatasetKind, file: File): Promise<unknown[]> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('File is larger than 8 MB.');
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith('.csv');
  if (!isCsv && !name.endsWith('.json')) {
    throw new Error('Upload a .json or .csv file (download the template to see the columns).');
  }
  let raw: unknown;
  try {
    raw = isCsv ? parseCsv(await file.text()) : JSON.parse(await file.text());
  } catch {
    throw new Error(isCsv ? 'File is not valid CSV.' : 'File is not valid JSON.');
  }
  const res = validateDataset(kind, raw);
  if (!res.ok) throw new Error(`${DATASETS[kind].label}: ${res.error}`);
  return res.rows;
}

export function useDatasetMutations() {
  const qc = useQueryClient();
  const done = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['wf'] }),
      qc.removeQueries({ queryKey: ['orbit'] }),
    ]);

  return {
    upload: useMutation({
      mutationFn: (v: { kind: DatasetKind; rows: unknown[] }) =>
        uploadDataset({ orgId: requireOrgId(), ...v }),
      onSuccess: done,
    }),
    reset: useMutation({
      mutationFn: (kind: DatasetKind) =>
        resetDataset({ orgId: requireOrgId(), kind }),
      onSuccess: done,
    }),
  };
}
