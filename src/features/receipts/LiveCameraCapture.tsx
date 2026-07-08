import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface LiveCameraCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (blob: Blob) => void
}

// Stops every track so the camera hardware/indicator light turns off; a stream left running
// after the dialog closes keeps the camera active and drains battery.
function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function LiveCameraCapture(props: LiveCameraCaptureProps) {
  const { open, onOpenChange, onCapture } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) return

    setError(null)
    setReady(false)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser')
      return
    }

    // Guards against a getUserMedia call that resolves after the dialog was already closed
    // (or superseded by a newer call) -- the stream it returns must be stopped immediately
    // instead of attached to the video element.
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stopStream(stream)
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        if (cancelled) return
        setError('Could not access the camera. Check browser permissions, or use the upload option instead.')
      })

    return () => {
      cancelled = true
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [open])

  function handleCapture() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob)
      },
      'image/jpeg',
      0.9
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>Live camera</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setReady(true)}
            className="aspect-video w-full rounded-md bg-black object-cover"
          />
        )}
        <Button onClick={handleCapture} disabled={!!error || !ready}>
          <Camera /> Capture
        </Button>
      </DialogContent>
    </Dialog>
  )
}
