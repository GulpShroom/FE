import { useCallback, useRef } from 'react'

/**
 * Opens gallery or camera via hidden file input.
 * `capture` = 'environment' requests rear camera when supported.
 */
export function usePhotoPick({ onPick } = {}) {
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const handleChange = useCallback(
    (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const url = URL.createObjectURL(file)
      onPick?.({ file, url })
    },
    [onPick],
  )

  const openGallery = useCallback(() => {
    galleryRef.current?.click()
  }, [])

  const openCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch {
      // Permission denied — still try capture input as fallback
    }
    cameraRef.current?.click()
  }, [])

  const pickers = (
    <>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </>
  )

  return { pickers, openGallery, openCamera }
}
