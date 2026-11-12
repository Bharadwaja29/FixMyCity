import type { Severity } from '@/lib/api'
import { cn } from '@/lib/utils'

const STYLE: Record<Severity, string> = {
  Low: 'border-input bg-card text-foreground',
  Medium: 'border-saffron bg-saffron/15 text-foreground',
  High: 'border-saffron bg-saffron text-saffron-foreground',
  Critical: 'border-destructive bg-destructive text-destructive-foreground',
}

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span className={cn('inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold', STYLE[severity])}>
      <span className="sr-only">Severity: </span>
      {severity}
    </span>
  )
}
