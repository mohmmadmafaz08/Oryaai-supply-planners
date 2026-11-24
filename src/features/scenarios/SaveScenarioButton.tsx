import { Bookmark } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useWorkflowMutations } from '@/data/workflow';
import { useSearchParams } from '@/lib/router-compat';

export function SaveScenarioButton({ skuId, locationId }: { skuId: string; locationId: string }) {
  const [params] = useSearchParams();
  const m = useWorkflowMutations();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!skuId || !locationId || m.saveScenario.isPending}
      onClick={() => {
        const name = window.prompt('Name this scenario', `${skuId} stress test`);
        if (!name?.trim()) return;
        const p = Object.fromEntries(params.entries());
        p['sku'] = skuId;
        p['location'] = locationId;
        m.saveScenario.mutate(
          { name: name.trim(), skuId, locationId, params: p },
          { onSuccess: () => toast.success('Scenario saved'), onError: (e) => toast.error(e instanceof Error ? e.message : 'Save failed') },
        );
      }}
    >
      <Bookmark className="h-4 w-4" /> Save scenario
    </Button>
  );
}
