'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import {
  CATEGORIES,
  DEFAULT_CENTER,
  type Complaint,
  type ComplaintCategory,
  type DuplicateMatch,
  type GeoPoint,
  type ImageAnalysis,
} from '@/lib/api'
import {
  analyzeImageAction,
  checkDuplicatesAction,
  submitComplaintAction,
  supportComplaintAction,
} from '@/app/report/actions'
import { ProgressRail } from './progress-rail'
import { EvidenceStep, type Photo } from './evidence-step'
import { LocationStep } from './location-step'
import { SimilarReports } from './similar-reports'
import { ReviewStep } from './review-step'
import { Receipt } from './receipt'
import { compressImage } from '@/lib/image-compression'

type Step = 1 | 2 | 3 | 'done'

const STEP_TITLES: Record<1 | 2 | 3, { title: string; body: string }> = {
  1: { title: 'Attach evidence', body: 'Clear photos help the department act faster. We will suggest a category from them.' },
  2: { title: 'Mark the location', body: 'Place the pin exactly where the problem is and add a landmark for the field team.' },
  3: { title: 'Review and file', body: 'Check the draft case file. Once filed, it is entered in the public register.' },
}

const STEP_OF_FIELD: Record<string, 1 | 2 | 3> = {
  photos: 1,
  category: 1,
  description: 1,
  severity: 1,
  landmark: 2,
  location: 2,
  confirm: 3,
}

