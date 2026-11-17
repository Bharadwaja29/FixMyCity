'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X, Camera } from 'lucide-react'
import type { ComplaintCategory, ImageAnalysis } from '@/lib/api'
import { CaseCard, FieldError, fieldClass } from './case-card'
import { AiAnalysisPanel } from './ai-analysis-panel'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/image-compression'

export interface Photo {
  id: string
  file: File
  url: string
}

export const MAX_PHOTOS = 3
const MAX_BYTES = 30 * 1024 * 1024

interface Props {
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  analysis: ImageAnalysis | null
  analyzing: boolean
  analysisError: string | null
  category: ComplaintCategory | ''
  onCategoryChange: (c: ComplaintCategory) => void
  description: string
  onDescriptionChange: (v: string) => void
  errors: Record<string, string>
}

export function EvidenceStep(props: Props) {
  const { photos, onPhotosChange, errors } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function addFiles(list: FileList | null) {
    if (!list) return
    const files = Array.from(list)
    const images = files.filter((f) => f.type.startsWith('image/'))
    const tooBig = images.filter((f) => f.size > MAX_BYTES)
    const accepted = images.filter((f) => f.size <= MAX_BYTES)
    const room = MAX_PHOTOS - photos.length
    const toAdd = accepted.slice(0, Math.max(0, room))

    const problems: string[] = []
    if (images.length < files.length) problems.push('Only image files can be attached.')
    if (tooBig.length) problems.push('Each photo must be under 30 MB.')
    if (accepted.length > room) problems.push(`You can attach up to ${MAX_PHOTOS} photos.`)
    setUploadError(problems.length ? problems.join(' ') : null)

    if (toAdd.length) {
      const compressedList = await Promise.all(
        toAdd.map(async (file) => {
          const compressed = await compressImage(file, 1600, 0.8)
          return { id: crypto.randomUUID(), file: compressed, url: URL.createObjectURL(compressed) }
        })
      )
      onPhotosChange([...photos, ...compressedList])
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function removePhoto(id: string) {
    const target = photos.find((p) => p.id === id)
    if (target) URL.revokeObjectURL(target.url)
    setUploadError(null)
    onPhotosChange(photos.filter((p) => p.id !== id))
  }

  const photosError = uploadError ?? errors.photos
  const full = photos.length >= MAX_PHOTOS

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <CaseCard label="Exhibit A · Photographs" icon={Camera} footer={`${photos.length} / ${MAX_PHOTOS} attached`}>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!full) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!full) addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-4 py-10 text-center',
            dragging ? 'border-foreground bg-muted' : 'border-input',
            photosError && 'border-destructive',
            full && 'opacity-60',
          )}
        >
          <ImagePlus className="size-8" strokeWidth={1} aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Drag photos here</span>
            <span className="text-muted-foreground"> or</span>
          </p>
          <button
            type="button"
            id="photos"
            onClick={() => inputRef.current?.click()}
            disabled={full}
            aria-describedby={cn('photos-hint', photosError && 'photos-error')}
            aria-invalid={photosError ? true : undefined}
            className="inline-flex h-10 items-center rounded-md border border-foreground bg-card px-4 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed"
          >
            Choose photos
          </button>
          <p id="photos-hint" className="text-xs text-muted-foreground">
            Up to {MAX_PHOTOS} images, 10 MB each. JPG, PNG or HEIC.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
        <FieldError id="photos-error" message={photosError} />

        {photos.length > 0 && (
          <ul aria-label="Attached photos" className="grid grid-cols-3 gap-3">
            {photos.map((p, i) => (
              <li key={p.id} className="flex flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={p.url} alt={`Photo ${i + 1}: ${p.file.name}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-sm border border-border bg-card hover:bg-muted"
                  >
                    <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    <span className="sr-only">Remove photo {i + 1}</span>
                  </button>
                </div>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  A-{String(i + 1).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-semibold">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={1000}
            value={props.description}
            onChange={(e) => props.onDescriptionChange(e.target.value)}
            placeholder="What is the problem, how long has it been there, who is affected?"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={cn('description-count', errors.description && 'description-error')}
            className={cn(fieldClass, 'resize-y py-2.5 leading-relaxed')}
          />
          <div className="flex items-start justify-between gap-3">
            <FieldError id="description-error" message={errors.description} />
            <span id="description-count" className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
              {props.description.length} / 1000
            </span>
          </div>
        </div>
      </CaseCard>

      <AiAnalysisPanel
        analysis={props.analysis}
        analyzing={props.analyzing}
        error={props.analysisError}
        category={props.category}
        onCategoryChange={props.onCategoryChange}
        categoryError={errors.category}
      />
    </div>
  )
}
