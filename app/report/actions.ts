'use server'

import {
  analyzeImage,
  checkDuplicates,
  submitComplaint,
  supportComplaint,
  type DuplicateQuery,
  type ImageMeta,
  type NewComplaintInput,
} from '@/lib/api'
import { uploadComplaintPhoto } from '@/lib/supabase/storage'

export async function analyzeImageAction(input: ImageMeta[] | FormData) {
  if (input instanceof FormData) {
    const file = input.get('file') as File | null
    const text = (input.get('text') as string) || undefined
    const metaRaw = input.get('meta') as string | null
    let images: ImageMeta[] = []
    if (metaRaw) {
      try {
        images = JSON.parse(metaRaw)
      } catch {}
    }
    return analyzeImage({
      file: file || undefined,
      fileName: file?.name,
      text,
      images,
    })
  }

  const safe: ImageMeta[] = input.slice(0, 3).map((i) => ({
    name: String(i.name).slice(0, 200),
    size: Number(i.size) || 0,
    type: String(i.type).slice(0, 50),
  }))
  return analyzeImage(safe)
}

export async function checkDuplicatesAction(query: DuplicateQuery) {
  return checkDuplicates(query)
}

export async function submitComplaintAction(input: NewComplaintInput | FormData) {
  if (input instanceof FormData) {
    const category = input.get('category') as any
    const description = (input.get('description') as string) || ''
    const landmark = (input.get('landmark') as string) || ''
    const lat = Number(input.get('lat')) || 0
    const lng = Number(input.get('lng')) || 0
    const severity = (input.get('severity') as any) || 'Medium'
    const photoCount = Number(input.get('photoCount')) || 0
    const aiCategory = (input.get('aiCategory') as string) || undefined
    const aiConfidenceRaw = input.get('aiConfidence') as string | null
    const aiConfidence = aiConfidenceRaw ? Number(aiConfidenceRaw) : undefined
    const aiSeverity = (input.get('aiSeverity') as any) || undefined
    const aiModelVersion = (input.get('aiModelVersion') as string) || undefined

    const rawFiles = input.getAll('photos') as File[]
    const photoUrls: string[] = []

    for (const file of rawFiles) {
      if (file && file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          const url = await uploadComplaintPhoto(buffer, file.name, file.type)
          photoUrls.push(url)
        } catch (err) {
          console.error('Failed to upload photo file to Supabase storage:', err)
        }
      }
    }

    return submitComplaint({
      category,
      description,
      landmark,
      location: { lat, lng },
      severity,
      photoCount: photoCount || (photoUrls.length > 0 ? photoUrls.length : 1),
      photoUrls,
      aiCategory,
      aiConfidence,
      aiSeverity,
      aiModelVersion,
    })
  }

  return submitComplaint(input)
}

export async function supportComplaintAction(id: string) {
  return supportComplaint(String(id))
}
