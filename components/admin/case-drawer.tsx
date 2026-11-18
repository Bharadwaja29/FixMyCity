'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitMerge,
  ImageOff,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { StatusBadge } from '@/components/case/status-badge'
import { SeverityChip } from '@/components/report/severity-chip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatKolkataDate } from '@/lib/format'
import {
  COMPLAINT_STATUSES,
  STATUS_LABEL,
  type ComplaintStatus,
} from '@/lib/api'
import { mutateComplaintStatus, mutateMergeDuplicate, useAdminComplaintDetail } from '@/lib/use-admin'
import { cn } from '@/lib/utils'

interface CaseDrawerProps {
  complaintId: string | null
  open: boolean
  onClose: () => void
  onUpdateSuccess: () => void
}

export function CaseDrawer({
  complaintId,
  open,
  onClose,
  onUpdateSuccess,
}: CaseDrawerProps) {
  const { data, error, isLoading, mutate } = useAdminComplaintDetail(complaintId)

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('in_progress')
  const [officerNote, setOfficerNote] = useState('')
  const [officerName, setOfficerName] = useState('Rajiv Sharma')
  const [officerRole, setOfficerRole] = useState('Ward 14 Nodal Officer')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null)
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string | null>(null)

  const [mergingTargetId, setMergingTargetId] = useState<string | null>(null)
  const [mergeSuccessMsg, setMergeSuccessMsg] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Sync state when new complaint opens
  useEffect(() => {
    if (data?.detail.complaint) {
      setSelectedStatus(data.detail.complaint.status)
      setOfficerNote('')
      setUpdateSuccessMsg(null)
      setUpdateErrorMsg(null)
      setMergeSuccessMsg(null)
      setImageError(false)
    }
  }, [data?.detail.complaint])

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !complaintId) return null

  const detail = data?.detail
  const complaint = detail?.complaint
  const duplicates = data?.duplicates ?? []
  const sla = data?.sla

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaint) return

    setIsUpdating(true)
    setUpdateSuccessMsg(null)
    setUpdateErrorMsg(null)

    try {
      await mutateComplaintStatus(complaint.id, {
        status: selectedStatus,
        note: officerNote,
        officerName,
        officerRole,
      })
      setUpdateSuccessMsg(
        `Status updated to ${STATUS_LABEL[selectedStatus]}. The timeline on /track is now updated.`,
      )
      setOfficerNote('')
      await mutate()
      onUpdateSuccess()
    } catch (err) {
      setUpdateErrorMsg((err as Error).message || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMergeDuplicate = async (targetId: string) => {
    if (!complaint) return
    const confirmed = window.confirm(
      `Merge ${complaint.id} into primary case ${targetId}? This will resolve ${complaint.id} and transfer its citizen supporters.`,
    )
    if (!confirmed) return

    setMergingTargetId(targetId)
    setMergeSuccessMsg(null)

    try {
      await mutateMergeDuplicate(
        complaint.id,
        targetId,
        `Merged by officer into primary case ${targetId}.`,
      )
      setMergeSuccessMsg(
        `Merged successfully into ${targetId}! Case marked resolved and supporters transferred.`,
      )
      await mutate()
      onUpdateSuccess()
    } catch (err) {
      alert((err as Error).message || 'Failed to merge duplicate')
    } finally {
      setMergingTargetId(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-xs transition-opacity"
    >
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Case Drawer
              </span>
              {complaint && (
                <Link
                  href={`/track?id=${complaint.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline underline-offset-2 hover:text-saffron"
                  title="Open live public case file on /track"
                >
                  <span>Track file</span>
                  <ExternalLink className="size-3" aria-hidden="true" />
                </Link>
              )}
            </div>
            <h2 id="drawer-title" className="font-mono text-xl font-bold tracking-tight text-foreground">
              {complaintId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-md border border-input p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex flex-col gap-6 p-6">
          {isLoading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="size-5 shrink-0" />
              <p>Failed to load case file: {error.message}</p>
            </div>
          )}

          {detail && complaint && (
            <>
              {/* Case Title and Status Bar */}
              <div className="flex flex-col gap-3 rounded-md border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={complaint.status} />
                    <SeverityChip severity={complaint.severity ?? 'Medium'} />
                  </div>
                  {sla && (
                    <span
                      className={cn(
                        'rounded-sm border px-2 py-0.5 text-xs font-semibold',
                        sla.isOverdue
                          ? 'border-destructive bg-destructive/15 text-destructive'
                          : 'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {sla.label}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl font-semibold leading-snug">{complaint.title}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 border-t border-dashed border-border pt-3">
                  <div>
                    <span className="text-muted-foreground">Department: </span>
                    <span className="font-semibold">{complaint.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ward: </span>
                    <span className="font-semibold">{complaint.ward}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filed: </span>
                    <span className="font-semibold tabular-nums">{formatKolkataDate(complaint.filedAt || complaint.filedOn)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days open: </span>
                    <span className="font-semibold tabular-nums">{detail.daysOpen}d</span>
                  </div>
                </div>
              </div>

              {/* Case File Section */}
              <section aria-labelledby="section-case-file" className="flex flex-col gap-3">
                <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                  <FileText className="size-4 text-saffron" aria-hidden="true" />
                  <h4 id="section-case-file">Citizen Case File</h4>
                </div>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                  {Boolean(
                    complaint.imageUrls &&
                    complaint.imageUrls.length > 0 &&
                    complaint.imageUrls.some((u) => Boolean(u && u.trim() && u !== '/placeholder.jpg')) &&
                    detail.photoUrl &&
                    detail.photoUrl !== '/placeholder.jpg'
                  ) && !imageError ? (
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <Image
                        src={detail.photoUrl}
                        alt={`Evidence photo for ${complaint.title}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 border-b border-dashed border-border bg-muted/60 p-6 text-center">
                      <ImageOff className="size-7 text-muted-foreground/50" aria-hidden="true" />
                      <p className="text-xs font-medium text-muted-foreground">
                        No photo attached to this complaint
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 p-4 text-sm">
                    {complaint.description && (
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Citizen description
                        </span>
                        <p className="mt-1 leading-relaxed text-foreground">{complaint.description}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>{complaint.landmark || 'No landmark specified'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Users className="size-3.5 text-saffron" aria-hidden="true" />
                        <span className="tabular-nums font-semibold">{detail.supporters}</span> residents support this report
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Analysis Section */}
              <section aria-labelledby="section-ai-analysis" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    <Sparkles className="size-4 text-saffron" aria-hidden="true" />
                    <h4 id="section-ai-analysis">AI Image Classifier & Triage</h4>
                  </div>
                  <span className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {detail.analysis.modelVersion}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/20 p-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Detected Issue:</span>
                    <p className="font-semibold text-foreground">{detail.analysis.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Classification Conf.:</span>
                    <p className="font-semibold tabular-nums text-foreground">
                      {Math.round(detail.analysis.confidence * 100)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Suggested Severity:</span>
                    <p className="font-semibold text-foreground">{detail.analysis.severity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority Score:</span>
                    <p className="font-mono font-bold text-destructive">
                      {data.priorityScore}/100
                    </p>
                  </div>
                </div>
              </section>

              {/* Similar / Duplicate links & Merge Action */}
              <section aria-labelledby="section-duplicates" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                    <GitMerge className="size-4 text-saffron" aria-hidden="true" />
                    <h4 id="section-duplicates">Similar Cases & Deduplication</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {duplicates.length} candidates nearby
                  </span>
                </div>

                {mergeSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-md border border-success bg-success/10 p-3 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{mergeSuccessMsg}</span>
                  </div>
                )}

                {duplicates.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No matching duplicates found within 600m.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {duplicates.map((dup) => {
                      const matchPct = Math.round(dup.overall * 100)
                      const isMerging = mergingTargetId === dup.complaint.id
                      return (
                        <li
                          key={dup.complaint.id}
                          className="flex flex-col gap-2.5 rounded-md border border-border bg-card p-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-foreground">
                                  {dup.complaint.id}
                                </span>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-medium">{dup.complaint.category}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="tabular-nums text-muted-foreground">
                                  {dup.distanceM}m away
                                </span>
                              </div>
                              <p className="line-clamp-1 text-foreground font-medium">{dup.complaint.title}</p>
                            </div>
                            <span className="font-mono text-sm font-bold text-saffron-foreground tabular-nums">
                              {matchPct}% match
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 border-t border-dashed border-border pt-2 text-[11px] text-muted-foreground">
                            <div>
                              <span>Location: </span>
                              <span className="font-semibold tabular-nums text-foreground">
                                {Math.round(dup.breakdown.location * 100)}%
                              </span>
                            </div>
                            <div>
                              <span>Image: </span>
                              <span className="font-semibold tabular-nums text-foreground">
                                {Math.round(dup.breakdown.image * 100)}%
                              </span>
                            </div>
                            <div>
                              <span>Text: </span>
                              <span className="font-semibold tabular-nums text-foreground">
                                {Math.round(dup.breakdown.text * 100)}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isMerging || complaint.status === 'resolved'}
                              onClick={() => handleMergeDuplicate(dup.complaint.id)}
                              className="h-7 gap-1.5 text-xs font-semibold hover:border-saffron hover:bg-saffron/10"
                            >
                              {isMerging ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <GitMerge className="size-3" />
                              )}
                              <span>Merge as duplicate</span>
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Status dropdown and note box */}
              <section aria-labelledby="section-officer-action" className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                  <Calendar className="size-4 text-saffron" aria-hidden="true" />
                  <h4 id="section-officer-action">Update Status & Official Note</h4>
                </div>

                {updateSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-md border border-success bg-success/10 p-3 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{updateSuccessMsg}</span>
                  </div>
                )}

                {updateErrorMsg && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{updateErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleStatusSubmit} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="status-dropdown"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Status
                      </label>
                      <select
                        id="status-dropdown"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
                      >
                        {COMPLAINT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="officer-name"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Officer Name & Title
                      </label>
                      <input
                        id="officer-name"
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="Officer Name"
                        className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors focus:border-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="note-box"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Audit / Citizen Timeline Note
                    </label>
                    <textarea
                      id="note-box"
                      rows={3}
                      value={officerNote}
                      onChange={(e) => setOfficerNote(e.target.value)}
                      placeholder="Enter an official note. This appears directly on the citizen's /track timeline."
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Submitting updates the mock store and synchronizes with <code className="text-foreground">/track</code>.
                    </p>
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="h-9 gap-1.5 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
                      <span>Save Status Update</span>
                    </Button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
