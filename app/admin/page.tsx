'use client'

import { useDeferredValue, useState } from 'react'
import Link from 'next/link'
import {
  BrainCircuit,
  ClipboardList,
  Filter,
  LogOut,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { AdminFilterSidebar } from '@/components/admin/admin-filter-sidebar'
import { CaseDrawer } from '@/components/admin/case-drawer'
import { MlInsightsTab } from '@/components/admin/ml-insights-tab'
import { PriorityTable } from '@/components/admin/priority-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ComplaintCategory, ComplaintFilters, SortKey } from '@/lib/api'
import { useComplaints } from '@/lib/use-ledger'
import { cn } from '@/lib/utils'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'insights'>('queue')
  const [filters, setFilters] = useState<ComplaintFilters>({
    sort: 'priorityScore',
    dir: 'desc',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)

  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Fetch complaints with active filters
  const activeFilters: ComplaintFilters = {
    ...filters,
    q: deferredSearch.trim() || undefined,
  }

  const { data: allComplaints = [], isLoading, mutate } = useComplaints(activeFilters)
  const { data: baselineComplaints = [] } = useComplaints({})

  const handleFilterChange = (updated: Partial<ComplaintFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }))
  }

  const handleResetFilters = () => {
    setFilters({ sort: 'priorityScore', dir: 'desc' })
    setSearchQuery('')
  }

  const handleSort = (key: SortKey) => {
    setFilters((prev) => {
      const isCurrentKey = prev.sort === key
      const newDir = isCurrentKey && prev.dir === 'desc' ? 'asc' : 'desc'
      return { ...prev, sort: key, dir: newDir }
    })
  }

  const handleHotspotFilter = (ward: string, category: ComplaintCategory) => {
    setFilters({
      ward,
      category,
      sort: 'priorityScore',
      dir: 'desc',
    })
    setActiveTab('queue')
  }

  const openCasesCount = baselineComplaints.filter((c) => c.status !== 'resolved').length

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST' })
    } finally {
      window.location.href = '/admin/login'
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="rounded-sm border border-saffron bg-saffron/15 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-saffron-foreground">
              Officer Console
            </span>
            <span className="text-xs text-muted-foreground font-mono">Bhagalpur Municipal Corp</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Triage & Dispatch Desk
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage public complaints, review AI priority triages, merge duplicates, and update case resolutions.
          </p>
        </div>

        {/* Global Navigation Tabs & Officer Actions */}
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Console views"
            className="flex h-11 items-center rounded-md border border-input bg-card p-1 shadow-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'queue'}
              aria-controls="panel-queue"
              id="tab-queue"
              onClick={() => setActiveTab('queue')}
              className={cn(
                'flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeTab === 'queue'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ClipboardList className="size-4" aria-hidden="true" />
              <span>Priority Queue</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 font-mono text-[10px]',
                  activeTab === 'queue' ? 'bg-saffron text-foreground font-bold' : 'bg-muted text-muted-foreground',
                )}
              >
                {openCasesCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'insights'}
              aria-controls="panel-insights"
              id="tab-insights"
              onClick={() => setActiveTab('insights')}
              className={cn(
                'flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeTab === 'insights'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BrainCircuit className="size-4" aria-hidden="true" />
              <span>ML Insights</span>
              <span className="rounded-sm bg-saffron/20 px-1 py-0.2 text-[9px] font-bold text-saffron-foreground uppercase">
                Eval
              </span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-11 gap-1.5 border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Sign out of Officer Console"
            aria-label="Sign out of Officer Console"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Tab 1: Priority Queue */}
      {activeTab === 'queue' && (
        <div id="panel-queue" role="tabpanel" aria-labelledby="tab-queue" className="flex flex-col gap-4">
          {/* Quick Search & Mobile Filter Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, keyword, landmark, or ward..."
                className="pl-9 h-9 text-xs"
                aria-label="Search complaints"
              />
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="h-9 gap-1.5 text-xs font-semibold"
                aria-expanded={mobileFilterOpen}
                aria-controls="mobile-filter-drawer"
              >
                <Filter className="size-3.5" aria-hidden="true" />
                <span>Filters</span>
              </Button>
            </div>
          </div>

          {/* Mobile Collapsible Filter Drawer */}
          {mobileFilterOpen && (
            <div id="mobile-filter-drawer" className="lg:hidden">
              <AdminFilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                totalCount={baselineComplaints.length}
                filteredCount={allComplaints.length}
              />
            </div>
          )}

          {/* Main Layout: Left Sidebar + Table */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
            {/* Desktop Left Filter Sidebar */}
            <div className="hidden lg:block sticky top-20">
              <AdminFilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
                totalCount={baselineComplaints.length}
                filteredCount={allComplaints.length}
              />
            </div>

            {/* Main Table */}
            <div className="flex flex-col gap-3 min-w-0">
              <PriorityTable
                complaints={allComplaints}
                loading={isLoading}
                selectedId={selectedComplaintId}
                onSelectComplaint={(id) => setSelectedComplaintId(id)}
                sort={filters.sort ?? 'priorityScore'}
                dir={filters.dir ?? 'desc'}
                onSort={handleSort}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ML Insights */}
      {activeTab === 'insights' && (
        <div id="panel-insights" role="tabpanel" aria-labelledby="tab-insights">
          <MlInsightsTab onSelectHotspotFilter={handleHotspotFilter} />
        </div>
      )}

      {/* Side Drawer for Selected Complaint */}
      <CaseDrawer
        complaintId={selectedComplaintId}
        open={Boolean(selectedComplaintId)}
        onClose={() => setSelectedComplaintId(null)}
        onUpdateSuccess={() => {
          mutate()
        }}
      />
    </div>
  )
}
