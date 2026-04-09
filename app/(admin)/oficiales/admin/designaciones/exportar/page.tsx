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
  categoria: string
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
  }).toUpperCase()
}

/** "Juan Carlos Pérez López" → "J. Pérez" */
function abreviarNombre(nombre: string | null): string {
  if (!nombre) return "—"
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 1) return partes[0]
  const inicial = partes[0][0].toUpperCase() + "."
  // Tomar el primer apellido (asumimos que los dos últimos tokens son apellidos)
  const apellido = partes.length >= 3 ? partes[partes.length - 2] : partes[partes.length - 1]
  return `${inicial} ${apellido}`
}

function getPosicion(p: PlanillaExport, campo: string) {
  return p.posiciones.find(pos => pos.campo === campo)?.nombre ?? null
}

// ── Vista en pantalla (mobile-friendly cards) ─────────────────────────────────
function PlanillaCard({ p }: { p: PlanillaExport }) {
  const arbitros = p.posiciones.filter(pos => ["cc", "a1", "a2"].includes(pos.campo))
  const mesa = p.posiciones.filter(pos => ["ap", "cron", "lanz", "esta", "rela"].includes(pos.campo))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="font-bold text-sm leading-tight">{p.equipoLocal} vs {p.equipoVisit}</p>
          <p className="text-xs text-gray-500 mt-0.5">{p.horaStr.slice(0, 5)} hs{p.cancha ? ` · ${p.cancha}` : ""}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          p.estado === "CONFIRMADA" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
        }`}>{p.estado}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-3">
          <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-2">Árbitros</p>
          {arbitros.map(pos => (
            <div key={pos.campo} className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
              <span className="text-[10px] text-gray-400 w-14 shrink-0">{pos.label}</span>
              <span className="text-[11px] font-semibold text-gray-900 leading-tight">{pos.nombre || <span className="text-gray-300 font-normal">—</span>}</span>
            </div>
          ))}
        </div>
        <div className="p-3">
          <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-2">Mesa de Control</p>
          {mesa.map(pos => (
            <div key={pos.campo} className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
              <span className="text-[10px] text-gray-400 w-16 shrink-0">{pos.label}</span>
              <span className="text-[11px] font-semibold text-gray-900 leading-tight">{pos.nombre || <span className="text-gray-300 font-normal">—</span>}</span>
            </div>
          ))}
        </div>
      </div>
      {p.obs && (
        <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-500">
          <span className="font-semibold">Obs:</span> {p.obs}
        </div>
      )}
    </div>
  )
}

// ── Hoja de impresión: tabla horizontal estilo Excel ──────────────────────────
function HojaImpresion({ planillas, fecha }: { planillas: PlanillaExport[], fecha: string }) {
  const fechaDisplay = formatFechaLarga(fecha)

  return (
    <div
      id="hoja-impresion"
      style={{
        width: "277mm", // A4 landscape usable
        backgroundColor: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: "10mm 8mm",
        boxSizing: "border-box",
      }}
    >
      {/* Logo + título */}
      <div style={{ textAlign: "center", marginBottom: "6mm" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon-cpb.png" alt="CPB" style={{ width: 36, height: 36, marginBottom: 6 }} />
        <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Confederación Paraguaya de Básquetbol
        </div>
        {/* Categoría — grande y destacada */}
        <div style={{ fontSize: 18, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: "#1a1a2e" }}>
          {planillas[0]?.categoria || "LNB"} — Designación de Oficiales
        </div>
        {/* Fecha — muy visible */}
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#1e3a5f", marginTop: 3, letterSpacing: 0.5 }}>
          {fechaDisplay}
        </div>
        <div style={{ borderBottom: "1.5px solid #222", marginTop: 5 }} />
      </div>

      {/* Tabla */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
        <thead>
          <tr style={{ backgroundColor: "#1a1a2e", color: "#fff" }}>
            <th style={th}>HORA</th>
            <th style={{ ...th, textAlign: "left" }}>LOCAL</th>
            <th style={{ ...th, textAlign: "left" }}>VISITANTE</th>
            <th style={th}>CANCHA</th>
            <th style={{ ...th, backgroundColor: "#1e3a5f" }}>CAT</th>
            <th style={{ ...th, backgroundColor: "#2d3a6b" }}>CC</th>
            <th style={{ ...th, backgroundColor: "#2d3a6b" }}>A1</th>
            <th style={{ ...th, backgroundColor: "#2d3a6b" }}>A2</th>
            <th style={{ ...th, backgroundColor: "#3b4a7a" }}>AP</th>
            <th style={{ ...th, backgroundColor: "#3b4a7a" }}>CRON</th>
            <th style={{ ...th, backgroundColor: "#3b4a7a" }}>LANZ</th>
            <th style={{ ...th, backgroundColor: "#3b4a7a" }}>ESTA</th>
            <th style={{ ...th, backgroundColor: "#3b4a7a" }}>RELA</th>
            <th style={{ ...th, backgroundColor: "#555" }}>OBS</th>
          </tr>
        </thead>
        <tbody>
          {planillas.map((p, i) => (
            <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8f9fa" }}>
              <td style={{ ...td, fontWeight: "bold", textAlign: "center" }}>{p.horaStr.slice(0, 5)}</td>
              <td style={{ ...td, fontWeight: "bold" }}>{p.equipoLocal}</td>
              <td style={td}>{p.equipoVisit}</td>
              <td style={{ ...td, textAlign: "center", fontSize: 8, color: "#555" }}>{p.cancha || "—"}</td>
              <td style={{ ...td, textAlign: "center", fontWeight: "bold", fontSize: 8, backgroundColor: "#eef2ff", color: "#1e3a5f" }}>{p.categoria}</td>
              <td style={{ ...td, textAlign: "center", fontWeight: "bold" }}>{abreviarNombre(getPosicion(p, "cc"))}</td>
              <td style={{ ...td, textAlign: "center" }}>{abreviarNombre(getPosicion(p, "a1"))}</td>
              <td style={{ ...td, textAlign: "center", color: getPosicion(p, "a2") ? "#222" : "#bbb" }}>{abreviarNombre(getPosicion(p, "a2"))}</td>
              <td style={{ ...td, textAlign: "center" }}>{abreviarNombre(getPosicion(p, "ap"))}</td>
              <td style={{ ...td, textAlign: "center" }}>{abreviarNombre(getPosicion(p, "cron"))}</td>
              <td style={{ ...td, textAlign: "center" }}>{abreviarNombre(getPosicion(p, "lanz"))}</td>
              <td style={{ ...td, textAlign: "center", color: getPosicion(p, "esta") ? "#222" : "#bbb" }}>{abreviarNombre(getPosicion(p, "esta"))}</td>
              <td style={{ ...td, textAlign: "center", color: getPosicion(p, "rela") ? "#222" : "#bbb" }}>{abreviarNombre(getPosicion(p, "rela"))}</td>
              <td style={{ ...td, fontSize: 8, color: "#666" }}>{p.obs || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, textAlign: "right", fontSize: 7, color: "#aaa" }}>
        cpb.com.py · Generado: {new Date().toLocaleString("es-PY")}
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  padding: "5px 4px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: 8,
  letterSpacing: 0.5,
  border: "1px solid #ddd",
  whiteSpace: "nowrap",
}

const td: React.CSSProperties = {
  padding: "5px 4px",
  border: "1px solid #e5e7eb",
  fontSize: 9,
  whiteSpace: "nowrap",
}

// ─────────────────────────────────────────────────────────────────────────────

function ExportarContent() {
  const searchParams = useSearchParams()
  const initialFecha = searchParams.get("fecha") || todayStr()
  const [fecha, setFecha] = useState(initialFecha)
  const [planillas, setPlanillas] = useState<PlanillaExport[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<"pdf" | "jpg" | null>(null)
  const hojaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fecha) return
    setLoading(true)
    fetch(`/api/designaciones/export?fecha=${fecha}`)
      .then(r => r.json())
      .then(d => setPlanillas(d.planillas || []))
      .finally(() => setLoading(false))
  }, [fecha])

  async function captureHoja() {
    const el = document.getElementById("hoja-impresion")
    if (!el) return null
    const html2canvas = (await import("html2canvas")).default
    return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#fff", logging: false })
  }

  async function exportarPDF() {
    if (planillas.length === 0) return
    setExporting("pdf")
    try {
      const canvas = await captureHoja()
      if (!canvas) return
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      const imgW = pageW - 16
      const imgH = imgW / ratio
      const y = Math.max(8, (pageH - imgH) / 2)
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 8, y, imgW, imgH)
      pdf.save(`designaciones-${fecha.replace(/-/g, "")}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  async function exportarJPG() {
    if (planillas.length === 0) return
    setExporting("jpg")
    try {
      const canvas = await captureHoja()
      if (!canvas) return
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
    <div>
      {/* Controles */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/oficiales/admin/designaciones" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Exportar planillas</h1>
          <div className="flex gap-2">
            <button onClick={exportarJPG} disabled={planillas.length === 0 || !!exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
              {exporting === "jpg" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
              JPG
            </button>
            <button onClick={exportarPDF} disabled={planillas.length === 0 || !!exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
              {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </button>
            <button onClick={() => window.print()} disabled={planillas.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-600">Fecha:</label>
          <input type="date" value={fecha} onChange={e => e.target.value && setFecha(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {!loading && planillas.length === 0 && (
          <p className="text-center text-gray-400 py-12">No hay planillas para esta fecha</p>
        )}

        {/* Cards mobile preview */}
        {planillas.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-3 capitalize">{fechaDisplay.toLowerCase()} · {planillas.length} partido{planillas.length !== 1 ? "s" : ""}</p>
            <div className="space-y-3 mb-8">
              {planillas.map(p => <PlanillaCard key={p.id} p={p} />)}
            </div>
          </>
        )}
      </div>

      {/* Hoja para export — siempre renderizada pero oculta en pantalla */}
      <div className="print:block" style={{ position: "fixed", left: "-9999px", top: 0 }} ref={hojaRef}>
        {planillas.length > 0 && <HojaImpresion planillas={planillas} fecha={fecha} />}
      </div>

      {/* Print layout */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden; }
          #hoja-impresion, #hoja-impresion * { visibility: visible; }
          #hoja-impresion { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; }
        }
      `}</style>
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
