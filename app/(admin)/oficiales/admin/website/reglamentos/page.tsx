"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, FileText } from "lucide-react"

const categorias = [
  { value: "REGLAMENTO_JUEGO", label: "Reglamentos de Juego" },
  { value: "REGLAMENTO_COMPETENCIA", label: "Reglamentos de Competencia" },
  { value: "ESTATUTO", label: "Estatutos" },
  { value: "CIRCULAR", label: "Circulares" },
  { value: "OTRO", label: "Otros" },
]

export default function AdminReglamentosPage() {
  const [reglamentos, setReglamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/website/reglamentos")
      .then((r) => r.json())
      .then((data) => setReglamentos(data.reglamentos ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/website/reglamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: data.get("titulo"),
          descripcion: data.get("descripcion") || null,
          archivoUrl: data.get("archivoUrl"),
          categoria: data.get("categoria"),
          orden: reglamentos.length,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error")
      const { reglamento } = await res.json()
      setReglamentos((prev) => [...prev, reglamento])
      form.reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este reglamento?")) return
    await fetch(`/api/website/reglamentos/${id}`, { method: "DELETE" })
    setReglamentos((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reglamentos y Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de documentos del sitio web</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Agregar documento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input name="titulo" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select name="categoria" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                {categorias.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del archivo (PDF) *</label>
            <input name="archivoUrl" type="url" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input name="descripcion" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar documento"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : reglamentos.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No hay documentos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reglamentos.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{reg.titulo}</p>
                <p className="text-xs text-gray-500">{categorias.find((c) => c.value === reg.categoria)?.label ?? reg.categoria}</p>
              </div>
              <a href={reg.archivoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                Ver PDF
              </a>
              <button onClick={() => handleDelete(reg.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
