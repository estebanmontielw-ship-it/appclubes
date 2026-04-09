"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface PortalInstallPromptProps {
  /** Identificador único para localStorage (sin espacios) */
  storageKey: string
  /** Nombre que aparece en el encabezado */
  appName: string
  /** Subtítulo corto */
  appSubtitle: string
  /** Beneficios a listar (máx 3) */
  benefits: string[]
}

export default function PortalInstallPrompt({
  storageKey,
  appName,
  appSubtitle,
  benefits,
}: PortalInstallPromptProps) {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if ((navigator as any).standalone === true) return

    // No mostrar por 14 días si ya fue descartado
    const dismissed = localStorage.getItem(`pwa-dismissed-${storageKey}`)
    if (dismissed && Date.now() - parseInt(dismissed) < 14 * 24 * 60 * 60 * 1000) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      // iOS: mostrar a los 4s
      const t = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(t)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 3000)
      }
      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [storageKey])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    dismiss()
  }

  function dismiss() {
    setShow(false)
    setShowIOSSteps(false)
    localStorage.setItem(`pwa-dismissed-${storageKey}`, Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 animate-slide-in-up sm:hidden">
      <div className="bg-[#0a1628] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <img src="/favicon-cpb.png" alt="CPB" className="h-11 w-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{appName}</p>
            <p className="text-blue-300 text-[11px]">{appSubtitle}</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Beneficios */}
        <div className="px-4 pt-1 pb-3">
          <ul className="space-y-1 mb-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-white/70 text-xs">
                <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                {b}
              </li>
            ))}
          </ul>

          {/* Android */}
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="w-full py-2.5 rounded-xl bg-white text-[#0a1628] font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              Agregar a mi celular
            </button>
          )}

          {/* iOS: botón que despliega los pasos */}
          {isIOS && !showIOSSteps && (
            <button
              onClick={() => setShowIOSSteps(true)}
              className="w-full py-2.5 rounded-xl bg-white text-[#0a1628] font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              ¿Cómo instalar?
            </button>
          )}

          {/* iOS: pasos inline */}
          {isIOS && showIOSSteps && (
            <div className="space-y-2 mt-1">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">1</span>
                <p className="text-white/80 text-xs">
                  Tocá el botón{" "}
                  <svg className="inline h-4 w-4 text-blue-400 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>{" "}
                  de compartir (abajo del navegador)
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">2</span>
                <p className="text-white/80 text-xs">
                  Desplazá hacia abajo y tocá{" "}
                  <span className="font-semibold text-white">"Agregar a Inicio"</span>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">3</span>
                <p className="text-white/80 text-xs">
                  Confirmá tocando{" "}
                  <span className="font-semibold text-white">"Agregar"</span> arriba a la derecha
                </p>
              </div>
              <button
                onClick={dismiss}
                className="w-full py-2 rounded-xl bg-white/10 text-white/60 text-xs font-medium mt-1"
              >
                Entendido
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
