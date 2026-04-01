"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function AdminSeleccionesPage() {
  const [selecciones, setSelecciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/website/selecciones")
      .then((r) => r.json())
      .then((data) => setSelecciones(data.selecciones ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/website/selecciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.get("nombre"),
          slug: slugify(data.get("nombre") as string),
          categoria: data.get("categoria"),
          genero: data.get("genero"),
          entrenador: data.get("entrenador") || null,
          imagenUrl: data.get("imagenUrl") || null,
          orden: selecciones.length,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error")
      const { seleccion } = await res.json()
      setSelecciones((prev) => [...prev, seleccion])
      form.reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta selección?")) return
    await fetch(`/api/website/selecciones/${id}`, { method: "DELETE" })
    setSelecciones((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Selecciones Nacionales</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de selecciones del sitio web</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Agregar selección
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input name="nombre" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Ej: Selección Mayor Masculina" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <input name="categoria" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Ej: Mayor, U18, U16" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
              <select name="genero" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                <option value="Masculina">Masculina</option>
                <option value="Femenina">Femenina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrenador</label>
              <input name="entrenador" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
              <input name="imagenUrl" type="url" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar selección"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : selecciones.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No hay selecciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selecciones.map((sel) => (
            <div key={sel.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              {sel.imagenUrl && <img src={sel.imagenUrl} alt={sel.nombre} className="w-16 h-12 object-cover rounded" />}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{sel.nombre}</p>
                <p className="text-xs text-gray-500">{sel.genero} · {sel.categoria}{sel.entrenador ? ` · DT: ${sel.entrenador}` : ""}</p>
              </div>
              <button onClick={() => handleDelete(sel.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
