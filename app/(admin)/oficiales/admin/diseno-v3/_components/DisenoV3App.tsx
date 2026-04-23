"use client"


import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import CanvasStage, { type CanvasStageHandle } from "./CanvasStage"
import TopBar from "./TopBar"
import LeftRail from "./LeftRail"
import RightInspector from "./RightInspector"
import GeniusImportPanel, { type ImportPayload } from "./GeniusImportPanel"
import DocumentsModal from "./DocumentsModal"
import { loadFabric } from "../_lib/fabric-bridge"
import { FORMATS, getFormat, type FormatKey } from "../_lib/formats"
import { getDefaultTheme, type LigaKey, type V3Theme, THEMES } from "../_lib/themes"
import { buildTemplate, type TemplateKey } from "../_lib/templates"
import { exportPNG, exportJPG, exportPDF, exportJSON, generateThumbnail } from "../_lib/export"

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
  const { toast } = useToast()

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

  const stageRef = useRef<CanvasStageHandle>(null)
  const canvasRef = useRef<any>(null)
  const format = getFormat(formatKey)

  // Al cambiar de liga, sugerir tema default (sin pisar si el usuario ya lo cambió)
  useEffect(() => {
    const defTheme = getDefaultTheme(liga)
    setTheme((t) => (t.liga === liga || t.key === "clean-light" ? t : defTheme))
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
  const onCanvasReady = useCallback((c: any) => {
    canvasRef.current = c
    refreshLayers()
  }, [refreshLayers])

  // Callback estable (evita recrear canvas en cada render)
  const onHistoryChangeStable = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u)
    setCanRedo(r)
  }, [])

  // Dirty tracking
  const markDirty = useCallback(() => {
    setDirty(true)
    refreshLayers()
  }, [refreshLayers])

  // --- Insert template ---
  const insertTemplate = useCallback(
    async (key: TemplateKey) => {
      const c = canvasRef.current
      if (!c) return
      const fabric = await loadFabric()
      // Si el template incluye bg, limpiamos el canvas primero
      if (key !== "blank") {
        c.clear()
      }
      const objs = buildTemplate(key, { fabric, theme, format })
      objs.forEach((o: any) => {
        if (!o.id) o.id = nextId()
        c.add(o)
      })
      c.requestRenderAll()
      refreshLayers()
      setDirty(true)
      stageRef.current?.fitToScreen()
    },
    [theme, format, refreshLayers],
  )

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
  const handleGeniusImport = useCallback(
    async (payload: ImportPayload) => {
      const c = canvasRef.current
      if (!c) return
      const fabric = await loadFabric()
      c.clear()
      const data: any = { ...(payload.data || {}), ligaLabel: (payload.data as any).ligaLabel }
      const objs = buildTemplate(payload.template as TemplateKey, { fabric, theme, format, data })
      objs.forEach((o: any) => {
        if (!o.id) o.id = nextId()
        c.add(o)
      })

      // Si es pre/resultado e incluye logos, los cargamos arriba
      if ((payload.template === "pre" || payload.template === "resultado") && (data.homeLogo || data.awayLogo)) {
        const addLogo = (url: string, x: number, y: number) => {
          fabric.Image.fromURL(
            url,
            (img: any) => {
              const targetW = format.width * 0.2
              const scale = targetW / (img.width || 1)
              img.set({
                left: x,
                top: y,
                scaleX: scale,
                scaleY: scale,
                originX: "center",
                originY: "center",
              })
              img.id = nextId()
              c.add(img)
              c.requestRenderAll()
              refreshLayers()
            },
            { crossOrigin: "anonymous" },
          )
        }
        if (data.homeLogo) addLogo(data.homeLogo, format.width * 0.28, format.height * 0.38)
        if (data.awayLogo) addLogo(data.awayLogo, format.width * 0.72, format.height * 0.38)
      }

      c.requestRenderAll()
      refreshLayers()
      setDirty(true)
      setGeniusOpen(false)
      toast({ title: "Datos importados", description: "Todo queda editable — tocá cualquier elemento." })
      stageRef.current?.fitToScreen()
    },
    [theme, format, refreshLayers, toast],
  )

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
        onOpen={() => setDocsOpen(true)}
        onExport={handleExport}
        saving={saving}
        dirty={dirty}
        onBack={() => router.push("/oficiales/admin")}
        onGenerateCopy={generateCopy}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail
          liga={liga}
          theme={theme}
          onInsertTemplate={insertTemplate}
          onInsertText={insertText}
          onInsertShape={insertShape}
          onInsertImage={insertImage}
          onSelectTheme={applyTheme}
          onOpenGenius={() => setGeniusOpen(true)}
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
