import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from './server'

const DEFAULT_BUCKET = 'evidence'

let storageClient: ReturnType<typeof createClient> | null = null

function getSupabaseStorageClient() {
  if (storageClient) return storageClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'placeholder-anon-key'

  if (supabaseUrl) {
    storageClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return storageClient
  }

  return null
}

/**
 * Converts a raw database file path (e.g. 'folder/image.jpg' or '1731912345-uuid.jpg')
 * into a fully qualified public Supabase Storage URL using `supabase.storage.from().getPublicUrl()`.
 *
 * @param filePath Raw database file path or URL
 * @param bucket Name of the storage bucket (defaults to 'evidence')
 * @returns Fully qualified public URL to the image, or a fallback placeholder
 */
export function getEvidencePublicUrl(
  filePath: string | null | undefined,
  bucket: string = DEFAULT_BUCKET,
): string {
  if (!filePath || filePath.trim() === '') {
    return '/placeholder.jpg'
  }

  const trimmed = filePath.trim()

  // If already an absolute HTTP/HTTPS URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // If already a local relative static path (e.g., '/placeholder.jpg' or '/complaints/pothole.jpg')
  if (trimmed.startsWith('/') && !trimmed.startsWith('/storage/v1/')) {
    return trimmed
  }

  // Normalize path by stripping leading slashes and optional redundant bucket prefix
  let cleanPath = trimmed.replace(/^\/+/, '')
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.slice(`${bucket}/`.length)
  }

  // Also check if bucket prefix was 'complaint-images/'
  if (cleanPath.startsWith('complaint-images/')) {
    cleanPath = cleanPath.slice('complaint-images/'.length)
  }

  try {
    const supabase = getSupabaseStorageClient()
    if (supabase) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath)
      if (data?.publicUrl) {
        return data.publicUrl
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to resolve public URL with Supabase client:', err)
  }

  // Fallback: manually construct URL if NEXT_PUBLIC_SUPABASE_URL is available
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (baseUrl) {
    const cleanBase = baseUrl.replace(/\/+$/, '')
    return `${cleanBase}/storage/v1/object/public/${bucket}/${cleanPath}`
  }

  return trimmed
}

// Alias for generic storage usages
export const getPublicStorageUrl = getEvidencePublicUrl

/**
 * Upload an image buffer or blob to Supabase Storage (default: 'evidence')
 * and return its fully qualified public URL.
 */
export async function uploadComplaintPhoto(
  fileBuffer: Buffer | ArrayBuffer | Uint8Array,
  originalName: string,
  contentType: string = 'image/jpeg',
  bucket: string = DEFAULT_BUCKET,
): Promise<string> {
  const supabase = getSupabaseServerClient()

  // Clean filename and ensure unique timestamped key
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext) ? ext : 'jpg'
  const key = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`

  // Attempt upload to target bucket
  let uploadBucket = bucket
  let { data, error } = await supabase.storage
    .from(uploadBucket)
    .upload(key, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  // If the target bucket doesn't exist, try fallback 'complaint-images' bucket
  if (error && bucket !== 'complaint-images') {
    const fallbackRes = await supabase.storage
      .from('complaint-images')
      .upload(key, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })
    if (!fallbackRes.error) {
      data = fallbackRes.data
      error = null
      uploadBucket = 'complaint-images'
    }
  }

  if (error || !data) {
    throw new Error(`Failed to upload photo to Supabase storage: ${error?.message || 'Unknown error'}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(uploadBucket)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}
