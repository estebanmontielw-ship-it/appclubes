"use client"

import { useEffect, useState } from "react"
import { X, Calculator, MapPin, ClipboardList, ArrowRight } from "lucide-react"
import Link from "next/link"

// Bump this key whenever you want the modal to re-appear for everyone
const STORAGE_KEY = "cpb_whats_new_v2"

interface Feature {
  icon: React.ElementType
  color: string
  bg: string
  title: string
  desc: string
  href?: string
  linkLabel?: string
}

const FEATURES: Feature[] = [
  {
    icon: Calculator,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Calculadora de Aranceles",
    desc: "Calculá al instante tu honorario por categoría, fase y sede — con IVA, feriado ×1.5 y plus transporte incluidos. Sin sorpresas.",
    href: "/oficiales/calculadora",
    linkLabel: "Abrir calculadora",
  },
  {
    icon: MapPin,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Plus transporte integrado",
    desc: "Al cargar tus honorarios de Inferiores (U13–U19), elegís la sede: Asunción, Luque (+60 000 Gs.) o Capiatá (+80 000 Gs.) y el plus se suma solo.",
    href: "/oficiales/mis-honorarios",
    linkLabel: "Cargar honorarios",
  },
  {
    icon: ClipboardList,
    color: "text-green-600",
    bg: "bg-green-50",
    title: "Designaciones de todos los torneos",
    desc: "Las planillas de designación ahora muestran todos los torneos CPB (LNB, LNBF, U22, Inferiores) — no solo LNB masculino.",
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
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-6 pb-8">
          <button
            onClick={close}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-white/70">Novedad</span>
          </div>
          <h2 className="text-xl font-black text-white leading-tight">
            Nuevas funciones<br />en el portal CPB
          </h2>
          <p className="text-sm text-white/80 mt-1.5">
            Te contamos qué hay de nuevo para vos.
          </p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-4 -mt-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3 items-start">
              <div className={`h-9 w-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                {f.href && (
                  <Link
                    href={f.href}
                    onClick={close}
                    className={`inline-flex items-center gap-1 text-xs font-semibold mt-1.5 ${f.color}`}
                  >
                    {f.linkLabel} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={close}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            Entendido, ¡gracias!
          </button>
        </div>
      </div>
    </div>
  )
}
