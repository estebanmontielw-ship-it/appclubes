"use client"

import { useEffect, useState } from "react"
import { Download, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Partido {
  matchId: number | string
  matchExternalId?: string
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
  { key: "resultado", label: "Resultado final", desc: "Para publicar el marcador" },
]

function formatDate(matchTime: string) {
  const [datePart, timePart] = matchTime.split(" ")
  const [y, m, d] = datePart.split("-")
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const month = months[Number(m) - 1] ?? m
  const time = timePart ? timePart.slice(0, 5) : null
  return `${d} ${month} ${y}${time ? ` · ${time} hs` : ""}`
}

export default function DisenoPage() {
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Partido | null>(null)
  const [template, setTemplate] = useState("pre")
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [filter, setFilter] = useState<"proximos" | "jugados">("proximos")

  useEffect(() => {
    fetch("/api/website/programacion-lnb")
      .then((r) => r.json())
      .then((data) => {
        const matches: any[] = data.matches ?? []
        const mapped: Partido[] = matches.map((m: any) => ({
          matchId: m.id,
          matchExternalId: m.matchExternalId,
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
    filter === "jugados"
      ? p.matchStatus === "COMPLETE"
      : p.matchStatus !== "COMPLETE"
  )

  function buildFlyerUrl(partido: Partido, tmpl: string) {
    return `/api/admin/flyer?matchId=${partido.matchId}&template=${tmpl}`
  }

  async function handleGenerate() {
    if (!selected) return
    setGenerating(true)
    setPreviewUrl(null)
    const url = buildFlyerUrl(selected, template)
    // Trigger load via img to check it works, then set as preview
    setPreviewUrl(url)
    setGenerating(false)
  }

  async function handleDownload() {
    if (!selected) return
    setGenerating(true)
    const url = buildFlyerUrl(selected, template)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      const safeName = `${selected.homeName.slice(0, 10)}_vs_${selected.awayName.slice(0, 10)}_${template}`
        .replace(/\s+/g, "_").toLowerCase()
      a.download = `flyer_${safeName}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
    finally { setGenerating(false) }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Diseño / Flyers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generá flyers para redes sociales con los datos del partido automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: selector */}
        <div className="space-y-4">

          {/* Template selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tipo de flyer</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTemplate(t.key); setPreviewUrl(null) }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    template === t.key
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-sm font-semibold ${template === t.key ? "text-primary" : "text-gray-800"}`}>{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Partidos</p>
            <div className="flex gap-2">
              {(["proximos", "jugados"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setSelected(null); setPreviewUrl(null) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filter === f
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {f === "proximos" ? "Próximos" : "Jugados"}
                </button>
              ))}
            </div>
          </div>

          {/* Match list */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando partidos...
              </div>
            ) : displayed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay partidos {filter === "proximos" ? "próximos" : "jugados"}</p>
            ) : (
              displayed.map((p) => (
                <button
                  key={p.matchId}
                  onClick={() => { setSelected(p); setPreviewUrl(null) }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                    selected?.matchId === p.matchId
                      ? "border-primary bg-primary/5"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {p.homeLogo && <img src={p.homeLogo} alt="" className="h-7 w-7 object-contain shrink-0" />}
                    <span className="text-sm font-medium truncate">{p.homeName}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.homeScore != null && p.awayScore != null
                        ? `${p.homeScore} – ${p.awayScore}`
                        : "vs"}
                    </span>
                    <span className="text-sm font-medium truncate">{p.awayName}</span>
                    {p.awayLogo && <img src={p.awayLogo} alt="" className="h-7 w-7 object-contain shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
              <span className="font-medium text-gray-800">{selected.homeName} vs {selected.awayName}</span>
              <br />{formatDate(selected.matchTime)}{selected.venue ? ` · ${selected.venue}` : ""}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGenerate}
              disabled={!selected || generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Vista previa
            </button>
            <button
              onClick={handleDownload}
              disabled={!selected || generating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar PNG
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
          <Card className="aspect-square overflow-hidden bg-gray-900 flex items-center justify-center">
            <CardContent className="p-0 w-full h-full flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Flyer preview"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-600">
                  <ImageIcon className="h-12 w-12 opacity-30" />
                  <p className="text-sm opacity-50">Seleccioná un partido y hacé clic en Vista previa</p>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-2 text-center">1080 × 1080 px — listo para Instagram y WhatsApp</p>
        </div>
      </div>
    </div>
  )
}
