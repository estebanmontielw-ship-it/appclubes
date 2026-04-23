// Smart guides (snapping + líneas rojas cuando alineás) para fabric.js v5.
// Adaptado del patrón de vue-fabric-editor / fabric-smart-object, simplificado.
//
// Cómo funciona:
//   1. Al mover un objeto, calculamos sus 6 "líneas de interés":
//      left, center-X, right, top, center-Y, bottom.
//   2. Para cada otro objeto en el canvas, comparamos esas líneas con las
//      del objeto móvil. Si la diferencia es <= SNAP_PX, hacemos snap
//      (movemos el objeto para que las líneas coincidan) y guardamos una
//      línea de guía a dibujar.
//   3. También comparamos contra el centro y bordes del canvas.
//   4. En el evento `after:render` pintamos las líneas rojas sobre el
//      contexto superior (no se exportan).
//
// Escapar el snap: mantener Alt mientras arrastrás.


const SNAP_PX = 6
const GUIDE_COLOR = "#FF3B30"
const GUIDE_WIDTH = 1

type Guide = {
  type: "v" | "h"
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SmartGuidesHandle {
  dispose: () => void
  setEnabled: (v: boolean) => void
}

export function attachSmartGuides(fabric: any, canvas: any): SmartGuidesHandle {
  let enabled = true
  let activeGuides: Guide[] = []

  function getObjectEdges(obj: any) {
    const br = obj.getBoundingRect(true, true)
    return {
      left: br.left,
      right: br.left + br.width,
      centerX: br.left + br.width / 2,
      top: br.top,
      bottom: br.top + br.height,
      centerY: br.top + br.height / 2,
      width: br.width,
      height: br.height,
    }
  }

  function applySnapping(e: any) {
    if (!enabled) return
    const target = e.target
    if (!target || (e.e && e.e.altKey)) return

    const edges = getObjectEdges(target)
    const others: any[] = []
    canvas.forEachObject((o: any) => {
      if (o === target || o.excludeFromSnap) return
      if (!o.visible) return
      others.push(o)
    })

    // "Virtual object" para el canvas
    const canvasW = canvas.getWidth() / canvas.getZoom()
    const canvasH = canvas.getHeight() / canvas.getZoom()
    const canvasEdges = {
      left: 0, right: canvasW, centerX: canvasW / 2,
      top: 0, bottom: canvasH, centerY: canvasH / 2,
      width: canvasW, height: canvasH,
    }

    activeGuides = []

    let dx = 0
    let dy = 0
    let foundX = false
    let foundY = false

    const vLines: Array<{ value: number; type: "left" | "centerX" | "right" }> = [
      { value: edges.left, type: "left" },
      { value: edges.centerX, type: "centerX" },
      { value: edges.right, type: "right" },
    ]
    const hLines: Array<{ value: number; type: "top" | "centerY" | "bottom" }> = [
      { value: edges.top, type: "top" },
      { value: edges.centerY, type: "centerY" },
      { value: edges.bottom, type: "bottom" },
    ]

    const candidatesX: Array<{ edges: ReturnType<typeof getObjectEdges> }> = [{ edges: canvasEdges as any }]
    const candidatesY = [...candidatesX]
    others.forEach((o) => {
      const e2 = getObjectEdges(o)
      candidatesX.push({ edges: e2 })
      candidatesY.push({ edges: e2 })
    })

    // Vertical guides (comparo x)
    for (const line of vLines) {
      if (foundX) break
      for (const cand of candidatesX) {
        const targets = [cand.edges.left, cand.edges.centerX, cand.edges.right]
        for (const tVal of targets) {
          if (Math.abs(line.value - tVal) <= SNAP_PX) {
            dx = tVal - line.value
            foundX = true
            const y1 = Math.min(edges.top, cand.edges.top)
            const y2 = Math.max(edges.bottom, cand.edges.bottom)
            activeGuides.push({ type: "v", x1: tVal, y1, x2: tVal, y2 })
            break
          }
        }
        if (foundX) break
      }
    }

    // Horizontal guides (comparo y)
    for (const line of hLines) {
      if (foundY) break
      for (const cand of candidatesY) {
        const targets = [cand.edges.top, cand.edges.centerY, cand.edges.bottom]
        for (const tVal of targets) {
          if (Math.abs(line.value - tVal) <= SNAP_PX) {
            dy = tVal - line.value
            foundY = true
            const x1 = Math.min(edges.left, cand.edges.left)
            const x2 = Math.max(edges.right, cand.edges.right)
            activeGuides.push({ type: "h", x1, y1: tVal, x2, y2: tVal })
            break
          }
        }
        if (foundY) break
      }
    }

    if (foundX || foundY) {
      target.set({
        left: target.left + dx,
        top: target.top + dy,
      })
      target.setCoords()
    }
  }

  function drawGuides() {
    if (!enabled || activeGuides.length === 0) return
    const ctx = canvas.getSelectionContext?.()
    if (!ctx) return
    const zoom = canvas.getZoom()
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]

    ctx.save()
    ctx.strokeStyle = GUIDE_COLOR
    ctx.lineWidth = GUIDE_WIDTH
    ctx.setLineDash([4, 4])

    activeGuides.forEach((g) => {
      const x1 = g.x1 * zoom + vpt[4]
      const y1 = g.y1 * zoom + vpt[5]
      const x2 = g.x2 * zoom + vpt[4]
      const y2 = g.y2 * zoom + vpt[5]
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })

    ctx.restore()
  }

  function clearGuides() {
    activeGuides = []
    canvas.requestRenderAll()
  }

  canvas.on("object:moving", applySnapping)
  canvas.on("object:scaling", applySnapping)
  canvas.on("mouse:up", clearGuides)
  canvas.on("after:render", drawGuides)

  return {
    dispose() {
      canvas.off("object:moving", applySnapping)
      canvas.off("object:scaling", applySnapping)
      canvas.off("mouse:up", clearGuides)
      canvas.off("after:render", drawGuides)
    },
    setEnabled(v: boolean) {
      enabled = v
      if (!v) clearGuides()
    },
  }
}
