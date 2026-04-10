"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  onAceptado: () => void
}

export default function AceptarTerminosModal({ onAceptado }: Props) {
  const [aceptado, setAceptado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function confirmar() {
    if (!aceptado) return
    setLoading(true)
    try {
      await fetch("/api/me/acepta-terminos", { method: "POST" })
      onAceptado()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2d50] px-6 py-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg">Actualizamos nuestras políticas</h2>
          <p className="text-blue-200 text-xs mt-1">Para continuar necesitás aceptarlas</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            La Confederación Paraguaya de Básquetbol actualizó sus Términos y Condiciones
            y su Política de Privacidad. Podés leerlos antes de aceptar.
          </p>

          <div className="flex gap-3">
            <Link
              href="/terminos"
              target="_blank"
              className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/privacidad"
              target="_blank"
              className="flex-1 text-center py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Política de Privacidad
            </Link>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
            />
            <span className="text-sm text-gray-700 leading-snug">
              Leí y acepto los{" "}
              <Link href="/terminos" target="_blank" className="text-primary underline">Términos y Condiciones</Link>
              {" "}y la{" "}
              <Link href="/privacidad" target="_blank" className="text-primary underline">Política de Privacidad</Link>
              <span className="text-red-500"> *</span>
            </span>
          </label>

          <button
            onClick={confirmar}
            disabled={!aceptado || loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading ? "Guardando..." : "Confirmar y continuar"}
          </button>
        </div>
      </div>
    </div>
  )
}
