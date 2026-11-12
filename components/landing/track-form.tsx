'use client'

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { COMPLAINT_ID_PATTERN, normalizeComplaintId } from '@/lib/api'
import { useLocale } from '@/components/locale-provider'

export function TrackForm({ defaultValue = '' }: { defaultValue?: string }) {
  const { t } = useLocale()
  const router = useRouter()
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const id = normalizeComplaintId(value)
    if (!COMPLAINT_ID_PATTERN.test(id)) {
      setError(true)
      return
    }
    setError(false)
    router.push(`/track?id=${encodeURIComponent(id)}`)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2 rounded-md border border-border bg-card p-4">
      <label htmlFor={inputId} className="text-sm font-semibold">
        {t('trackLabel')}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <input
            id={inputId}
            name="id"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(false)
            }}
            placeholder="FMC-2026-004217"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-invalid={error}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
            className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 font-mono text-base uppercase tabular-nums tracking-wide placeholder:normal-case placeholder:text-muted-foreground aria-invalid:border-destructive"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t('trackButton')}
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        {t('trackHint')}
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {t('trackError')}
        </p>
      )}
    </form>
  )
}
