"use client"

import { useEffect, useState } from "react"
import { X, Loader2, Camera, Check, Heart, MessageCircle } from "lucide-react"

interface SocialPost {
  id: string | number
  network: string
  text: string
  url: string
  image: string | null
  video: string | null
  author: string
  likes: number
  comments: number
  createdAt: string | null
}

interface InstagramImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (result: {
    titulo: string
    slug: string
    extracto: string
    contenido: string
    categoria: string
    imagenUrl: string
  }) => void
}

export default function InstagramImportModal({ open, onClose, onImport }: InstagramImportModalProps) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError("")
    setSelectedId(null)
    fetch("/api/curator/posts?limit=12")
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.posts)) {
          setPosts(data.posts.filter((p: SocialPost) => p.image).slice(0, 12))
        } else {
          setError(data.error || "No se pudieron cargar las publicaciones")
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [open])

  async function handleImport(post: SocialPost) {
    setProcessing(true)
    setError("")
    setSelectedId(post.id)

    try {
      // Step 1: convert Instagram caption into a news article
      setProcessingStep("Convirtiendo publicación en noticia...")
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: post.text || "Publicación sin texto",
          tipo: "importar-instagram",
        }),
      })

      if (!aiRes.ok) {
        const body = await aiRes.json().catch(() => null)
        throw new Error(body?.error || "Error al generar noticia con IA")
      }

      const { result } = await aiRes.json()

      // Step 2: analyze image with Kimi vision (optional enhancement)
      let contenidoFinal = result.contenido || ""
      if (post.image) {
        setProcessingStep("Analizando imagen con IA...")
        try {
          const visionRes = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: post.image,
              tipo: "analizar-imagen",
            }),
          })

          if (visionRes.ok) {
            const { result: visionResult } = await visionRes.json()
            if (visionResult?.analisis) {
              contenidoFinal += `\n<p><em>${visionResult.analisis}</em></p>`
            }
          }
        } catch {
          // Vision is optional, continue even if it fails
        }
      }

      // Step 3: pass everything back to the parent form
      onImport({
        titulo: result.titulo || "",
        slug: result.slug || "",
        extracto: result.extracto || "",
        contenido: contenidoFinal,
        categoria: result.categoria || "GENERAL",
        imagenUrl: post.image || "",
      })

      onClose()
    } catch (err: any) {
      setError(err.message)
      setSelectedId(null)
    } finally {
      setProcessing(false)
      setProcessingStep("")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Importar de Instagram</h3>
              <p className="text-xs text-gray-500">Elegí una publicación para convertir en noticia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer"
                />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No hay publicaciones disponibles
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {posts.map(post => {
                const isSelected = selectedId === post.id
                return (
                  <button
                    key={post.id}
                    type="button"
                    disabled={processing}
                    onClick={() => handleImport(post)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-4 ring-primary/20 scale-95"
                        : "border-transparent hover:border-primary hover:scale-[1.02] hover:shadow-lg"
                    } disabled:opacity-50 disabled:cursor-wait`}
                  >
                    {post.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image}
                        alt={post.text?.slice(0, 80) || "Post"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-70 group-hover:opacity-100 transition-opacity" />

                    {/* Stats at bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-2 text-white text-[10px] flex items-center gap-2">
                      {post.likes > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3" />
                          {post.likes > 999 ? `${(post.likes / 1000).toFixed(1)}k` : post.likes}
                        </span>
                      )}
                      {post.comments > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="h-3 w-3" />
                          {post.comments}
                        </span>
                      )}
                    </div>

                    {/* Loading overlay on selected */}
                    {isSelected && processing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white p-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-[10px] text-center font-semibold">{processingStep}</p>
                      </div>
                    )}

                    {/* Hover check */}
                    {!isSelected && !processing && (
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center scale-50 group-hover:scale-100 transition-transform">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] text-gray-500 text-center">
            Al seleccionar una publicación, la IA va a generar automáticamente el título, extracto, contenido y descripción visual
          </p>
        </div>
      </div>
    </div>
  )
}
