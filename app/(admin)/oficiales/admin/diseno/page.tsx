"use client"

import { useEffect, useState } from "react"
import { Download, Image as ImageIcon, Loader2, RefreshCw, CheckSquare, Square } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Partido {
  matchId: string
  matchTime: string
  matchStatus: string
  homeName: string
  homeLogo: string | null
  awayName: string
  awayLogo: string | null
  homeScore: string | null
  awayScore: string | null
  venue: string
}

const TEMPLATES = [
  { key: "pre", label: "Anuncio de partido", desc: "Para publicar antes del juego" },
  { key: "resultado", label: "Resultado final", desc: "Con el marcador incluido" },
]

function formatDate(iso: string) {
  if (!iso) return ""
  const datePart = iso.includes("T") ? iso.split("T")[0] : iso.split(" ")[0]
  const timePart = iso.includes("T") ? iso.split("T")[1]?.slice(0, 5) : iso.split(" ")[1]?.slice(0, 5)
  const [y, m, d] = datePart.split("-")
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  return `${d} ${months[Number(m) - 1]} ${y}${timePart ? ` · ${timePart} hs` : ""}`
}

export default function DisenoPage() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [template, setTemplate] = useState("pre")
  const [titulo, setTitulo] = useState("")
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [filter, setFilter] = useState<"proximos" | "jugados">("proximos")

  useEffect(() => {
    fetch("/api/website/programacion-lnb")
      .then((r) => r.json())
      .then((data) => {
        const matches: any[] = data.matches ?? []
        const mapped: Partido[] = matches.map((m: any) => ({
          matchId: String(m.id),
          matchTime: m.isoDateTime ?? m.date ?? "",
          matchStatus: m.status ?? "",
          homeName: m.homeName ?? "",
          homeLogo: m.homeLogo ?? null,
          awayName: m.awayName ?? "",
          awayLogo: m.awayLogo ?? null,
          homeScore: m.homeScore != null ? String(m.homeScore) : null,
          awayScore: m.awayScore != null ? String(m.awayScore) : null,
          venue: m.venue ?? "",
        }))
        setPartidos(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displayed = partidos.filter((p) =>
    filter === "jugados" ? p.matchStatus === "COMPLETE" : p.matchStatus !== "COMPLETE"
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPreviewUrl(null)
  }

  function buildFlyerUrl() {
    if (selected.size === 0) return null
    const ids = Array.from(selected).join(",")
    const params = new URLSearchParams({ matchIds: ids, template })
    if (titulo.trim()) params.set("titulo", titulo.trim())
    return `/api/admin/flyer?${params.toString()}`
  }

  function handleGenerate() {
    const url = buildFlyerUrl()
    if (!url) return
    setPreviewUrl(null)
    setTimeout(() => setPreviewUrl(url), 50)
  }

  async function handleDownload() {
    const url = buildFlyerUrl()
    if (!url) return
    setGenerating(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      const safeTitulo = titulo.trim() ? titulo.trim().replace(/\s+/g, "_").toLowerCase() : template
      a.download = `flyer_lnb_${safeTitulo}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
    finally { setGenerating(false) }
  }

  const canGenerate = selected.size > 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Diseño / Flyers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generá flyers para redes sociales. Seleccioná uno o más partidos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: configuración ── */}
        <div className="space-y-5">

          {/* Tipo de flyer */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Tipo de flyer</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTemplate(t.key); setPreviewUrl(null) }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    template === t.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-sm font-semibold ${template === t.key ? "text-primary" : "text-gray-800"}`}>{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Título personalizado */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Título del flyer <span className="normal-case font-normal">(opcional)</span>
            </Label>
            <Input
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setPreviewUrl(null) }}
              placeholder="Ej: 4ª FECHA, SEMIFINALES, FINAL..."
              className="h-9"
            />
            <p className="text-xs text-muted-foreground mt-1">Si lo dejás vacío se usa "Próximos Partidos" o "Resultados"</p>
          </div>

          {/* Filtro */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Partidos
                {selected.size > 0 && (
                  <span className="ml-2 normal-case font-medium text-primary">{selected.size} seleccionado{selected.size > 1 ? "s" : ""}</span>
                )}
              </Label>
              <div className="flex gap-2">
                {(["proximos", "jugados"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setSelected(new Set()); setPreviewUrl(null) }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      filter === f ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {f === "proximos" ? "Próximos" : "Jugados"}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de partidos con checkboxes */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1 border rounded-xl p-2 bg-gray-50/50">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando partidos...
                </div>
              ) : displayed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay partidos {filter === "proximos" ? "próximos" : "jugados"}
                </p>
              ) : (
                displayed.map((p) => {
                  const isChecked = selected.has(p.matchId)
                  return (
                    <button
                      key={p.matchId}
                      onClick={() => toggle(p.matchId)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                        isChecked ? "border-primary bg-primary/5" : "border-transparent bg-white hover:border-gray-200"
                      }`}
                    >
                      {isChecked
                        ? <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                        : <Square className="h-5 w-5 text-gray-300 shrink-0" />
                      }
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {p.homeLogo && <img src={p.homeLogo} alt="" className="h-7 w-7 object-contain shrink-0" />}
                        <span className="text-sm font-semibold truncate">{p.homeName}</span>
                        <span className="text-xs text-muted-foreground shrink-0 font-medium">
                          {p.homeScore != null && p.awayScore != null ? `${p.homeScore}–${p.awayScore}` : "vs"}
                        </span>
                        <span className="text-sm font-semibold truncate">{p.awayName}</span>
                        {p.awayLogo && <img src={p.awayLogo} alt="" className="h-7 w-7 object-contain shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDate(p.matchTime)}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Vista previa
            </button>
            <button
              onClick={handleDownload}
              disabled={!canGenerate || generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar PNG
            </button>
          </div>
        </div>

        {/* ── RIGHT: preview ── */}
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Preview</Label>
          <Card className="overflow-hidden bg-gray-900">
            <CardContent className="p-0 flex items-center justify-center min-h-[400px]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Flyer preview"
                  className="w-full h-auto"
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-600 py-16">
                  <ImageIcon className="h-12 w-12 opacity-20" />
                  <p className="text-sm opacity-40 text-center px-8">
                    {canGenerate
                      ? "Hacé clic en Vista previa para generar"
                      : "Seleccioná uno o más partidos para comenzar"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            1080×1080 (1 partido) · 1080×1350 (2 partidos) · 1080×1620 (3+)
          </p>
        </div>
      </div>
    </div>
  )
}
