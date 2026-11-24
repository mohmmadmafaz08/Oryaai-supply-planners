import { describe, expect, it } from 'vitest';
import { validateDataset } from './datasets';

describe('validateDataset', () => {
  it('accepts a valid locations file', () => {
    const r = validateDataset('locations', [{ location_id: 'LOC-NA-01', name: 'Dallas DC', region: 'NA' }]);
    expect(r.ok).toBe(true);
  });
  it('rejects a location id in the wrong format', () => {
    const r = validateDataset('locations', [{ location_id: 'dallas', name: 'Dallas DC', region: 'NA' }]);
    expect(r).toMatchObject({ ok: false });
  });
  it('rejects a file that is not an array', () => {
    expect(validateDataset('skus', { sku_id: 'SKU-000001' })).toEqual({ ok: false, error: 'File must contain a JSON array of rows.' });
  });
});
