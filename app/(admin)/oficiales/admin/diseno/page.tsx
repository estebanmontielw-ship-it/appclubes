"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Image as ImageIcon, Loader2, RefreshCw, CheckSquare, Square, Upload, X, AlertCircle } from "lucide-react"
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

type Liga = "lnb" | "lnbf" | "u22m" | "u22f"

const LIGAS: { key: Liga; label: string; sub: string; api: string }[] = [
  { key: "lnb",  label: "LNB",      sub: "Masculino",   api: "/api/website/programacion-lnb"  },
  { key: "lnbf", label: "LNBF",     sub: "Femenino",    api: "/api/website/programacion-lnbf" },
  { key: "u22m", label: "U22 Masc", sub: "Sub 22 Masc", api: "/api/website/programacion-u22m" },
  { key: "u22f", label: "U22 Fem",  sub: "Sub 22 Fem",  api: "/api/website/programacion-u22f" },
]

const TEMPLATES = [
  { key: "pre",       label: "Anuncio",   desc: "Antes del partido" },
  { key: "resultado", label: "Resultado", desc: "Con marcador"      },
]

const FORMATS = [
  { key: "feed",     label: "Feed 4:5",      desc: "1080 × 1350" },
  { key: "historia", label: "Historia 9:16", desc: "1080 × 1920" },
]

function formatDate(iso: string) {
  if (!iso) return ""
  const datePart = iso.includes("T") ? iso.split("T")[0] : iso.split(" ")[0]
  const timePart = iso.includes("T") ? iso.split("T")[1]?.slice(0, 5) : iso.split(" ")[1]?.slice(0, 5)
  const [, m, d] = datePart.split("-")
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  return `${d} ${months[Number(m) - 1]}${timePart ? ` · ${timePart} hs` : ""}`
}

