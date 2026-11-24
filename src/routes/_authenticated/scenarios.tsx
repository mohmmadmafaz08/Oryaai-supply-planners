import { createFileRoute } from '@tanstack/react-router';
import { ScenariosPage } from '@/features/scenarios/ScenariosPage';

export const Route = createFileRoute('/_authenticated/scenarios')({
  head: () => ({
    meta: [
      { title: 'Saved Scenarios · Oryva' },
      { name: 'description', content: 'Your saved simulator scenarios.' },
      { property: 'og:title', content: 'Saved Scenarios · Oryva' },
      { property: 'og:description', content: 'Your saved simulator scenarios.' },
    ],
  }),
  component: ScenariosPage,
});
