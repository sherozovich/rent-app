import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'

const COMPRESSION_OPTIONS = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true }

/**
 * PhotoUpload — upload rental photos to Supabase Storage (bucket: rental-photos)
 * and persist the public URLs to rentals.photos array.
 *
 * Props:
 *   rentalId  {string}   - rental UUID
 *   photos    {string[]} - current photo URLs
 *   onUpdate  {fn}       - called after successful upload/delete with new photos array
 */
export default function PhotoUpload({ rentalId, photos = [], onUpdate }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const invalid = files.find((f) => !f.type.startsWith('image/'))
    if (invalid) { setError('Только изображения разрешены'); return }
    const tooBig = files.find((f) => f.size > 50 * 1024 * 1024)
    if (tooBig) { setError('Файл слишком большой (макс. 50 МБ)'); return }
    setUploading(true)
    setError(null)
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
          const path = `${rentalId}/${Date.now()}-${file.name}`
          const { error: uploadError } = await supabase.storage
            .from('rental-photos')
            .upload(path, compressed, { upsert: false })
          if (uploadError) throw new Error(uploadError.message)

          const { data } = supabase.storage.from('rental-photos').getPublicUrl(path)
          return data.publicUrl
        }),
      )
      onUpdate([...photos, ...urls])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(url) {
    const marker = '/rental-photos/'
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const path = url.slice(idx + marker.length)
    const { error: deleteError } = await supabase.storage.from('rental-photos').remove([path])
    if (deleteError) { setError(deleteError.message); return }
    onUpdate(photos.filter((p) => p !== url))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {photos.map((url) => (
          <div key={url} className="relative group">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt="rental photo"
                loading="lazy"
                className="h-24 w-24 object-cover rounded border"
              />
            </a>
            <button
              type="button"
              onClick={() => handleDelete(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete photo"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <Upload size={14} className="mr-2" />
            Загрузить фото
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
