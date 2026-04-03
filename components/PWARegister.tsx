"use client"

import { useEffect, useState } from "react"

const VISIT_KEY = "cpb_pwa_visits"
const DISMISSED_KEY = "cpb_pwa_dismissed_at"
const SHOW_EVERY = 10 // mostrar cada N visitas en iOS

function isMobile() {
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  )
}

export default function PWARegister() {
  const [showIOSBanner, setShowIOSBanner] = useState(false)

  useEffect(() => {
    // Registrar SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Solo mobile
    if (!isMobile()) return

    // iOS: lógica de popup cada 10 visitas
    if (isIOS()) {
      if (isStandalone()) return // ya está instalada, nunca mostrar

      const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0") + 1
      localStorage.setItem(VISIT_KEY, String(visits))

      const lastDismissed = parseInt(localStorage.getItem(DISMISSED_KEY) || "0")
      const dismissedRecently = visits - lastDismissed < SHOW_EVERY

      if (visits % SHOW_EVERY === 0 && !dismissedRecently) {
        setTimeout(() => setShowIOSBanner(true), 2000)
      }
    }
  }, [])

  const handleDismiss = () => {
    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0")
    localStorage.setItem(DISMISSED_KEY, String(visits))
    setShowIOSBanner(false)
  }

  if (!showIOSBanner) return null

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: "16px 20px 32px",
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)",
      borderTop: "1px solid #e5e7eb",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
      borderRadius: "20px 20px 0 0",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <img src="/favicon-cpb.png" width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} alt="CPB" />
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#111827" }}>Instalá la app CPB</p>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          Tocá <strong>Compartir</strong> <span style={{ fontSize: 15 }}>⬆️</span> y luego <strong>"Agregar a inicio"</strong> para acceder más rápido.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          fontSize: 20,
          color: "#9ca3af",
          cursor: "pointer",
          padding: "0 4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}
