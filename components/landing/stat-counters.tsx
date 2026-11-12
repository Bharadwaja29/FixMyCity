'use client'

import { useEffect, useRef, useState } from 'react'
import type { PlatformStats } from '@/lib/api'

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(target)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setValue(0)
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return { value, ref }
}

function Stat({ value, label, note, suffix }: { value: number; label: string; note: string; suffix?: string }) {
  const { value: shown, ref } = useCountUp(value)
  return (
    <div className="flex flex-col gap-2 border-t-2 border-foreground pt-5">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="order-first font-serif text-6xl font-semibold leading-none tracking-tight tabular-nums md:text-7xl">
        <span ref={ref} aria-hidden="true">
          {shown.toLocaleString('en-IN')}
        </span>
        <span className="sr-only">{value.toLocaleString('en-IN')}</span>
        {suffix && <span className="ml-1 text-2xl font-normal text-muted-foreground">{suffix}</span>}
      </dd>
      <dd className="text-sm leading-relaxed text-muted-foreground">{note}</dd>
    </div>
  )
}

export function StatCounters({ stats }: { stats: PlatformStats }) {
  const rate = Math.round((stats.resolved / stats.filed) * 100)
  return (
    <section aria-labelledby="stats-title" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <h2 id="stats-title" className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            The register, so far.
          </h2>
          <p className="text-sm text-muted-foreground">
            Bhagalpur pilot · updated daily · <span className="tabular-nums">{rate}%</span> resolution rate
          </p>
        </div>
        <dl className="mt-10 grid gap-10 md:grid-cols-3">
          <Stat value={stats.filed} label="Complaints filed" note="Every one has a public case number." />
          <Stat value={stats.resolved} label="Complaints resolved" note="Closed with an officer's after-photo." />
          <Stat
            value={stats.medianDaysToResolve}
            suffix="days"
            label="Median time to fix"
            note="From filing to citizen-confirmed closure."
          />
        </dl>
      </div>
    </section>
  )
}
