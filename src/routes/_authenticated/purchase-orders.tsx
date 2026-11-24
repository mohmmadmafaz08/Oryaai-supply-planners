import { createFileRoute } from '@tanstack/react-router';
import { PurchaseOrdersPage } from '@/features/purchase-orders/PurchaseOrdersPage';

export const Route = createFileRoute('/_authenticated/purchase-orders')({
  head: () => ({
    meta: [
      { title: 'Purchase Orders · Oryva' },
      { name: 'description', content: 'Track purchase order status, delays and receipts.' },
      { property: 'og:title', content: 'Purchase Orders · Oryva' },
      { property: 'og:description', content: 'Track purchase order status, delays and receipts.' },
    ],
  }),
  component: PurchaseOrdersPage,
});
