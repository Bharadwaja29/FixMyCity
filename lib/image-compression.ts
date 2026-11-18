/**
 * Compresses an image in the browser using HTMLCanvasElement.
 * - Resizes so the longest side is at most `maxDimension` (default 1600px).
 * - Encodes as JPEG with quality `quality` (default 0.8).
 * - Preserves original filename (updating extension to .jpg).
 * - Falls back to original file if not in browser or on error.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.8
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }

  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  return new Promise<File>((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        if (!width || !height) {
          resolve(file)
          return
        }

        // Calculate target dimensions (max 1600px on longest side)
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '')
            const safeName = `${baseName || 'photo'}.jpg`
            const compressedFile = new File([blob], safeName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      } catch (err) {
        console.warn('Image compression failed, using original file:', err)
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
