import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaseCardProps {
  label: React.ReactNode
  icon?: LucideIcon
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  labelledBy?: string
}

/** Case-file card: dashed header strip, body, optional mono ledger footer — matches the landing "How it works" cards. */
export function CaseCard({ label, icon: Icon, footer, children, className, bodyClassName, labelledBy }: CaseCardProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn('flex flex-col rounded-md border border-border bg-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border px-5 py-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest tabular-nums text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="size-5 shrink-0" strokeWidth={1.25} aria-hidden="true" />}
      </div>
      <div className={cn('flex flex-1 flex-col gap-5 px-5 py-6', bodyClassName)}>{children}</div>
      {footer && (
        <div className="border-t border-border bg-muted px-5 py-3 font-mono text-xs tabular-nums">{footer}</div>
      )}
    </section>
  )
}

export const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground aria-invalid:border-destructive md:text-sm'

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {message}
    </p>
  )
}
