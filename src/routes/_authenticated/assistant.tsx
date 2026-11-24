import { createFileRoute } from '@tanstack/react-router';
import { AssistantPage } from '@/features/assistant/AssistantPage';

export const Route = createFileRoute('/_authenticated/assistant')({
  head: () => ({
    meta: [
      { title: 'Copilot · Oryva' },
      { name: 'description', content: 'Ask Gemini about shortages, suppliers and mitigation options.' },
      { property: 'og:title', content: 'Copilot · Oryva' },
      { property: 'og:description', content: 'Ask Gemini about shortages, suppliers and mitigation options.' },
    ],
  }),
  component: AssistantPage,
});
