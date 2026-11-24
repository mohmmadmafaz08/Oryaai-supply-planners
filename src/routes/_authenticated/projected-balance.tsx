import { createFileRoute } from '@tanstack/react-router';
import { ProjectedBalancePage } from '@/features/projected-balance/ProjectedBalancePage';

export const Route = createFileRoute('/_authenticated/projected-balance')({
  head: () => ({
    meta: [
      { title: 'Projected Balance · Oryva' },
      { name: 'description', content: 'Week-by-week projected available balance reconciliation.' },
      { property: 'og:title', content: 'Projected Balance · Oryva' },
      { property: 'og:description', content: 'Week-by-week projected available balance reconciliation.' },
    ],
  }),
  component: ProjectedBalancePage,
});
