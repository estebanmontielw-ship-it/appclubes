"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if ((navigator as any).standalone === true) return

    // Show once per day
    const dismissed = localStorage.getItem("cpb-pwa-dismissed")
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 6000)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 4000)
      }
      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

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
    localStorage.setItem("cpb-pwa-dismissed", Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 z-40 animate-slide-in-up sm:hidden">
      <div className="bg-[#0a1628] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <img src="/favicon-cpb.png" alt="CPB" className="h-11 w-11 rounded-xl" />
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Acceso directo a la CPB</p>
            <p className="text-blue-300 text-[11px]">Abrí la app desde tu pantalla de inicio</p>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isIOS ? (
          <div className="px-4 pb-4 pt-1">
            <p className="text-white/60 text-xs mb-3">
              Agregá la app de la CPB a tu celular para acceder más rápido al calendario, posiciones y noticias sin abrir el navegador.
            </p>
            <button
              onClick={handleInstall}
              className="w-full py-2.5 rounded-xl bg-white text-[#0a1628] font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              Agregar a mi celular
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4 pt-1">
            <p className="text-white/60 text-xs mb-3">
              Agregá la app de la CPB a tu iPhone para acceder más rápido:
            </p>
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">1</span>
                <p className="text-white/80 text-xs">
                  Tocá el botón <span className="inline-block">
                    <svg className="inline h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span> de compartir (abajo del navegador)
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">2</span>
                <p className="text-white/80 text-xs">
                  Buscá <span className="font-semibold text-white">&quot;Agregar a Inicio&quot;</span> y confirmá
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
