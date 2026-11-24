import { createFileRoute } from '@tanstack/react-router';
import { OrganizationPage } from '@/features/organization/OrganizationPage';

export const Route = createFileRoute('/_authenticated/organization')({
  head: () => ({
    meta: [
      { title: 'Organization · Oryva' },
      { name: 'description', content: 'Members and invite code for your organization.' },
      { property: 'og:title', content: 'Organization · Oryva' },
      { property: 'og:description', content: 'Members and invite code for your organization.' },
    ],
  }),
  component: OrganizationPage,
});
