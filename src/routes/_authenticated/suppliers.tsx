import { createFileRoute } from '@tanstack/react-router';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';

export const Route = createFileRoute('/_authenticated/suppliers')({
  head: () => ({
    meta: [
      { title: 'Suppliers · Oryva' },
      { name: 'description', content: 'Supplier reliability, capacity and lead times.' },
      { property: 'og:title', content: 'Suppliers · Oryva' },
      { property: 'og:description', content: 'Supplier reliability, capacity and lead times.' },
    ],
  }),
  component: SuppliersPage,
});
