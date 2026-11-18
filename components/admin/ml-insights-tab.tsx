'use client'

import { useState } from 'react'
import {
  BarChart3,
  BrainCircuit,
  FileText,
  Flame,
  Grid3X3,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { CATEGORIES, type ComplaintCategory } from '@/lib/api'
import { useComplaints, useHotspots } from '@/lib/use-ledger'
import { cn } from '@/lib/utils'

interface MlInsightsTabProps {
  onSelectHotspotFilter?: (ward: string, category: ComplaintCategory) => void
}

/* ------------------------------------------------------------------ */
/* 1. Image Classifier Measured Metrics (CLIP + Logistic Regression)  */
/* ------------------------------------------------------------------ */
const IMAGE_MODEL = {
  name: 'Visual Issue Classifier',
  architecture: 'CLIP embeddings + logistic regression',
  totalImages: 939,
  testImages: 188,
  trainedAccuracy: 96.8,
  zeroShotAccuracy: 56.4,
  accuracyDelta: '+40.4%',
  macroF1: 0.961,
  cvMean: 93.4,
  cvStd: 2.4,
}

const IMAGE_CLASSES = [
  { id: 'damaged_infrastructure', label: 'Damaged Infra', full: 'damaged_infrastructure' },
  { id: 'garbage', label: 'Garbage', full: 'garbage' },
  { id: 'no_issue', label: 'No Issue', full: 'no_issue' },
  { id: 'pothole', label: 'Pothole', full: 'pothole' },
  { id: 'streetlight', label: 'Streetlight', full: 'streetlight' },
  { id: 'water_leakage', label: 'Water Leakage', full: 'water_leakage' },
]

// Rows = Actual Ground Truth, Columns = Predicted Class
// Order: [damaged_infrastructure, garbage, no_issue, pothole, streetlight, water_leakage]
const IMAGE_CONFUSION_MATRIX: number[][] = [
  [19, 0, 0, 0, 0, 0],
  [0, 43, 0, 0, 0, 0],
  [0, 0, 15, 0, 2, 1],
  [0, 1, 0, 42, 0, 0],
  [0, 0, 0, 0, 38, 0],
  [1, 0, 0, 1, 0, 25],
]

/* ------------------------------------------------------------------ */
/* 2. Text Classifier Measured Metrics (MiniLM + Logistic Regression) */
/* ------------------------------------------------------------------ */
const TEXT_MODEL = {
  name: 'Department Routing Text Classifier',
  architecture: 'MiniLM + logistic regression',
  totalComplaints: 210,
  testComplaints: 42,
  trainedAccuracy: 90.5,
  tfidfBaseline: 83.3,
  accuracyDelta: '+7.2%',
  cvMean: 88.1,
  cvStd: 3.7,
}

const TEXT_CLASSES = [
  { id: 'Electricity', label: 'Electricity', full: 'Electricity' },
  { id: 'Hospitals', label: 'Hospitals', full: 'Hospitals' },
  { id: 'Hostel_Food', label: 'Hostel & Food', full: 'Hostel_Food' },
  { id: 'Roads', label: 'Roads', full: 'Roads' },
  { id: 'Sanitation', label: 'Sanitation', full: 'Sanitation' },
  { id: 'Schools', label: 'Schools', full: 'Schools' },
  { id: 'Water_Supply', label: 'Water Supply', full: 'Water_Supply' },
]

// Rows = Actual Ground Truth, Columns = Predicted Class
// Order: [Electricity, Hospitals, Hostel_Food, Roads, Sanitation, Schools, Water_Supply]
const TEXT_CONFUSION_MATRIX: number[][] = [
  [5, 0, 0, 1, 0, 0, 0],
  [0, 5, 0, 0, 0, 0, 1],
  [0, 0, 6, 0, 0, 0, 0],
  [0, 0, 1, 5, 0, 0, 0],
  [0, 0, 0, 0, 5, 0, 1],
  [0, 0, 0, 0, 0, 6, 0],
  [0, 0, 0, 0, 0, 0, 6],
]

interface HoverCellState {
  actual: string
  predicted: string
  count: number
  totalInRow: number
}

export function MlInsightsTab({ onSelectHotspotFilter }: MlInsightsTabProps) {
  const { data: complaints = [] } = useComplaints()
  const { data: hotspots = [] } = useHotspots()

  const [hoveredImageCell, setHoveredImageCell] = useState<HoverCellState | null>(null)
  const [hoveredTextCell, setHoveredTextCell] = useState<HoverCellState | null>(null)

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
      {/* 0. Top Evaluation Banner & Rule-Based Severity Note */}
      <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-saffron/40 bg-saffron/15 text-saffron-ink">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Machine Learning Evaluation Dashboard
                </h2>
                <span className="rounded-xs border border-success/40 bg-success/15 px-2 py-0.5 font-mono text-[10px] font-bold text-success uppercase">
                  Measured Results
                </span>
              </div>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                Empirical evaluation metrics and confusion matrices for the visual triage model (CLIP + Logistic Regression) and complaint description routing model (MiniLM + Logistic Regression).
              </p>
            </div>
          </div>

          {/* Severity Note */}
          <div className="flex max-w-md items-start gap-2.5 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-saffron-ink" aria-hidden="true" />
            <div className="leading-relaxed">
              <span className="font-semibold text-foreground">Note on Severity:</span> Case severity triage (Critical, High, Medium, Low) is <strong className="text-foreground">rule-based</strong> using deterministic municipal heuristics (category hazard rating, SLA duration open, and resident upvote count), not an ML model classification.
            </div>
          </div>
        </div>
      </div>

      {/* 1. Panel: Image Classifier (CLIP embeddings + logistic regression) */}
      <section aria-labelledby="heading-image-model" className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 shadow-xs">
        {/* Panel Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-saffron" aria-hidden="true" />
            <h3 id="heading-image-model" className="font-serif text-xl font-semibold text-foreground">
              Image Classifier — CLIP Embeddings + Logistic Regression
            </h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Dataset: {IMAGE_MODEL.totalImages} images ({IMAGE_MODEL.testImages} test split)
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Card 1 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trained Accuracy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {IMAGE_MODEL.trainedAccuracy}%
              </span>
              <span className="font-mono text-xs font-semibold text-success">
                {IMAGE_MODEL.accuracyDelta}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">182 / 188 correct predictions</span>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Zero-Shot Baseline
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {IMAGE_MODEL.zeroShotAccuracy}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Pretrained CLIP zero-shot</span>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Macro-F1 Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {IMAGE_MODEL.macroF1}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Balanced across all 6 classes</span>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              5-Fold Cross-Val
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {IMAGE_MODEL.cvMean}%
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ± {IMAGE_MODEL.cvStd}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Stratified 5-fold cross-validation</span>
          </div>
        </div>

        {/* Confusion Matrix Heatmap */}
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Grid3X3 className="size-4 text-saffron" aria-hidden="true" />
              <span>Image Confusion Matrix (Test Split N = {IMAGE_MODEL.testImages})</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Rows = Actual Ground Truth &bull; Columns = Predicted Class
            </span>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-background p-4">
            <div className="min-w-[580px]">
              <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-1 text-xs">
                {/* Top-left Corner Header */}
                <div className="p-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                  Actual ↓ / Pred →
                </div>

                {/* Column Headers */}
                {IMAGE_CLASSES.map((col) => (
                  <div
                    key={col.id}
                    className="p-2 text-center font-semibold text-foreground text-[11px] truncate"
                    title={col.full}
                  >
                    {col.label}
                  </div>
                ))}

                {/* Matrix Rows */}
                {IMAGE_CLASSES.map((rowItem, rIdx) => {
                  const rowSum = IMAGE_CONFUSION_MATRIX[rIdx].reduce((a, b) => a + b, 0)
                  return (
                    <div key={rowItem.id} className="contents">
                      {/* Row Label */}
                      <div
                        className="flex items-center py-2 pr-3 font-semibold text-foreground text-xs truncate"
                        title={`${rowItem.full} (Total: ${rowSum})`}
                      >
                        {rowItem.label}
                      </div>

                      {/* Cells */}
                      {IMAGE_CLASSES.map((colItem, cIdx) => {
                        const count = IMAGE_CONFUSION_MATRIX[rIdx][cIdx]
                        const isDiagonal = rIdx === cIdx

                        let cellStyle = 'bg-muted/30 text-muted-foreground/40 font-normal'
                        if (isDiagonal) {
                          cellStyle = 'bg-primary text-primary-foreground font-bold shadow-xs'
                        } else if (count > 0) {
                          cellStyle = 'bg-saffron/25 text-saffron-ink font-semibold border border-saffron/40'
                        }

                        return (
                          <div
                            key={colItem.id}
                            onMouseEnter={() =>
                              setHoveredImageCell({
                                actual: rowItem.label,
                                predicted: colItem.label,
                                count,
                                totalInRow: rowSum,
                              })
                            }
                            onMouseLeave={() => setHoveredImageCell(null)}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`Actual: ${rowItem.label}, Predicted: ${colItem.label}, Count: ${count}`}
                            className={cn(
                              'flex aspect-[1.4/1] items-center justify-center rounded-sm text-xs tabular-nums transition-transform hover:scale-105 hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-default',
                              cellStyle,
                            )}
                          >
                            {count}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Heatmap Footer Legend & Hover Inspector */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Legend:</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-3 rounded-xs bg-primary" /> Diagonal Match (Correct)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-3 rounded-xs border border-saffron/40 bg-saffron/25" /> Misclassification
                  </span>
                </div>
                <div className="font-mono text-xs">
                  {hoveredImageCell ? (
                    <span>
                      Actual: <strong className="text-foreground">{hoveredImageCell.actual}</strong> → Predicted:{' '}
                      <strong className="text-foreground">{hoveredImageCell.predicted}</strong> ({hoveredImageCell.count}{' '}
                      of {hoveredImageCell.totalInRow} cases,{' '}
                      {hoveredImageCell.totalInRow > 0
                        ? Math.round((hoveredImageCell.count / hoveredImageCell.totalInRow) * 100)
                        : 0}
                      %)
                    </span>
                  ) : (
                    <span>Hover any cell to inspect breakdown</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Panel: Text Classifier (MiniLM + logistic regression) */}
      <section aria-labelledby="heading-text-model" className="flex flex-col gap-4 rounded-md border border-border bg-card p-5 shadow-xs">
        {/* Panel Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-saffron" aria-hidden="true" />
            <h3 id="heading-text-model" className="font-serif text-xl font-semibold text-foreground">
              Text Classifier — MiniLM + Logistic Regression
            </h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Dataset: {TEXT_MODEL.totalComplaints} complaints ({TEXT_MODEL.testComplaints} test split)
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Card 1 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trained Accuracy
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {TEXT_MODEL.trainedAccuracy}%
              </span>
              <span className="font-mono text-xs font-semibold text-success">
                {TEXT_MODEL.accuracyDelta}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">38 / 42 correct department routings</span>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              TF-IDF Baseline
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {TEXT_MODEL.tfidfBaseline}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Traditional n-gram TF-IDF baseline</span>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col gap-1 rounded-md border border-border bg-background p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              5-Fold Cross-Val
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold tabular-nums text-foreground">
                {TEXT_MODEL.cvMean}%
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ± {TEXT_MODEL.cvStd}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Stratified 5-fold cross-validation</span>
          </div>
        </div>

        {/* Confusion Matrix Heatmap */}
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Grid3X3 className="size-4 text-saffron" aria-hidden="true" />
              <span>Department Confusion Matrix (Test Split N = {TEXT_MODEL.testComplaints})</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Rows = Actual Department &bull; Columns = Predicted Department
            </span>
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-background p-4">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[130px_repeat(7,1fr)] gap-1 text-xs">
                {/* Top-left Corner Header */}
                <div className="p-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                  Actual ↓ / Pred →
                </div>

                {/* Column Headers */}
                {TEXT_CLASSES.map((col) => (
                  <div
                    key={col.id}
                    className="p-2 text-center font-semibold text-foreground text-[11px] truncate"
                    title={col.full}
                  >
                    {col.label}
                  </div>
                ))}

                {/* Matrix Rows */}
                {TEXT_CLASSES.map((rowItem, rIdx) => {
                  const rowSum = TEXT_CONFUSION_MATRIX[rIdx].reduce((a, b) => a + b, 0)
                  return (
                    <div key={rowItem.id} className="contents">
                      {/* Row Label */}
                      <div
                        className="flex items-center py-2 pr-3 font-semibold text-foreground text-xs truncate"
                        title={`${rowItem.full} (Total: ${rowSum})`}
                      >
                        {rowItem.label}
                      </div>

                      {/* Cells */}
                      {TEXT_CLASSES.map((colItem, cIdx) => {
                        const count = TEXT_CONFUSION_MATRIX[rIdx][cIdx]
                        const isDiagonal = rIdx === cIdx

                        let cellStyle = 'bg-muted/30 text-muted-foreground/40 font-normal'
                        if (isDiagonal) {
                          cellStyle = 'bg-primary text-primary-foreground font-bold shadow-xs'
                        } else if (count > 0) {
                          cellStyle = 'bg-saffron/25 text-saffron-ink font-semibold border border-saffron/40'
                        }

                        return (
                          <div
                            key={colItem.id}
                            onMouseEnter={() =>
                              setHoveredTextCell({
                                actual: rowItem.label,
                                predicted: colItem.label,
                                count,
                                totalInRow: rowSum,
                              })
                            }
                            onMouseLeave={() => setHoveredTextCell(null)}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`Actual: ${rowItem.label}, Predicted: ${colItem.label}, Count: ${count}`}
                            className={cn(
                              'flex aspect-[1.3/1] items-center justify-center rounded-sm text-xs tabular-nums transition-transform hover:scale-105 hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-default',
                              cellStyle,
                            )}
                          >
                            {count}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Heatmap Footer Legend & Hover Inspector */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Legend:</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-3 rounded-xs bg-primary" /> Diagonal Match (Correct)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-3 rounded-xs border border-saffron/40 bg-saffron/25" /> Misclassification
                  </span>
                </div>
                <div className="font-mono text-xs">
                  {hoveredTextCell ? (
                    <span>
                      Actual: <strong className="text-foreground">{hoveredTextCell.actual}</strong> → Predicted:{' '}
                      <strong className="text-foreground">{hoveredTextCell.predicted}</strong> ({hoveredTextCell.count}{' '}
                      of {hoveredTextCell.totalInRow} cases,{' '}
                      {hoveredTextCell.totalInRow > 0
                        ? Math.round((hoveredTextCell.count / hoveredTextCell.totalInRow) * 100)
                        : 0}
                      %)
                    </span>
                  ) : (
                    <span>Hover any cell to inspect breakdown</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Complaints Volume by Category Chart */}
      <section aria-labelledby="heading-category-chart" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-saffron" aria-hidden="true" />
            <h3 id="heading-category-chart" className="font-serif text-2xl font-semibold text-foreground">
              Complaints Volume by Category
            </h3>
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

      {/* 4. Hotspot Spatial Clusters */}
      <section aria-labelledby="heading-hotspots" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-border pb-2">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-saffron" aria-hidden="true" />
            <h3 id="heading-hotspots" className="font-serif text-2xl font-semibold text-foreground">
              Hotspot Spatial Clusters
            </h3>
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
