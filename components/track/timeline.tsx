import { Check, CircleAlert } from 'lucide-react'
import type { TimelineStep } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

function Node({ step }: { step: TimelineStep }) {
  const escalated = step.status === 'escalated'
  if (step.state === 'upcoming') {
    return <span className="size-6 rounded-full border-2 border-dashed border-input bg-background" />
  }
  if (step.state === 'current') {
    return (
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full border-2 bg-card ring-4',
          escalated ? 'border-destructive ring-destructive/20' : 'border-saffron ring-saffron/30',
        )}
      >
        {escalated ? (
          <CircleAlert className="size-3.5 text-destructive" strokeWidth={2} aria-hidden="true" />
        ) : (
          <span className="size-2.5 rounded-full bg-saffron" />
        )}
      </span>
    )
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full border-2 border-primary bg-primary">
      <Check className="size-3.5 text-primary-foreground" strokeWidth={2.5} aria-hidden="true" />
    </span>
  )
}

const STATE_TEXT: Record<TimelineStep['state'], string> = {
  done: 'Completed',
  current: 'Current step',
  upcoming: 'Pending',
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        const upcoming = step.state === 'upcoming'
        const nextReached = !last && steps[i + 1].state !== 'upcoming'
        return (
          <li key={step.status} aria-current={step.state === 'current' ? 'step' : undefined} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Node step={step} />
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn('my-1 w-0.5 flex-1', nextReached ? 'bg-primary' : 'border-l-2 border-dashed border-input')}
                />
              )}
            </div>

            <div
              className={cn(
                'mb-5 flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border px-4 py-3',
                step.state === 'current' && 'border-primary bg-card',
                step.state === 'done' && 'border-border bg-card',
                upcoming && 'border-dashed border-border bg-transparent',
                last && 'mb-0',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className={cn('font-serif text-lg font-semibold', upcoming && 'text-muted-foreground')}>
                  {step.label}
                </h3>
                <span className="sr-only">{STATE_TEXT[step.state]}</span>
                {step.at ? (
                  <time dateTime={step.at} className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(step.at)}
                  </time>
                ) : (
                  <span className="text-xs text-muted-foreground" aria-hidden="true">
                    Awaiting
                  </span>
                )}
              </div>

              {step.officer && (
                <p className="text-sm leading-snug">
                  <span className="font-semibold">{step.officer.name}</span>
                  <span className="text-muted-foreground">, {step.officer.role}</span>
                </p>
              )}
              {step.note && <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{step.note}</p>}
              {step.sincePrevious && (
                <p className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {step.sincePrevious} after previous step
                </p>
              )}
              {upcoming && (
                <p className="text-sm text-muted-foreground">
                  {step.status === 'resolved' ? 'Closed once the field team confirms the fix.' : 'Not yet reached.'}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
