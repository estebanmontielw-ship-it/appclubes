"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Instagram, Loader2, Sparkles } from "lucide-react"

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function AdminNoticiasPage() {
  const [noticias, setNoticias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Instagram importer
  const [showImporter, setShowImporter] = useState(false)
  const [igText, setIgText] = useState("")
  const [igImageUrl, setIgImageUrl] = useState("")
  const [igLoading, setIgLoading] = useState(false)
  const [igMessage, setIgMessage] = useState("")

  async function importFromInstagram() {
    if (!igText.trim()) return
    setIgLoading(true)
    setIgMessage("")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: igText, tipo: "importar-instagram" }),
      })

      if (!res.ok) throw new Error("Error al generar")
      const { result } = await res.json()

      // Create the noticia directly
      const createRes = await fetch("/api/website/noticias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: result.titulo,
          slug: slugify(result.titulo),
          extracto: result.extracto,
          contenido: result.contenido,
          imagenUrl: igImageUrl || null,
          categoria: result.categoria || "GENERAL",
          destacada: false,
          publicada: false, // Borrador para que revises antes
        }),
      })

      if (!createRes.ok) throw new Error("Error al crear noticia")

      const { noticia } = await createRes.json()
      setNoticias((prev) => [noticia, ...prev])
      setIgText("")
      setIgImageUrl("")
      setShowImporter(false)
      setIgMessage("Noticia creada como borrador. Revisá y publicá cuando quieras.")
      setTimeout(() => setIgMessage(""), 5000)
    } catch (err: any) {
      setIgMessage("Error: " + (err.message || "No se pudo importar"))
    } finally {
      setIgLoading(false)
    }
  }

  useEffect(() => {
    fetch("/api/website/noticias?admin=true&limite=50")
      .then((r) => r.json())
      .then((data) => setNoticias(data.noticias ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta noticia?")) return
    await fetch(`/api/website/noticias/${id}`, { method: "DELETE" })
    setNoticias((prev) => prev.filter((n) => n.id !== id))
  }

  async function togglePublicada(noticia: any) {
    const res = await fetch(`/api/website/noticias/${noticia.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicada: !noticia.publicada }),
    })
    if (res.ok) {
      const { noticia: updated } = await res.json()
      setNoticias((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Noticias</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de noticias del sitio web público</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImporter(!showImporter)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <Instagram className="h-4 w-4" />
            Importar de Instagram
          </button>
          <Link
            href="/oficiales/admin/website/noticias/crear"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva noticia
          </Link>
        </div>
      </div>

      {/* Instagram Importer */}
      {showImporter && (
        <div className="mb-6 p-5 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center gap-2 mb-3">
            <Instagram className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Importar post de Instagram</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Copiá el texto de un post de Instagram y la IA lo convierte en una noticia lista para publicar.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto del post *</label>
              <textarea
                value={igText}
                onChange={(e) => setIgText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-purple-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Pegá acá el texto del post de Instagram..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de la imagen (opcional)</label>
              <input
                value={igImageUrl}
                onChange={(e) => setIgImageUrl(e.target.value)}
                type="url"
                className="w-full px-3 py-2.5 rounded-lg border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="https://... (pegá la URL de la imagen del post)"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={importFromInstagram}
                disabled={igLoading || !igText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {igLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generando noticia...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Convertir en noticia</>
                )}
              </button>
              <button
                onClick={() => setShowImporter(false)}
                className="px-4 py-2 rounded-lg bg-white text-gray-700 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {igMessage && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${igMessage.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {igMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : noticias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No hay noticias creadas</p>
          <Link href="/oficiales/admin/website/noticias/crear" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">
            Crear la primera noticia
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {noticias.map((noticia) => (
                <tr key={noticia.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {noticia.destacada && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      <span className="font-medium text-gray-900 line-clamp-1">{noticia.titulo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {categoryLabels[noticia.categoria] ?? noticia.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${noticia.publicada ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {noticia.publicada ? "Publicada" : "Borrador"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => togglePublicada(noticia)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title={noticia.publicada ? "Despublicar" : "Publicar"}
                      >
                        {noticia.publicada ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/oficiales/admin/website/noticias/${noticia.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(noticia.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
