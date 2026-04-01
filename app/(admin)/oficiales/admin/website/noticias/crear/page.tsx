"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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

      <h1 className="text-2xl font-bold mb-6">Nueva Noticia</h1>

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
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            placeholder="<p>Contenido de la noticia...</p>"
          />
          <p className="text-xs text-gray-400 mt-1">Puede usar HTML. En una futura versión se agregará un editor visual.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select
              name="categoria"
              required
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen de portada</label>
            <input
              name="imagenUrl"
              type="url"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de video (YouTube)</label>
            <input
              name="videoUrl"
              type="url"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
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
    </div>
  )
}
