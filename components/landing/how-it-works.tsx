import { Camera, ClipboardList, Stamp } from 'lucide-react'

const STEPS = [
  {
    icon: Camera,
    title: 'File the complaint',
    body: 'Take a photo, drop a pin and choose a category. No account needed — just a phone number for the SMS receipt.',
    entry: 'Case no. issued · FMC-2026-004217',
  },
  {
    icon: ClipboardList,
    title: 'Routed to a department',
    body: 'The case is assigned to the responsible ward office with a deadline. Every hand-off is stamped on the timeline.',
    entry: 'Assigned · PWD, Ward 14 · Due in 7 days',
  },
  {
    icon: Stamp,
    title: 'Closed with proof',
    body: 'Officers upload an after-photo to close the case. You confirm the fix, or reopen it if the work is not done.',
    entry: 'Resolved · After-photo attached',
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="flex flex-col gap-3 md:max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
        <h2 id="how-title" className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          One case file, from first photo to final stamp.
        </h2>
      </div>

      <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <li
              key={step.title}
              className="relative flex flex-col rounded-md border border-border bg-card md:rounded-none md:border-r-0 md:first:rounded-l-md md:last:rounded-r-md md:last:border-r"
            >
              <div className="flex items-center justify-between border-b border-dashed border-border px-5 py-3">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest tabular-nums text-muted-foreground">
                  Step {String(i + 1).padStart(2, '0')} / 03
                </span>
                <Icon className="size-5" strokeWidth={1.25} aria-hidden="true" />
              </div>
              <div className="flex flex-1 flex-col gap-3 px-5 py-6">
                <h3 className="font-serif text-xl font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
              <p className="border-t border-border bg-muted px-5 py-3 font-mono text-xs tabular-nums">{step.entry}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
