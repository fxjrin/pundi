const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.7

export interface CompressedImage {
  base64: string
  mimeType: 'image/jpeg'
}

/**
 * Downscales an image blob to at most 1280px on its longest side and re-encodes as JPEG at
 * ~0.7 quality before base64-encoding it -- a full-resolution phone photo can exceed Vercel's
 * ~4.5MB request body limit otherwise.
 */
export async function compressImage(blob: Blob): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), mimeType: 'image/jpeg' }
}
