"use client"


import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react"
import { loadFabric } from "../_lib/fabric-bridge"
import { attachSmartGuides, type SmartGuidesHandle } from "../_lib/smart-guides"
import { attachHistory, type HistoryHandle } from "../_lib/history"
import type { CanvasFormat } from "../_lib/formats"

export interface CanvasStageHandle {
  getCanvas: () => any
  getHistory: () => HistoryHandle | null
  fitToScreen: () => void
  setZoom: (z: number) => void
  getZoom: () => number
}

interface Props {
  format: CanvasFormat
  bgColor: string
  onReady?: (canvas: any) => void
  onSelectionChange?: (selected: any | null) => void
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void
  onDirty?: () => void
  showSafeZones?: boolean
}

const CanvasStage = forwardRef<CanvasStageHandle, Props>(function CanvasStage(
  { format, bgColor, onReady, onSelectionChange, onHistoryChange, onDirty, showSafeZones },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<any>(null)
  const guidesRef = useRef<SmartGuidesHandle | null>(null)
  const historyRef = useRef<HistoryHandle | null>(null)
  const fabricRef = useRef<any>(null)
  const [zoom, setZoomState] = useState(0.5)
  const [ready, setReady] = useState(false)

  // Ref con el formato actual para que el wheel/fit usen siempre el vigente
  // sin tener que re-crear el canvas cuando cambia.
  const formatRef = useRef(format)
  useEffect(() => { formatRef.current = format }, [format])

  // Callbacks en refs para que NO disparen re-creación del canvas.
  const onReadyRef = useRef(onReady)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const onHistoryChangeRef = useRef(onHistoryChange)
  const onDirtyRef = useRef(onDirty)
  useEffect(() => { onReadyRef.current = onReady })
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange })
  useEffect(() => { onHistoryChangeRef.current = onHistoryChange })
  useEffect(() => { onDirtyRef.current = onDirty })

  // ── Fit-to-screen: el canvas DOM siempre tiene el tamaño del contenedor.
  // El zoom y el pan se aplican vía viewportTransform para que el "arte"
  // (el formato) quede centrado y visible. Este enfoque (estilo Figma/Canva)
  // evita el bug donde el canvas DOM crecía con el zoom y se desalineaba.
  const fitToScreen = useCallback(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const f = formatRef.current
    const padding = 48
    const W = el.clientWidth
    const H = el.clientHeight
    const z = Math.max(0.05, Math.min((W - padding) / f.width, (H - padding) / f.height))
    // Ajustar el canvas DOM al tamaño completo del contenedor
    if (canvas.getWidth() !== W || canvas.getHeight() !== H) {
      canvas.setWidth(W)
      canvas.setHeight(H)
    }
    const tx = (W - f.width * z) / 2
    const ty = (H - f.height * z) / 2
    canvas.setViewportTransform([z, 0, 0, z, tx, ty])
    canvas.requestRenderAll()
    setZoomState(z)
  }, [])

  // ── Setup (una sola vez) ──
  useEffect(() => {
    let destroyed = false
    let resizeObs: ResizeObserver | null = null

    ;(async () => {
      const fabric = await loadFabric()
      if (destroyed || !canvasElRef.current || !containerRef.current) return
      fabricRef.current = fabric

      const W = containerRef.current.clientWidth || 800
      const H = containerRef.current.clientHeight || 600

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: W,
        height: H,
        backgroundColor: "#0B0F1A",
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: false,
        enableRetinaScaling: true,
      })

      canvasRef.current = canvas

      // Selection events — usan refs
      canvas.on("selection:created", (e: any) => onSelectionChangeRef.current?.(e.selected?.[0] ?? null))
      canvas.on("selection:updated", (e: any) => onSelectionChangeRef.current?.(e.selected?.[0] ?? null))
      canvas.on("selection:cleared", () => onSelectionChangeRef.current?.(null))

      // Wheel zoom — SOLO viewport transform. El canvas DOM es fijo.
      canvas.on("mouse:wheel", (opt: any) => {
        const evt = opt.e
        const delta = evt.deltaY
        let z = canvas.getZoom()
        z *= 0.999 ** delta
        z = Math.max(0.05, Math.min(z, 5))
        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, z)
        setZoomState(z)
        evt.preventDefault()
        evt.stopPropagation()
      })

      // Pan con Espacio
      let panning = false
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space" && !panning) {
          panning = true
          canvas.defaultCursor = "grab"
          canvas.selection = false
        }
      }
      const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          panning = false
          canvas.defaultCursor = "default"
          canvas.selection = true
        }
      }
      canvas.on("mouse:down", (opt: any) => {
        if (panning) {
          canvas.setCursor("grabbing")
          canvas.__isDragging = true
          canvas.__lastPos = { x: opt.e.clientX, y: opt.e.clientY }
        }
      })
      canvas.on("mouse:move", (opt: any) => {
        if (canvas.__isDragging) {
          const vpt = canvas.viewportTransform
          vpt[4] += opt.e.clientX - canvas.__lastPos.x
          vpt[5] += opt.e.clientY - canvas.__lastPos.y
          canvas.requestRenderAll()
          canvas.__lastPos = { x: opt.e.clientX, y: opt.e.clientY }
        }
      })
      canvas.on("mouse:up", () => {
        canvas.__isDragging = false
      })
      window.addEventListener("keydown", onKeyDown)
      window.addEventListener("keyup", onKeyUp)

      // Smart guides (sin bug de "líneas pegadas" — ver smart-guides.ts)
      guidesRef.current = attachSmartGuides(fabric, canvas)

      // History
      historyRef.current = attachHistory(canvas, () => {
        onHistoryChangeRef.current?.(!!historyRef.current?.canUndo(), !!historyRef.current?.canRedo())
        onDirtyRef.current?.()
      })

      // Fit inicial
      fitToScreen()
      setReady(true)
      onReadyRef.current?.(canvas)

      // Resize observer del container
      resizeObs = new ResizeObserver(() => fitToScreen())
      resizeObs.observe(containerRef.current)

      ;(canvas as any)._cleanup = () => {
        window.removeEventListener("keydown", onKeyDown)
        window.removeEventListener("keyup", onKeyUp)
      }
    })()

    return () => {
      destroyed = true
      resizeObs?.disconnect()
      guidesRef.current?.dispose()
      historyRef.current?.dispose()
      const c = canvasRef.current
      if (c) {
        c._cleanup?.()
        c.dispose()
      }
      canvasRef.current = null
    }
    // Canvas se crea UNA SOLA VEZ. Cambios de format/bgColor se manejan en effects separados
    // para no destruir los objetos del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cambio de formato → solo re-encuadrar (los objetos se mantienen)
  useEffect(() => {
    if (canvasRef.current) fitToScreen()
  }, [format.width, format.height, fitToScreen])

  // bgColor → el fondo VIVE en un objeto "artboard" en el canvas (ver DisenoV3App).
  // Acá solo mantenemos el color del container fuera del área del diseño.
  useEffect(() => {
    // No-op: el background real lo pone el template vía objeto con role=background.
  }, [bgColor])

  // Safe zones overlay → solo re-render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    canvas.requestRenderAll()
  }, [showSafeZones, ready])

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getHistory: () => historyRef.current,
    fitToScreen,
    setZoom: (z: number) => {
      const canvas = canvasRef.current
      if (!canvas || !containerRef.current) return
      const z2 = Math.max(0.05, Math.min(z, 5))
      const f = formatRef.current
      const W = containerRef.current.clientWidth
      const H = containerRef.current.clientHeight
      const tx = (W - f.width * z2) / 2
      const ty = (H - f.height * z2) / 2
      canvas.setViewportTransform([z2, 0, 0, z2, tx, ty])
      canvas.requestRenderAll()
      setZoomState(z2)
    },
    getZoom: () => zoom,
  }))

  // Posición del overlay de safe zones (se pinta en coords de pantalla)
  const safeTopPx = format.safeTop != null ? format.safeTop * zoom : null
  const safeBottomPx = format.safeBottom != null ? format.safeBottom * zoom : null

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-neutral-950"
      style={{ minHeight: 0 }}
    >
      <canvas ref={canvasElRef} className="absolute inset-0" />

      {/* Safe zones overlay — solo si safeTop/Bottom definidos y showSafeZones activo.
          Nota: este overlay está en coords de pantalla, no del canvas. */}
      {showSafeZones && safeTopPx != null && safeBottomPx != null && (
        <>
          {/* top/bottom se calculan a partir del viewport transform actual — por simplicidad
              se ocultan cuando hay pan/zoom distinto al fit inicial. */}
          <div
            className="absolute left-0 right-0 pointer-events-none border-b border-dashed border-amber-400/60"
            style={{ top: 24 + safeTopPx }}
          />
          <div
            className="absolute left-0 right-0 pointer-events-none border-t border-dashed border-amber-400/60"
            style={{ bottom: 24 + safeBottomPx }}
          />
        </>
      )}

      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-300 ring-1 ring-white/10 backdrop-blur">
        <span>{Math.round(zoom * 100)}%</span>
        <span className="text-neutral-500">·</span>
        <span className="text-neutral-500">Scroll para zoom · Espacio + arrastrar para mover</span>
      </div>
    </div>
  )
})

export default CanvasStage
