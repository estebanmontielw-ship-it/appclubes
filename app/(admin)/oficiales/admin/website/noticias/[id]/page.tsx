"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ImageUploader from "@/components/website/ImageUploader"

const categorias = [
  { value: "GENERAL", label: "General" },
  { value: "TORNEOS", label: "Torneos" },
  { value: "SELECCIONES", label: "Selecciones" },
  { value: "ARBITRAJE", label: "Arbitraje" },
  { value: "INSTITUCIONAL", label: "Institucional" },
  { value: "CLUBES", label: "Clubes" },
]

export default function EditarNoticiaPage() {
  const router = useRouter()
  const params = useParams()
  const [noticia, setNoticia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [imagenUrl, setImagenUrl] = useState("")
  const [contenido, setContenido] = useState("")
  const [aiMessage, setAiMessage] = useState("")

  useEffect(() => {
    fetch(`/api/website/noticias/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setNoticia(data.noticia)
        setImagenUrl(data.noticia?.imagenUrl || "")
        setContenido(data.noticia?.contenido || "")
      })
      .finally(() => setLoading(false))
  }, [params.id])

  function handleAiAnalysis(analysis: string) {
    // Append the AI analysis to the content
    const newContent = contenido + `\n<p><strong>Sobre la imagen:</strong> ${analysis}</p>`
    setContenido(newContent)
    setAiMessage("Análisis de imagen agregado al contenido. Revisá y editá si querés.")
    setTimeout(() => setAiMessage(""), 5000)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch(`/api/website/noticias/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: data.get("titulo"),
          slug: data.get("slug"),
          extracto: data.get("extracto"),
          contenido,
          imagenUrl: imagenUrl || null,
          videoUrl: data.get("videoUrl") || null,
          categoria: data.get("categoria"),
          destacada: data.get("destacada") === "on",
          publicada: data.get("publicada") === "on",
          autorNombre: data.get("autorNombre") || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Error al guardar")
      }

      router.push("/oficiales/admin/website/noticias")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Cargando...</div>
  if (!noticia) return <div className="py-12 text-center text-gray-400">Noticia no encontrada</div>

  return (
    <div className="max-w-3xl">
      <Link href="/oficiales/admin/website/noticias" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a noticias
      </Link>

      <h1 className="text-2xl font-bold mb-6">Editar Noticia</h1>

      {aiMessage && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-violet-50 text-violet-700">{aiMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input name="titulo" type="text" required defaultValue={noticia.titulo}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input name="slug" type="text" required defaultValue={noticia.slug}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracto *</label>
          <textarea name="extracto" rows={2} required defaultValue={noticia.extracto}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido * (HTML)</label>
          <textarea name="contenido" rows={10} required value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select name="categoria" required defaultValue={noticia.categoria}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input name="autorNombre" type="text" defaultValue={noticia.autorNombre ?? ""}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>

        {/* Image uploader with AI vision */}
        <ImageUploader
          value={imagenUrl}
          onChange={setImagenUrl}
          onAiAnalysis={handleAiAnalysis}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de video (YouTube)</label>
          <input name="videoUrl" type="url" defaultValue={noticia.videoUrl ?? ""}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input name="destacada" type="checkbox" defaultChecked={noticia.destacada} className="rounded border-gray-300" />
            Destacada
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="publicada" type="checkbox" defaultChecked={noticia.publicada} className="rounded border-gray-300" />
            Publicada
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link href="/oficiales/admin/website/noticias"
            className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
