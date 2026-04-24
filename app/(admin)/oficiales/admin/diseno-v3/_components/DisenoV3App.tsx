"use client"


import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import CanvasStage, { type CanvasStageHandle } from "./CanvasStage"
import TopBar from "./TopBar"
import LeftRail from "./LeftRail"
import RightInspector from "./RightInspector"
import GeniusImportPanel, { type ImportPayload, type MatchData } from "./GeniusImportPanel"
import DocumentsModal from "./DocumentsModal"
import type { SponsorsConfig } from "./SponsorsPanel"
import { loadFabric } from "../_lib/fabric-bridge"
import { FORMATS, getFormat, type FormatKey } from "../_lib/formats"
import { getDefaultTheme, type LigaKey, type V3Theme, THEMES } from "../_lib/themes"
import { buildTemplate, makeSponsorStrip, type TemplateKey } from "../_lib/templates"
import { exportPNG, exportJPG, exportPDF, exportJSON, generateThumbnail } from "../_lib/export"
import type { PatternKey } from "../_lib/patterns"

let uid = 0
const nextId = () => `o${Date.now().toString(36)}-${(++uid).toString(36)}`

interface LayerItem {
  id: string
  label: string
  type: string
  visible: boolean
  locked: boolean
}

export default function DisenoV3App() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Leer query params una sola vez al montar
  const initialDocId = searchParams.get("doc")
  const initialNew = searchParams.get("new")  // formato:liga:template

  // --- Estado principal ---
  const [docId, setDocId] = useState<string | null>(null)
  const [docName, setDocName] = useState("Diseño sin título")
  const [liga, setLiga] = useState<LigaKey>("lnb")
  const [formatKey, setFormatKey] = useState<FormatKey>("feed")
  const [theme, setTheme] = useState<V3Theme>(getDefaultTheme("lnb"))
  const [showSafeZones, setShowSafeZones] = useState(false)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [selected, setSelected] = useState<any | null>(null)
  const [layers, setLayers] = useState<LayerItem[]>([])

  const [geniusOpen, setGeniusOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)

  // Sponsors config — persistido y aplicado al insertar templates.
  // Por default la franja está APAGADA (el usuario la activa si la quiere).
  // Los sponsors cargados se mantienen en memoria aunque `show=false`.
  const [sponsorsConfig, setSponsorsConfig] = useState<SponsorsConfig>({
    sponsors: [null, null, null, null, null],
    scales: [100, 100, 100, 100, 100],
    bg: "dark",
    show: false,
  })

  // Patrón de fondo — default "scratch" a 10% como V2 Stories
  const [patternKey, setPatternKey] = useState<PatternKey>("scratch")
  const [patternAlpha, setPatternAlpha] = useState(0.10)

  const stageRef = useRef<CanvasStageHandle>(null)
  const canvasRef = useRef<any>(null)
  const format = getFormat(formatKey)

  // Al cambiar de liga, sugerir tema default (sin pisar si el usuario ya lo cambió)
  useEffect(() => {
    const defTheme = getDefaultTheme(liga)
    setTheme((t) => (t.liga === liga || t.key === "clean-light" ? t : defTheme))
  }, [liga])

  // Al cambiar de formato, re-dimensionar las capas de fondo (background,
  // pattern overlay, glows, sponsor strip) al nuevo tamaño. Los objetos del
  // usuario (títulos, logos, cards) se preservan en sus coords. Este efecto
  // NO corre en la primera render (solo cuando ya hay canvas + primer
  // template insertado).
  const prevFormatRef = useRef<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const prev = prevFormatRef.current
    prevFormatRef.current = { w: format.width, h: format.height }
    if (!prev || (prev.w === format.width && prev.h === format.height)) return

    // Ratios para re-escalar en X e Y independientemente (para que el bg
    // cubra el nuevo área completa).
    const rx = format.width / prev.w
    const ry = format.height / prev.h

    c.getObjects().forEach((o: any) => {
      const role = o.role as string | undefined
      if (!role) return
      // Background, pattern y glows: se estiran para cubrir el nuevo formato
      if (role === "background" || role === "pattern") {
        o.set({ left: 0, top: 0, scaleX: 1, scaleY: 1, width: format.width, height: format.height })
      } else if (role === "glow") {
        // Los glows van a las esquinas con tamaño proporcional
        o.set({
          left: (o.left || 0) * rx,
          top: (o.top || 0) * ry,
          scaleX: (o.scaleX || 1) * rx,
          scaleY: (o.scaleY || 1) * ry,
        })
      } else if (role.startsWith("sponsor-")) {
        // Mejor eliminar toda la sponsor strip; se re-aplica abajo
        c.remove(o)
      }
    })

    // Re-aplicar sponsor strip con el nuevo tamaño si show=true
    if (sponsorsConfig.show) {
      ;(async () => {
        const fabric = await loadFabric()
        const strip = makeSponsorStrip(fabric, theme, format, sponsorsConfig.bg)
        strip.forEach((o: any) => {
          if (!o.id) o.id = nextId()
          c.add(o)
        })
        for (let i = 0; i < 5; i++) {
          const url = sponsorsConfig.sponsors[i]
          if (!url) continue
          const slot = c.getObjects().find((o: any) => o.role === `sponsor-slot-${i}`)
          if (!slot) continue
          const sw = (slot.width || 1) * (slot.scaleX || 1)
          const sh = (slot.height || 1) * (slot.scaleY || 1)
          await new Promise<void>((resolve) => {
            fabric.Image.fromURL(url, (img: any) => {
              const baseScale = Math.min(sw / (img.width || 1), sh / (img.height || 1))
              const scale = baseScale * (sponsorsConfig.scales[i] / 100)
              img.set({
                left: (slot.left || 0) + sw / 2,
                top: (slot.top || 0) + sh / 2,
                originX: "center", originY: "center",
                scaleX: scale, scaleY: scale,
                role: `sponsor-img-${i}`,
              })
              img.id = nextId()
              c.add(img)
              resolve()
            }, { crossOrigin: "anonymous" })
          })
        }
        c.requestRenderAll()
      })()
    }

    c.requestRenderAll()
    setDirty(true)
  }, [format.width, format.height, sponsorsConfig, theme])

  // Pre-llenar sponsors desde la config guardada en V2 (misma tabla diseno_configs).
  // Si el usuario ya tenía sus 5 sponsors + barra configurados en Diseño V2 para
  // esta liga, aparecen automáticamente en el SponsorsPanel del V3.
  useEffect(() => {
    let cancel = false
    fetch(`/api/admin/diseno-config?liga=${liga}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancel || !data?.config) return
        const c = data.config
        const sp = Array.isArray(c.sponsors) ? c.sponsors : []
        const sc = Array.isArray(c.sponsorScales) ? c.sponsorScales : []
        // Importar sponsors guardados del V2 pero preservar el toggle "show"
        // actual (default: false). Así no aparece la franja sin que el
        // usuario la active explícitamente.
        setSponsorsConfig((prev) => ({
          sponsors: [...sp, ...Array(5)].slice(0, 5).map((v: any) => (typeof v === "string" && v ? v : null)),
          // scales en V2 viven como multiplier (1.0 = 100%); en V3 como porcentaje.
          scales: [...sc, ...Array(5)].slice(0, 5).map((v: any) => (typeof v === "number" ? Math.round(v * 100) : 100)),
          bg: (c.sponsorBg === "white" ? "white" : "dark") as "white" | "dark",
          show: prev.show,
        }))
      })
      .catch(() => { /* silent */ })
    return () => { cancel = true }
  }, [liga])

  // --- Refresh layers list ---
  const refreshLayers = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const items: LayerItem[] = []
    c.forEachObject((o: any) => {
      if (!o.id) o.id = nextId()
      const label =
        o.role
          ? o.role
          : o.type === "i-text" || o.type === "text"
          ? `T · ${(o.text || "").slice(0, 18) || "Texto"}`
          : o.type === "image"
          ? "Imagen"
          : o.type === "rect"
          ? "Rectángulo"
          : o.type === "circle"
          ? "Círculo"
          : o.type === "line"
          ? "Línea"
          : o.type
      items.push({
        id: o.id,
        label,
        type: o.type,
        visible: o.visible !== false,
        locked: !!o.lockMovementX,
      })
    })
    setLayers(items)
  }, [])

  // --- Canvas ready ---
  // Guardamos flag para auto-cargar el diseño indicado por query params
  // una sola vez (la primera vez que el canvas está listo).
  const autoLoadedRef = useRef(false)
  const onCanvasReady = useCallback((c: any) => {
    canvasRef.current = c
    refreshLayers()
    if (autoLoadedRef.current) return
    autoLoadedRef.current = true
    // Caso 1: ?doc=ID → abrir documento guardado
    if (initialDocId) {
      setTimeout(() => openDocRef.current?.(initialDocId), 50)
      return
    }
    // Caso 2: ?new=formato:liga:template → configurar y auto-insertar template
    if (initialNew) {
      const [fmt, lg, tpl] = initialNew.split(":")
      if (fmt) setFormatKey(fmt as FormatKey)
      if (lg) setLiga(lg as LigaKey)
      if (tpl && tpl !== "blank") {
        // Pequeño delay para que liga/theme se estabilicen antes de insertar
        setTimeout(() => insertTemplateRef.current?.(tpl as TemplateKey), 150)
      }
    }
  }, [refreshLayers, initialDocId, initialNew])

  // Refs para romper el ciclo de dependencias de onCanvasReady
  const openDocRef = useRef<((id: string) => Promise<void>) | null>(null)
  const insertTemplateRef = useRef<((k: TemplateKey, data?: any) => Promise<void>) | null>(null)

  // Callback estable (evita recrear canvas en cada render)
  const onHistoryChangeStable = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u)
    setCanRedo(r)
  }, [])

  // Mantener refs sincronizadas con las funciones después de su definición
  // (ver bloque al final del componente).

  // Dirty tracking
  const markDirty = useCallback(() => {
    setDirty(true)
    refreshLayers()
  }, [refreshLayers])

  // --- Aplicar sponsors subidos sobre los slots del template ---
  const applySponsorsToCanvas = useCallback(async () => {
    const c = canvasRef.current
    if (!c) return
    const fabric = await loadFabric()
    // Buscar los 5 slots
    for (let i = 0; i < 5; i++) {
      const url = sponsorsConfig.sponsors[i]
      if (!url) continue
      const slot = c.getObjects().find((o: any) => o.role === `sponsor-slot-${i}`)
      if (!slot) continue
      await new Promise<void>((resolve) => {
        fabric.Image.fromURL(url, (img: any) => {
          const sw = (slot.width || 1) * (slot.scaleX || 1)
          const sh = (slot.height || 1) * (slot.scaleY || 1)
          const scaleBase = Math.min(sw / (img.width || 1), sh / (img.height || 1))
          const sc = scaleBase * (sponsorsConfig.scales[i] / 100)
          img.set({
            left: (slot.left || 0) + sw / 2,
            top: (slot.top || 0) + sh / 2,
            originX: "center", originY: "center",
            scaleX: sc, scaleY: sc,
            role: `sponsor-img-${i}`,
          })
          img.id = nextId()
          c.add(img)
          resolve()
        }, { crossOrigin: "anonymous" })
      })
    }
    c.requestRenderAll()
    refreshLayers()
  }, [sponsorsConfig, refreshLayers])

  // --- Insert template ---
  const insertTemplate = useCallback(
    async (key: TemplateKey, data?: any) => {
      const c = canvasRef.current
      if (!c) return
      const fabric = await loadFabric()
      c.clear()
      const objs = await buildTemplate(key, {
        fabric, theme, format, data,
        pattern: patternKey,
        patternAlpha,
        showSponsorStrip: sponsorsConfig.show,
        sponsorBg: sponsorsConfig.bg,
      })
      objs.forEach((o: any) => {
        if (!o.id) o.id = nextId()
        c.add(o)
      })
      c.requestRenderAll()
      if (sponsorsConfig.show) await applySponsorsToCanvas()
      refreshLayers()
      setDirty(true)
      stageRef.current?.fitToScreen()
    },
    [theme, format, refreshLayers, patternKey, patternAlpha, sponsorsConfig, applySponsorsToCanvas],
  )

  // Sponsors config change → re-aplicar franja con sponsors reales.
  const handleSponsorsChange = useCallback(async (cfg: SponsorsConfig) => {
    setSponsorsConfig(cfg)
    const c = canvasRef.current
    if (!c) return
    // 1) quitar sponsors previos (strip bg, label, slots, imgs)
    const toRemove = c.getObjects().filter((o: any) =>
      typeof o.role === "string" && (
        o.role.startsWith("sponsor-strip") ||
        o.role.startsWith("sponsor-label") ||
        o.role.startsWith("sponsor-slot") ||
        o.role.startsWith("sponsor-img")
      )
    )
    toRemove.forEach((o: any) => c.remove(o))

    // 2) si está visible la franja, reinsertar strip + label + slots
    if (cfg.show) {
      const fabric = await loadFabric()
      const stripObjs = makeSponsorStrip(fabric, theme, format, cfg.bg)
      stripObjs.forEach((o: any) => {
        if (!o.id) o.id = nextId()
        c.add(o)
      })
      // 3) colocar cada sponsor cargado sobre su slot
      for (let i = 0; i < 5; i++) {
        const url = cfg.sponsors[i]
        if (!url) continue
        const slot = c.getObjects().find((o: any) => o.role === `sponsor-slot-${i}`)
        if (!slot) continue
        const sw = (slot.width || 1) * (slot.scaleX || 1)
        const sh = (slot.height || 1) * (slot.scaleY || 1)
        await new Promise<void>((resolve) => {
          fabric.Image.fromURL(url, (img: any) => {
            const baseScale = Math.min(sw / (img.width || 1), sh / (img.height || 1))
            const scale = baseScale * (cfg.scales[i] / 100)
            img.set({
              left: (slot.left || 0) + sw / 2,
              top: (slot.top || 0) + sh / 2,
              originX: "center", originY: "center",
              scaleX: scale, scaleY: scale,
              role: `sponsor-img-${i}`,
            })
            img.id = nextId()
            c.add(img)
            resolve()
          }, { crossOrigin: "anonymous" })
        })
      }
    }

    c.requestRenderAll()
    markDirty()
  }, [markDirty, theme, format])

  // --- Insert text ---
  const insertText = useCallback(
    async (style: "title" | "subtitle" | "body") => {
      const c = canvasRef.current
      if (!c) return
      const fabric = await loadFabric()
      const text =
        style === "title"
          ? new fabric.IText("Título nuevo", {
              fontFamily: theme.fontDisplay,
              fontSize: format.width * 0.08,
              fill: theme.fg,
              fontWeight: "900",
              left: format.width / 2,
              top: format.height * 0.3,
              originX: "center",
            })
          : style === "subtitle"
          ? new fabric.IText("Subtítulo", {
              fontFamily: theme.fontBody,
              fontSize: format.width * 0.035,
              fill: theme.fgMuted,
              left: format.width / 2,
              top: format.height * 0.42,
              originX: "center",
            })
          : new fabric.IText("Texto de cuerpo", {
              fontFamily: theme.fontBody,
              fontSize: format.width * 0.022,
              fill: theme.fg,
              left: format.width / 2,
              top: format.height * 0.5,
              originX: "center",
            })
      text.id = nextId()
      c.add(text)
      c.setActiveObject(text)
      c.requestRenderAll()
      refreshLayers()
      setDirty(true)
    },
    [theme, format, refreshLayers],
  )

  // --- Insert shape ---
  const insertShape = useCallback(
    async (shape: "rect" | "circle" | "line") => {
      const c = canvasRef.current
      if (!c) return
      const fabric = await loadFabric()
      let obj: any
      if (shape === "rect") {
        obj = new fabric.Rect({
          left: format.width / 2 - 200,
          top: format.height / 2 - 120,
          width: 400,
          height: 240,
          fill: theme.accent,
          rx: 16,
          ry: 16,
        })
      } else if (shape === "circle") {
        obj = new fabric.Circle({
          left: format.width / 2 - 150,
          top: format.height / 2 - 150,
          radius: 150,
          fill: theme.accent,
        })
      } else {
        obj = new fabric.Line([format.width * 0.2, format.height * 0.5, format.width * 0.8, format.height * 0.5], {
          stroke: theme.accent,
          strokeWidth: 6,
        })
      }
      obj.id = nextId()
      c.add(obj)
      c.setActiveObject(obj)
      c.requestRenderAll()
      refreshLayers()
      setDirty(true)
    },
    [theme, format, refreshLayers],
  )

  // --- Insert image from URL (upload) ---
  const insertImage = useCallback(async (url: string) => {
    const c = canvasRef.current
    if (!c) return
    const fabric = await loadFabric()
    fabric.Image.fromURL(
      url,
      (img: any) => {
        const maxW = format.width * 0.6
        const scale = Math.min(maxW / (img.width || 1), 1)
        img.set({
          left: format.width / 2 - (img.width * scale) / 2,
          top: format.height / 2 - (img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })
        img.id = nextId()
        c.add(img)
        c.setActiveObject(img)
        c.requestRenderAll()
        refreshLayers()
        setDirty(true)
      },
      { crossOrigin: "anonymous" },
    )
  }, [format, refreshLayers])

  // --- Genius import ---
  // --- Handlers del MatchesPanel persistente ---
  const addTeamLogos = useCallback(async (data: MatchData) => {
    const c = canvasRef.current
    if (!c) return
    const fabric = await loadFabric()
    const addLogo = (url: string, x: number, y: number, size: number) => {
      fabric.Image.fromURL(url, (img: any) => {
        const scale = size / Math.max(img.width || 1, img.height || 1)
        img.set({
          left: x, top: y, scaleX: scale, scaleY: scale,
          originX: "center", originY: "center",
          role: "team-logo",
        })
        img.id = nextId()
        c.add(img)
        c.requestRenderAll()
        refreshLayers()
      }, { crossOrigin: "anonymous" })
    }
    if (data.homeLogo) addLogo(data.homeLogo, format.width * 0.24, format.height * 0.48, format.width * 0.18)
    if (data.awayLogo) addLogo(data.awayLogo, format.width * 0.76, format.height * 0.48, format.width * 0.18)
  }, [format, refreshLayers])

  const handleApplyMatch = useCallback(async (data: MatchData, withScore: boolean) => {
    await insertTemplate(withScore ? "resultado" : "pre", data)
    await addTeamLogos(data)
    toast({ title: "Partido importado", description: "Todo queda editable." })
  }, [insertTemplate, addTeamLogos, toast])

  // Multi-partido: insertar template "proximos-multi" o "resultados-multi"
  // con un array de partidos y cargar todos los logos sobre las cards.
  const handleApplyMatches = useCallback(async (datas: MatchData[], withScore: boolean) => {
    if (!datas.length) return
    if (datas.length === 1) return handleApplyMatch(datas[0], withScore)
    const key = withScore ? "resultados-multi" : "proximos-multi"
    // Calcular la jornada real desde los matchNumber (si existen).
    // Para LNB (8 equipos) la jornada = ceil(matchNumber / 4). Para LNBF (menos
    // equipos) puede ser 3. Como no sabemos el total de equipos, asumimos 4.
    const nums = datas.map((d) => d.matchNumber).filter((n): n is number => typeof n === "number" && n > 0)
    const perJornada = 4
    const jornada = nums.length ? Math.ceil(Math.min(...nums) / perJornada) : null
    const fechaLabel = jornada ? `FECHA ${jornada}` : (withScore ? "RESULTADOS" : "PRÓXIMA JORNADA")
    await insertTemplate(key, { matches: datas, fechaLabel })
    // Cargar logos a cada card (role=card-bg-N marca la posición)
    const c = canvasRef.current
    if (!c) return
    const fabric = await loadFabric()
    datas.forEach((m, i) => {
      const card = c.getObjects().find((o: any) => o.role === `card-bg-${i}`)
      if (!card) return
      const cw = (card.width || 0) * (card.scaleX || 1)
      const ch = (card.height || 0) * (card.scaleY || 1)
      const cx0 = card.left || 0
      const cy0 = card.top || 0
      const logoSize = ch * 0.55
      const addLogoAt = (url: string | null | undefined, relX: number) => {
        if (!url) return
        fabric.Image.fromURL(url, (img: any) => {
          const s = logoSize / Math.max(img.width || 1, img.height || 1)
          img.set({
            left: cx0 + cw * relX,
            top: cy0 + ch * 0.38,
            scaleX: s, scaleY: s,
            originX: "center", originY: "center",
            role: `card-logo-${i}`,
          })
          img.id = "o" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
          c.add(img)
          c.requestRenderAll()
        }, { crossOrigin: "anonymous" })
      }
      addLogoAt(m.homeLogo, 0.22)
      addLogoAt(m.awayLogo, 0.78)
    })
    toast({ title: `${datas.length} partidos importados`, description: "Todo queda editable." })
  }, [insertTemplate, handleApplyMatch, toast])

  const handleApplyStandings = useCallback(async (rows: any[]) => {
    const standings = rows.map((s: any, i: number) => ({
      pos: s.rank ?? s.position ?? i + 1,
      name: s.teamName || s.competitorName || s.name || "",
      w: s.wins ?? s.matchesWon ?? 0,
      l: s.losses ?? s.matchesLost ?? 0,
    }))
    const ligaLabelMap: Record<LigaKey, string> = {
      lnb: "LNB APERTURA 2026", lnbf: "LNBF APERTURA 2026",
      u22m: "U22 MASC 2026", u22f: "U22 FEM 2026",
    }
    await insertTemplate("tabla", { standings, ligaLabel: ligaLabelMap[liga] })
    toast({ title: "Tabla importada" })
  }, [insertTemplate, liga, toast])

  const handleApplyLeaders = useCallback(async (rows: any[]) => {
    const leaders = rows.slice(0, 5).map((p: any) => ({
      name: p.playerName || `${p.firstName || ""} ${p.familyName || ""}`.trim() || "—",
      team: p.teamCode || p.teamName || "",
      value: p.value ?? p.points ?? p.stat ?? "",
    }))
    await insertTemplate("lideres", { leaders })
    toast({ title: "Líderes importados" })
  }, [insertTemplate, toast])

  // --- Compatibilidad: modal legacy de Genius ---
  const handleGeniusImport = useCallback(async (payload: ImportPayload) => {
    await insertTemplate(payload.template as TemplateKey, payload.data)
    if ("homeLogo" in (payload.data as any)) await addTeamLogos(payload.data as MatchData)
    setGeniusOpen(false)
  }, [insertTemplate, addTeamLogos])

  // --- Selection actions ---
  const deleteSelected = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const actives = c.getActiveObjects()
    actives.forEach((o: any) => c.remove(o))
    c.discardActiveObject()
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  const duplicateSelected = useCallback(() => {
    const c = canvasRef.current
    const active = c?.getActiveObject()
    if (!c || !active) return
    active.clone((cloned: any) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      })
      cloned.id = nextId()
      c.add(cloned)
      c.setActiveObject(cloned)
      c.requestRenderAll()
      refreshLayers()
      markDirty()
    })
  }, [markDirty, refreshLayers])

  const bringForward = useCallback(() => {
    const c = canvasRef.current
    const a = c?.getActiveObject()
    if (!c || !a) return
    c.bringForward(a)
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])
  const sendBackward = useCallback(() => {
    const c = canvasRef.current
    const a = c?.getActiveObject()
    if (!c || !a) return
    c.sendBackwards(a)
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])
  const bringToFront = useCallback(() => {
    const c = canvasRef.current
    const a = c?.getActiveObject()
    if (!c || !a) return
    c.bringToFront(a)
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])
  const sendToBack = useCallback(() => {
    const c = canvasRef.current
    const a = c?.getActiveObject()
    if (!c || !a) return
    c.sendToBack(a)
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  const toggleLock = useCallback(() => {
    const a = canvasRef.current?.getActiveObject()
    if (!a) return
    const locked = !!a.lockMovementX
    a.set({
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockRotation: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
    })
    canvasRef.current.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  const alignToCanvas = useCallback((edge: "left" | "centerX" | "right" | "top" | "centerY" | "bottom") => {
    const a = canvasRef.current?.getActiveObject()
    if (!a) return
    const br = a.getBoundingRect(true, true)
    if (edge === "left") a.set("left", (a.left || 0) - br.left)
    if (edge === "right") a.set("left", (a.left || 0) + (format.width - (br.left + br.width)))
    if (edge === "centerX") a.set("left", (a.left || 0) + (format.width / 2 - (br.left + br.width / 2)))
    if (edge === "top") a.set("top", (a.top || 0) - br.top)
    if (edge === "bottom") a.set("top", (a.top || 0) + (format.height - (br.top + br.height)))
    if (edge === "centerY") a.set("top", (a.top || 0) + (format.height / 2 - (br.top + br.height / 2)))
    a.setCoords()
    canvasRef.current.requestRenderAll()
    markDirty()
  }, [format, markDirty])

  // --- Layers panel actions ---
  const selectLayer = useCallback((id: string) => {
    const c = canvasRef.current
    if (!c) return
    c.forEachObject((o: any) => {
      if (o.id === id) {
        c.setActiveObject(o)
        c.requestRenderAll()
      }
    })
  }, [])

  const toggleLayerVisibility = useCallback((id: string) => {
    const c = canvasRef.current
    if (!c) return
    c.forEachObject((o: any) => {
      if (o.id === id) o.visible = !o.visible
    })
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  const toggleLayerLock = useCallback((id: string) => {
    const c = canvasRef.current
    if (!c) return
    c.forEachObject((o: any) => {
      if (o.id === id) {
        const locked = !!o.lockMovementX
        o.lockMovementX = !locked
        o.lockMovementY = !locked
      }
    })
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  const deleteLayer = useCallback((id: string) => {
    const c = canvasRef.current
    if (!c) return
    c.forEachObject((o: any) => {
      if (o.id === id) c.remove(o)
    })
    c.requestRenderAll()
    refreshLayers()
    markDirty()
  }, [markDirty, refreshLayers])

  // --- Theme change: actualiza bg del canvas y texto ---
  const applyTheme = useCallback((newTheme: V3Theme) => {
    setTheme(newTheme)
    const c = canvasRef.current
    if (!c) return
    // Repinta el fondo si existe un objeto con role=background
    c.forEachObject((o: any) => {
      if (o.role === "background") {
        c.remove(o)
      }
    })
    markDirty()
  }, [markDirty])

  // --- Save / Load ---
  const doSave = useCallback(async (silent?: boolean) => {
    const c = canvasRef.current
    if (!c) return
    setSaving(true)
    try {
      const canvasJson = c.toJSON(["id", "role", "excludeFromSnap", "editable"])
      const thumbnailUrl = generateThumbnail(c, format.width, format.height)

      const payload = {
        nombre: docName,
        liga,
        template: "custom",
        format: formatKey,
        canvasJson,
        thumbnailUrl,
      }

      if (docId) {
        const res = await fetch(`/api/admin/diseno-v3/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("PATCH failed")
      } else {
        const res = await fetch("/api/admin/diseno-v3/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("POST failed")
        const data = await res.json()
        setDocId(data.document.id)
      }

      setDirty(false)
      if (!silent) toast({ title: "Guardado", description: "Tu diseño se guardó correctamente." })
    } catch (e) {
      console.error(e)
      toast({ title: "Error al guardar", description: "Revisá la consola.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }, [docId, docName, liga, formatKey, format.width, format.height, toast])

  const openDoc = useCallback(async (id: string) => {
    const c = canvasRef.current
    if (!c) return
    try {
      const res = await fetch(`/api/admin/diseno-v3/documents/${id}`)
      if (!res.ok) throw new Error("GET failed")
      const { document: doc } = await res.json()
      setDocId(doc.id)
      setDocName(doc.nombre)
      setLiga(doc.liga as LigaKey)
      setFormatKey(doc.format as FormatKey)

      c.loadFromJSON(doc.canvasJson, () => {
        c.requestRenderAll()
        refreshLayers()
        setDirty(false)
        setDocsOpen(false)
        stageRef.current?.fitToScreen()
      })
    } catch (e) {
      console.error(e)
      toast({ title: "Error al abrir", description: "No se pudo cargar el diseño." })
    }
  }, [refreshLayers, toast])

  const newDoc = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    c.clear()
    setDocId(null)
    setDocName("Diseño sin título")
    setDirty(false)
    setDocsOpen(false)
    refreshLayers()
    // Insertar fondo del tema actual
    insertTemplate("blank")
  }, [refreshLayers, insertTemplate])

  // --- Export ---
  const handleExport = useCallback((kind: "png" | "jpg" | "pdf" | "json") => {
    const c = canvasRef.current
    if (!c) return
    const filename = `${docName.replace(/[^\w-]+/g, "_") || "diseno"}_${formatKey}`
    if (kind === "png") exportPNG({ canvas: c, width: format.width, height: format.height, filename })
    else if (kind === "jpg") exportJPG({ canvas: c, width: format.width, height: format.height, filename })
    else if (kind === "pdf") exportPDF({ canvas: c, width: format.width, height: format.height, filename })
    else exportJSON({ canvas: c, filename })
  }, [docName, formatKey, format.width, format.height])

  // --- AI copy generation (reusa /api/admin/generate-copy) ---
  const generateCopy = useCallback(async () => {
    const c = canvasRef.current
    if (!c) return
    const texts: string[] = []
    c.forEachObject((o: any) => {
      if ((o.type === "i-text" || o.type === "text") && o.text) {
        texts.push(o.text)
      }
    })
    const titulo = texts[0] || docName
    try {
      const res = await fetch("/api/admin/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, liga, template: "custom" }),
      })
      if (!res.ok) throw new Error("Copy API failed")
      const data = await res.json()
      const copy = (data.copies || [])[0] || data.copy || "—"
      await navigator.clipboard.writeText(copy)
      toast({ title: "Copy generado", description: "Copiado al portapapeles." })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "No se pudo generar el copy." })
    }
  }, [docName, liga, toast])

  // --- Undo/redo ---
  const undo = useCallback(() => {
    const h = stageRef.current?.getHistory()
    h?.undo()
    setCanUndo(!!h?.canUndo())
    setCanRedo(!!h?.canRedo())
    setTimeout(refreshLayers, 50)
  }, [refreshLayers])

  const redo = useCallback(() => {
    const h = stageRef.current?.getHistory()
    h?.redo()
    setCanUndo(!!h?.canUndo())
    setCanRedo(!!h?.canRedo())
    setTimeout(refreshLayers, 50)
  }, [refreshLayers])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      // No interceptar si el usuario está tipeando en un input
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target as any).isContentEditable)) return
      // Tampoco si hay un IText en modo edición
      const c = canvasRef.current
      const active = c?.getActiveObject()
      if (active?.isEditing) return

      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        doSave()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        undo()
        return
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault()
        duplicateSelected()
        return
      }
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault()
        setDocsOpen(true)
        return
      }
      if ((e.key === "Delete" || e.key === "Backspace") && active) {
        e.preventDefault()
        deleteSelected()
        return
      }
      if (active && !active.isEditing) {
        const step = e.shiftKey ? 10 : 1
        if (e.key === "ArrowUp") { active.top = (active.top || 0) - step; active.setCoords(); c.requestRenderAll(); markDirty(); e.preventDefault() }
        if (e.key === "ArrowDown") { active.top = (active.top || 0) + step; active.setCoords(); c.requestRenderAll(); markDirty(); e.preventDefault() }
        if (e.key === "ArrowLeft") { active.left = (active.left || 0) - step; active.setCoords(); c.requestRenderAll(); markDirty(); e.preventDefault() }
        if (e.key === "ArrowRight") { active.left = (active.left || 0) + step; active.setCoords(); c.requestRenderAll(); markDirty(); e.preventDefault() }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo, doSave, duplicateSelected, deleteSelected, markDirty])

  // --- Bg color del stage ---
  const stageBg = theme.bg

  // Sincronizar refs (evitan referencias circulares con onCanvasReady)
  useEffect(() => { openDocRef.current = openDoc }, [openDoc])
  useEffect(() => { insertTemplateRef.current = insertTemplate }, [insertTemplate])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-neutral-950 text-white">
      <TopBar
        docName={docName}
        onDocNameChange={setDocName}
        liga={liga}
        onLigaChange={setLiga}
        format={formatKey}
        onFormatChange={setFormatKey}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={() => doSave()}
        onOpen={() => router.push("/oficiales/admin/diseno-v3")}
        onExport={handleExport}
        saving={saving}
        dirty={dirty}
        onBack={() => router.push("/oficiales/admin/diseno-v3")}
        onGenerateCopy={generateCopy}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail
          liga={liga}
          theme={theme}
          onInsertTemplate={(k) => insertTemplate(k)}
          onInsertText={insertText}
          onInsertShape={insertShape}
          onInsertImage={insertImage}
          onSelectTheme={applyTheme}
          onApplyMatch={handleApplyMatch}
          onApplyMatches={handleApplyMatches}
          onApplyStandings={handleApplyStandings}
          onApplyLeaders={handleApplyLeaders}
          sponsorsConfig={sponsorsConfig}
          onSponsorsChange={handleSponsorsChange}
          patternKey={patternKey}
          patternAlpha={patternAlpha}
          onPatternChange={setPatternKey}
          onPatternAlphaChange={setPatternAlpha}
          layers={layers}
          selectedId={selected?.id ?? null}
          onSelectLayer={selectLayer}
          onToggleLayerVisibility={toggleLayerVisibility}
          onToggleLayerLock={toggleLayerLock}
          onDeleteLayer={deleteLayer}
        />

        <CanvasStage
          ref={stageRef}
          format={format}
          bgColor={stageBg}
          onReady={onCanvasReady}
          onSelectionChange={setSelected}
          onHistoryChange={onHistoryChangeStable}
          onDirty={markDirty}
          showSafeZones={showSafeZones}
        />

        <RightInspector
          selected={selected}
          canvasWidth={format.width}
          canvasHeight={format.height}
          onChange={() => { markDirty(); canvasRef.current?.requestRenderAll() }}
          onDelete={deleteSelected}
          onDuplicate={duplicateSelected}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onToggleLock={toggleLock}
          onAlignCanvas={alignToCanvas}
        />
      </div>

      <GeniusImportPanel
        open={geniusOpen}
        liga={liga}
        onClose={() => setGeniusOpen(false)}
        onImport={handleGeniusImport}
      />

      <DocumentsModal
        open={docsOpen}
        liga={liga}
        onClose={() => setDocsOpen(false)}
        onOpenDoc={openDoc}
        onNewDoc={newDoc}
      />
    </div>
  )
}
