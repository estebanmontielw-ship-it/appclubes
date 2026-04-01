"use client"

import { useState, useEffect } from "react"
import { Save, Sparkles, Loader2 } from "lucide-react"

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

  // AI state per page
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTarget, setAiTarget] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/website/paginas")
      .then((r) => r.json())
      .then((data) => setPaginas(data.paginas ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function generateWithAI(clave: string) {
    if (!aiPrompt.trim()) return
    setAiLoading(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, tipo: "generar-pagina" }),
      })

      if (!res.ok) throw new Error("Error al generar")

      const { result } = await res.json()

      // Fill the form fields
      const form = document.querySelector(`form[data-clave="${clave}"]`) as HTMLFormElement
      if (form) {
        const tituloInput = form.querySelector('input[name="titulo"]') as HTMLInputElement
        const contenidoArea = form.querySelector('textarea[name="contenido"]') as HTMLTextAreaElement
        if (tituloInput && result.titulo) tituloInput.value = result.titulo
        if (contenidoArea && result.contenido) contenidoArea.value = result.contenido
      }

      setAiTarget(null)
      setAiPrompt("")
      setMessage("Contenido generado. Revisá y guardá.")
      setTimeout(() => setMessage(""), 5000)
    } catch {
      setMessage("Error al generar contenido con IA")
    } finally {
      setAiLoading(false)
    }
  }

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
              <div className="p-5">
                {/* AI Generator */}
                {aiTarget === pagina.clave ? (
                  <div className="mb-5 p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      <p className="font-semibold text-sm text-gray-900">Generar contenido con IA</p>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={2}
                      placeholder={`Ej: Información sobre la CPB, fundada en 1950, historia, logros internacionales...`}
                      className="w-full px-3 py-2 rounded-lg border border-violet-200 text-sm mb-2 resize-none"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => generateWithAI(pagina.clave)} disabled={aiLoading || !aiPrompt.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-semibold disabled:opacity-50">
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {aiLoading ? "Generando..." : "Generar"}
                      </button>
                      <button type="button" onClick={() => setAiTarget(null)}
                        className="px-3 py-1.5 rounded-lg bg-white text-gray-600 text-sm border border-gray-200">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setAiTarget(pagina.clave); setAiPrompt("") }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold mb-4 hover:from-violet-700 hover:to-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" /> Generar con IA
                  </button>
                )}

                <form onSubmit={handleSave} data-clave={pagina.clave} className="space-y-4">
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
