"use client"

// HOME del V3 (estilo Canva):
//   - Grid de diseños guardados del usuario con thumbnails
//   - Botón grande "Nuevo diseño" → abre wizard
//   - Filtro por liga
// El editor se abre en /diseno-v3/editor?doc=ID o ?new=formato:liga:template

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Loader2, Trash2, Copy as CopyIcon, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocSummary {
  id: string
  nombre: string
  liga: string
  template: string
  format: string
  thumbnailUrl: string | null
  updatedAt: string
}

type LigaKey = "all" | "lnb" | "lnbf" | "u22m" | "u22f"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return "recién"
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return `hace ${d} d`
}

export default function DisenoV3Home() {
  const router = useRouter()
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LigaKey>("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = filter === "all" ? "" : `?liga=${filter}`
      const res = await fetch(`/api/admin/diseno-v3/documents${qs}`)
      if (res.ok) {
        const d = await res.json()
        setDocs(d.documents || [])
      }
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("¿Eliminar este diseño?")) return
    await fetch(`/api/admin/diseno-v3/documents/${id}`, { method: "DELETE" })
    setDocs((ds) => ds.filter((d) => d.id !== id))
  }

  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch(`/api/admin/diseno-v3/documents/${id}/duplicate`, { method: "POST" })
    if (res.ok) load()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Diseño V3</h1>
            <p className="text-xs text-neutral-400">Tu espacio de trabajo</p>
          </div>
          <Link
            href="/oficiales/admin/diseno-v3/nuevo"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nuevo diseño
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Hero shortcuts */}
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/oficiales/admin/diseno-v3/nuevo?tipo=partidos"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 p-5 text-left hover:border-white/25 hover:from-indigo-500/30 hover:to-violet-500/30"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Partidos</div>
            <div className="mt-1 text-lg font-bold">Próximos · Resultados · Previas</div>
            <div className="mt-2 text-xs text-neutral-300">Traer datos de Genius y armar en segundos</div>
          </Link>
          <Link
            href="/oficiales/admin/diseno-v3/nuevo?tipo=estadisticas"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-amber-600/20 to-orange-600/20 p-5 text-left hover:border-white/25 hover:from-amber-500/30 hover:to-orange-500/30"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">Estadísticas</div>
            <div className="mt-1 text-lg font-bold">Posiciones · Líderes · Jugador</div>
            <div className="mt-2 text-xs text-neutral-300">Tablas y rankings siempre al día</div>
          </Link>
          <Link
            href="/oficiales/admin/diseno-v3/nuevo?tipo=evento"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-pink-600/20 to-rose-600/20 p-5 text-left hover:border-white/25 hover:from-pink-500/30 hover:to-rose-500/30"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-pink-300">Eventos</div>
            <div className="mt-1 text-lg font-bold">Lanzamiento · Anuncios · Libre</div>
            <div className="mt-2 text-xs text-neutral-300">Plantillas editables desde cero</div>
          </Link>
        </div>

        {/* Filtro + título */}
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Mis diseños {docs.length > 0 && <span className="text-neutral-500">({docs.length})</span>}
          </h2>
          <div className="ml-auto flex items-center gap-0.5 rounded-full bg-white/5 p-0.5">
            {([
              { key: "all",  label: "Todos" },
              { key: "lnb",  label: "LNB" },
              { key: "lnbf", label: "LNBF" },
              { key: "u22m", label: "U22 M" },
              { key: "u22f", label: "U22 F" },
            ] as { key: LigaKey; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  filter === f.key ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white",
                )}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Grid de diseños */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
            <div className="mb-2 text-lg font-semibold">Todavía no hay diseños guardados</div>
            <p className="mb-4 max-w-sm text-sm text-neutral-400">
              Creá tu primer diseño. Cuando lo guardes, aparecerá acá para seguir editándolo.
            </p>
            <Link
              href="/oficiales/admin/diseno-v3/nuevo"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              <Plus className="h-4 w-4" /> Nuevo diseño
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {docs.map((d) => (
              <Link
                key={d.id}
                href={`/oficiales/admin/diseno-v3/editor?doc=${d.id}`}
                className="group cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/10 hover:shadow-xl"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
                  {d.thumbnailUrl ? (
                    <img src={d.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-600">Sin preview</div>
                  )}
                  <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => handleDuplicate(d.id, e)}
                      className="flex-1 rounded-md bg-black/80 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-black"
                      title="Duplicar"
                    ><CopyIcon className="inline h-3 w-3" /></button>
                    <button
                      onClick={(e) => handleDelete(d.id, e)}
                      className="flex-1 rounded-md bg-red-500/90 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-red-600"
                      title="Eliminar"
                    ><Trash2 className="inline h-3 w-3" /></button>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="truncate text-sm font-semibold text-white">{d.nombre}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                    <span className="uppercase">{d.liga}</span>
                    <span>·</span>
                    <span>{d.format}</span>
                    <span>·</span>
                    <span>{timeAgo(d.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
