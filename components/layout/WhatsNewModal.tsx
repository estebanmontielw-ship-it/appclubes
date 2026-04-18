"use client"

import { useEffect, useState } from "react"
import { X, Banknote, Calculator, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

// Bump this key whenever you want the modal to re-appear for everyone
const STORAGE_KEY = "cpb_whats_new_v4"

interface Feature {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  desc: string
  href?: string
  linkLabel?: string
  highlight?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Calendario Macro — 4 torneos en uno",
    desc: "Ahora podés ver todos los partidos de LNB, LNBF, U22 Masculino y U22 Femenino en un solo calendario. Navegá por semana o mes, filtrá por equipo y consultá horarios, canchas y rivales de un vistazo.",
    href: "/oficiales/calendario-macro",
    linkLabel: "Abrir calendario",
    highlight: true,
  },
  {
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Mis Honorarios",
    desc: "Registrá cada partido, consultá aranceles y llevá el control de tus cobros de temporada.",
    href: "/oficiales/mis-honorarios",
    linkLabel: "Ver mis honorarios",
  },
  {
    icon: Calculator,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Calculadora de Aranceles",
    desc: "Calculá tu honorario neto, IVA 10% y feriado ×1.5 antes del partido.",
    href: "/oficiales/calculadora",
    linkLabel: "Abrir calculadora",
  },
]

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {}
  }, [])

  function close() {
    try { localStorage.setItem(STORAGE_KEY, "seen") } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
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
            Nuevas funciones<br />en tu portal CPB
          </h2>
          <p className="text-sm text-white/80 mt-1.5">
            Calendario de torneos, honorarios y más para esta temporada.
          </p>
        </div>

        {/* Features — overlap header with negative margin */}
        <div className="px-5 pb-2 -mt-5 space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`flex gap-3 items-start rounded-xl p-3.5 ${
                f.highlight
                  ? "bg-emerald-50 border border-emerald-200 shadow-sm"
                  : "bg-gray-50"
              }`}
            >
              <div className={`h-9 w-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${f.highlight ? "text-emerald-800" : "text-gray-900"}`}>
                  {f.highlight && <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block mb-0.5">Principal</span>}
                  {f.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                {f.href && (
                  <Link
                    href={f.href}
                    onClick={close}
                    className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${f.color}`}
                  >
                    {f.linkLabel} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 py-5">
          <Link
            href="/oficiales/calendario-macro"
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
