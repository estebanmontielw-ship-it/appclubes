"use client"

import { useEffect, useState } from "react"
import { X, Banknote, Calculator, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

// Bump this key whenever you want the modal to re-appear for everyone
const STORAGE_KEY = "cpb_whats_new_v3"

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
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Mis Honorarios — tu registro de cobros",
    desc: "Registrá cada partido que arbitrás o trabajás: categoría, fase, monto y estado (pendiente / cobrado). El sistema te sugiere el arancel CPB automáticamente según la fase. Llevá el control de todo lo que ganás en la temporada.",
    href: "/oficiales/mis-honorarios",
    linkLabel: "Ir a Mis Honorarios",
    highlight: true,
  },
  {
    icon: Calculator,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Calculadora de Aranceles",
    desc: "Conocé tu honorario antes del partido: elegís categoría, fase y sede y el sistema calcula neto, IVA 10% y feriado ×1.5 al instante.",
    href: "/oficiales/calculadora",
    linkLabel: "Abrir calculadora",
  },
  {
    icon: MapPin,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Plus transporte para Inferiores",
    desc: "Al cargar honorarios de U13 a U19 podés sumar el plus de sede: Luque +60 000 Gs. o Capiatá +80 000 Gs. Se suma solo al monto.",
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
            Controlá tus cobros<br />desde el portal CPB
          </h2>
          <p className="text-sm text-white/80 mt-1.5">
            Ahora tenés herramientas para llevar tus finanzas de temporada.
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
            href="/oficiales/mis-honorarios"
            onClick={close}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Ir a Mis Honorarios
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
