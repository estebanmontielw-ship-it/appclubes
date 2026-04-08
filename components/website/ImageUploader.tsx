"use client"

import { useState, useRef, useEffect } from "react"
import { X, Loader2, Sparkles, Image as ImageIcon, Crop, Monitor, Smartphone, Check, Move } from "lucide-react"
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { parseFocalPoint, withFocalPoint } from "@/lib/image"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  onAiAnalysis?: (analysis: string) => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): CropType {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  )
}

export default function ImageUploader({ value, onChange, onAiAnalysis }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Crop state
  const [showCrop, setShowCrop] = useState(false)
  const [cropSrc, setCropSrc] = useState("")
  const [crop, setCrop] = useState<CropType>()
  const [cropFile, setCropFile] = useState<File | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Focal point editor state
  const parsed = parseFocalPoint(value)
  const cleanSrc = parsed.src
  const [focal, setFocal] = useState<{ x: number; y: number }>(parsed.focal ?? { x: 50, y: 50 })
  const [focalDragging, setFocalDragging] = useState(false)
  const focalRef = useRef<HTMLDivElement>(null)

  // When the URL changes from outside (e.g. after upload or from form reset),
  // sync the local focal state from whatever the URL says.
  useEffect(() => {
    const p = parseFocalPoint(value)
    setFocal(p.focal ?? { x: 50, y: 50 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanSrc])

  function updateFocal(nextX: number, nextY: number) {
    const x = Math.max(0, Math.min(100, nextX))
    const y = Math.max(0, Math.min(100, nextY))
    setFocal({ x, y })
    if (cleanSrc) onChange(withFocalPoint(cleanSrc, { x, y }))
  }

  function handleFocalPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!focalRef.current) return
    setFocalDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    applyFocalFromEvent(e)
  }

  function handleFocalPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!focalDragging) return
    applyFocalFromEvent(e)
  }

  function handleFocalPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setFocalDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  function applyFocalFromEvent(e: React.PointerEvent<HTMLDivElement>) {
    if (!focalRef.current) return
    const rect = focalRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    updateFocal(x, y)
  }

  function resetFocal() {
    updateFocal(50, 50)
  }

  const focalStyle = { objectPosition: `${focal.x}% ${focal.y}%` as const }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setCrop(centerAspectCrop(naturalWidth, naturalHeight, 16 / 9))
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no puede superar 10MB")
      return
    }

    setError("")
    setCropFile(file)

    // Show crop editor
    const reader = new FileReader()
    reader.onload = () => {
      setCropSrc(reader.result as string)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function applyCrop() {
    if (!imgRef.current || !crop || !cropFile) return

    setUploading(true)
    setShowCrop(false)

    try {
      const canvas = document.createElement("canvas")
      const img = imgRef.current
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height

      const pixelCrop = {
        x: (crop.x / 100) * img.width * scaleX,
        y: (crop.y / 100) * img.height * scaleY,
        width: (crop.width / 100) * img.width * scaleX,
        height: (crop.height / 100) * img.height * scaleY,
      }

      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No canvas context")

      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      )

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Failed")), "image/jpeg", 0.9)
      })

      const croppedFile = new File([blob], cropFile.name, { type: "image/jpeg" })

      // Upload
      const formData = new FormData()
      formData.append("file", croppedFile)
      formData.append("bucket", "website")

      const res = await fetch("/api/upload", { method: "POST", body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Error al subir imagen")
      }

      const { url } = await res.json()
      onChange(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setCropSrc("")
      setCropFile(null)
    }
  }

  function skipCrop() {
    if (!cropFile) return
    setShowCrop(false)
    uploadDirectly(cropFile)
  }

  async function uploadDirectly(file: File) {
    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "website")

      const res = await fetch("/api/upload", { method: "POST", body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Error al subir imagen")
      }

      const { url } = await res.json()
      onChange(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setCropSrc("")
      setCropFile(null)
    }
  }

  async function analyzeImage() {
    if (!value || !onAiAnalysis) return
    setAnalyzing(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value, tipo: "analizar-imagen" }),
      })

      if (!res.ok) throw new Error("Error al analizar")
      const { result } = await res.json()
      if (result?.analisis) onAiAnalysis(result.analisis)
    } catch {
      setError("No se pudo analizar la imagen")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de portada</label>

      {/* Crop editor modal */}
      {showCrop && cropSrc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crop className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-gray-900">Recortar imagen</h3>
                </div>
                <button onClick={() => { setShowCrop(false); setCropSrc("") }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Ajustá el recorte para la portada (16:9)</p>
            </div>

            <div className="p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={16 / 9}
                className="max-h-[50vh]"
              >
                <img
                  ref={imgRef}
                  src={cropSrc}
                  onLoad={onImageLoad}
                  alt="Recortar"
                  className="max-w-full"
                />
              </ReactCrop>
            </div>

            {/* Preview */}
            {value === "" && cropSrc && (
              <div className="px-4 pb-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Vista previa:</p>
                <div className="flex gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Monitor className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Desktop</span>
                    </div>
                    <div className="w-40 h-[90px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={cropSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Smartphone className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Mobile</span>
                    </div>
                    <div className="w-20 h-[90px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={cropSrc} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={skipCrop}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200">
                Subir sin recortar
              </button>
              <button onClick={applyCrop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">
                <Check className="h-4 w-4" /> Aplicar recorte y subir
              </button>
            </div>
          </div>
        </div>
      )}

      {value ? (
        <div className="space-y-3">
          {/* Main preview with drag-to-reposition focal point */}
          <div
            ref={focalRef}
            onPointerDown={handleFocalPointerDown}
            onPointerMove={handleFocalPointerMove}
            onPointerUp={handleFocalPointerUp}
            onPointerCancel={handleFocalPointerUp}
            className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 select-none cursor-crosshair touch-none"
            style={{ aspectRatio: "16 / 9" }}
          >
            <img
              src={cleanSrc}
              alt="Portada"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={focalStyle}
            />

            {/* Focal point dot */}
            <div
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)] pointer-events-none transition-transform"
              style={{
                left: `${focal.x}%`,
                top: `${focal.y}%`,
                transform: focalDragging ? "scale(1.15)" : "scale(1)",
                background: "rgba(59,130,246,0.35)",
              }}
            >
              <div className="absolute inset-1 rounded-full bg-white/90" />
              <div className="absolute inset-2.5 rounded-full bg-blue-500" />
            </div>

            {/* Controls */}
            <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
              {onAiAnalysis && (
                <button type="button" onClick={(e) => { e.stopPropagation(); analyzeImage() }} disabled={analyzing}
                  className="p-2 rounded-lg bg-violet-600 text-white shadow-md hover:bg-violet-700 disabled:opacity-50"
                  title="Analizar imagen con IA">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </button>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange("") }}
                className="p-2 rounded-lg bg-red-600 text-white shadow-md hover:bg-red-700" title="Quitar imagen">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Hint badge */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-medium pointer-events-none">
              <Move className="h-3 w-3" />
              Arrastrá el punto para centrar lo importante
            </div>

            {analyzing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> Analizando con IA...
                </div>
              </div>
            )}
          </div>

          {/* Reset focal button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Punto focal: {Math.round(focal.x)}%, {Math.round(focal.y)}%
            </p>
            <button
              type="button"
              onClick={resetFocal}
              className="text-xs text-gray-500 hover:text-primary font-medium"
            >
              Centrar
            </button>
          </div>

          {/* Device previews — reflect focal point live */}
          <div className="flex gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Monitor className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Desktop</span>
              </div>
              <div className="w-44 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={cleanSrc} alt="" className="w-full h-full object-cover" style={focalStyle} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Smartphone className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">Mobile</span>
              </div>
              <div className="w-20 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={cleanSrc} alt="" className="w-full h-full object-cover" style={focalStyle} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-gray-400">Card</span>
              </div>
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={cleanSrc} alt="" className="w-full h-full object-cover" style={focalStyle} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-gray-500">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Click para subir imagen</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP — Máx 10MB — Se recorta 16:9</p>
            </div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {!value && !showCrop && (
        <div className="mt-2">
          <input type="url" placeholder="O pegá una URL de imagen..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            onChange={(e) => { if (e.target.value) onChange(e.target.value) }} />
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
