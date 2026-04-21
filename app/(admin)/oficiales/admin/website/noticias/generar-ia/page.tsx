"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Send, ImageIcon, ChevronDown, ChevronUp, Check, Wand2 } from "lucide-react"
import RichTextEditor from "@/components/admin/RichTextEditor"

const LIGAS = [
  { id: "lnb", label: "LNB", fullName: "Liga Nacional de Básquetbol" },
  { id: "lnbf", label: "LNBF", fullName: "Liga Nacional de Básquetbol Femenino" },
  { id: "u22m", label: "U22 Masc.", fullName: "Torneo Sub 22 Masculino" },
  { id: "u22f", label: "U22 Fem.", fullName: "Torneo Sub 22 Femenino" },
]

const TIPOS = [
  { id: "resultado", label: "Resultados", desc: "Resumen de partidos jugados" },
  { id: "previa", label: "Previa", desc: "Anticipación de próximos partidos" },
  { id: "general", label: "General", desc: "Nota institucional o especial" },
]

const CATEGORIAS = [
  { value: "GENERAL", label: "General" },
  { value: "TORNEOS", label: "Torneos" },
  { value: "SELECCIONES", label: "Selecciones" },
  { value: "ARBITRAJE", label: "Arbitraje" },
  { value: "INSTITUCIONAL", label: "Institucional" },
  { value: "CLUBES", label: "Clubes" },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function formatMatchTime(matchTime: string) {
  if (!matchTime) return { date: "", time: "" }
  const [datePart, timePart] = matchTime.split(" ")
  if (!datePart) return { date: "", time: "" }
  const [y, m, d] = datePart.split("-").map(Number)
  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const dt = new Date(y, m - 1, d)
  const time = timePart ? timePart.slice(0, 5) : ""
  return { date: `${DIAS[dt.getDay()]} ${d} ${MESES[m - 1]}`, time }
}

interface MatchItem {
  matchId: number
  homeName: string
  awayName: string
  homeScore: string | null
  awayScore: string | null
  date: string
  time: string
  venue: string
  status: string
}

export default function GenerarIAPage() {
  const router = useRouter()

  // Context
  const [liga, setLiga] = useState("lnb")
  const [tipoNota, setTipoNota] = useState("resultado")
  const [extraInfo, setExtraInfo] = useState("")
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [selected, setSelected] = useState(new Set<number>())

  // Article fields
  const [titulo, setTitulo] = useState("")
  const [slug, setSlug] = useState("")
  const [autoSlug, setAutoSlug] = useState(true)
  const [extracto, setExtracto] = useState("")
  const [contenido, setContenido] = useState("")
  const [categoria, setCategoria] = useState("TORNEOS")
  const [autorNombre, setAutorNombre] = useState("Esteban Montiel")

  // UI
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [genError, setGenError] = useState("")
  const [showContext, setShowContext] = useState(true)

  // Cover
  const [coverUrl, setCoverUrl] = useState("")
  const [coverLoading, setCoverLoading] = useState(false)
  const [uploadedCover, setUploadedCover] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true)
    setSelected(new Set())
    try {
      // Load both scheduled and complete matches
      const [scheduled, complete] = await Promise.all([
        fetch(`/api/genius/matches?status=SCHEDULED&liga=${liga}`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/genius/matches?status=COMPLETE&liga=${liga}`).then(r => r.json()).catch(() => ({ data: [] })),
      ])

      const raw: any[] = [
        ...(complete?.response?.data ?? complete?.data ?? []),
        ...(scheduled?.response?.data ?? scheduled?.data ?? []),
      ]

      // Sort: most recent complete first, then upcoming
      const items: MatchItem[] = raw.map((m: any) => {
        const home = m.competitors?.find((c: any) => c.isHomeCompetitor === 1) ?? m.competitors?.[0]
        const away = m.competitors?.find((c: any) => c.isHomeCompetitor === 0) ?? m.competitors?.[1]
        const { date, time } = formatMatchTime(m.matchTime ?? "")
        return {
          matchId: m.matchId,
          homeName: home?.competitorName ?? "Local",
          awayName: away?.competitorName ?? "Visitante",
          homeScore: home?.scoreString || null,
          awayScore: away?.scoreString || null,
          date,
          time,
          venue: m.venue?.venueName ?? m.venueName ?? "",
          status: m.matchStatus ?? "",
        }
      }).filter(m => m.matchId)

      // Sort: complete first (most recent by date desc), then scheduled
      const complete_ = items.filter(m => m.status === "COMPLETE").slice(0, 8)
      const scheduled_ = items.filter(m => m.status !== "COMPLETE").slice(0, 6)
      setMatches([...complete_, ...scheduled_])
    } catch {
      setMatches([])
    } finally {
      setMatchesLoading(false)
    }
  }, [liga])

  useEffect(() => { loadMatches() }, [loadMatches])

  function toggleMatch(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError("")

    const ligaLabel = LIGAS.find(l => l.id === liga)?.fullName ?? liga.toUpperCase()
    const selectedMatches = matches.filter(m => selected.has(m.matchId))

    const matchLines = selectedMatches.map(m => {
      if (tipoNota === "resultado" && m.homeScore && m.awayScore) {
        return `${m.homeName} ${m.homeScore} – ${m.awayScore} ${m.awayName}${m.venue ? ` (${m.venue})` : ""}${m.date ? ` · ${m.date}` : ""}`
      }
      return `${m.homeName} vs ${m.awayName}${m.venue ? ` en ${m.venue}` : ""}${m.date ? ` · ${m.date}` : ""}${m.time ? ` a las ${m.time}` : ""}`
    }).join("\n")

    const prompt = [
      `Liga: ${ligaLabel}`,
      `Tipo de nota: ${tipoNota === "resultado" ? "Resumen de resultados" : tipoNota === "previa" ? "Previa de jornada" : "Nota general"}`,
      matchLines ? `\nPartidos:\n${matchLines}` : "",
      extraInfo ? `\nInformación adicional: ${extraInfo}` : "",
    ].filter(Boolean).join("\n")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tipo: "generar-noticia" }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error al generar")
      }
      const { result } = await res.json()
      setTitulo(result.titulo ?? "")
      setSlug(slugify(result.titulo ?? ""))
      setExtracto(result.extracto ?? "")
      setContenido(result.contenido ?? "")
      if (result.categoria) setCategoria(result.categoria)
      setGenerated(true)
      setShowContext(false)
      // Auto-generate cover
      void generateCover(result.titulo ?? "", result.categoria ?? categoria, selectedMatches)
    } catch (e: any) {
      setGenError(e.message ?? "Error")
    } finally {
      setGenerating(false)
    }
  }

  async function generateCover(t?: string, cat?: string, selMatches?: MatchItem[]) {
    const titleToUse = t ?? titulo
    if (!titleToUse) return
    setCoverLoading(true)
    const matchList = selMatches ?? matches.filter(m => selected.has(m.matchId))
    const first = matchList[0]
    const params = new URLSearchParams({
      titulo: titleToUse,
      categoria: cat ?? categoria,
      ...(first ? {
        home: first.homeName,
        away: first.awayName,
        ...(first.homeScore && first.awayScore ? { homeScore: first.homeScore, awayScore: first.awayScore } : {}),
        fecha: first.date,
      } : {}),
    })
    setCoverUrl(`/api/admin/news-cover?${params.toString()}&t=${Date.now()}`)
    setCoverLoading(false)
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    if (res.ok) {
      const { url } = await res.json()
      setUploadedCover(url)
      setCoverUrl(url)
    }
  }

  async function handleChat() {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
    setChatLoading(true)

    const context = `Estás ayudando a refinar una noticia para la CPB.\n\nTítulo actual: ${titulo}\nExtracto: ${extracto}\nContenido:\n${contenido.replace(/<[^>]+>/g, " ")}\n\nSolicitud del editor: ${userMsg}\n\nResponde con un JSON con las claves que querés actualizar (titulo, extracto, contenido — solo las que cambian). Si es solo una pregunta, respondé con { "mensaje": "..." }.`

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: context, tipo: "chat-noticia" }),
      })
      const { result } = await res.json()
      let reply = ""
      if (typeof result === "string") {
        try {
          const parsed = JSON.parse(result)
          if (parsed.titulo) { setTitulo(parsed.titulo); setSlug(slugify(parsed.titulo)) }
          if (parsed.extracto) setExtracto(parsed.extracto)
          if (parsed.contenido) setContenido(parsed.contenido)
          reply = parsed.mensaje ?? "Listo, actualicé la noticia."
        } catch {
          reply = result
        }
      } else {
        if (result?.titulo) { setTitulo(result.titulo); setSlug(slugify(result.titulo)) }
        if (result?.extracto) setExtracto(result.extracto)
        if (result?.contenido) setContenido(result.contenido)
        reply = result?.mensaje ?? "Listo, actualicé la noticia."
      }
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Error al procesar la solicitud." }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  function sendToCrear() {
    localStorage.setItem("noticia_draft", JSON.stringify({
      titulo, slug, extracto, contenido, categoria,
      autorNombre, imagenUrl: coverUrl,
    }))
    router.push("/oficiales/admin/website/noticias/crear")
  }

  const selectedCount = selected.size
  const canGenerate = tipoNota === "general" ? true : selectedCount > 0

  return (
    <div className="max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/oficiales/admin/website/noticias" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            Generar Noticia con IA
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Seleccioná los partidos y la IA redacta la noticia completa</p>
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[1fr_360px] xl:gap-6">
        {/* LEFT: Context + Fields */}
        <div className="space-y-5">

          {/* Context panel */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowContext(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-violet-500" />
                <span className="font-semibold text-gray-900">Contexto de la nota</span>
                {selectedCount > 0 && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                    {selectedCount} partido{selectedCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {showContext ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {showContext && (
              <div className="px-5 pb-5 border-t border-gray-50 space-y-4">
                {/* Liga */}
                <div className="pt-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Liga</label>
                  <div className="flex gap-2 flex-wrap">
                    {LIGAS.map(l => (
                      <button key={l.id} type="button" onClick={() => setLiga(l.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${liga === l.id ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo de nota</label>
                  <div className="flex gap-2 flex-wrap">
                    {TIPOS.map(t => (
                      <button key={t.id} type="button" onClick={() => setTipoNota(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tipoNota === t.id ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matches */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Seleccionar partidos
                    </label>
                    <button type="button" onClick={loadMatches} className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Actualizar
                    </button>
                  </div>
                  {matchesLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando partidos...
                    </div>
                  ) : matches.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No se encontraron partidos para esta liga</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {matches.map(m => {
                        const isSelected = selected.has(m.matchId)
                        const isComplete = m.status === "COMPLETE"
                        return (
                          <button
                            key={m.matchId}
                            type="button"
                            onClick={() => toggleMatch(m.matchId)}
                            className={`text-left p-3 rounded-lg border-2 transition-all ${isSelected ? "border-violet-400 bg-violet-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isComplete ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {isComplete ? "Jugado" : "Próximo"}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-violet-500" />}
                            </div>
                            <p className="text-xs font-bold text-gray-900 leading-tight">
                              {m.homeName}
                              {isComplete && m.homeScore && m.awayScore
                                ? <span className="text-violet-700"> {m.homeScore}–{m.awayScore} </span>
                                : " vs "}
                              {m.awayName}
                            </p>
                            {(m.date || m.time) && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{m.date}{m.time ? ` · ${m.time}` : ""}{m.venue ? ` · ${m.venue}` : ""}</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Extra info */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Info adicional (opcional)</label>
                  <textarea
                    value={extraInfo}
                    onChange={e => setExtraInfo(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                    placeholder="Ej: Fue la jornada 5 de la fase regular, se definieron los clasificados al Top 4..."
                  />
                </div>

                {/* Generate button */}
                {genError && <p className="text-sm text-red-500">{genError}</p>}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !canGenerate}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generando noticia...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {generated ? "Regenerar noticia" : "Generar noticia"}</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Article fields — only shown after generation */}
          {generated && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Contenido de la noticia</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => {
                    setTitulo(e.target.value)
                    if (autoSlug) setSlug(slugify(e.target.value))
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setAutoSlug(false) }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <p className="text-xs text-gray-400 mt-1">URL: /noticias/{slug || "..."}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extracto *</label>
                <textarea
                  rows={2}
                  value={extracto}
                  onChange={e => setExtracto(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <RichTextEditor value={contenido} onChange={setContenido} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                  <input
                    type="text"
                    value={autorNombre}
                    onChange={e => setAutorNombre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={sendToCrear}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow"
              >
                <Check className="h-4 w-4" />
                Enviar al formulario de publicación
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Cover + Chat */}
        <div className="mt-5 xl:mt-0 space-y-4 xl:sticky xl:top-6 xl:self-start">

          {/* Cover image */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-400" />
                Imagen de portada
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => generateCover()}
                  disabled={!titulo || coverLoading}
                  className="text-xs px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <Wand2 className="h-3 w-3" /> Regenerar
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Subir foto
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

            {coverUrl ? (
              <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt="Portada"
                  className="w-full"
                  style={{ aspectRatio: "1200/628", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-dashed border-gray-200 flex flex-col items-center justify-center py-10 gap-2">
                {coverLoading ? (
                  <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-gray-200" />
                    <p className="text-xs text-gray-400 text-center">
                      La portada se genera<br />automáticamente con el título
                    </p>
                  </>
                )}
              </div>
            )}

            {coverUrl && (
              <p className="text-[10px] text-gray-400 mt-2 text-center">1200 × 628 px — tamaño estándar web</p>
            )}
          </div>

          {/* Chat */}
          {generated && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setChatOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50"
              >
                <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Refinar con IA
                </span>
                {chatOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {chatOpen && (
                <div className="border-t border-gray-50">
                  {/* Messages */}
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 text-center mb-3">Pedile cambios a la IA</p>
                        {[
                          "Hacé el título más atractivo",
                          "Acortá el extracto a 1 oración",
                          "Agregá más contexto sobre el resultado",
                          "Cambiá el tono a más formal",
                        ].map(s => (
                          <button key={s} type="button" onClick={() => { setChatInput(s) }}
                            className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl ${msg.role === "user" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-3 py-2 rounded-xl">
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {/* Input */}
                  <div className="p-3 border-t border-gray-50 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChat()}
                      placeholder="Pedí un cambio..."
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                    <button
                      type="button"
                      onClick={handleChat}
                      disabled={chatLoading || !chatInput.trim()}
                      className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
