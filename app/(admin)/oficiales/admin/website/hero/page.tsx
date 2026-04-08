"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Monitor, Smartphone, Save, Check } from "lucide-react"
import ImageUploader from "@/components/website/ImageUploader"
import FocalPointPicker from "@/components/admin/FocalPointPicker"
import { parseFocalPoint } from "@/lib/image"

const MAX_HERO_IMAGES = 5

interface HeroImage {
  id: string
  imageUrl: string
  focalDesktopX: number
  focalDesktopY: number
  focalMobileX: number
  focalMobileY: number
  orden: number
  activo: boolean
}

export default function AdminHeroPage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Upload state
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newDesktopX, setNewDesktopX] = useState(50)
  const [newDesktopY, setNewDesktopY] = useState(50)
  const [newMobileX, setNewMobileX] = useState(50)
  const [newMobileY, setNewMobileY] = useState(50)
  const [saving, setSaving] = useState(false)

  // Per-image save state (for focal point edits)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/website/hero", { cache: "no-store" })
      const data = await res.json()
      setImages(data.images ?? [])
    } catch (e: any) {
      setError(e.message || "Error cargando imágenes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // ImageUploader stores focal point in the URL hash. We strip it and seed the
  // picker defaults from whatever was set during the crop step.
  function handleNewUpload(url: string) {
    const parsed = parseFocalPoint(url)
    setNewImageUrl(parsed.src)
    if (parsed.focal) {
      setNewDesktopX(parsed.focal.x)
      setNewDesktopY(parsed.focal.y)
      setNewMobileX(parsed.focal.x)
      setNewMobileY(parsed.focal.y)
    } else {
      setNewDesktopX(50)
      setNewDesktopY(50)
      setNewMobileX(50)
      setNewMobileY(50)
    }
  }

  async function handleCreate() {
    if (!newImageUrl) {
      setError("Subí una imagen primero")
      return
    }
    if (images.length >= MAX_HERO_IMAGES) {
      setError(`Máximo ${MAX_HERO_IMAGES} imágenes. Eliminá una antes de agregar otra.`)
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/website/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          focalDesktopX: newDesktopX,
          focalDesktopY: newDesktopY,
          focalMobileX: newMobileX,
          focalMobileY: newMobileY,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      setImages((prev) => [...prev, data.image])
      setNewImageUrl("")
      setNewDesktopX(50)
      setNewDesktopY(50)
      setNewMobileX(50)
      setNewMobileY(50)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta imagen del carrusel del inicio?")) return
    const res = await fetch(`/api/website/hero/${id}`, { method: "DELETE" })
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== id))
    }
  }

  function updateLocal(id: string, patch: Partial<HeroImage>) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)))
    // Clear "saved" badge when user edits again
    setSavedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleSaveFocal(img: HeroImage) {
    const res = await fetch(`/api/website/hero/${img.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        focalDesktopX: img.focalDesktopX,
        focalDesktopY: img.focalDesktopY,
        focalMobileX: img.focalMobileX,
        focalMobileY: img.focalMobileY,
      }),
    })
    if (res.ok) {
      setSavedIds((prev) => new Set(prev).add(img.id))
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev)
          next.delete(img.id)
          return next
        })
      }, 2000)
    }
  }

  const canAddMore = images.length < MAX_HERO_IMAGES

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fotos del Inicio (Hero)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hasta {MAX_HERO_IMAGES} imágenes que rotan cada 5 segundos en el fondo del hero de la página principal, con el sombreado azul de CPB.
          Podés elegir el punto de enfoque para desktop y mobile por separado.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current images */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Imágenes activas ({images.length}/{MAX_HERO_IMAGES})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No hay imágenes todavía. Subí la primera abajo.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {images.map((img, idx) => (
              <div key={img.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">Imagen #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedIds.has(img.id) && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3.5 w-3.5" /> Guardado
                      </span>
                    )}
                    <button
                      onClick={() => handleSaveFocal(img)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar enfoque
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Monitor className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700">Desktop (16:9)</span>
                    </div>
                    <FocalPointPicker
                      src={img.imageUrl}
                      x={img.focalDesktopX}
                      y={img.focalDesktopY}
                      aspect={16 / 9}
                      onChange={(x, y) =>
                        updateLocal(img.id, { focalDesktopX: x, focalDesktopY: y })
                      }
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-700">Mobile (9:16)</span>
                    </div>
                    <FocalPointPicker
                      src={img.imageUrl}
                      x={img.focalMobileX}
                      y={img.focalMobileY}
                      aspect={9 / 16}
                      onChange={(x, y) =>
                        updateLocal(img.id, { focalMobileX: x, focalMobileY: y })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new */}
      {canAddMore ? (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar nueva imagen
          </h2>

          <ImageUploader value={newImageUrl} onChange={handleNewUpload} />

          {newImageUrl && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-700 mb-3">
                Ajustá el punto de enfoque para cada dispositivo
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FocalPointPicker
                  label="Desktop (16:9)"
                  src={newImageUrl}
                  x={newDesktopX}
                  y={newDesktopY}
                  aspect={16 / 9}
                  onChange={(x, y) => {
                    setNewDesktopX(x)
                    setNewDesktopY(y)
                  }}
                />
                <FocalPointPicker
                  label="Mobile (9:16)"
                  src={newImageUrl}
                  x={newMobileX}
                  y={newMobileY}
                  aspect={9 / 16}
                  onChange={(x, y) => {
                    setNewMobileX(x)
                    setNewMobileY(y)
                  }}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {saving ? "Guardando..." : "Agregar al carrusel"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Llegaste al máximo de {MAX_HERO_IMAGES} imágenes. Eliminá una de arriba para poder agregar otra.
        </div>
      )}
    </div>
  )
}
