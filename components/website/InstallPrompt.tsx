"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return

    // Don't show if user dismissed before (check localStorage)
    const dismissed = localStorage.getItem("cpb-install-dismissed")
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    // Listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Small delay so it doesn't appear immediately
      setTimeout(() => setShow(true), 5000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // For iOS (no beforeinstallprompt), show after delay if Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIOS && isSafari) {
      setTimeout(() => setShow(true), 8000)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShow(false)
      }
      setDeferredPrompt(null)
    } else {
      // iOS - show instructions
      alert("Para instalar:\n1. Tocá el botón de compartir (📤)\n2. Seleccioná \"Agregar a pantalla de inicio\"")
    }
    dismiss()
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem("cpb-install-dismissed", Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-slide-in-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Instalá la app de CPB</p>
          <p className="text-xs text-gray-500 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
