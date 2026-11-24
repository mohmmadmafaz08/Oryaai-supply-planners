import { useMutation } from '@tanstack/react-query';
import * as React from 'react';
import { useOrg } from '@/app/org';
import {
  useBomQuery,
  useForecastDemandQuery,
  useInventoryQuery,
  useMitigationsQuery,
  usePurchaseOrdersQuery,
  useShortagesQuery,
  useSkuSubstitutesQuery,
  useSkusQuery,
  useSuppliersQuery,
} from '@/data/queries';
import { askCopilot, type ChatMessage } from '@/lib/ai.functions';
import { buildCopilotContext } from './buildContext';

export type { ChatMessage };

export function useCopilot() {
  const { current } = useOrg();
  const shortages = useShortagesQuery();
  const mitigations = useMitigationsQuery();
  const suppliers = useSuppliersQuery();
  const pos = usePurchaseOrdersQuery();
  const skus = useSkusQuery();
  const inventory = useInventoryQuery();
  const demand = useForecastDemandQuery();
  const bom = useBomQuery();
  const substitutes = useSkuSubstitutesQuery();

  const ready = Boolean(current && shortages.data && mitigations.data && suppliers.data && pos.data);

  const build = React.useCallback(
    (focusShortageId?: string, mode?: 'action_plan' | 'root_cause' | 'cost_optimizer' | 'executive' | 'general') =>
      buildCopilotContext({
        orgName: current?.name ?? 'Workspace',
        shortages: shortages.data ?? [],
        mitigations: mitigations.data ?? [],
        suppliers: suppliers.data ?? [],
        purchaseOrders: pos.data ?? [],
        skus: skus.data,
        inventory: inventory.data,
        forecastDemand: demand.data,
        bom: bom.data,
        substitutes: substitutes.data,
        focusShortageId,
        mode,
      }),
    [current, shortages.data, mitigations.data, suppliers.data, pos.data, skus.data, inventory.data, demand.data, bom.data, substitutes.data],
  );

  const mutation = useMutation({
    mutationFn: (v: {
      messages: ChatMessage[];
      focusShortageId?: string;
      mode?: 'action_plan' | 'root_cause' | 'cost_optimizer' | 'executive' | 'general';
    }) =>
      askCopilot({
        orgId: current?.id ?? 'org_northwind_default',
        context: build(v.focusShortageId, v.mode),
        messages: v.messages.slice(-12),
        mode: v.mode,
      }),
  });

  return {
    ready,
    mutation,
    stats: {
      shortageCount: shortages.data?.length ?? 0,
      mitigationCount: mitigations.data?.length ?? 0,
      supplierCount: suppliers.data?.length ?? 0,
      poCount: pos.data?.length ?? 0,
    },
  };
}
