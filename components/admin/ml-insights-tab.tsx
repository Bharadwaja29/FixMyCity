'use client'

import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Flame,
  Grid3X3,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { CATEGORIES, type ComplaintCategory, type Hotspot } from '@/lib/api'
import { useComplaints, useHotspots } from '@/lib/use-ledger'
import { cn } from '@/lib/utils'

interface MlInsightsTabProps {
  onSelectHotspotFilter?: (ward: string, category: ComplaintCategory) => void
}

/* ------------------------------------------------------------------ */
/* Model Performance Placeholders (Clearly labeled for replacement)    */
/* ------------------------------------------------------------------ */
const MODEL_METRICS = {
  version: 'civic-vit-base-patch16-224 (v0.3)',
  evalDataset: 'Bhagalpur Civic Validation Split (N = 1,420 images)',
  accuracy: 92.4,
  accuracyDelta: '+1.8%',
  macroF1: 0.912,
  severityF1: 0.887,
  duplicateAuroc: 0.954,
  gpuLatencyMs: 38,
  cpuLatencyMs: 410,
}

const CATEGORY_METRICS = [
  { category: 'Pothole', precision: 94.2, recall: 93.1, f1: 0.936, n: 240 },
  { category: 'Streetlight', precision: 96.5, recall: 95.0, f1: 0.957, n: 195 },
  { category: 'Garbage', precision: 91.8, recall: 90.4, f1: 0.911, n: 210 },
  { category: 'Drainage', precision: 88.4, recall: 87.2, f1: 0.878, n: 180 },
  { category: 'Water Supply', precision: 89.6, recall: 91.5, f1: 0.905, n: 175 },
  { category: 'Encroachment', precision: 90.1, recall: 89.0, f1: 0.895, n: 140 },
  { category: 'School Facilities', precision: 93.7, recall: 92.1, f1: 0.929, n: 110 },
  { category: 'Hospital Services', precision: 95.2, recall: 94.6, f1: 0.949, n: 90 },
  { category: 'Food Safety', precision: 89.0, recall: 88.5, f1: 0.887, n: 80 },
]

/* ------------------------------------------------------------------ */
/* Confusion Matrix for Image Classifier (6 Core Civic Categories)    */
/* Normalized percentages: Rows = Actual Ground Truth, Cols = Predicted */
/* ------------------------------------------------------------------ */
const CONFUSION_CLASSES: ComplaintCategory[] = [
  'Pothole',
  'Streetlight',
  'Garbage',
  'Drainage',
  'Water Supply',
  'Encroachment',
]

