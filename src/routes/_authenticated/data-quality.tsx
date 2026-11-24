import { createFileRoute } from '@tanstack/react-router';
import { DataQualityPage } from '@/features/data-quality/DataQualityPage';

export const Route = createFileRoute('/_authenticated/data-quality')({
  head: () => ({
    meta: [
      { title: 'Data Quality · Oryva' },
      { name: 'description', content: 'Validation checks, edge cases and dataset provenance.' },
      { property: 'og:title', content: 'Data Quality · Oryva' },
      { property: 'og:description', content: 'Validation checks, edge cases and dataset provenance.' },
    ],
  }),
  component: DataQualityPage,
});