export function ReportFlow() {
  const [step, setStep] = useState<Step>(1)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [category, setCategory] = useState<ComplaintCategory | ''>('')
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<GeoPoint>(DEFAULT_CENTER)
  const [landmark, setLandmark] = useState('')
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [supportingId, setSupportingId] = useState<string | null>(null)
  const [result, setResult] = useState<{ complaint: Complaint; kind: 'filed' | 'supported' } | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const analysisRequest = useRef(0)
  const photosRef = useRef(photos)
  photosRef.current = photos
  const categoryTouchedRef = useRef(false)
  const categoryRef = useRef(category)
  categoryRef.current = category
  const isFirstRender = useRef(true)

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
    headingRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [step, dismissedDuplicates])

  const clearError = (key: string) =>
    setErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })

  async function handlePhotosChange(next: Photo[]) {
    setPhotos(next)
    clearError('photos')
    const request = ++analysisRequest.current
    if (next.length === 0) {
      setAnalysis(null)
      setAnalyzing(false)
      setAnalysisError(null)
      if (!categoryTouchedRef.current && !categoryRef.current) setCategory('')
      return
    }
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const formData = new FormData()
      if (next[0]?.file) {
        const compressed = await compressImage(next[0].file, 1600, 0.8)
        formData.append('file', compressed)
      }
      if (description) formData.append('text', description)
      formData.append(
        'meta',
        JSON.stringify(next.map((p) => ({ name: p.file.name, size: p.file.size, type: p.file.type })))
      )
      const res = await analyzeImageAction(formData)
      if (request !== analysisRequest.current) return
      setAnalysis(res)
      if (!categoryTouchedRef.current && !categoryRef.current) {
        if (!res.isNoIssue && res.issueType !== 'No issue detected') {
          const preselected =
            res.issueType === 'Water Supply (leak)'
              ? 'Water Supply'
              : CATEGORIES.includes(res.issueType as ComplaintCategory)
              ? (res.issueType as ComplaintCategory)
              : ''
          if (preselected) {
            setCategory(preselected)
            clearError('category')
          }
        }
      }
    } catch {
      if (request !== analysisRequest.current) return
      setAnalysisError('Analysis failed. Choose a category manually below.')
    } finally {
      if (request === analysisRequest.current) setAnalyzing(false)
    }
  }

  const focusFirstError = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0]
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus())
  }

  function validateEvidence() {
    const e: Record<string, string> = {}
    if (photos.length === 0) e.photos = 'Attach at least one photo of the problem.'
    if (!category) e.category = analyzing ? 'Wait for the analysis to finish, or choose a category.' : 'Choose a category.'
    if (description.trim().length < 15) e.description = 'Describe the problem in at least 15 characters.'
    return e
  }

  function validateLocation() {
    const e: Record<string, string> = {}
    if (landmark.trim().length < 3) e.landmark = 'Enter a landmark, nearby place or address.'
    return e
  }

  async function next() {
    if (step === 1) {
      const e = validateEvidence()
      setErrors(e)
      if (Object.keys(e).length) return focusFirstError(e)
      setStep(2)
    } else if (step === 2) {
      const e = validateLocation()
      setErrors(e)
      if (Object.keys(e).length) return focusFirstError(e)
      setBusy(true)
      try {
        const matches = await checkDuplicatesAction({
          category: category as ComplaintCategory,
          location,
          description,
          landmark,
        })
        setDuplicates(matches)
        setDismissedDuplicates(false)
      } catch {
        setDuplicates([])
      } finally {
        setBusy(false)
      }
      setStep(3)
    }
  }

  async function submit() {
    const e = { ...validateEvidence(), ...validateLocation() }
    if (!confirmed) e.confirm = 'Tick the confirmation to file this complaint.'
    setErrors(e)
    if (Object.keys(e).length) {
      const target = Math.min(...Object.keys(e).map((k) => STEP_OF_FIELD[k] ?? 3)) as 1 | 2 | 3
      if (target !== 3) setStep(target)
      return focusFirstError(e)
    }
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('category', category as string)
      formData.append('description', description)
      formData.append('landmark', landmark)
      formData.append('lat', String(location.lat))
      formData.append('lng', String(location.lng))
      formData.append('severity', analysis?.severity ?? 'Medium')
      formData.append('photoCount', String(photos.length))
      if (analysis) {
        if (analysis.issueType) formData.append('aiCategory', analysis.issueType)
        const confidence = analysis.topClasses?.[0]?.score
        if (confidence !== undefined) formData.append('aiConfidence', String(confidence))
        if (analysis.severity) formData.append('aiSeverity', analysis.severity)
        if (analysis.modelVersion) formData.append('aiModelVersion', analysis.modelVersion)
      }
      for (const p of photos) {
        const compressed = await compressImage(p.file, 1600, 0.8)
        formData.append('photos', compressed)
      }

      const res = await submitComplaintAction(formData)
      if (res.ok) {
        setResult({ complaint: res.complaint, kind: 'filed' })
        setStep('done')
      } else {
        setErrors(res.errors)
        const target = Math.min(...Object.keys(res.errors).map((k) => STEP_OF_FIELD[k] ?? 3)) as 1 | 2 | 3
        setStep(target)
        focusFirstError(res.errors)
      }
    } catch {
      setErrors({ submit: 'Could not file the complaint. Check your connection and try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function support(id: string) {
    setSupportingId(id)
    try {
      const updated = await supportComplaintAction(id)
      if (updated) {
        setResult({ complaint: updated, kind: 'supported' })
        setStep('done')
      } else {
        setErrors({ submit: 'That case could not be found. Continue with your own report.' })
      }
    } finally {
      setSupportingId(null)
    }
  }

  const reset = useCallback(() => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.url))
    setPhotos([])
    setAnalysis(null)
    setAnalysisError(null)
    setCategory('')
    setCategoryTouched(false)
    categoryTouchedRef.current = false
    setDescription('')
    setLocation(DEFAULT_CENTER)
    setLandmark('')
    setDuplicates([])
    setDismissedDuplicates(false)
    setConfirmed(false)
    setErrors({})
    setResult(null)
    setStep(1)
  }, [])

  if (step === 'done' && result) {
    return <Receipt complaint={result.complaint} kind={result.kind} onReset={reset} headingRef={headingRef} />
  }

  const current = step as 1 | 2 | 3
  const showDuplicates = current === 3 && duplicates.length > 0 && !dismissedDuplicates
  const errorCount = Object.keys(errors).length

  return (
    <div className="flex flex-col gap-8">
      <ProgressRail current={current} />

      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest tabular-nums text-muted-foreground">
          Step {String(current).padStart(2, '0')} / 03
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-24 text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl"
        >
          {showDuplicates ? 'Before you file' : STEP_TITLES[current].title}
        </h2>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          {showDuplicates
            ? 'We found open cases close to your pin that look like the same problem.'
            : STEP_TITLES[current].body}
        </p>
      </div>

      {errorCount > 0 && !errors.submit && (
        <p role="alert" className="rounded-md border border-destructive bg-card px-4 py-3 text-sm font-medium text-destructive">
          {errorCount === 1 ? 'One field needs attention.' : `${errorCount} fields need attention.`} See the messages
          below.
        </p>
      )}
      {errors.submit && (
        <p role="alert" className="rounded-md border border-destructive bg-card px-4 py-3 text-sm font-medium text-destructive">
          {errors.submit}
        </p>
      )}

      {current === 1 && (
        <EvidenceStep
          photos={photos}
          onPhotosChange={handlePhotosChange}
          analysis={analysis}
          analyzing={analyzing}
          analysisError={analysisError}
          category={category}
          onCategoryChange={(c) => {
            setCategory(c)
            setCategoryTouched(true)
            categoryTouchedRef.current = true
            clearError('category')
          }}
          description={description}
          onDescriptionChange={(v) => {
            setDescription(v)
            if (v.trim().length >= 15) clearError('description')
          }}
          errors={errors}
        />
      )}

      {current === 2 && (
        <LocationStep
          location={location}
          onLocationChange={setLocation}
          landmark={landmark}
          onLandmarkChange={(v) => {
            setLandmark(v)
            if (v.trim().length >= 3) clearError('landmark')
          }}
          analysis={analysis}
          errors={errors}
        />
      )}

      {showDuplicates && (
        <SimilarReports
          matches={duplicates}
          onSupport={support}
          onDifferent={() => setDismissedDuplicates(true)}
          supportingId={supportingId}
        />
      )}

      {current === 3 && !showDuplicates && (
        <ReviewStep
          photos={photos}
          analysis={analysis}
          category={category}
          description={description}
          landmark={landmark}
          location={location}
          onEdit={(s) => {
            setErrors({})
            setStep(s)
          }}
          confirmed={confirmed}
          onConfirmedChange={(v) => {
            setConfirmed(v)
            if (v) clearError('confirm')
          }}
          errors={errors}
        />
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {current > 1 ? (
          <button
            type="button"
            onClick={() => {
              setErrors({})
              setStep((current - 1) as 1 | 2)
            }}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-70"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Back
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {!showDuplicates && (
          <button
            type="button"
            onClick={current === 3 ? submit : next}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
          >
            {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {current === 1 && 'Continue to location'}
            {current === 2 && (busy ? 'Checking for similar reports…' : 'Continue to review')}
            {current === 3 && (busy ? 'Filing…' : 'File complaint')}
            {!busy && current < 3 && <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  )
}