const CONFUSION_MATRIX: Record<string, Record<string, number>> = {
  Pothole: {
    Pothole: 94,
    Streetlight: 0,
    Garbage: 2,
    Drainage: 3,
    'Water Supply': 1,
    Encroachment: 0,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  Streetlight: {
    Pothole: 0,
    Streetlight: 96,
    Garbage: 1,
    Drainage: 0,
    'Water Supply': 1,
    Encroachment: 2,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  Garbage: {
    Pothole: 2,
    Streetlight: 1,
    Garbage: 91,
    Drainage: 3,
    'Water Supply': 0,
    Encroachment: 3,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  Drainage: {
    Pothole: 2,
    Streetlight: 0,
    Garbage: 3,
    Drainage: 88,
    'Water Supply': 6,
    Encroachment: 1,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  'Water Supply': {
    Pothole: 1,
    Streetlight: 0,
    Garbage: 1,
    Drainage: 7,
    'Water Supply': 90,
    Encroachment: 1,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  Encroachment: {
    Pothole: 1,
    Streetlight: 2,
    Garbage: 4,
    Drainage: 1,
    'Water Supply': 1,
    Encroachment: 91,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  'School Facilities': {
    Pothole: 0,
    Streetlight: 0,
    Garbage: 0,
    Drainage: 0,
    'Water Supply': 0,
    Encroachment: 0,
    'School Facilities': 93,
    'Hospital Services': 0,
    'Food Safety': 0,
  },
  'Hospital Services': {
    Pothole: 0,
    Streetlight: 0,
    Garbage: 0,
    Drainage: 0,
    'Water Supply': 0,
    Encroachment: 0,
    'School Facilities': 0,
    'Hospital Services': 95,
    'Food Safety': 0,
  },
  'Food Safety': {
    Pothole: 0,
    Streetlight: 0,
    Garbage: 0,
    Drainage: 0,
    'Water Supply': 0,
    Encroachment: 0,
    'School Facilities': 0,
    'Hospital Services': 0,
    'Food Safety': 89,
  },
}

export function MlInsightsTab({ onSelectHotspotFilter }: MlInsightsTabProps) {
  const { data: complaints = [] } = useComplaints()
  const { data: hotspots = [] } = useHotspots()
  const [hoveredCell, setHoveredCell] = useState<{ actual: string; predicted: string; val: number } | null>(null)

  // Compute live breakdown by category from complaints store
  const categoryStats = CATEGORIES.map((cat) => {
    const list = complaints.filter((c) => c.category === cat)
    const open = list.filter((c) => c.status !== 'resolved').length
    const resolved = list.filter((c) => c.status === 'resolved').length
    return {
      category: cat,
      total: list.length,
      open,
      resolved,
      resolvedPct: list.length ? Math.round((resolved / list.length) * 100) : 0,
    }
  }).sort((a, b) => b.total - a.total)

  const maxCategoryCount = Math.max(1, ...categoryStats.map((c) => c.total))

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-md border border-saffron bg-saffron/10 p-4 text-xs">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-saffron" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">
            Machine Learning Evaluation Dashboard (Placeholder Metrics)
          </p>
          <p className="leading-relaxed text-muted-foreground">
            The values below reflect evaluation benchmark targets for model{' '}
            <code className="rounded-sm bg-background px-1 py-0.5 font-mono font-semibold text-foreground">
              {MODEL_METRICS.version}
            </code>{' '}
            tested against the {MODEL_METRICS.evalDataset}. Replace with real production model evaluation outputs as models are re-trained.
          </p>
        </div>
      </div>

      {/* 1. Accuracy / F1 Cards */}
      <section aria-labelledby="heading-eval-cards" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <h2 id="heading-eval-cards" className="font-serif text-2xl font-semibold text-foreground">
            Model Performance Benchmarks
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Eval dataset: N = 1,420 civic photos
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Card 1 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top-1 Accuracy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {MODEL_METRICS.accuracy}%
              </span>
              <span className="text-xs font-semibold text-success">
                {MODEL_METRICS.accuracyDelta}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Overall class match</span>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Macro F1-Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {MODEL_METRICS.macroF1}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Balanced across 9 classes</span>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Severity F1
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {MODEL_METRICS.severityF1}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Urgency classification</span>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Duplicate AUROC
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {MODEL_METRICS.duplicateAuroc}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Embeddings similarity</span>
          </div>

          {/* Card 5 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inference Time
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {MODEL_METRICS.gpuLatencyMs}ms
              </span>
              <span className="text-[11px] text-muted-foreground">GPU</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{MODEL_METRICS.cpuLatencyMs}ms CPU fallback</span>
          </div>
        </div>
      </section>

      {/* 2. Confusion Matrix Heatmap */}
      <section aria-labelledby="heading-confusion-matrix" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <div className="flex items-center gap-2">
            <Grid3X3 className="size-5 text-saffron" aria-hidden="true" />
            <h2 id="heading-confusion-matrix" className="font-serif text-2xl font-semibold text-foreground">
              Image Classifier Confusion Matrix
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Normalized accuracy % (Ground Truth vs Predicted Class)
          </span>
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-card p-5">
          <div className="min-w-[620px]">
            {/* Heatmap Grid */}
            <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-1 text-xs">
              {/* Top Header Corner */}
              <div className="p-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                Actual ↓ / Pred →
              </div>

              {/* Column Headers (Predicted) */}
              {CONFUSION_CLASSES.map((col) => (
                <div
                  key={col}
                  className="p-2 text-center font-semibold text-foreground text-[11px] line-clamp-1 truncate"
                  title={col}
                >
                  {col}
                </div>
              ))}

              {/* Rows */}
              {CONFUSION_CLASSES.map((row) => (
                <div key={row} className="contents">
                  {/* Row Label (Actual) */}
                  <div className="flex items-center py-2 pr-3 font-semibold text-foreground text-xs line-clamp-1 truncate" title={row}>
                    {row}
                  </div>

                  {/* Cells */}
                  {CONFUSION_CLASSES.map((col) => {
                    const val = CONFUSION_MATRIX[row]?.[col] ?? 0
                    const isDiagonal = row === col

                    // Color density styling
                    let bgClass = 'bg-muted/40 text-muted-foreground'
                    if (isDiagonal) {
                      if (val >= 94) bgClass = 'bg-primary text-primary-foreground font-bold'
                      else if (val >= 90) bgClass = 'bg-primary/90 text-primary-foreground font-bold'
                      else bgClass = 'bg-primary/80 text-primary-foreground font-semibold'
                    } else if (val >= 5) {
                      bgClass = 'bg-saffron/40 font-semibold text-foreground'
                    } else if (val > 0) {
                      bgClass = 'bg-saffron/15 text-muted-foreground'
                    }

                    return (
                      <div
                        key={col}
                        onMouseEnter={() => setHoveredCell({ actual: row, predicted: col, val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`Actual: ${row}, Predicted: ${col}, ${val}%`}
                        className={cn(
                          'flex aspect-[1.4/1] items-center justify-center rounded-sm text-xs tabular-nums transition-transform hover:scale-105 hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-default',
                          bgClass,
                        )}
                      >
                        {val}%
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend and Inspect note */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Legend:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded-sm bg-primary" /> Diagonal Match (High Accuracy)
                </span>
                <span className="inline-flex items-center gap-1 ml-2">
                  <span className="size-3 rounded-sm bg-saffron/40" /> Class Confusion (5%+ error)
                </span>
              </div>
              <div className="font-mono text-xs">
                {hoveredCell ? (
                  <span>
                    Actual: <strong className="text-foreground">{hoveredCell.actual}</strong> → Predicted:{' '}
                    <strong className="text-foreground">{hoveredCell.predicted}</strong> ({hoveredCell.val}%)
                  </span>
                ) : (
                  <span>Hover any cell to inspect classification breakdown</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Complaints by Category Chart */}
      <section aria-labelledby="heading-category-chart" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-saffron" aria-hidden="true" />
            <h2 id="heading-category-chart" className="font-serif text-2xl font-semibold text-foreground">
              Complaints Volume by Category
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Live counts from municipal register
          </span>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <ul className="flex flex-col gap-3.5" aria-label="Complaints by Category">
            {categoryStats.map((item) => {
              const totalPct = Math.round((item.total / maxCategoryCount) * 100)
              const openPct = item.total ? Math.round((item.open / item.total) * 100) : 0
              const resolvedPct = item.total ? 100 - openPct : 0

              return (
                <li key={item.category} className="grid grid-cols-[140px_1fr_90px] items-center gap-4 text-xs">
                  <span className="font-semibold text-foreground truncate" title={item.category}>
                    {item.category}
                  </span>

                  <div className="relative h-6 w-full overflow-hidden rounded-sm bg-muted flex">
                    {/* Open part (Saffron) */}
                    <div
                      className="h-full bg-saffron transition-all"
                      style={{ width: `${(totalPct * openPct) / 100}%` }}
                      title={`${item.open} open cases`}
                    />
                    {/* Resolved part (Navy Primary) */}
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(totalPct * resolvedPct) / 100}%` }}
                      title={`${item.resolved} resolved cases`}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 font-mono tabular-nums">
                    <span className="font-bold text-foreground">{item.total}</span>
                    <span className="text-muted-foreground text-[11px]">({item.open} open)</span>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-saffron" /> Open / In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-primary" /> Resolved
              </span>
            </div>
            <span>Total cases: {complaints.length}</span>
          </div>
        </div>
      </section>

      {/* 4. Hotspot Clusters */}
      <section aria-labelledby="heading-hotspots" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-saffron" aria-hidden="true" />
            <h2 id="heading-hotspots" className="font-serif text-2xl font-semibold text-foreground">
              Hotspot Spatial Clusters
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Density clusters aggregated within 450m radius
          </span>
        </div>

        {hotspots.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No active hotspot clusters detected.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotspots.map((hs) => {
              const intensityPct = Math.round(hs.intensity * 100)
              return (
                <div
                  key={hs.id}
                  className="flex flex-col justify-between gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-4 text-saffron shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-foreground">{hs.ward}</span>
                      </div>
                      <span className="rounded-sm border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-destructive tabular-nums">
                        {hs.count} cases
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Top issue:</span>
                        <span className="font-semibold text-foreground">{hs.topCategory}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Spread radius:</span>
                        <span className="font-mono tabular-nums">{hs.radiusM} m</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Cluster intensity:</span>
                        <span className="font-mono tabular-nums font-semibold text-foreground">{intensityPct}%</span>
                      </div>
                    </div>

                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-muted">
                      <div className="h-full bg-destructive transition-all" style={{ width: `${intensityPct}%` }} />
                    </div>
                  </div>

                  {onSelectHotspotFilter && (
                    <button
                      type="button"
                      onClick={() => onSelectHotspotFilter(hs.ward, hs.topCategory)}
                      className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md border border-input bg-secondary text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none"
                    >
                      Filter queue for this hotspot
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
