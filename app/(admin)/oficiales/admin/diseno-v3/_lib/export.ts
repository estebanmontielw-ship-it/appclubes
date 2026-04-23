// Export helpers para V3:
//   - exportPNG: descarga PNG (toDataURL x multiplier)
//   - exportJSON: descarga el documento como JSON (para backup / duplicar)
//   - exportPDF: genera PDF con jspdf (ya instalado) — 1 página por canvas
//   - generateThumbnail: mini PNG 400px para la grilla de documentos
//
// Para no romper el zoom visual, cada función clona el estado y exporta
// a resolución nativa (1:1 con width/height del formato).

import jsPDF from "jspdf"

interface ExportOpts {
  canvas: any
  width: number
  height: number
  filename?: string
}

function toNativeDataURL(canvas: any, width: number, height: number, format: "png" | "jpeg" = "png", quality = 1): string {
  const zoom = canvas.getZoom()
  const vpt = canvas.viewportTransform?.slice()
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.setZoom(1)
  const url = canvas.toDataURL({
    format,
    quality,
    left: 0,
    top: 0,
    width,
    height,
    multiplier: 1,
  })
  if (vpt) canvas.setViewportTransform(vpt)
  canvas.setZoom(zoom)
  canvas.requestRenderAll()
  return url
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function exportPNG({ canvas, width, height, filename = "diseno.png" }: ExportOpts) {
  const url = toNativeDataURL(canvas, width, height, "png")
  triggerDownload(url, filename.endsWith(".png") ? filename : `${filename}.png`)
}

export function exportJPG({ canvas, width, height, filename = "diseno.jpg" }: ExportOpts) {
  const url = toNativeDataURL(canvas, width, height, "jpeg", 0.92)
  triggerDownload(url, filename.endsWith(".jpg") ? filename : `${filename}.jpg`)
}

export function exportPDF({ canvas, width, height, filename = "diseno.pdf" }: ExportOpts) {
  const url = toNativeDataURL(canvas, width, height, "jpeg", 0.95)
  const orientation = width > height ? "l" : "p"
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
    compress: true,
  })
  pdf.addImage(url, "JPEG", 0, 0, width, height, undefined, "FAST")
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}

export function exportJSON({ canvas, filename = "diseno.json" }: { canvas: any; filename?: string }) {
  const json = canvas.toJSON([
    "id", "name", "role", "excludeFromSnap", "editable",
    "lockMovementX", "lockMovementY", "selectable",
  ])
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename.endsWith(".json") ? filename : `${filename}.json`)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Genera un thumbnail 400×(400*aspect) data URL para guardar con el doc.
export function generateThumbnail(canvas: any, width: number, height: number): string {
  const zoom = canvas.getZoom()
  const vpt = canvas.viewportTransform?.slice()
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.setZoom(1)
  const multiplier = Math.min(400 / width, 400 / height)
  const url = canvas.toDataURL({
    format: "jpeg",
    quality: 0.7,
    left: 0,
    top: 0,
    width,
    height,
    multiplier,
  })
  if (vpt) canvas.setViewportTransform(vpt)
  canvas.setZoom(zoom)
  canvas.requestRenderAll()
  return url
}