function DisenoInner() {
  const searchParams = useSearchParams()
  const ligaParam = (searchParams.get("liga") ?? "lnb") as Liga
  const ligaConfig = LIGAS.find((l) => l.key === ligaParam) ?? LIGAS[0]

  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [template, setTemplate] = useState("pre")
  const [format, setFormat] = useState("feed")
  const [titulo, setTitulo] = useState("")
  const [subtitulo, setSubtitulo] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"proximos" | "jugados">("proximos")
  const [teamFilter, setTeamFilter] = useState("")
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    setPartidos([])
    setSelected(new Set())
    setPreviewUrl(null)
    setPreviewError(null)
    setTeamFilter("")

    fetch(ligaConfig.api)
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
      .catch(() => setPreviewError("Error al cargar los partidos"))
      .finally(() => setLoading(false))
  }, [ligaConfig.api])

  const displayed = partidos
    .filter((p) => filter === "jugados" ? p.matchStatus === "COMPLETE" : p.matchStatus !== "COMPLETE")
    .filter((p) => {
      if (!teamFilter.trim()) return true
      const q = teamFilter.toLowerCase()
      return p.homeName.toLowerCase().includes(q) || p.awayName.toLowerCase().includes(q)
    })

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("bucket", "website")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir el logo")
      setLogoUrl(data.url)
      setPreviewUrl(null)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error al subir el logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPreviewUrl(null)
    setPreviewError(null)
  }

  function buildFlyerUrl() {
    if (selected.size === 0) return null
    const ids = Array.from(selected).join(",")
    const params = new URLSearchParams({ matchIds: ids, template, liga: ligaParam, format })
    if (titulo.trim()) params.set("titulo", titulo.trim())
    if (subtitulo.trim()) params.set("subtitulo", subtitulo.trim())
    if (logoUrl) params.set("logoUrl", logoUrl)
    return `/api/admin/flyer?${params.toString()}`
  }

  async function handleGenerate() {
    const url = buildFlyerUrl()
    if (!url) return
    setPreviewUrl(null)
    setPreviewError(null)

    // Check the API first before showing broken image
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const text = await res.text()
        setPreviewError(`Error ${res.status}: ${text || "No se pudo generar el flyer"}`)
        return
      }
      // Success – set as img src (re-fetch will be cached)
      setPreviewUrl(url)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error de conexión al generar el flyer")
    }
  }

  async function handleDownload() {
    const url = buildFlyerUrl()
    if (!url) return
    setGenerating(true)
    setPreviewError(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const text = await res.text()
        setPreviewError(`Error ${res.status}: ${text || "No se pudo generar el flyer"}`)
        return
      }
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      const safeTitulo = titulo.trim() ? titulo.trim().replace(/\s+/g, "_").toLowerCase() : template
      a.download = `flyer_${ligaParam}_${safeTitulo}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error de conexión al descargar el flyer")
    } finally {
      setGenerating(false)
    }
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

          {/* Liga activa */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <span className="text-sm font-bold text-primary">{ligaConfig.label}</span>
            <span className="text-xs text-muted-foreground">{ligaConfig.sub}</span>
            <span className="ml-auto text-xs text-muted-foreground">Seleccioná otra liga en el menú lateral</span>
          </div>

          {/* Logo (opcional) */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Logo <span className="normal-case font-normal">(opcional — si no subís nada, no aparece)</span>
            </Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
                e.target.value = ""
              }}
            />
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg border bg-gray-50 p-1" />
                <button
                  onClick={() => { setLogoUrl(null); setPreviewUrl(null) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Quitar logo
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "Subiendo..." : "Subir logo"}
              </button>
            )}
          </div>

          {/* Tipo */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTemplate(t.key); setPreviewUrl(null); setPreviewError(null) }}
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

          {/* Formato */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Formato</Label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setFormat(f.key); setPreviewUrl(null); setPreviewError(null) }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    format === f.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-sm font-semibold ${format === f.key ? "text-primary" : "text-gray-800"}`}>{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Título y Subtítulo */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Título <span className="normal-case font-normal">(opcional)</span>
              </Label>
              <Input
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); setPreviewUrl(null); setPreviewError(null) }}
                placeholder="Ej: FASE REGULAR FECHA 4"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Subtítulo <span className="normal-case font-normal">(opcional)</span>
              </Label>
              <Input
                value={subtitulo}
                onChange={(e) => { setSubtitulo(e.target.value); setPreviewUrl(null); setPreviewError(null) }}
                placeholder="Ej: APERTURA 2026 · LIGA NACIONAL"
                className="h-9"
              />
            </div>
          </div>

          {/* Lista de partidos */}
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
                    onClick={() => { setFilter(f); setSelected(new Set()); setPreviewUrl(null); setPreviewError(null) }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      filter === f ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {f === "proximos" ? "Próximos" : "Jugados"}
                  </button>
                ))}
              </div>
            </div>

            <Input
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Filtrar por equipo..."
              className="h-8 mb-2 text-xs"
            />

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 border rounded-xl p-2 bg-gray-50/50">
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
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center gap-3 ${
                        isChecked ? "border-primary bg-primary/5" : "border-transparent bg-white hover:border-gray-200"
                      }`}
                    >
                      {isChecked
                        ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                        : <Square className="h-4 w-4 text-gray-300 shrink-0" />
                      }
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {p.homeLogo && <img src={p.homeLogo} alt="" className="h-5 w-5 object-contain shrink-0" />}
                        <span className="text-xs font-semibold truncate">{p.homeName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {p.homeScore != null && p.awayScore != null ? `${p.homeScore}–${p.awayScore}` : "vs"}
                        </span>
                        <span className="text-xs font-semibold truncate">{p.awayName}</span>
                        {p.awayLogo && <img src={p.awayLogo} alt="" className="h-5 w-5 object-contain shrink-0" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{formatDate(p.matchTime)}</span>
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
              {previewError ? (
                <div className="flex flex-col items-center gap-3 text-red-400 py-12 px-6">
                  <AlertCircle className="h-10 w-10 opacity-70" />
                  <p className="text-sm text-center font-medium">{previewError}</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Flyer preview"
                  className="w-full h-auto"
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
            {format === "feed" ? "1080 × 1350 px · Feed 4:5" : "1080 × 1920 px · Historia 9:16"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DisenoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
      </div>
    }>
      <DisenoInner />
    </Suspense>
  )
}
