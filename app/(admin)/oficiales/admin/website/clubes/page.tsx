"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Pencil, X, Check, Upload, ChevronDown, ChevronUp } from "lucide-react"

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

interface Club {
  id: string
  nombre: string
  slug: string
  sigla?: string | null
  logoUrl?: string | null
  ciudad: string
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  sitioWeb?: string | null
  instagram?: string | null
  facebook?: string | null
  descripcion?: string | null
  activo: boolean
  orden: number
}

interface EditState {
  nombre: string
  ciudad: string
  sigla: string
  logoUrl: string
  descripcion: string
  instagram: string
  facebook: string
  sitioWeb: string
  telefono: string
  email: string
  direccion: string
}

function ClubCard({ club, onUpdate, onDelete }: {
  club: Club
  onUpdate: (updated: Club) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [edit, setEdit] = useState<EditState>({
    nombre: club.nombre,
    ciudad: club.ciudad,
    sigla: club.sigla || "",
    logoUrl: club.logoUrl || "",
    descripcion: club.descripcion || "",
    instagram: club.instagram || "",
    facebook: club.facebook || "",
    sitioWeb: club.sitioWeb || "",
    telefono: club.telefono || "",
    email: club.email || "",
    direccion: club.direccion || "",
  })
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5MB"); return }
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "logos-clubes")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Error al subir")
      const { url } = await res.json()
      setEdit(prev => ({ ...prev, logoUrl: url }))
    } catch {
      alert("No se pudo subir el logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/website/clubes/${club.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: edit.nombre,
          ciudad: edit.ciudad,
          sigla: edit.sigla || null,
          logoUrl: edit.logoUrl || null,
          descripcion: edit.descripcion || null,
          instagram: edit.instagram || null,
          facebook: edit.facebook || null,
          sitioWeb: edit.sitioWeb || null,
          telefono: edit.telefono || null,
          email: edit.email || null,
          direccion: edit.direccion || null,
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      const { club: updated } = await res.json()
      onUpdate(updated)
      setExpanded(false)
    } catch {
      alert("No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEdit({
      nombre: club.nombre,
      ciudad: club.ciudad,
      sigla: club.sigla || "",
      logoUrl: club.logoUrl || "",
      descripcion: club.descripcion || "",
      instagram: club.instagram || "",
      facebook: club.facebook || "",
      sitioWeb: club.sitioWeb || "",
      telefono: club.telefono || "",
      email: club.email || "",
      direccion: club.direccion || "",
    })
    setExpanded(false)
  }

  const logoSrc = expanded ? edit.logoUrl : club.logoUrl
  const hasInfo = club.descripcion || club.instagram || club.facebook || club.sitioWeb

  return (
    <div className={`bg-white rounded-xl border transition-all ${expanded ? "border-primary/30 shadow-md col-span-1 sm:col-span-2 lg:col-span-3" : "border-gray-100"}`}>
      {/* Card header - always visible */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative shrink-0">
          {logoSrc ? (
            <img src={logoSrc} alt={club.nombre} className="w-12 h-12 object-contain rounded-lg border border-gray-100" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {club.sigla?.charAt(0) || club.nombre.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{club.nombre}</p>
          <p className="text-xs text-gray-400">{club.ciudad}{club.sigla ? ` · ${club.sigla}` : ""}</p>
          {!expanded && hasInfo && (
            <div className="flex gap-2 mt-0.5">
              {club.instagram && <span className="text-xs text-blue-500">IG</span>}
              {club.facebook && <span className="text-xs text-blue-500">FB</span>}
              {club.descripcion && <span className="text-xs text-gray-400">✓ Descripción</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="Editar"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onDelete(club.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit form - expanded */}
      {expanded && (
        <div className="px-4 pb-5 border-t border-gray-50 pt-4 space-y-5">
          {/* Logo upload section */}
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {edit.logoUrl ? (
                <img src={edit.logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1" />
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-700">Logo del club</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingLogo ? "Subiendo..." : "Subir logo"}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <p className="text-xs text-gray-400">PNG, JPG o SVG. Máx 5MB.</p>
              {edit.logoUrl && (
                <input
                  value={edit.logoUrl}
                  onChange={e => setEdit(p => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="O pegá una URL"
                  className="w-full px-2 py-1 text-xs rounded border border-gray-200 text-gray-500"
                />
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <input value={edit.nombre} onChange={e => setEdit(p => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ciudad</label>
              <input value={edit.ciudad} onChange={e => setEdit(p => ({ ...p, ciudad: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sigla</label>
              <input value={edit.sigla} onChange={e => setEdit(p => ({ ...p, sigla: e.target.value }))}
                placeholder="Ej: OLI" maxLength={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <textarea value={edit.descripcion} onChange={e => setEdit(p => ({ ...p, descripcion: e.target.value }))}
              rows={3} placeholder="Historia o presentación del club..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          {/* Redes y contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
              <input value={edit.instagram} onChange={e => setEdit(p => ({ ...p, instagram: e.target.value }))}
                placeholder="@clubejemplo"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
              <input value={edit.facebook} onChange={e => setEdit(p => ({ ...p, facebook: e.target.value }))}
                placeholder="facebook.com/club"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sitio web</label>
              <input value={edit.sitioWeb} onChange={e => setEdit(p => ({ ...p, sitioWeb: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
              <input value={edit.telefono} onChange={e => setEdit(p => ({ ...p, telefono: e.target.value }))}
                placeholder="+595 ..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input value={edit.email} onChange={e => setEdit(p => ({ ...p, email: e.target.value }))}
                type="email" placeholder="club@ejemplo.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
              <input value={edit.direccion} onChange={e => setEdit(p => ({ ...p, direccion: e.target.value }))}
                placeholder="Calle, barrio, ciudad"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Check className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/website/clubes?admin=true")
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
      const res2 = await fetch("/api/website/clubes?admin=true")
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

  function handleUpdate(updated: Club) {
    setClubes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const filtered = clubes.filter(c =>
    !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.ciudad.toLowerCase().includes(search.toLowerCase())
  )

  const withLogo = clubes.filter(c => c.logoUrl).length
  const withDesc = clubes.filter(c => c.descripcion).length
  const withSocial = clubes.filter(c => c.instagram || c.facebook).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clubes Afiliados</h1>
          <p className="text-sm text-gray-500 mt-1">{clubes.length} clubes · {withLogo} con logo · {withDesc} con descripción · {withSocial} con redes</p>
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

      {/* Search */}
      {clubes.length > 0 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      )}

      {/* New club form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <p className="font-semibold text-gray-700">Nuevo club</p>
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
              <input name="sigla" maxLength={6} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Ej: OLI" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar club"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">{search ? "Sin resultados" : "No hay clubes registrados"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
