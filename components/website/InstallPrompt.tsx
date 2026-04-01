"use client"

import { useState, useEffect } from "react"
import { Download, X, Share } from "lucide-react"

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Only show on mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // Don't show if user dismissed before
    const dismissed = localStorage.getItem("cpb-install-dismissed")
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // Android: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 5000)
    }
    window.addEventListener("beforeinstallprompt", handler)

    // iOS: show after delay
    if (ios) {
      setTimeout(() => setShow(true), 8000)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
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
    localStorage.setItem("cpb-install-dismissed", Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 animate-slide-in-up sm:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {isIOS ? (
          // iOS instructions
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Instalá la app de CPB</p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">1</span>
                    Tocá el botón <Share className="h-3.5 w-3.5 text-primary inline" /> de compartir
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">2</span>
                    Seleccioná &quot;Agregar a inicio&quot;
                  </p>
                </div>
              </div>
              <button onClick={dismiss} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // Android install button
          <div className="p-4 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Instalá la app de CPB</p>
              <p className="text-xs text-gray-500">Acceso rápido desde tu pantalla</p>
            </div>
            <button
              onClick={handleInstall}
              className="px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 shrink-0"
            >
              Instalar
            </button>
            <button onClick={dismiss} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
