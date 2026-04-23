"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Download, Image as ImageIcon, Loader2, RefreshCw, CheckSquare, Square, Upload, X, AlertCircle, Plus, Sparkles, Copy, Check, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react"
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
  round: number | null
}

type Liga = "lnb" | "lnbf" | "u22m" | "u22f"

const LIGAS: { key: Liga; label: string; sub: string; api: string }[] = [
  { key: "lnb",  label: "LNB",      sub: "Masculino",   api: "/api/website/programacion-lnb"  },
  { key: "lnbf", label: "LNBF",     sub: "Femenino",    api: "/api/website/programacion-lnbf" },
  { key: "u22m", label: "U22 Masc", sub: "Sub 22 Masc", api: "/api/website/programacion-u22m" },
  { key: "u22f", label: "U22 Fem",  sub: "Sub 22 Fem",  api: "/api/website/programacion-u22f" },
]

const TEMPLATES = [
  { key: "pre",         label: "Anuncio",     desc: "Antes del partido" },
  { key: "resultado",   label: "Resultado",   desc: "Con marcador"      },
  { key: "tabla",       label: "Tabla",       desc: "Posiciones"        },
  { key: "lideres",     label: "Líderes",     desc: "Top estadísticas"  },
  { key: "jugador",     label: "Jugador",     desc: "Premio del partido" },
  { key: "lanzamiento", label: "Lanzamiento", desc: "Arranque de temporada" },
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
  const [textColor, setTextColor] = useState<"light" | "dark">("light")
  const [sponsors, setSponsors] = useState<(string | null)[]>([null, null, null, null, null])
  const [sponsorScales, setSponsorScales] = useState<number[]>([1, 1, 1, 1, 1])
  const [uploadingSponsors, setUploadingSponsors] = useState<boolean[]>([false, false, false, false, false])
  const [sponsorBg, setSponsorBg] = useState<"white" | "dark">("dark")
  const [textureUrl, setTextureUrl] = useState<string | null>(null)
  const [textureOpacity, setTextureOpacity] = useState(12)
  const [uploadingTexture, setUploadingTexture] = useState(false)
  const textureInputRef = useRef<HTMLInputElement>(null)
  const [titleSize, setTitleSize] = useState(100)
  const [subtitleSize, setSubtitleSize] = useState(100)
  const [titleWeight, setTitleWeight] = useState<400 | 700 | 900>(900)
  const [cardStyle, setCardStyle] = useState<"glass" | "solid" | "minimal">("glass")
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)
  const saveConfigTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [filter, setFilter] = useState<"proximos" | "jugados">("proximos")
  const [teamFilter, setTeamFilter] = useState("")
  const [copies, setCopies] = useState<string[]>([])
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeCopyIndex, setActiveCopyIndex] = useState<number | null>(null)
  const autoPreviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [presets, setPresets] = useState<Array<{name: string, config: Record<string, any>}>>([])
  const [presetName, setPresetName] = useState("")
  const [showPresetInput, setShowPresetInput] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [layout, setLayout] = useState<"default" | "compact">("default")
  const [statType, setStatType] = useState<"scoring" | "assists" | "rebounds">("scoring")
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState<string | null>(null)
  const [uploadingPlayerPhoto, setUploadingPlayerPhoto] = useState(false)
  const playerPhotoRef = useRef<HTMLInputElement>(null)
  const [jugadorNombre, setJugadorNombre] = useState("")
  const [jugadorClub, setJugadorClub] = useState("")
  const [jugadorPremio, setJugadorPremio] = useState("BROU")
  const [jugadorFecha, setJugadorFecha] = useState("")
  // Lanzamiento (arranque de temporada) — fecha + hora opcionales
  const [lzFecha, setLzFecha] = useState("")
  const [lzHora, setLzHora] = useState("")
  // LNBF Premium — selector de patrón de fondo
  const [lnbfPattern, setLnbfPattern] = useState<"clean" | "dots" | "nandu" | "court">("dots")
  // Badge "FECHA X" arriba derecha (solo en tema lnbf-premium). Vacío = sin badge.
  const [lnbfBadge, setLnbfBadge] = useState("")
  // Barra HORARIO al pie de cada tarjeta (solo en tema lnbf-premium)
  const [lnbfShowHorarioBar, setLnbfShowHorarioBar] = useState(true)
  const [jugadorTeamLogo, setJugadorTeamLogo] = useState<string | null>(null)
  const [uploadingJugadorLogo, setUploadingJugadorLogo] = useState(false)
  const jugadorLogoRef = useRef<HTMLInputElement>(null)
  const sponsorRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  // ── Sección (tab): Partidos (pre, resultado, jugador) vs Estadísticas (tabla, lideres) ──
  const [section, setSection] = useState<"partidos" | "estadisticas">("partidos")
  // Encuadre de imágenes (cover = llenar, contain = ver todo)
  const [bgFit, setBgFit] = useState<"cover" | "contain">("cover")
  const [photoFit, setPhotoFit] = useState<"cover" | "contain">("cover")
  const [photoPosX, setPhotoPosX] = useState(50)
  const [photoPosY, setPhotoPosY] = useState(0)
  const [photoScale, setPhotoScale] = useState(100)
  const [safeZones, setSafeZones] = useState(false)
  // Errores de upload inline (por campo)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({})

  // ── Helpers para guardar/cargar en localStorage ──
  function lsKey(key: string) { return `diseno_${key}_${ligaParam}` }

  function saveSponsors(sps: (string | null)[], scales: number[], bg: string) {
    localStorage.setItem(lsKey("sponsors"), JSON.stringify(sps))
    localStorage.setItem(lsKey("sponsorScales"), JSON.stringify(scales))
    localStorage.setItem(lsKey("sponsorBg"), bg)
  }

  function loadFromLocalStorage() {
    setLogoUrl(localStorage.getItem(lsKey("logo")) ?? null)
    setLogoScale(parseInt(localStorage.getItem(lsKey("logoScale")) ?? "100"))
    setTextureUrl(localStorage.getItem(lsKey("texture")) ?? null)
    setTextureOpacity(parseInt(localStorage.getItem(lsKey("textureOpacity")) ?? "12"))
    setTheme(localStorage.getItem(lsKey("theme")) ?? "masc1")
    setBgImageUrl(localStorage.getItem(lsKey("bgImage")) ?? null)
    setTitleSize(parseInt(localStorage.getItem(lsKey("titleSize")) ?? "100"))
    setSubtitleSize(parseInt(localStorage.getItem(lsKey("subtitleSize")) ?? "100"))
    setTitleWeight((parseInt(localStorage.getItem(lsKey("titleWeight")) ?? "900") as 400 | 700 | 900))
    setCardStyle((localStorage.getItem(lsKey("cardStyle")) as "glass" | "solid" | "minimal") ?? "glass")
    setTextColor((localStorage.getItem(lsKey("textColor")) as "light" | "dark") ?? "light")
    setBgFit((localStorage.getItem(lsKey("bgFit")) as "cover" | "contain") ?? "cover")
    setPhotoFit((localStorage.getItem(lsKey("photoFit")) as "cover" | "contain") ?? "cover")
    try {
      const sp = JSON.parse(localStorage.getItem(lsKey("sponsors")) ?? "null")
      setSponsors(Array.isArray(sp) ? [...sp, ...Array(5)].slice(0, 5).map(v => v ?? null) : [null, null, null, null, null])
      const sc = JSON.parse(localStorage.getItem(lsKey("sponsorScales")) ?? "null")
      setSponsorScales(Array.isArray(sc) ? [...sc, ...Array(5)].slice(0, 5).map(v => v ?? 1) : [1, 1, 1, 1, 1])
      setSponsorBg((localStorage.getItem(lsKey("sponsorBg")) as "white" | "dark") ?? "dark")
    } catch {
      setSponsors([null, null, null, null, null])
      setSponsorScales([1, 1, 1, 1, 1])
    }
  }

  // Cargar configuración cuando cambia la liga: primero intentamos desde
  // la DB (sincronización entre dispositivos), y si no hay nada o falla
  // la API, caemos a localStorage (modo offline + migración de datos
  // existentes).
  useEffect(() => {
    let cancelled = false
    setConfigLoaded(false)

    fetch(`/api/admin/diseno-config?liga=${ligaParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const c = data?.config
        if (c) {
          setLogoUrl(c.logoUrl ?? null)
          setLogoScale(typeof c.logoScale === "number" ? c.logoScale : 100)
          setTheme(c.theme ?? "masc1")
          setBgImageUrl(c.bgImageUrl ?? null)
          setBgFit((c.bgFit as "cover" | "contain") ?? "cover")
          setTextureUrl(c.textureUrl ?? null)
          setTextureOpacity(typeof c.textureOpacity === "number" ? c.textureOpacity : 12)
          const sp = Array.isArray(c.sponsors) ? c.sponsors : []
          const sc = Array.isArray(c.sponsorScales) ? c.sponsorScales : []
          setSponsors([...sp, ...Array(5)].slice(0, 5).map((v: any) => v ?? null))
          setSponsorScales([...sc, ...Array(5)].slice(0, 5).map((v: any) => (typeof v === "number" ? v : 1)))
          setSponsorBg((c.sponsorBg as "white" | "dark") ?? "dark")
          setTitleSize(typeof c.titleSize === "number" ? c.titleSize : 100)
          setSubtitleSize(typeof c.subtitleSize === "number" ? c.subtitleSize : 100)
          setTitleWeight((c.titleWeight ?? 900) as 400 | 700 | 900)
          setCardStyle((c.cardStyle as "glass" | "solid" | "minimal") ?? "glass")
          setTextColor((c.textColor as "light" | "dark") ?? "light")
          setLayout((c.layout as "default" | "compact") ?? "default")
          setSafeZones(Boolean(c.safeZones))
        } else {
          loadFromLocalStorage()
        }
      })
      .catch(() => {
        if (!cancelled) loadFromLocalStorage()
      })
      .finally(() => {
        if (!cancelled) {
          setConfigLoaded(true)
          setPreviewUrl(null)
          setPreviewError(null)
        }
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligaParam])

  // Load presets on mount (global, not per-liga)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("diseno_presets") ?? "[]")
      setPresets(Array.isArray(saved) ? saved : [])
    } catch { setPresets([]) }
  }, [])

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
          round: typeof m.round === "number" ? m.round : null,
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

  function setUploadError(key: string, msg: string | null) {
    setUploadErrors((prev) => ({ ...prev, [key]: msg }))
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true)
    setUploadError("logo", null)
    try {
      const url = await uploadImage(file)
      setLogoUrl(url)
      localStorage.setItem(lsKey("logo"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError("logo", e.message ?? "Error al subir el logo")
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
    setUploadError("texture", null)
    try {
      const url = await uploadImage(file)
      setTextureUrl(url)
      localStorage.setItem(lsKey("texture"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError("texture", e.message ?? "Error al subir textura")
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
    setUploadError("bg", null)
    try {
      const url = await uploadImage(file)
      setBgImageUrl(url)
      localStorage.setItem(lsKey("bgImage"), url)
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError("bg", e.message ?? "Error al subir el fondo")
    } finally {
      setUploadingBg(false)
    }
  }

  function handleRemoveBg() {
    setBgImageUrl(null)
    localStorage.removeItem(lsKey("bgImage"))
    setPreviewUrl(null)
  }

  async function handlePlayerPhotoUpload(file: File) {
    setUploadingPlayerPhoto(true)
    setUploadError("playerPhoto", null)
    try {
      const url = await uploadImage(file)
      setPlayerPhotoUrl(url)
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError("playerPhoto", e.message ?? "Error al subir la foto")
    } finally {
      setUploadingPlayerPhoto(false)
    }
  }

  async function handleJugadorLogoUpload(file: File) {
    setUploadingJugadorLogo(true)
    setUploadError("jugadorLogo", null)
    try {
      const url = await uploadImage(file)
      setJugadorTeamLogo(url)
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError("jugadorLogo", e.message ?? "Error al subir el escudo")
    } finally {
      setUploadingJugadorLogo(false)
    }
  }

  async function handleSponsorUpload(index: number, file: File) {
    setUploadingSponsors((prev) => { const n = [...prev]; n[index] = true; return n })
    setUploadError(`sponsor${index}`, null)
    try {
      const url = await uploadImage(file)
      setSponsors((prev) => {
        const n = [...prev]; n[index] = url
        saveSponsors(n, sponsorScales, sponsorBg)
        return n
      })
      setPreviewUrl(null)
    } catch (e: any) {
      setUploadError(`sponsor${index}`, e.message ?? "Error al subir sponsor")
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

  // Si todos los partidos seleccionados pertenecen a la misma jornada,
  // usamos "FECHA X" como subtítulo por defecto cuando el usuario no puso
  // uno custom.
  const suggestedSubtitle = (() => {
    if (selected.size === 0) return ""
    const selPartidos = partidos.filter((p) => selected.has(p.matchId))
    const rounds = Array.from(new Set(selPartidos.map((p) => p.round).filter((r): r is number => typeof r === "number")))
    if (rounds.length === 1) return `FECHA ${rounds[0]}`
    return ""
  })()

  function buildFlyerUrl() {
    const isAutoTemplate = template === "tabla" || template === "lideres" || template === "jugador" || template === "lanzamiento"
    if (!isAutoTemplate && selected.size === 0) return null
    const ids = isAutoTemplate ? template : Array.from(selected).join(",")
    const params = new URLSearchParams({ matchIds: ids, template, liga: ligaParam, format })
    if (safeZones && format === "historia") params.set("safeZones", "true")
    if (titulo.trim()) params.set("titulo", titulo.trim())
    if (subtitulo.trim()) params.set("subtitulo", subtitulo.trim())
    else if (suggestedSubtitle) params.set("subtitulo", suggestedSubtitle)
    if (logoUrl) { params.set("logoUrl", logoUrl); if (logoScale !== 100) params.set("logoScale", String(logoScale)) }
    if (!bgImageUrl) params.set("theme", theme)
    if (bgImageUrl) { params.set("bgImageUrl", bgImageUrl); if (bgFit !== "cover") params.set("bgFit", bgFit) }
    if (textureUrl) { params.set("textureUrl", textureUrl); params.set("textureOpacity", String(textureOpacity)) }
    if (playerPhotoUrl && photoFit !== "cover") params.set("photoFit", photoFit)
    // photoPosX/Y/Scale se mandan siempre (incluso sin playerPhotoUrl)
    // porque los templates Líderes/Jugador también usan foto auto-fetched
    // de Genius Sports cuando no hay foto custom subida.
    if (photoPosX !== 50) params.set("photoPosX", String(photoPosX))
    if (photoPosY !== 0) params.set("photoPosY", String(photoPosY))
    if (photoScale !== 100) params.set("photoScale", String(photoScale))
    if (titleSize !== 100) params.set("titleSize", String(titleSize))
    if (subtitleSize !== 100) params.set("subtitleSize", String(subtitleSize))
    if (titleWeight !== 900) params.set("titleWeight", String(titleWeight))
    if (cardStyle !== "glass") params.set("cardStyle", cardStyle)
    if (textColor !== "light") params.set("textColor", textColor)
    if (layout !== "default") params.set("layout", layout)
    if (template === "lideres" && statType !== "scoring") params.set("statType", statType)
    if (playerPhotoUrl) params.set("playerPhoto", playerPhotoUrl)
    if (jugadorNombre.trim()) params.set("jugadorNombre", jugadorNombre.trim())
    if (jugadorClub.trim()) params.set("jugadorClub", jugadorClub.trim())
    if (jugadorPremio.trim() && jugadorPremio !== "BROU") params.set("jugadorPremio", jugadorPremio.trim())
    if (jugadorFecha.trim()) params.set("jugadorFecha", jugadorFecha.trim())
    if (jugadorTeamLogo) params.set("jugadorTeamLogo", jugadorTeamLogo)
    if (template === "lanzamiento") {
      if (lzFecha.trim()) params.set("lzFecha", lzFecha.trim())
      if (lzHora.trim()) params.set("lzHora", lzHora.trim())
    }
    if (theme === "lnbf-premium" && lnbfPattern !== "dots") {
      params.set("lnbfPattern", lnbfPattern)
    }
    if (theme === "lnbf-premium" && lnbfBadge.trim()) {
      params.set("lnbfBadge", lnbfBadge.trim())
    }
    if (theme === "lnbf-premium" && !lnbfShowHorarioBar) {
      params.set("lnbfShowHorarioBar", "false")
    }
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
    return `/api/admin/flyer-v2?${params.toString()}`
  }

  // Auto-preview con debounce — se lanza 700ms después del último cambio
  const scheduleAutoPreview = useCallback(() => {
    if (autoPreviewTimer.current) clearTimeout(autoPreviewTimer.current)
    autoPreviewTimer.current = setTimeout(() => {
      const url = buildFlyerUrl()
      if (!url) { setPreviewLoading(false); return }
      setPreviewError(null)
      setPreviewLoading(true)
      fetch(url).then(async (res) => {
        if (res.ok) setPreviewUrl(url)
        else { const t = await res.text(); setPreviewError(`Error ${res.status}: ${t || "No se pudo generar"}`) }
      }).catch((e) => setPreviewError(e.message ?? "Error de conexión"))
        .finally(() => setPreviewLoading(false))
    }, 700)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, template, format, titulo, subtitulo, logoUrl, logoScale, theme, bgImageUrl, bgFit, photoFit, photoPosX, photoPosY, photoScale, textureUrl, textureOpacity, sponsors, sponsorScales, sponsorBg, titleSize, subtitleSize, titleWeight, cardStyle, textColor, ligaParam, layout, statType, playerPhotoUrl, jugadorNombre, jugadorClub, jugadorPremio, jugadorFecha, jugadorTeamLogo, safeZones, lzFecha, lzHora, lnbfPattern, lnbfBadge, lnbfShowHorarioBar])

  // Cualquier cambio de las deps re-dispara el preview (incluye escribir
  // el título/subtítulo, cambiar sponsors, logo, etc. — antes solo algunos
  // handlers lo llamaban explícitamente).
  useEffect(() => {
    scheduleAutoPreview()
  }, [scheduleAutoPreview])

  // Auto-save de la config a la DB con debounce de 1500ms. Se dispara en
  // cualquier cambio de los campos persistidos, después de que la carga
  // inicial (de DB o localStorage) terminó — así evitamos sobreescribir
  // la DB con los defaults vacíos antes de recibir la respuesta.
  useEffect(() => {
    if (!configLoaded) return
    if (saveConfigTimer.current) clearTimeout(saveConfigTimer.current)
    saveConfigTimer.current = setTimeout(() => {
      fetch(`/api/admin/diseno-config?liga=${ligaParam}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          logoUrl, logoScale, theme, bgImageUrl, bgFit,
          textureUrl, textureOpacity,
          sponsors, sponsorScales, sponsorBg,
          titleSize, subtitleSize, titleWeight,
          cardStyle, textColor, layout, safeZones,
        }),
      }).catch(() => {
        // Silencioso — localStorage sigue siendo el fallback offline.
      })
    }, 1500)
    return () => {
      if (saveConfigTimer.current) clearTimeout(saveConfigTimer.current)
    }
  }, [
    configLoaded, ligaParam,
    logoUrl, logoScale, theme, bgImageUrl, bgFit,
    textureUrl, textureOpacity,
    sponsors, sponsorScales, sponsorBg,
    titleSize, subtitleSize, titleWeight,
    cardStyle, textColor, layout, safeZones,
  ])

  // Helpers de texto/estilo con guardado + auto-preview
  function handleTitleSize(val: number) { setTitleSize(val); localStorage.setItem(lsKey("titleSize"), String(val)); setPreviewUrl(null); scheduleAutoPreview() }
  function handleSubtitleSize(val: number) { setSubtitleSize(val); localStorage.setItem(lsKey("subtitleSize"), String(val)); setPreviewUrl(null); scheduleAutoPreview() }
  function handleCardStyle(val: "glass" | "solid" | "minimal") { setCardStyle(val); localStorage.setItem(lsKey("cardStyle"), val); setPreviewUrl(null); scheduleAutoPreview() }
  function handleTextColor(val: "light" | "dark") { setTextColor(val); localStorage.setItem(lsKey("textColor"), val); setPreviewUrl(null); scheduleAutoPreview() }
  function handleBgFit(val: "cover" | "contain") { setBgFit(val); localStorage.setItem(lsKey("bgFit"), val); setPreviewUrl(null); scheduleAutoPreview() }
  function handlePhotoFit(val: "cover" | "contain") { setPhotoFit(val); localStorage.setItem(lsKey("photoFit"), val); setPreviewUrl(null); scheduleAutoPreview() }
  function handleTitleWeight(val: 400 | 700 | 900) { setTitleWeight(val); localStorage.setItem(lsKey("titleWeight"), String(val)); setPreviewUrl(null); scheduleAutoPreview() }

  // Cambiar sección (tab): setea template por defecto de la sección si el actual no pertenece
  function handleSection(val: "partidos" | "estadisticas") {
    setSection(val)
    const templatesPartidos = ["pre", "resultado", "jugador"]
    const templatesEstadisticas = ["tabla", "lideres"]
    const currentValid = val === "partidos" ? templatesPartidos.includes(template) : templatesEstadisticas.includes(template)
    if (!currentValid) setTemplate(val === "partidos" ? "pre" : "tabla")
    setPreviewUrl(null)
    setPreviewError(null)
  }

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

  async function handleGenerateCopy() {
    if (selected.size === 0) return
    setGeneratingCopy(true)
    setCopyError(null)
    setCopies([])
    const selectedPartidos = partidos.filter((p) => selected.has(p.matchId))
    const matches = selectedPartidos.map((p) => ({
      homeName: p.homeName,
      awayName: p.awayName,
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      venue: p.venue,
    }))
    try {
      const res = await fetch("/api/admin/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches, template, liga: ligaParam, titulo, subtitulo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al generar")
      setCopies(data.copies ?? [])
      if ((data.copies ?? []).length > 0) setActiveCopyIndex(0)
    } catch (e: any) {
      setCopyError(e.message ?? "Error al generar el copy")
    } finally {
      setGeneratingCopy(false)
    }
  }

  function handleCopyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  const isAutoTemplate = template === "tabla" || template === "lideres" || template === "jugador"
  const canGenerate = selected.size > 0 || isAutoTemplate

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Diseño / Flyers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generá flyers para redes sociales. Seleccioná uno o más partidos.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[520px_1fr] gap-8 items-start">

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
            {uploadErrors.logo && (
              <p className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.logo}</p>
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
                { key: "lnbf-premium", label: "LNBF Premium", sub: "Morado + gold · ñandutí", from: "#3C1370", to: "#0E0418" },
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
            {/* Controles específicos de LNBF Premium */}
            {theme === "lnbf-premium" && (
              <div className="mt-2 p-2.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                <div>
                  <Label className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-2 block">Patrón de fondo</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { key: "clean", label: "Liso",      desc: "Solo glows" },
                      { key: "dots",  label: "Puntos",    desc: "Constelación" },
                      { key: "nandu", label: "Ñandutí",   desc: "Rombos" },
                      { key: "court", label: "Cancha",    desc: "Líneas" },
                    ] as const).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setLnbfPattern(p.key)}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                          lnbfPattern === p.key ? "border-primary bg-white text-primary" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                        title={p.desc}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1.5 block">
                    Badge arriba derecha <span className="normal-case font-normal text-muted-foreground">(vacío = sin badge)</span>
                  </Label>
                  <Input
                    value={lnbfBadge}
                    onChange={(e) => setLnbfBadge(e.target.value)}
                    placeholder="Ej: FECHA 1 · APERTURA 2026"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <button
                  onClick={() => setLnbfShowHorarioBar(!lnbfShowHorarioBar)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                    lnbfShowHorarioBar ? "border-primary bg-white" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    lnbfShowHorarioBar ? "border-primary bg-primary" : "border-gray-300 bg-white"
                  }`}>
                    {lnbfShowHorarioBar && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[11px] font-semibold ${lnbfShowHorarioBar ? "text-primary" : "text-gray-600"}`}>
                    Mostrar barra HORARIO en cada tarjeta
                  </span>
                </button>
              </div>
            )}
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
                <div className="space-y-2">
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
                  {/* Toggle encuadre */}
                  <div className="flex gap-1.5">
                    {([
                      { key: "cover", label: "Llenar", desc: "Recorta bordes" },
                      { key: "contain", label: "Ver todo", desc: "Con márgenes" },
                    ] as const).map((o) => (
                      <button
                        key={o.key}
                        onClick={() => handleBgFit(o.key)}
                        className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                          bgFit === o.key ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {o.label} <span className="font-normal opacity-70">· {o.desc}</span>
                      </button>
                    ))}
                  </div>
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
              {uploadErrors.bg && (
                <p className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.bg}</p>
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
            {uploadErrors.texture && (
              <p className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.texture}</p>
            )}
          </div>

          {/* Sponsors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sponsors <span className="normal-case font-normal">(hasta 5 · solo PNG con fondo transparente)</span>
              </Label>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[0, 1, 2, 3, 4].map((i) => (
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
            {[0, 1, 2, 3, 4].map((i) => uploadErrors[`sponsor${i}`] ? (
              <p key={i} className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />Sponsor {i + 1}: {uploadErrors[`sponsor${i}`]}
              </p>
            ) : null)}
          </div>

          {/* Sección (tabs) + Tipo */}
          <div>
            {/* Tabs PARTIDOS / ESTADÍSTICAS */}
            <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-3">
              {(["partidos", "estadisticas"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSection(s)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    section === s ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {s === "partidos" ? "Partidos" : "Estadísticas"}
                </button>
              ))}
            </div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES
                .filter((t) => section === "partidos"
                  ? ["pre", "resultado", "jugador"].includes(t.key)
                  : ["tabla", "lideres"].includes(t.key))
                .map((t) => (
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

          {/* Layout (only for match card templates) */}
          {(template === "pre" || template === "resultado") && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Diseño de tarjeta</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "default", label: "Estándar", desc: "Logos + VS centrado" },
                  { key: "compact", label: "Compacto", desc: "Logos apilados + score" },
                ] as const).map((l) => (
                  <button key={l.key} onClick={() => { setLayout(l.key); setPreviewUrl(null) }}
                    className={`p-3 rounded-xl border text-left transition-colors ${layout === l.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <p className={`text-sm font-semibold ${layout === l.key ? "text-primary" : "text-gray-800"}`}>{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Líderes config */}
          {template === "lideres" && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Estadística</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "scoring",  label: "Puntos"      },
                  { key: "assists",  label: "Asistencias" },
                  { key: "rebounds", label: "Rebotes"     },
                ] as const).map((s) => (
                  <button key={s.key} onClick={() => { setStatType(s.key); setPreviewUrl(null) }}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${statType === s.key ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Foto del líder (opcional)</Label>
                <input ref={playerPhotoRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePlayerPhotoUpload(f); e.target.value = "" }} />
                {playerPhotoUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={playerPhotoUrl} alt="Foto" className="h-12 w-10 object-cover rounded border" />
                      <button onClick={() => { setPlayerPhotoUrl(null); setPreviewUrl(null) }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
                        <X className="h-3 w-3" /> Quitar
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      {([
                        { key: "cover", label: "Llenar" },
                        { key: "contain", label: "Ver todo" },
                      ] as const).map((o) => (
                        <button
                          key={o.key}
                          onClick={() => handlePhotoFit(o.key)}
                          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                            photoFit === o.key ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-muted-foreground w-14 shrink-0">Posición X</span>
                      <input type="range" min={0} max={100} value={photoPosX}
                        onChange={(e) => setPhotoPosX(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="text-[10px] font-medium w-8 text-right">{photoPosX}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14 shrink-0">Posición Y</span>
                      <input type="range" min={0} max={100} value={photoPosY}
                        onChange={(e) => setPhotoPosY(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="text-[10px] font-medium w-8 text-right">{photoPosY}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14 shrink-0">Zoom</span>
                      <input type="range" min={50} max={300} value={photoScale}
                        onChange={(e) => setPhotoScale(Number(e.target.value))}
                        className="flex-1 accent-primary" />
                      <span className="text-[10px] font-medium w-8 text-right">{photoScale}%</span>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => playerPhotoRef.current?.click()} disabled={uploadingPlayerPhoto}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-50">
                    {uploadingPlayerPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingPlayerPhoto ? "Subiendo..." : "Subir foto"}
                  </button>
                )}
                {uploadErrors.playerPhoto && (
                  <p className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.playerPhoto}</p>
                )}
              </div>
            </div>
          )}

          {/* Jugador del partido config */}
          {template === "jugador" && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Datos del jugador</Label>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Nombre completo</Label>
                <Input value={jugadorNombre} onChange={(e) => { setJugadorNombre(e.target.value); setPreviewUrl(null) }} placeholder="Ej: Juan Pérez" className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Club</Label>
                  <Input value={jugadorClub} onChange={(e) => { setJugadorClub(e.target.value); setPreviewUrl(null) }} placeholder="Ej: Olimpia" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Premio</Label>
                  <Input value={jugadorPremio} onChange={(e) => { setJugadorPremio(e.target.value); setPreviewUrl(null) }} placeholder="Ej: BROU" className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fecha / Jornada</Label>
                <Input value={jugadorFecha} onChange={(e) => { setJugadorFecha(e.target.value); setPreviewUrl(null) }} placeholder="Ej: Fecha 5" className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Foto del jugador</Label>
                  <input ref={playerPhotoRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePlayerPhotoUpload(f); e.target.value = "" }} />
                  {playerPhotoUrl ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <img src={playerPhotoUrl} alt="Foto" className="h-12 w-10 object-cover rounded border" />
                        <button onClick={() => { setPlayerPhotoUrl(null); setPreviewUrl(null) }}
                          className="flex items-center gap-1 px-2 py-1 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {([
                          { key: "cover", label: "Llenar" },
                          { key: "contain", label: "Ver todo" },
                        ] as const).map((o) => (
                          <button
                            key={o.key}
                            onClick={() => handlePhotoFit(o.key)}
                            className={`flex-1 py-1 rounded border text-[10px] font-semibold transition-colors ${
                              photoFit === o.key ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Posición X</span>
                        <input type="range" min={0} max={100} value={photoPosX}
                          onChange={(e) => setPhotoPosX(Number(e.target.value))}
                          className="flex-1 accent-primary" />
                        <span className="text-[10px] font-medium w-8 text-right">{photoPosX}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Posición Y</span>
                        <input type="range" min={0} max={100} value={photoPosY}
                          onChange={(e) => setPhotoPosY(Number(e.target.value))}
                          className="flex-1 accent-primary" />
                        <span className="text-[10px] font-medium w-8 text-right">{photoPosY}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">Zoom</span>
                        <input type="range" min={50} max={300} value={photoScale}
                          onChange={(e) => setPhotoScale(Number(e.target.value))}
                          className="flex-1 accent-primary" />
                        <span className="text-[10px] font-medium w-8 text-right">{photoScale}%</span>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => playerPhotoRef.current?.click()} disabled={uploadingPlayerPhoto}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-50 w-full justify-center">
                      {uploadingPlayerPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploadingPlayerPhoto ? "Subiendo..." : "Subir foto"}
                    </button>
                  )}
                  {uploadErrors.playerPhoto && (
                    <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.playerPhoto}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Escudo del club</Label>
                  <input ref={jugadorLogoRef} type="file" accept="image/png" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJugadorLogoUpload(f); e.target.value = "" }} />
                  {jugadorTeamLogo ? (
                    <div className="flex items-center gap-2">
                      <img src={jugadorTeamLogo} alt="Escudo" className="h-12 w-12 object-contain rounded border bg-gray-50 p-0.5" />
                      <button onClick={() => { setJugadorTeamLogo(null); setPreviewUrl(null) }}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => jugadorLogoRef.current?.click()} disabled={uploadingJugadorLogo}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-50 w-full justify-center">
                      {uploadingJugadorLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {uploadingJugadorLogo ? "Subiendo..." : "Subir escudo"}
                    </button>
                  )}
                  {uploadErrors.jugadorLogo && (
                    <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{uploadErrors.jugadorLogo}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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
            {format === "historia" && (
              <button
                onClick={() => setSafeZones(!safeZones)}
                className={`mt-2 w-full p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                  safeZones ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  safeZones ? "border-primary bg-primary" : "border-gray-300 bg-white"
                }`}>
                  {safeZones && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${safeZones ? "text-primary" : "text-gray-800"}`}>Optimizar para Stories</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Padding seguro para que no tape username/sponsors</p>
                </div>
              </button>
            )}
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
            {template === "lanzamiento" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Fecha</Label>
                  <Input value={lzFecha} onChange={(e) => setLzFecha(e.target.value)} placeholder="24 de abril" className="h-9" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Hora</Label>
                  <Input value={lzHora} onChange={(e) => setLzHora(e.target.value)} placeholder="20:30" className="h-9" />
                </div>
              </div>
            )}
          </div>

          {/* Texto y tarjetas */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Texto y tarjetas</Label>

            {/* Color del texto */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "light", label: "Texto claro",  desc: "Para fondos oscuros",  preview: "bg-gray-800" },
                { key: "dark",  label: "Texto oscuro", desc: "Para fondos claros",   preview: "bg-gray-100 border" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTextColor(t.key)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                    textColor === t.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className={`h-6 w-6 rounded shrink-0 ${t.preview} flex items-center justify-center`}>
                    <span className={`text-[9px] font-black ${t.key === "light" ? "text-white" : "text-gray-800"}`}>Aa</span>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${textColor === t.key ? "text-primary" : "text-gray-800"}`}>{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Estilo de tarjetas */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: "glass",  label: "Box claro",   desc: "Para fondos oscuros",  bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.3)" },
                { key: "solid",  label: "Box oscuro",  desc: "Para fondos claros",   bg: "rgba(0,0,0,0.45)",       border: "transparent" },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleCardStyle(s.key)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                    cardStyle === s.key ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div
                    className="h-6 w-6 rounded shrink-0 border border-gray-300"
                    style={{ background: s.bg }}
                  />
                  <div>
                    <p className={`text-xs font-semibold ${cardStyle === s.key ? "text-primary" : "text-gray-800"}`}>{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Tamaños de texto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Título <span className="font-medium text-gray-700">{titleSize}%</span></p>
                <input type="range" min={40} max={200} step={5} value={titleSize}
                  onChange={(e) => handleTitleSize(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subtítulo <span className="font-medium text-gray-700">{subtitleSize}%</span></p>
                <input type="range" min={40} max={200} step={5} value={subtitleSize}
                  onChange={(e) => handleSubtitleSize(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            {/* Peso del título */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Peso del título</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { val: 400 as const, label: "Regular",  weight: "font-normal" },
                  { val: 700 as const, label: "Bold",     weight: "font-bold" },
                  { val: 900 as const, label: "Black",    weight: "font-black" },
                ]).map((o) => (
                  <button
                    key={o.val}
                    onClick={() => handleTitleWeight(o.val)}
                    className={`py-1.5 rounded-lg border text-xs transition-colors ${o.weight} ${
                      titleWeight === o.val ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de partidos (solo para templates que requieren selección) */}
          {!isAutoTemplate && <div>
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
          </div>}

          {/* Acciones — solo en móvil (en desktop están en el panel de preview) */}
          <div className="flex gap-2 xl:hidden">
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

        {/* ── RIGHT: preview — sticky en desktop ── */}
        <div className="xl:sticky xl:top-6 space-y-3">

          {/* Header del panel — solo label e info de formato */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
              <p className="text-[10px] text-muted-foreground">
                {format === "feed" ? "Feed 4:5 · 1080 × 1350 px" : "Historia 9:16 · 1080 × 1920 px"}
              </p>
            </div>
          </div>

          {format === "feed" ? (
            /* ── Instagram Feed mockup (4:5) ── */
            <div className="max-w-[390px] mx-auto bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100">
                <img src="https://www.cpb.com.py/logo-cpb.jpg" alt="CPB" className="h-8 w-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-none text-gray-900">cpb_py</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Paraguay</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
              </div>

              {/* Image — aspect 4:5 */}
              <div className="relative bg-gray-900 overflow-hidden" style={{ aspectRatio: "4/5" }}>
                {previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 px-4 text-center">
                    <AlertCircle className="h-7 w-7 opacity-70 shrink-0" />
                    <p className="text-xs font-medium">{previewError}</p>
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Flyer" className="absolute inset-0 w-full h-full object-contain" />
                ) : previewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-xs">Generando preview...</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
                    <ImageIcon className="h-8 w-8 opacity-20" />
                    <p className="text-xs opacity-40 text-center px-6">
                      {canGenerate ? "Vista previa en vivo" : "Seleccioná uno o más partidos para generar"}
                    </p>
                  </div>
                )}
                {/* Mini indicator while refreshing an existing preview */}
                {previewLoading && previewUrl && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Actualizando</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-3.5 mb-2">
                  <Heart className="h-5 w-5 text-gray-700" />
                  <MessageCircle className="h-5 w-5 text-gray-700" />
                  <Send className="h-5 w-5 text-gray-700" />
                  <Bookmark className="h-5 w-5 text-gray-700 ml-auto" />
                </div>
                <p className="text-xs font-semibold text-gray-800">1.234 Me gusta</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed line-clamp-3">
                  <span className="font-semibold text-gray-900">cpb_py</span>{" "}
                  <span className="text-gray-500">
                    {activeCopyIndex !== null && copies[activeCopyIndex]
                      ? copies[activeCopyIndex]
                      : titulo ? titulo.toLowerCase()
                      : template === "resultado" ? "así quedaron los resultados 🏀"
                      : "todo listo para una nueva jornada 🏀"}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            /* ── Phone mockup — Historia (9:16) ── */
            <div className="max-w-[260px] mx-auto">
              <div className="relative bg-black rounded-[36px] border-[7px] border-gray-800 shadow-2xl overflow-hidden" style={{ aspectRatio: "9/16" }}>
                {/* Image */}
                {previewError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 px-4 text-center">
                    <AlertCircle className="h-6 w-6 opacity-70" />
                    <p className="text-[10px] font-medium">{previewError}</p>
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Historia" className="absolute inset-0 w-full h-full object-contain" />
                ) : previewLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-[10px]">Generando...</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
                    <ImageIcon className="h-8 w-8 opacity-20" />
                    <p className="text-[10px] opacity-40 text-center px-4">
                      {canGenerate ? "Vista previa en vivo" : "Seleccioná partidos"}
                    </p>
                  </div>
                )}
                {previewLoading && previewUrl && (
                  <div className="absolute top-10 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  </div>
                )}

                {/* Story UI overlay */}
                <div className="absolute top-0 left-0 right-0 px-2 pt-2 space-y-2 pointer-events-none">
                  {/* Progress bars */}
                  <div className="flex gap-1">
                    <div className="h-0.5 flex-1 rounded-full bg-white/80" />
                    <div className="h-0.5 flex-1 rounded-full bg-white/30" />
                    <div className="h-0.5 flex-1 rounded-full bg-white/30" />
                  </div>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-1.5">
                    <img src="https://www.cpb.com.py/logo-cpb.jpg" alt="CPB" className="h-6 w-6 rounded-full object-cover shrink-0" />
                    <span className="text-white text-[10px] font-semibold drop-shadow">cpb_py</span>
                    <span className="text-white/60 text-[9px]">· 2h</span>
                  </div>
                </div>
              </div>
              {/* Pill debajo del phone */}
              <div className="flex justify-center mt-2">
                <span className="text-[10px] text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">Historia · 1080 × 1920 px</span>
              </div>
            </div>
          )}

          {/* Botones de acción — siempre visibles bajo el mockup en desktop */}
          <div className="hidden xl:flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Vista previa
            </button>
            <button
              onClick={handleDownload}
              disabled={!canGenerate || generating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Descargar PNG
            </button>
          </div>

          {canGenerate && !previewUrl && !previewError && (
            <p className="text-[10px] text-muted-foreground text-center">
              Auto-preview activo · se genera 1.5 s después del último cambio
            </p>
          )}
        </div>
      </div>

      {/* ── Copy para Instagram ── */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Copy para Instagram
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generá 3 opciones de caption con IA basadas en los partidos seleccionados
            </p>
          </div>
          <button
            onClick={handleGenerateCopy}
            disabled={selected.size === 0 || generatingCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {generatingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generatingCopy ? "Generando..." : "Generar copys"}
          </button>
        </div>

        {copyError && (
          <div className="flex items-center gap-2 text-red-600 text-sm py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {copyError}
          </div>
        )}

        {copies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {copies.map((copy, i) => (
              <div
                key={i}
                onClick={() => setActiveCopyIndex(i)}
                className={`relative group rounded-xl border p-4 cursor-pointer transition-colors ${
                  activeCopyIndex === i
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${activeCopyIndex === i ? "text-primary" : "text-muted-foreground"}`}>
                    Opción {i + 1}
                  </p>
                  {activeCopyIndex === i && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      En mockup
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{copy}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(copy, i) }}
                  className="absolute top-3 right-3 h-7 w-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100"
                  title="Copiar al portapapeles"
                >
                  {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
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
