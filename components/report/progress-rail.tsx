import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['Evidence', 'Location', 'Review & submit']

export function ProgressRail({ current }: { current: number }) {
  return (
    <nav aria-label="Report progress">
      <ol className="grid grid-cols-3 gap-2 md:gap-3">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = n < current ? 'done' : n === current ? 'current' : 'upcoming'
          return (
            <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'h-1 rounded-sm',
                  state === 'done' && 'bg-primary',
                  state === 'current' && 'bg-saffron',
                  state === 'upcoming' && 'bg-border',
                )}
              />
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-sm border font-mono text-xs font-semibold tabular-nums',
                    state === 'done' && 'border-primary bg-primary text-primary-foreground',
                    state === 'current' && 'border-foreground bg-card text-foreground',
                    state === 'upcoming' && 'border-input text-muted-foreground',
                  )}
                >
                  {state === 'done' ? <Check className="size-3.5" strokeWidth={2} /> : String(n).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-xs leading-tight sm:text-sm',
                    state === 'upcoming' ? 'text-muted-foreground' : 'font-semibold text-foreground',
                  )}
                >
                  <span className="sr-only">
                    Step {n} of 3{state === 'done' ? ', completed' : state === 'current' ? ', current' : ''}:{' '}
                  </span>
                  {label}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
