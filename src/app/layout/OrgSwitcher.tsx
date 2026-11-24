import { Building2 } from 'lucide-react';
import * as React from 'react';
import { useOrg } from '@/app/org';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function OrgSwitcher(): React.ReactElement | null {
  const { orgs, current, switchOrg } = useOrg();
  if (!current) return null;
  return (
    <div className="border-b border-[var(--border-default)] p-2">
      <Select value={current.id} onValueChange={switchOrg}>
        <SelectTrigger aria-label="Switch organization" className="h-9 w-full">
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
