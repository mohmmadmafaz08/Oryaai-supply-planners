import { createFileRoute } from '@tanstack/react-router';
import { CommandCenterPage } from '@/features/command-center/CommandCenterPage';

export const Route = createFileRoute('/_authenticated/dashboard')({
  head: () => ({
    meta: [
      { title: 'Command Center · Oryva' },
      { name: 'description', content: 'Live overview of shortages, coverage and supplier risk.' },
      { property: 'og:title', content: 'Command Center · Oryva' },
      { property: 'og:description', content: 'Live overview of shortages, coverage and supplier risk.' },
    ],
  }),
  component: CommandCenterPage,
});
