"use client"

import { useState, useEffect } from "react"
import { Save, Plus } from "lucide-react"

const defaultPages = [
  { clave: "institucional-about", titulo: "Sobre la CPB" },
  { clave: "institucional-historia", titulo: "Historia" },
  { clave: "institucional-autoridades", titulo: "Autoridades" },
]

export default function AdminPaginasPage() {
  const [paginas, setPaginas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/website/paginas")
      .then((r) => r.json())
      .then((data) => setPaginas(data.paginas ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/website/paginas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave: data.get("clave"),
          titulo: data.get("titulo"),
          contenido: data.get("contenido"),
          imagenUrl: data.get("imagenUrl") || null,
        }),
      })

      if (!res.ok) throw new Error("Error al guardar")

      const { pagina } = await res.json()
      setPaginas((prev) => {
        const exists = prev.find((p) => p.clave === pagina.clave)
        if (exists) return prev.map((p) => (p.clave === pagina.clave ? pagina : p))
        return [...prev, pagina]
      })
      setEditingKey(null)
      setMessage("Guardado correctamente")
      setTimeout(() => setMessage(""), 3000)
    } catch {
      setMessage("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const existingKeys = new Set(paginas.map((p) => p.clave))
  const allPages = [
    ...paginas,
    ...defaultPages.filter((d) => !existingKeys.has(d.clave)).map((d) => ({ ...d, id: d.clave, contenido: "", imagenUrl: null })),
  ]

  if (loading) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Páginas de Contenido</h1>
        <p className="text-sm text-gray-500 mt-1">Edición de páginas estáticas del sitio (sección Institucional)</p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {allPages.map((pagina) => (
          <div key={pagina.clave} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <div>
                <p className="font-medium text-gray-900">{pagina.titulo}</p>
                <p className="text-xs text-gray-400">Clave: {pagina.clave}</p>
              </div>
              <button
                onClick={() => setEditingKey(editingKey === pagina.clave ? null : pagina.clave)}
                className="text-sm text-primary font-medium hover:underline"
              >
                {editingKey === pagina.clave ? "Cancelar" : "Editar"}
              </button>
            </div>

            {editingKey === pagina.clave && (
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <input type="hidden" name="clave" value={pagina.clave} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input name="titulo" defaultValue={pagina.titulo} required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                  <input name="imagenUrl" type="url" defaultValue={pagina.imagenUrl ?? ""}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (HTML)</label>
                  <textarea name="contenido" rows={8} defaultValue={pagina.contenido}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono resize-y" />
                </div>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
