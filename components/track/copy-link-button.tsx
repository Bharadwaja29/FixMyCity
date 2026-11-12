'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    const url = `${window.location.origin}/track?id=${encodeURIComponent(id)}`
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('failed')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2500)
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={copy} className="gap-2">
        {state === 'copied' ? (
          <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Link2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
        )}
        {state === 'copied' ? 'Link copied' : 'Copy tracking link'}
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' && 'Tracking link copied to clipboard.'}
        {state === 'failed' && 'Could not copy. Copy the address from the browser bar instead.'}
      </span>
    </>
  )
}
