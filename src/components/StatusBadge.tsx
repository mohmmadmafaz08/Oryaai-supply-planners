import { AlertTriangle, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';
import * as React from 'react';
import { Badge } from './ui/badge';

export type SemanticTone = 'critical' | 'warning' | 'ok' | 'info' | 'neutral';

export interface StatusBadgeProps {
  tone: SemanticTone;
  label: string;
}

const TONE_ICON_MAP: Record<SemanticTone, React.ReactElement> = {
  critical: <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />,
  warning: <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />,
  ok: <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />,
  info: <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />,
  neutral: <Info className="h-3 w-3 shrink-0" aria-hidden="true" />,
};

/**
 * Accessible status indicator pairing semantic color with icon and text label.
 */
export function StatusBadge({ tone, label }: StatusBadgeProps): React.ReactElement {
  return (
    <Badge variant={tone}>
      {TONE_ICON_MAP[tone]}
      <span>{label}</span>
    </Badge>
  );
}
