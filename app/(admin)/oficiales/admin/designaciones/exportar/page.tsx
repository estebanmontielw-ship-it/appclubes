"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Printer, ArrowLeft, Loader2, FileImage, FileText } from "lucide-react"
import Link from "next/link"

interface Posicion {
  campo: string
  label: string
  id: string | null
  nombre: string | null
}

interface PlanillaExport {
  id: string
  matchId: string
  fecha: string
  horaStr: string
  equipoLocal: string
  equipoVisit: string
  cancha: string | null
  estado: string
  obs: string | null
  posiciones: Posicion[]
  confirmadaEn: string | null
  confirmadoPorNombre: string | null
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function formatFechaLarga(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function PlanillaCard({ p }: { p: PlanillaExport }) {
  const arbitros = p.posiciones.filter(pos => ["cc", "a1", "a2"].includes(pos.campo))
  const mesa = p.posiciones.filter(pos => ["ap", "cron", "lanz", "esta", "rela"].includes(pos.campo))

  return (
    <div className="planilla-card bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ pageBreakInside: "avoid" }}>
      {/* Header del partido */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-300">
        <div>
          <p className="font-bold text-base leading-tight">{p.equipoLocal} vs {p.equipoVisit}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {p.horaStr.slice(0, 5)} hs{p.cancha ? ` · ${p.cancha}` : ""}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
          p.estado === "CONFIRMADA"
            ? "bg-green-50 text-green-700 border-green-400"
            : "bg-orange-50 text-orange-600 border-orange-400"
        }`}>
          {p.estado}
        </span>
      </div>

      {/* Cuerpo: árbitros + mesa en 2 columnas */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-200">
        <div className="px-3 py-2">
          <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Árbitros</p>
          <table className="w-full">
            <tbody>
              {arbitros.map(pos => (
                <tr key={pos.campo} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 pr-2 text-[10px] text-gray-400 w-24 leading-tight">{pos.label}</td>
                  <td className="py-1 text-[11px] font-semibold text-gray-900 leading-tight">
                    {pos.nombre || <span className="text-gray-300 font-normal">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-2">
          <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-1.5">Mesa de Control</p>
          <table className="w-full">
            <tbody>
              {mesa.map(pos => (
                <tr key={pos.campo} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 pr-2 text-[10px] text-gray-400 w-24 leading-tight">{pos.label}</td>
                  <td className="py-1 text-[11px] font-semibold text-gray-900 leading-tight">
                    {pos.nombre || <span className="text-gray-300 font-normal">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {p.obs && (
        <div className="px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-500">
          <span className="font-semibold">Obs:</span> {p.obs}
        </div>
      )}

      {/* Firmas */}
      <div className="grid grid-cols-3 gap-4 px-4 pb-3 pt-3 border-t border-gray-200">
        {["Designador", "Crew Chief", "Recibido"].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-gray-400 h-6 mb-1" />
            <p className="text-[9px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExportarContent() {
  const searchParams = useSearchParams()
  const initialFecha = searchParams.get("fecha") || todayStr()
  const [fecha, setFecha] = useState(initialFecha)
  const [planillas, setPlanillas] = useState<PlanillaExport[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<"pdf" | "jpg" | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fecha) return
    setLoading(true)
    fetch(`/api/designaciones/export?fecha=${fecha}`)
      .then(r => r.json())
      .then(d => setPlanillas(d.planillas || []))
      .finally(() => setLoading(false))
  }, [fecha])

  async function exportarPDF() {
    if (!printRef.current || planillas.length === 0) return
    setExporting("pdf")
    try {
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - 20 // 10mm margin each side
      const imgH = (canvas.height * imgW) / canvas.width

      let y = 10
      let remaining = imgH

      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - 20)
        const srcY = (imgH - remaining) * (canvas.height / imgH)
        const srcH = sliceH * (canvas.height / imgH)

        const sliceCanvas = document.createElement("canvas")
        sliceCanvas.width = canvas.width
        sliceCanvas.height = srcH
        const ctx = sliceCanvas.getContext("2d")!
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95)
        pdf.addImage(sliceData, "JPEG", 10, y, imgW, sliceH)

        remaining -= sliceH
        if (remaining > 0) { pdf.addPage(); y = 10 }
      }

      const fechaStr = fecha.replace(/-/g, "")
      pdf.save(`designaciones-${fechaStr}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  async function exportarJPG() {
    if (!printRef.current || planillas.length === 0) return
    setExporting("jpg")
    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `designaciones-${fecha.replace(/-/g, "")}.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }, "image/jpeg", 0.95)
    } finally {
      setExporting(null)
    }
  }

  const fechaDisplay = formatFechaLarga(fecha)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Controles */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/oficiales/admin/designaciones" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Exportar planillas</h1>
          <div className="flex gap-2">
            <button
              onClick={exportarJPG}
              disabled={planillas.length === 0 || !!exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              {exporting === "jpg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
              JPG
            </button>
            <button
              onClick={exportarPDF}
              disabled={planillas.length === 0 || !!exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </button>
            <button
              onClick={() => window.print()}
              disabled={planillas.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <label className="text-sm font-medium text-gray-600">Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={e => e.target.value && setFecha(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {!loading && planillas.length === 0 && (
          <p className="text-center text-gray-400 py-12">No hay planillas para esta fecha</p>
        )}
      </div>

      {/* Contenido exportable */}
      {planillas.length > 0 && (
        <div ref={printRef} className="bg-white p-6 rounded-xl border border-gray-200 print:border-0 print:p-0">
          {/* Encabezado */}
          <div className="text-center mb-5">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">Confederación Paraguaya de Básquetbol</p>
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">Designación de Árbitros y Mesa</h2>
            <p className="text-sm text-gray-500 mt-1 capitalize">{fechaDisplay}</p>
            <div className="mt-3 border-t border-gray-300" />
          </div>

          {/* Grid de planillas: 1 columna siempre, pero compactas */}
          <div className="space-y-4">
            {planillas.map(p => (
              <PlanillaCard key={p.id} p={p} />
            ))}
          </div>

          {/* Pie */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-[10px] text-gray-400">cpb.com.py · Impreso: {new Date().toLocaleString("es-PY")}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExportarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>}>
      <ExportarContent />
    </Suspense>
  )
}
