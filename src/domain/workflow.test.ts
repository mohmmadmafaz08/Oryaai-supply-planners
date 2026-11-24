import { describe, expect, it } from 'vitest';
import { validateStatusChange } from './workflow';

describe('validateStatusChange', () => {
  it('blocks resolving without an approved mitigation', () => {
    expect(validateStatusChange('RESOLVED', 0)).toMatch(/Approve at least one mitigation/);
  });
  it('allows resolving with one approved mitigation', () => {
    expect(validateStatusChange('RESOLVED', 1)).toBeNull();
  });
  it('allows moving to mitigating without approvals', () => {
    expect(validateStatusChange('MITIGATING', 0)).toBeNull();
  });
});
