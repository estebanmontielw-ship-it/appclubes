"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  onAiAnalysis?: (analysis: string) => void
}

export default function ImageUploader({ value, onChange, onAiAnalysis }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "website")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

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
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function analyzeImage() {
    if (!value || !onAiAnalysis) return
    setAnalyzing(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: value,
          tipo: "analizar-imagen",
        }),
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

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="Portada" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            {onAiAnalysis && (
              <button
                type="button"
                onClick={analyzeImage}
                disabled={analyzing}
                className="p-2 rounded-lg bg-violet-600 text-white shadow-md hover:bg-violet-700 disabled:opacity-50"
                title="Analizar imagen con IA"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-lg bg-red-600 text-white shadow-md hover:bg-red-700"
              title="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {analyzing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                Analizando imagen con IA...
              </div>
            </div>
          )}
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
              <p className="text-xs text-gray-400">JPG, PNG, WEBP — Máx 10MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Manual URL input as alternative */}
      {!value && (
        <div className="mt-2">
          <input
            type="url"
            placeholder="O pegá una URL de imagen..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            onChange={(e) => { if (e.target.value) onChange(e.target.value) }}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
