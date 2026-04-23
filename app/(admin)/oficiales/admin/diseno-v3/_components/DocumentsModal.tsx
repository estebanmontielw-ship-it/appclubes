"use client"


import { useCallback, useEffect, useState } from "react"
import { X, FolderOpen, Loader2, Plus, Trash2, Copy as CopyIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LigaKey } from "../_lib/themes"

export interface DocSummary {
  id: string
  nombre: string
  liga: string
  template: string
  format: string
  thumbnailUrl: string | null
  updatedAt: string
}

interface Props {
  open: boolean
  liga: LigaKey
  onClose: () => void
  onOpenDoc: (id: string) => void
  onNewDoc: () => void
}

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

export default function DocumentsModal({ open, liga, onClose, onOpenDoc, onNewDoc }: Props) {
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | LigaKey>("all")

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

  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("¿Eliminar este diseño?")) return
    await fetch(`/api/admin/diseno-v3/documents/${id}`, { method: "DELETE" })
    setDocs((ds) => ds.filter((d) => d.id !== id))
  }

  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const res = await fetch(`/api/admin/diseno-v3/documents/${id}/duplicate`, { method: "POST" })
    if (res.ok) load()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">Mis diseños</h2>
            <p className="text-xs text-neutral-400">Abrí un diseño guardado o arrancá uno nuevo.</p>
          </div>
          <button
            onClick={onNewDoc}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-white/5 px-5 py-2">
          {[
            { key: "all",  label: "Todos" },
            { key: "lnb",  label: "LNB" },
            { key: "lnbf", label: "LNBF" },
            { key: "u22m", label: "U22 M" },
            { key: "u22f", label: "U22 F" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filter === f.key ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-neutral-400">
              <div className="mb-2 text-lg text-white">Todavía no hay diseños guardados</div>
              <p className="max-w-sm">Creá tu primer diseño. Cuando lo guardes, aparecerá acá para seguir editándolo.</p>
              <button
                onClick={onNewDoc}
                className="mt-4 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                <Plus className="h-4 w-4" /> Nuevo diseño
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {docs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onOpenDoc(d.id)}
                  className="group cursor-pointer overflow-hidden rounded-lg border border-white/5 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/10"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
                    {d.thumbnailUrl ? (
                      <img
                        src={d.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-600">
                        Sin preview
                      </div>
                    )}
                    <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={(e) => handleDuplicate(d.id, e)}
                        className="flex-1 rounded bg-black/80 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-black"
                        title="Duplicar"
                      >
                        <CopyIcon className="inline h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(d.id, e)}
                        className="flex-1 rounded bg-red-500/90 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="inline h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="truncate text-xs font-semibold text-white">{d.nombre}</div>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <span className="uppercase">{d.liga}</span>
                      <span>·</span>
                      <span>{d.format}</span>
                      <span>·</span>
                      <span>{timeAgo(d.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
