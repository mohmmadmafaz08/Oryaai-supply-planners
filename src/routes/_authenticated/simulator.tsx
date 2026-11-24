import { createFileRoute } from '@tanstack/react-router';
import { SimulatorPage } from '@/features/simulator/SimulatorPage';

export const Route = createFileRoute('/_authenticated/simulator')({
  head: () => ({
    meta: [
      { title: 'Simulator · Oryva' },
      { name: 'description', content: 'Stress-test demand, delays and supplier capacity.' },
      { property: 'og:title', content: 'Simulator · Oryva' },
      { property: 'og:description', content: 'Stress-test demand, delays and supplier capacity.' },
    ],
  }),
  component: SimulatorPage,
});
