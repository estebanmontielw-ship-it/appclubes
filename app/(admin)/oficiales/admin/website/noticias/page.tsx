"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit2, Trash2, Eye, EyeOff, Star } from "lucide-react"

const categoryLabels: Record<string, string> = {
  GENERAL: "General",
  TORNEOS: "Torneos",
  SELECCIONES: "Selecciones",
  ARBITRAJE: "Arbitraje",
  INSTITUCIONAL: "Institucional",
  CLUBES: "Clubes",
}

export default function AdminNoticiasPage() {
  const [noticias, setNoticias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        <Link
          href="/oficiales/admin/website/noticias/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva noticia
        </Link>
      </div>

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
