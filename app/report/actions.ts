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

export async function analyzeImageAction(images: ImageMeta[]) {
  const safe = images.slice(0, 3).map((i) => ({
    name: String(i.name).slice(0, 200),
    size: Number(i.size) || 0,
    type: String(i.type).slice(0, 50),
  }))
  return analyzeImage(safe)
}

export async function checkDuplicatesAction(query: DuplicateQuery) {
  return checkDuplicates(query)
}

export async function submitComplaintAction(input: NewComplaintInput) {
  return submitComplaint(input)
}

export async function supportComplaintAction(id: string) {
  return supportComplaint(String(id))
}
