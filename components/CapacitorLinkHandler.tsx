"use client"

import { useEffect } from "react"

/**
 * Intercepts target="_blank" links and window.open() calls on iOS Capacitor.
 * WKWebView can't open new windows, so they fall through to Safari.
 * - Same-origin URLs → navigate in the same WebView
 * - External URLs    → App.openUrl() (opens Safari as a controlled action)
 */
export default function CapacitorLinkHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const cap = (window as any).Capacitor
    if (!cap?.isNativePlatform?.() || cap.getPlatform() !== "ios") return

    const openUrl = (href: string) => {
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin === window.location.origin) {
          window.location.href = href
        } else {
          cap.Plugins?.App?.openUrl({ url: href })
        }
      } catch {
        window.location.href = href
      }
    }

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest('a[target="_blank"]') as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute("href")
      if (!href || href.startsWith("#")) return
      e.preventDefault()
      e.stopPropagation()
      openUrl(href)
    }

    const originalOpen = window.open.bind(window)
    window.open = (url?: string | URL, target?: string, features?: string) => {
      if (url) {
        openUrl(url.toString())
        return null
      }
      return originalOpen(url, target, features)
    }

    document.addEventListener("click", handleClick, true)
    return () => {
      document.removeEventListener("click", handleClick, true)
      window.open = originalOpen
    }
  }, [])

  return null
}
