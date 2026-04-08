"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, Camera } from "lucide-react"
import ImageUploader from "@/components/website/ImageUploader"
import InstagramImportModal from "@/components/admin/InstagramImportModal"

const categorias = [
  { value: "GENERAL", label: "General" },
  { value: "TORNEOS", label: "Torneos" },
  { value: "SELECCIONES", label: "Selecciones" },
  { value: "ARBITRAJE", label: "Arbitraje" },
  { value: "INSTITUCIONAL", label: "Institucional" },
  { value: "CLUBES", label: "Clubes" },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function CrearNoticiaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [titulo, setTitulo] = useState("")
  const [slug, setSlug] = useState("")
  const [autoSlug, setAutoSlug] = useState(true)
  const [extracto, setExtracto] = useState("")
  const [contenido, setContenido] = useState("")
  const [categoria, setCategoria] = useState("GENERAL")
  const [imagenUrl, setImagenUrl] = useState("")
  const [aiImageMessage, setAiImageMessage] = useState("")

  // AI generator
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [aiTipo, setAiTipo] = useState<"generar-noticia" | "generar-circular">("generar-noticia")

  // Instagram import
  const [showInstagram, setShowInstagram] = useState(false)

  async function generateWithAI() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setError("")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tipo: aiTipo }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Error al generar con IA")
      }

      const { result } = await res.json()

      setTitulo(result.titulo)
      setSlug(slugify(result.titulo))
      setExtracto(result.extracto)
      setContenido(result.contenido)
      if (result.categoria) setCategoria(result.categoria)
      setShowAi(false)
      setAiPrompt("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/website/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: data.get("titulo"),
          slug: data.get("slug"),
          extracto: data.get("extracto"),
          contenido: data.get("contenido"),
          imagenUrl: data.get("imagenUrl") || null,
          videoUrl: data.get("videoUrl") || null,
          categoria: data.get("categoria"),
          destacada: data.get("destacada") === "on",
          publicada: data.get("publicada") === "on",
          autorNombre: data.get("autorNombre") || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Error al crear la noticia")
      }

      router.push("/oficiales/admin/website/noticias")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/oficiales/admin/website/noticias" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a noticias
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Nueva Noticia</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInstagram(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-md"
          >
            <Camera className="h-4 w-4" />
            Importar de Instagram
          </button>
          <button
            type="button"
            onClick={() => setShowAi(!showAi)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Generar con IA
          </button>
        </div>
      </div>

      {/* AI Generator Panel */}
      {showAi && (
        <div className="mb-6 p-5 rounded-xl border-2 border-violet-200 bg-violet-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="font-bold text-gray-900">Generar noticia con IA</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Describí brevemente la información y la IA va a generar el contenido completo.
          </p>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setAiTipo("generar-noticia")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aiTipo === "generar-noticia" ? "bg-violet-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Noticia
            </button>
            <button type="button" onClick={() => setAiTipo("generar-circular")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${aiTipo === "generar-circular" ? "bg-violet-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Circular / Comunicado
            </button>
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 resize-none mb-3"
            placeholder="Ej: La selección paraguaya de básquetbol masculino sub-18 clasificó al mundial FIBA U18 2025 después de ganar a Argentina 78-65 en la final del sudamericano en Lima, Perú. Máximo anotador fue Juan Pérez con 23 puntos."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={generateWithAI}
              disabled={aiLoading || !aiPrompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAi(false)}
              className="px-4 py-2 rounded-lg bg-white text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            name="titulo"
            type="text"
            required
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
              if (autoSlug) setSlug(slugify(e.target.value))
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setAutoSlug(false) }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-gray-400 mt-1">URL: /noticias/{slug || "..."}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracto *</label>
          <textarea
            name="extracto"
            rows={2}
            required
            value={extracto}
            onChange={(e) => setExtracto(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="Resumen corto para las tarjetas de preview"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido * (HTML)</label>
          <textarea
            name="contenido"
            rows={10}
            required
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            placeholder="<p>Contenido de la noticia...</p>"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              name="categoria"
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input
              name="autorNombre"
              type="text"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Image uploader with AI vision */}
        <ImageUploader
          value={imagenUrl}
          onChange={setImagenUrl}
          onAiAnalysis={(analysis) => {
            setContenido((prev) => prev + `\n<p><strong>Sobre la imagen:</strong> ${analysis}</p>`)
            setAiImageMessage("Análisis de imagen agregado al contenido.")
            setTimeout(() => setAiImageMessage(""), 5000)
          }}
        />
        <input type="hidden" name="imagenUrl" value={imagenUrl} />

        {aiImageMessage && (
          <div className="px-4 py-2 rounded-lg text-sm bg-violet-50 text-violet-700">{aiImageMessage}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de video (YouTube)</label>
          <input
            name="videoUrl"
            type="url"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input name="destacada" type="checkbox" className="rounded border-gray-300" />
            Destacada
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="publicada" type="checkbox" className="rounded border-gray-300" />
            Publicar ahora
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear noticia"}
          </button>
          <Link
            href="/oficiales/admin/website/noticias"
            className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <InstagramImportModal
        open={showInstagram}
        onClose={() => setShowInstagram(false)}
        onImport={(result) => {
          setTitulo(result.titulo)
          setSlug(result.slug || slugify(result.titulo))
          setAutoSlug(false)
          setExtracto(result.extracto)
          setContenido(result.contenido)
          setCategoria(result.categoria)
          if (result.imagenUrl) setImagenUrl(result.imagenUrl)
        }}
      />
    </div>
  )
}
