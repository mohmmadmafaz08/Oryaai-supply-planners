import { createFileRoute } from '@tanstack/react-router';
import { ShortagesPage } from '@/features/shortages/ShortagesPage';

export const Route = createFileRoute('/_authenticated/shortages')({
  head: () => ({
    meta: [
      { title: 'Shortages · Oryva' },
      { name: 'description', content: 'Prioritised shortage queue with root cause and mitigation workflow.' },
      { property: 'og:title', content: 'Shortages · Oryva' },
      { property: 'og:description', content: 'Prioritised shortage queue with root cause and mitigation workflow.' },
    ],
  }),
  component: ShortagesPage,
});
