import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ApiError } from '@/lib/api-client'
import { compressImage } from './compress-image'
import { LiveCameraCapture } from './LiveCameraCapture'
import { useScanReceipt, type ScanReceiptResult } from './use-scan-receipt'

interface ReceiptScanButtonProps {
  onScanned: (result: ScanReceiptResult) => void
  /** 'fab' renders an icon-only circular trigger matching the mobile floating action
   * buttons (e.g. Add transaction); default renders the labeled outline button used
   * in the desktop button row. */
  variant?: 'default' | 'fab'
}

export function ReceiptScanButton({ onScanned, variant = 'default' }: ReceiptScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const scanReceipt = useScanReceipt()

  // Shared by both capture paths (file picker and live camera) so compress/scan/report
  // logic only lives in one place.
  async function handleImage(blob: Blob) {
    try {
      const { base64, mimeType } = await compressImage(blob)
      const result = await scanReceipt.mutateAsync({ imageBase64: base64, mimeType })
      if (result.warning) toast.warning(result.warning)
      onScanned(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not scan receipt')
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    void handleImage(file)
  }

  function handleCapture(blob: Blob) {
    setCameraOpen(false)
    void handleImage(blob)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'fab' ? (
            <Button
              variant="secondary"
              size="icon-lg"
              className="size-14 rounded-full shadow-lg"
              disabled={scanReceipt.isPending}
              aria-label={scanReceipt.isPending ? 'Scanning receipt' : 'Scan receipt'}
            >
              <Camera className="size-6" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={scanReceipt.isPending}>
              <Camera /> {scanReceipt.isPending ? 'Scanning...' : 'Scan receipt'}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>Upload photo</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCameraOpen(true)}>Use live camera</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LiveCameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onCapture={handleCapture} />
    </>
  )
}
