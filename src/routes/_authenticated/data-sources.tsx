import { createFileRoute } from '@tanstack/react-router';
import { DataSourcesPage } from '@/features/data-sources/DataSourcesPage';

export const Route = createFileRoute('/_authenticated/data-sources')({
  head: () => ({
    meta: [
      { title: 'Data sources · Oryva' },
      { name: 'description', content: 'Import and validate your planning data files.' },
      { property: 'og:title', content: 'Data sources · Oryva' },
      { property: 'og:description', content: 'Import and validate your planning data files.' },
    ],
  }),
  component: DataSourcesPage,
});
