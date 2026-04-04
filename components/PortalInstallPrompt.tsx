"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"

interface PortalInstallPromptProps {
  portalName: string
  portalDesc: string
}

export default function PortalInstallPrompt({ portalName, portalDesc }: PortalInstallPromptProps) {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if ((navigator as any).standalone === true) return

    // Show once per day per portal
    const key = `cpb-pwa-${portalName.toLowerCase().replace(/\s/g, "-")}`
    const dismissed = localStorage.getItem(key)
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 5000)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 3000)
      }
      window.addEventListener("beforeinstallprompt", handler)
      return () => window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [portalName])

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
    const key = `cpb-pwa-${portalName.toLowerCase().replace(/\s/g, "-")}`
    localStorage.setItem(key, Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Download className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Acceso directo a {portalName}</p>
        <p className="text-xs text-gray-500">{portalDesc}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!isIOS ? (
          <button onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90">
            Agregar
          </button>
        ) : (
          <button onClick={() => {
            alert("Para agregar:\n1. Tocá el botón de compartir (📤) abajo\n2. Seleccioná \"Agregar a Inicio\"")
            dismiss()
          }}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90">
            Cómo agregar
          </button>
        )}
        <button onClick={dismiss} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
