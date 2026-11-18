import { getSupabaseServerClient } from './server'

/**
 * Upload an image buffer or blob to the public 'complaint-images' storage bucket
 * and return its public URL.
 */
export async function uploadComplaintPhoto(
  fileBuffer: Buffer | ArrayBuffer | Uint8Array,
  originalName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const supabase = getSupabaseServerClient()

  // Clean filename and ensure unique timestamped key
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const key = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`

  const { data, error } = await supabase.storage
    .from('complaint-images')
    .upload(key, fileBuffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload photo to Supabase storage: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('complaint-images')
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}
