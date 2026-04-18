"use client"

import { useEffect, useState } from "react"
import { X, Calendar, BarChart3, ArrowRight } from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "cpb_ct_whats_new_v1"

type RolCT = "ENTRENADOR_NACIONAL" | "ENTRENADOR_EXTRANJERO" | "ASISTENTE" | string

const ROLES_STATS: RolCT[] = ["ENTRENADOR_NACIONAL", "ENTRENADOR_EXTRANJERO", "ASISTENTE"]

interface CTWhatsNewModalProps {
  rol: RolCT
}

export default function CTWhatsNewModal({ rol }: CTWhatsNewModalProps) {
  const [visible, setVisible] = useState(false)
  const showStats = ROLES_STATS.includes(rol)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {}
  }, [])

  function close() {
    try { localStorage.setItem(STORAGE_KEY, "seen") } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-10">
          <button
            onClick={close}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Nuevas funciones</span>
          <h2 className="text-xl font-black text-white leading-tight mt-1">
            {showStats ? "Calendario y estadísticas" : "Calendario de torneos"}<br />en tu portal CPB
          </h2>
          <p className="text-sm text-white/80 mt-1.5">
            {showStats
              ? "Seguí todos los torneos y analizá el rendimiento de los equipos."
              : "Toda la programación de la temporada en un solo lugar."}
          </p>
        </div>

        {/* Features */}
        <div className="px-5 pb-2 -mt-5 space-y-3">
          {/* Calendario Macro — for all CT */}
          <div className="flex gap-3 items-start rounded-xl p-3.5 bg-blue-50 border border-blue-200 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-blue-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block mb-0.5">Nuevo</span>
                Calendario Macro — 4 torneos en uno
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                LNB, LNBF, U22 Masculino y U22 Femenino en un solo calendario. Navegá por semana o mes, filtrá por equipo y consultá horarios y canchas.
              </p>
              <Link
                href="/cuerpotecnico/calendario-macro"
                onClick={close}
                className="inline-flex items-center gap-1 text-xs font-semibold mt-2 text-blue-600"
              >
                Abrir calendario <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Estadísticas — only for entrenadores/asistentes */}
          {showStats && (
            <div className="flex gap-3 items-start rounded-xl p-3.5 bg-gray-50">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">Estadísticas LNB — analizá el rendimiento</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Acceso directo al portal de estadísticas. Promedios, box scores y líderes de temporada para preparar el análisis de tus rivales.
                </p>
                <Link
                  href="/cuerpotecnico/estadisticas"
                  onClick={close}
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2 text-primary"
                >
                  Ver estadísticas <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 py-5">
          <Link
            href="/cuerpotecnico/calendario-macro"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Ver Calendario Macro
          </Link>
          <button
            onClick={close}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
