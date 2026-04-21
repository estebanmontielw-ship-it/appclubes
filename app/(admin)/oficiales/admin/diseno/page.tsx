"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Image as ImageIcon, Loader2, RefreshCw, CheckSquare, Square, Upload, X, AlertCircle, Plus } from "lucide-react"
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
  const [logoScale, setLogoScale] = useState(100)
  const [theme, setTheme] = useState("masc1")
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [sponsors, setSponsors] = useState<(string | null)[]>([null, null, null])
  const [sponsorScales, setSponsorScales] = useState<number[]>([1, 1, 1])
  const [uploadingSponsors, setUploadingSponsors] = useState<boolean[]>([false, false, false])
  const [sponsorBg, setSponsorBg] = useState<"white" | "dark">("dark")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [textureOpacity, setTextureOpacity] = useState(12)
  const [uploadingTexture, setUploadingTexture] = useState(false)
  const textureInputRef = useRef<HTMLInputElement>(null)
  const [titleSize, setTitleSize] = useState(100)
  const [subtitleSize, setSubtitleSize] = useState(100)
  const [cardStyle, setCardStyle] = useState<"glass" | "solid" | "minimal">("glass")
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"proximos" | "jugados">("proximos")
  const [teamFilter, setTeamFilter] = useState("")
  const autoPreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const sponsorRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // ── Helpers para guardar/cargar en localStorage ──
  function lsKey(key: string) { return `diseno_${key}_${ligaParam}` }

  function saveSponsors(sps: (string | null)[], scales: number[], bg: string) {
    localStorage.setItem(lsKey("sponsors"), JSON.stringify(sps))
    localStorage.setItem(lsKey("sponsorScales"), JSON.stringify(scales))
    localStorage.setItem(lsKey("sponsorBg"), bg)
  }

  // Cargar configuración cuando cambia la liga
  useEffect(() => {
    setLogoUrl(localStorage.getItem(lsKey("logo")) ?? null)
    setLogoScale(parseInt(localStorage.getItem(lsKey("logoScale")) ?? "100"))
    setTextureUrl(localStorage.getItem(lsKey("texture")) ?? null)
    setTextureOpacity(parseInt(localStorage.getItem(lsKey("textureOpacity")) ?? "12"))
    setTheme(localStorage.getItem(lsKey("theme")) ?? "masc1")
    setBgImageUrl(localStorage.getItem(lsKey("bgImage")) ?? null)
    setTitleSize(parseInt(localStorage.getItem(lsKey("titleSize")) ?? "100"))
    setSubtitleSize(parseInt(localStorage.getItem(lsKey("subtitleSize")) ?? "100"))
    setCardStyle((localStorage.getItem(lsKey("cardStyle")) as "glass" | "solid" | "minimal") ?? "glass")
    try {
      const sp = JSON.parse(localStorage.getItem(lsKey("sponsors")) ?? "null")
      setSponsors(Array.isArray(sp) ? sp : [null, null, null])
      const sc = JSON.parse(localStorage.getItem(lsKey("sponsorScales")) ?? "null")
      setSponsorScales(Array.isArray(sc) ? sc : [1, 1, 1])
      setSponsorBg((localStorage.getItem(lsKey("sponsorBg")) as "white" | "dark") ?? "dark")
    } catch {
      setSponsors([null, null, null])
      setSponsorScales([1, 1, 1])
    }
    setPreviewUrl(null)
    setPreviewError(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligaParam])

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

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("bucket", "website")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error al subir imagen")
    return data.url as string
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    try {
      const url = await uploadImage(file)
      setLogoUrl(url)
      localStorage.setItem(lsKey("logo"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error al subir el logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  function handleRemoveLogo() {
    setLogoUrl(null)
    localStorage.removeItem(lsKey("logo"))
    setPreviewUrl(null)
  }

  function handleLogoScale(val: number) {
    setLogoScale(val)
    localStorage.setItem(lsKey("logoScale"), String(val))
    setPreviewUrl(null)
  }

  async function handleTextureUpload(file: File) {
    setUploadingTexture(true)
    try {
      const url = await uploadImage(file)
      setTextureUrl(url)
      localStorage.setItem(lsKey("texture"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error al subir textura")
    } finally {
      setUploadingTexture(false)
    }
  }

  function handleRemoveTexture() {
    setTextureUrl(null)
    localStorage.removeItem(lsKey("texture"))
    setPreviewUrl(null)
  }

  function handleTextureOpacity(val: number) {
    setTextureOpacity(val)
    localStorage.setItem(lsKey("textureOpacity"), String(val))
    setPreviewUrl(null)
  }

  function handleTheme(val: string) {
    setTheme(val)
    localStorage.setItem(lsKey("theme"), val)
    setPreviewUrl(null)
  }

  async function handleBgUpload(file: File) {
    setUploadingBg(true)
    try {
      const url = await uploadImage(file)
      setBgImageUrl(url)
      localStorage.setItem(lsKey("bgImage"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error al subir el fondo")
    } finally {
      setUploadingBg(false)
    }
  }

  function handleRemoveBg() {
    setBgImageUrl(null)
    localStorage.removeItem(lsKey("bgImage"))
    setPreviewUrl(null)
  }

  async function handleSponsorUpload(index: number, file: File) {
    setUploadingSponsors((prev) => { const n = [...prev]; n[index] = true; return n })
    try {
      const url = await uploadImage(file)
      setSponsors((prev) => {
        const n = [...prev]; n[index] = url
        saveSponsors(n, sponsorScales, sponsorBg)
        return n
      })
      setPreviewUrl(null)
    } catch (e: any) {
      setPreviewError(e.message ?? "Error al subir sponsor")
    } finally {
      setUploadingSponsors((prev) => { const n = [...prev]; n[index] = false; return n })
    }
  }

  function handleRemoveSponsor(index: number) {
    setSponsors((prev) => {
      const n = [...prev]; n[index] = null
      saveSponsors(n, sponsorScales, sponsorBg)
      return n
    })
    setPreviewUrl(null)
  }

  function handleSponsorScale(index: number, val: number) {
    setSponsorScales((prev) => {
      const n = [...prev]; n[index] = val
      saveSponsors(sponsors, n, sponsorBg)
      return n
    })
    setPreviewUrl(null)
  }

  function handleSponsorBg(val: "white" | "dark") {
    setSponsorBg(val)
    saveSponsors(sponsors, sponsorScales, val)
    setPreviewUrl(null)
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
    if (logoUrl) { params.set("logoUrl", logoUrl); if (logoScale !== 100) params.set("logoScale", String(logoScale)) }
    if (!bgImageUrl) params.set("theme", theme)
    if (bgImageUrl) params.set("bgImageUrl", bgImageUrl)
    if (textureUrl && !bgImageUrl) { params.set("textureUrl", textureUrl); params.set("textureOpacity", String(textureOpacity)) }
    if (titleSize !== 100) params.set("titleSize", String(titleSize))
    if (subtitleSize !== 100) params.set("subtitleSize", String(subtitleSize))
    if (cardStyle !== "glass") params.set("cardStyle", cardStyle)
    const activeSponsors = sponsors.filter(Boolean)
    if (activeSponsors.length > 0) {
      sponsors.forEach((s, i) => {
        if (s) {
          params.set(`s${i + 1}`, s)
          if (sponsorScales[i] !== 1) params.set(`s${i + 1}scale`, String(sponsorScales[i]))
        }
      })
      params.set("sponsorBg", sponsorBg)
    }
    return `/api/admin/flyer?${params.toString()}`
  }

  // Auto-preview con debounce — se lanza 1.5s después del último cambio
  const scheduleAutoPreview = useCallback(() => {
    if (autoPreviewTimer.current) clearTimeout(autoPreviewTimer.current)
    autoPreviewTimer.current = setTimeout(() => {
      const url = buildFlyerUrl()
      if (!url) return
      setPreviewUrl(null)
      setPreviewError(null)
      fetch(url).then(async (res) => {
        if (res.ok) setPreviewUrl(url)
        else { const t = await res.text(); setPreviewError(`Error ${res.status}: ${t || "No se pudo generar"}`) }
      }).catch((e) => setPreviewError(e.message ?? "Error de conexión"))
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, template, format, titulo, subtitulo, logoUrl, logoScale, theme, bgImageUrl, textureUrl, textureOpacity, sponsors, sponsorScales, sponsorBg, titleSize, subtitleSize, cardStyle, ligaParam])

  // Helpers de texto/estilo con guardado + auto-preview
  function handleTitleSize(val: number) { setTitleSize(val); localStorage.setItem(lsKey("titleSize"), String(val)); setPreviewUrl(null); scheduleAutoPreview() }
  function handleSubtitleSize(val: number) { setSubtitleSize(val); localStorage.setItem(lsKey("subtitleSize"), String(val)); setPreviewUrl(null); scheduleAutoPreview() }
  function handleCardStyle(val: "glass" | "solid" | "minimal") { setCardStyle(val); localStorage.setItem(lsKey("cardStyle"), val); setPreviewUrl(null); scheduleAutoPreview() }

  async function handleGenerate() {
    if (autoPreviewTimer.current) clearTimeout(autoPreviewTimer.current)
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
              Logo <span className="normal-case font-normal">(opcional · solo PNG con fondo transparente)</span>
            </Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
                e.target.value = ""
              }}
            />
            {logoUrl ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-lg border bg-gray-50 p-1" />
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Quitar logo
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">Tamaño</span>
                    <input
                      type="range" min={30} max={300} value={logoScale}
                      onChange={(e) => handleLogoScale(Number(e.target.value))}
                      className="w-20 accent-primary"
                    />
                    <span className="text-xs font-medium w-8">{logoScale}%</span>
                  </div>
                </div>
              </>
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

          {/* Color del fondo */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Color de fondo</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "masc1", label: "Azul marino",   sub: "Masculino · clásico",  from: "#0b1e3d", to: "#091830" },
                { key: "masc2", label: "Azul royal",    sub: "Masculino · alternativo", from: "#0a2e6e", to: "#061a4a" },
                { key: "fem1",  label: "Violeta",       sub: "Femenino · clásico",   from: "#2d0a4e", to: "#1a0630" },
                { key: "fem2",  label: "Bordo/rojo",    sub: "Femenino · alternativo", from: "#4a0a1a", to: "#2a0610" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTheme(t.key)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                    theme === t.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                  />
                  <div>
                    <p className={`text-xs font-semibold ${theme === t.key ? "text-primary" : "text-gray-800"}`}>{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            {/* Subir fondo propio */}
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleBgUpload(file)
                e.target.value = ""
              }}
            />
            <div className="mt-2">
              {bgImageUrl ? (
                <div className="flex items-center gap-3 p-2 rounded-xl border border-primary/30 bg-primary/5">
                  <img src={bgImageUrl} alt="Fondo" className="h-10 w-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary">Fondo propio activo</p>
                    <p className="text-[10px] text-muted-foreground">Reemplaza el color de fondo al 100%</p>
                  </div>
                  <button
                    onClick={handleRemoveBg}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3 w-3" /> Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => bgInputRef.current?.click()}
                  disabled={uploadingBg}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {uploadingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingBg ? "Subiendo..." : "Subir propio fondo (reemplaza el color)"}
                </button>
              )}
            </div>
          </div>

          {/* Textura de fondo */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Textura de fondo <span className="normal-case font-normal">(opcional)</span>
            </Label>
            <input
              ref={textureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleTextureUpload(file)
                e.target.value = ""
              }}
            />
            <div className="flex items-center gap-3">
              {textureUrl ? (
                <>
                  <img src={textureUrl} alt="Textura" className="h-10 w-16 object-cover rounded border" />
                  <button
                    onClick={handleRemoveTexture}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Quitar
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">Opacidad</span>
                    <input
                      type="range" min={5} max={40} value={textureOpacity}
                      onChange={(e) => handleTextureOpacity(Number(e.target.value))}
                      className="w-20 accent-primary"
                    />
                    <span className="text-xs font-medium w-8">{textureOpacity}%</span>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => textureInputRef.current?.click()}
                  disabled={uploadingTexture}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  {uploadingTexture ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingTexture ? "Subiendo..." : "Subir textura"}
                </button>
              )}
            </div>
          </div>

          {/* Sponsors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sponsors <span className="normal-case font-normal">(hasta 3 · solo PNG con fondo transparente)</span>
              </Label>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <input
                    ref={sponsorRefs[i]}
                    type="file"
                    accept="image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleSponsorUpload(i, file)
                      e.target.value = ""
                    }}
                  />
                  {sponsors[i] ? (
                    <>
                      <div className="relative group">
                        <img
                          src={sponsors[i]!}
                          alt={`Sponsor ${i + 1}`}
                          className="h-12 w-full object-contain rounded-lg border bg-gray-100 p-1"
                        />
                        <button
                          onClick={() => handleRemoveSponsor(i)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {/* Tamaño del sponsor */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleSponsorScale(i, Math.max(0.3, +(sponsorScales[i]-0.1).toFixed(1)))}
                          className="h-6 w-6 rounded border text-xs font-bold text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                        >−</button>
                        <span className="text-[10px] text-muted-foreground font-medium">{Math.round(sponsorScales[i]*100)}%</span>
                        <button
                          onClick={() => handleSponsorScale(i, Math.min(3, +(sponsorScales[i]+0.1).toFixed(1)))}
                          className="h-6 w-6 rounded border text-xs font-bold text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                        >+</button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => sponsorRefs[i].current?.click()}
                      disabled={uploadingSponsors[i]}
                      className="h-12 w-full rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingSponsors[i] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span className="text-[10px]">Sponsor {i + 1}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sponsors.some(Boolean) && (
              <div className="flex gap-2">
                {(["dark", "white"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSponsorBg(opt)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      sponsorBg === opt
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {opt === "dark" ? "🌑 Barra oscura" : "⬜ Barra blanca"}
                  </button>
                ))}
              </div>
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

          {/* Texto y estilo de tarjetas */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Texto y estilo</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Título <span className="font-medium text-gray-700">{titleSize}%</span></p>
                <input
                  type="range" min={40} max={200} step={5} value={titleSize}
                  onChange={(e) => handleTitleSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subtítulo <span className="font-medium text-gray-700">{subtitleSize}%</span></p>
                <input
                  type="range" min={40} max={200} step={5} value={subtitleSize}
                  onChange={(e) => handleSubtitleSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "glass",   label: "Vidrio",  desc: "Con transparencia" },
                { key: "solid",   label: "Sólido",  desc: "Oscuro opaco" },
                { key: "minimal", label: "Mínimo",  desc: "Sin relleno" },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleCardStyle(s.key)}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    cardStyle === s.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-xs font-semibold ${cardStyle === s.key ? "text-primary" : "text-gray-800"}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </button>
              ))}
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
