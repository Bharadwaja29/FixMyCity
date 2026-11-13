import { STATUS_LABEL, type ComplaintStatus } from '@/lib/api'
import { cn } from '@/lib/utils'

const BADGE: Record<ComplaintStatus, string> = {
  received: 'border-input bg-card text-foreground',
  assigned: 'border-primary bg-secondary text-foreground',
  in_progress: 'border-saffron bg-saffron/15 text-foreground',
  resolved: 'border-success bg-success text-success-foreground',
  escalated: 'border-destructive bg-destructive text-destructive-foreground',
}

const STAMP_INK: Record<ComplaintStatus, string> = {
  received: 'border-primary text-primary',
  assigned: 'border-primary text-primary',
  in_progress: 'border-saffron text-saffron-ink',
  resolved: 'border-success text-success',
  escalated: 'border-destructive text-destructive',
}

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-semibold',
        BADGE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Rubber-stamp mark: double border, tracked capitals, slight tilt. */
export function StatusStamp({ status, className }: { status: ComplaintStatus; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`Status: ${STATUS_LABEL[status]}`}
      className={cn(
        'inline-block -rotate-3 select-none rounded-sm border-[5px] border-double px-3 py-1.5 font-sans text-base font-extrabold uppercase tracking-[0.2em] md:text-lg',
        STAMP_INK[status],
        className,
      )}
    >
      <span aria-hidden="true">{STATUS_LABEL[status]}</span>
    </span>
  )
}
