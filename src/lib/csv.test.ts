import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses quoted cells and coerces numbers', () => {
    expect(parseCsv('id,name,qty\nSKU-1,"Bolt, M6",12\n')).toEqual([{ id: 'SKU-1', name: 'Bolt, M6', qty: 12 }]);
  });
  it('turns empty cells into null and keeps leading-zero codes as text', () => {
    expect(parseCsv('a,b\n,007')).toEqual([{ a: null, b: '007' }]);
  });
});
