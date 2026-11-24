import { createFileRoute } from '@tanstack/react-router';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

export const Route = createFileRoute('/_authenticated/onboarding')({
  head: () => ({
    meta: [
      { title: 'Get started · Oryva' },
      { name: 'description', content: 'Create or join an organization and import data.' },
      { property: 'og:title', content: 'Get started · Oryva' },
      { property: 'og:description', content: 'Create or join an organization and import data.' },
    ],
  }),
  component: OnboardingPage,
});
