"use client"

import { useState, useCallback } from "react"
import Cropper, { Area } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Upload, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PhotoUploadProps {
  currentPhotoUrl: string | null
  onPhotoUpdated: (url: string) => void
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  size = 500
): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9)
  })
}

export default function PhotoUpload({
  currentPhotoUrl,
  onPhotoUpdated,
}: PhotoUploadProps) {
  const { toast } = useToast()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showCropper, setShowCropper] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Solo se permiten imágenes" })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setShowCropper(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e)
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setUploading(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 500)
      const file = new File([croppedBlob], "foto-carnet.jpg", {
        type: "image/jpeg",
      })

      // Upload to storage
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "fotos-carnet")
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()

      // Update profile
      const profileRes = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotoCarnetUrl: url }),
      })

      if (!profileRes.ok) throw new Error("Profile update failed")

      onPhotoUpdated(url)
      setShowCropper(false)
      setImageSrc(null)
      toast({ title: "Foto actualizada" })
    } catch {
      toast({ variant: "destructive", title: "Error al subir la foto" })
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setShowCropper(false)
    setImageSrc(null)
  }

  return (
    <div>
      {/* Current photo or placeholder */}
      {!showCropper && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Foto carnet"
                className="h-32 w-32 rounded-xl object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-32 w-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Subir foto
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Cámara
                </span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="user"
                onChange={handleCameraCapture}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            La foto se recorta a 500x500px automáticamente
          </p>
        </div>
      )}

      {/* Cropper modal */}
      {showCropper && imageSrc && (
        <div className="space-y-4">
          <div className="relative w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 max-w-sm mx-auto">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={handleSave} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar foto
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={uploading}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
