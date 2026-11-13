'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { Building2, Map as MapIcon, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ComplaintsPanel } from './complaints-panel'
import { DepartmentsPanel } from './departments-panel'
import { MapPanel } from './map-panel'

import type { LedgerTabId } from './tabs'

const LEDGER_TABS: { id: LedgerTabId; label: string; icon: typeof Building2 }[] = [
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'complaints', label: 'All complaints', icon: Table2 },
  { id: 'map', label: 'Map', icon: MapIcon },
]

export function LedgerTabs({ initialTab }: { initialTab: LedgerTabId }) {
  const [active, setActive] = useState<LedgerTabId>(initialTab)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function select(id: LedgerTabId, focus = false) {
    setActive(id)
    window.history.replaceState(null, '', id === 'departments' ? '/ledger' : `/ledger?tab=${id}`)
    if (focus) refs.current[id]?.focus()
  }

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = LEDGER_TABS.length - 1
    const next =
      e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    select(LEDGER_TABS[next].id, true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Ledger views" className="flex gap-1 overflow-x-auto border-b border-border">
        {LEDGER_TABS.map(({ id, label, icon: Icon }, i) => {
          const selected = active === id
          return (
            <button
              key={id}
              ref={(el) => {
                refs.current[id] = el
              }}
              role="tab"
              type="button"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold',
                selected
                  ? 'border-saffron text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      {LEDGER_TABS.map(({ id }) => (
        <div key={id} role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={active !== id} tabIndex={0}>
          {active === id &&
            (id === 'departments' ? <DepartmentsPanel /> : id === 'complaints' ? <ComplaintsPanel /> : <MapPanel />)}
        </div>
      ))}
    </div>
  )
}
