import { createFileRoute } from '@tanstack/react-router';
import { ProductionBomPage } from '@/features/production-bom/ProductionBomPage';

export const Route = createFileRoute('/_authenticated/production-bom')({
  head: () => ({
    meta: [
      { title: 'Production and BOM · Oryva' },
      { name: 'description', content: 'Production plans and bill of materials coverage.' },
      { property: 'og:title', content: 'Production and BOM · Oryva' },
      { property: 'og:description', content: 'Production plans and bill of materials coverage.' },
    ],
  }),
  component: ProductionBomPage,
});
