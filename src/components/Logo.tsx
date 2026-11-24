import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-6 w-6 shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id="oryva-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-from)" />
          <stop offset="1" stopColor="var(--brand-to)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="10" fill="none" stroke="url(#oryva-g)" strokeWidth="6" />
      <path d="M16 1v5M16 26v5" stroke="url(#oryva-g)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.04em]">oryva</span>
      <span className="text-[10px] font-medium text-[var(--brand-from)]">AI</span>
    </span>
  );
}
