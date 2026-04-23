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

  // Callbacks en refs para que NO disparen re-creación del canvas (antes causaba
  // loop infinito porque el parent pasaba callbacks inline que cambiaban cada render).
  const onReadyRef = useRef(onReady)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const onHistoryChangeRef = useRef(onHistoryChange)
  const onDirtyRef = useRef(onDirty)
  useEffect(() => { onReadyRef.current = onReady })
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange })
  useEffect(() => { onHistoryChangeRef.current = onHistoryChange })
  useEffect(() => { onDirtyRef.current = onDirty })

  // --- compute zoom to fit ---
  const fitToScreen = useCallback(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const padding = 80
    const w = el.clientWidth - padding
    const h = el.clientHeight - padding
    const z = Math.max(0.05, Math.min(w / format.width, h / format.height))
    canvas.setZoom(z)
    canvas.setWidth(format.width * z)
    canvas.setHeight(format.height * z)
    canvas.requestRenderAll()
    setZoomState(z)
  }, [format.width, format.height])

  // --- setup on mount ---
  useEffect(() => {
    let destroyed = false
    let resizeObs: ResizeObserver | null = null

    ;(async () => {
      const fabric = await loadFabric()
      if (destroyed || !canvasElRef.current) return
      fabricRef.current = fabric

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: format.width,
        height: format.height,
        backgroundColor: bgColor,
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: false,
        enableRetinaScaling: true,
      })

      canvasRef.current = canvas

      // Selection events — usan refs para no recrear el canvas
      canvas.on("selection:created", (e: any) => onSelectionChangeRef.current?.(e.selected?.[0] ?? null))
      canvas.on("selection:updated", (e: any) => onSelectionChangeRef.current?.(e.selected?.[0] ?? null))
      canvas.on("selection:cleared", () => onSelectionChangeRef.current?.(null))

      // Wheel zoom
      canvas.on("mouse:wheel", (opt: any) => {
        const evt = opt.e
        const delta = evt.deltaY
        let z = canvas.getZoom()
        z *= 0.999 ** delta
        z = Math.max(0.05, Math.min(z, 5))
        const pointer = canvas.getPointer(evt, true)
        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, z)
        canvas.setWidth(format.width * z)
        canvas.setHeight(format.height * z)
        setZoomState(z)
        evt.preventDefault()
        evt.stopPropagation()
      })

      // Pan con espacio
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

      // Smart guides
      guidesRef.current = attachSmartGuides(fabric, canvas)

      // History — callbacks vía refs
      historyRef.current = attachHistory(canvas, () => {
        onHistoryChangeRef.current?.(!!historyRef.current?.canUndo(), !!historyRef.current?.canRedo())
        onDirtyRef.current?.()
      })

      // Initial fit
      fitToScreen()
      setReady(true)
      onReadyRef.current?.(canvas)

      // Resize observer
      if (containerRef.current) {
        resizeObs = new ResizeObserver(() => fitToScreen())
        resizeObs.observe(containerRef.current)
      }

      // Cleanup on effect reset
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
    // Solo re-crear canvas si cambia el formato. bgColor y callbacks usan refs
    // para no disparar recreación (eso causaba loop infinito).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format.width, format.height])

  // bgColor change → solo actualizamos el fondo, no recreamos el canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setBackgroundColor(bgColor, () => canvas.requestRenderAll())
  }, [bgColor])

  // Safe zones overlay (solo visual — no es un objeto fabric)
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
      if (!canvas) return
      const z2 = Math.max(0.05, Math.min(z, 5))
      canvas.setZoom(z2)
      canvas.setWidth(format.width * z2)
      canvas.setHeight(format.height * z2)
      canvas.requestRenderAll()
      setZoomState(z2)
    },
    getZoom: () => zoom,
  }))

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center"
      style={{ minHeight: 0 }}
    >
      <div className="relative shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
        <canvas ref={canvasElRef} />
        {showSafeZones && format.safeTop !== undefined && (
          <>
            <div
              className="absolute left-0 right-0 pointer-events-none border-b border-dashed border-amber-400/60"
              style={{ top: format.safeTop * zoom }}
            />
            <div
              className="absolute left-0 right-0 pointer-events-none border-t border-dashed border-amber-400/60"
              style={{ bottom: (format.safeBottom ?? 0) * zoom }}
            />
          </>
        )}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-300 ring-1 ring-white/10 backdrop-blur">
        <span>{Math.round(zoom * 100)}%</span>
        <span className="text-neutral-500">·</span>
        <span className="text-neutral-500">Scroll para zoom · Espacio + arrastrar para mover</span>
      </div>
    </div>
  )
})

export default CanvasStage
