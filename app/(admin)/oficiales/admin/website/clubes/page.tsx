"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save } from "lucide-react"

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function AdminClubesPage() {
  const [clubes, setClubes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/website/clubes")
      .then((r) => r.json())
      .then((data) => setClubes(data.clubes ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch("/api/website/clubes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.get("nombre"),
          slug: slugify(data.get("nombre") as string),
          ciudad: data.get("ciudad"),
          sigla: data.get("sigla") || null,
          logoUrl: data.get("logoUrl") || null,
          instagram: data.get("instagram") || null,
          orden: clubes.length,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Error")
      const { club } = await res.json()
      setClubes((prev) => [...prev, club])
      form.reset()
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSeed() {
    if (!confirm("¿Cargar los 55 clubes de SADE? Los que ya existen no se duplicarán.")) return
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/seed-clubes", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(data.message)
      // Reload clubs
      const res2 = await fetch("/api/website/clubes")
      const data2 = await res2.json()
      setClubes(data2.clubes ?? [])
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSeeding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este club?")) return
    await fetch(`/api/website/clubes/${id}`, { method: "DELETE" })
    setClubes((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clubes Afiliados</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de clubes del sitio web</p>
        </div>
        <div className="flex gap-2">
          {clubes.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {seeding ? "Cargando..." : "Cargar clubes SADE"}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Agregar club
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input name="nombre" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input name="ciudad" required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sigla</label>
              <input name="sigla" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
              <input name="logoUrl" type="url" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input name="instagram" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="@usuario" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar club"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : clubes.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No hay clubes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubes.map((club) => (
            <div key={club.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.nombre} className="w-12 h-12 object-contain rounded" />
              ) : (
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {club.sigla || club.nombre.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{club.nombre}</p>
                <p className="text-xs text-gray-500">{club.ciudad}</p>
              </div>
              <button onClick={() => handleDelete(club.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
