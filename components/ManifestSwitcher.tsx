"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ManifestSwitcher() {
  const pathname = usePathname()

  useEffect(() => {
    let manifestUrl = "/manifest.json" // default: public site

    if (pathname.startsWith("/oficiales/admin")) {
      manifestUrl = "/manifest-admin.json"
    } else if (pathname.startsWith("/oficiales")) {
      manifestUrl = "/manifest-oficiales.json"
    } else if (pathname.startsWith("/cuerpotecnico")) {
      manifestUrl = "/manifest-ct.json"
    }

    // Update or create manifest link
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (link) {
      link.href = manifestUrl
    } else {
      link = document.createElement("link")
      link.rel = "manifest"
      link.href = manifestUrl
      document.head.appendChild(link)
    }
  }, [pathname])

  return null
}
