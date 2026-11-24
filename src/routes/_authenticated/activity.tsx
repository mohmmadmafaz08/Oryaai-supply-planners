import { createFileRoute } from '@tanstack/react-router';
import { ActivityPage } from '@/features/activity/ActivityPage';

export const Route = createFileRoute('/_authenticated/activity')({
  head: () => ({
    meta: [
      { title: 'Team Activity · Oryva' },
      { name: 'description', content: 'Audit trail of every workflow change made by the team.' },
      { property: 'og:title', content: 'Team Activity · Oryva' },
      { property: 'og:description', content: 'Audit trail of every workflow change made by the team.' },
    ],
  }),
  component: ActivityPage,
});
