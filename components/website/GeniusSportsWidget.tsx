"use client"

import { useEffect, useRef, useState } from "react"

interface GeniusSportsWidgetProps {
  page: string
  showNavBar?: boolean
  showCompetitionChooser?: boolean
  showMatchFilter?: boolean
  showTitle?: boolean
  showSubMenus?: boolean
  className?: string
}

let instanceCounter = 0

export default function GeniusSportsWidget({
  page,
  showNavBar = false,
  showCompetitionChooser = true,
  showMatchFilter = true,
  showTitle = true,
  showSubMenus = true,
  className,
}: GeniusSportsWidgetProps) {
  const [instanceId] = useState(() => `spil_w_${++instanceCounter}`)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up any previous instance
    const existingScripts = document.querySelectorAll('script[src*="geniussports.com/embed"]')
    existingScripts.forEach((s) => s.remove())

    // Clean window config
    delete (window as any).spilWHH

    // Set config on window
    ;(window as any).spilWHH = {
      placeHolder: instanceId,
      page,
      raw: true,
      showNavBar,
      showLinks: true,
      showTitle,
      showSubMenus,
      showLanguageChooser: false,
      showCompetitionChooser,
      showMatchFilter,
      rawEnableCSS: true,
      rawEnableJS: true,
      language: "es",
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const script = document.createElement("script")
      script.async = true
      script.src = "https://hosted.dcd.shared.geniussports.com/embed/?CPDB|spilWHH"
      document.body.appendChild(script)
    }, 100)

    return () => {
      clearTimeout(timer)
      // Cleanup scripts
      const scripts = document.querySelectorAll('script[src*="geniussports.com/embed"]')
      scripts.forEach((s) => s.remove())
      delete (window as any).spilWHH
      // Reset container
      if (containerRef.current) {
        containerRef.current.innerHTML = '<p style="padding: 2rem; color: #999; text-align: center;">Cargando datos...</p>'
      }
    }
  }, [page, instanceId, showNavBar, showCompetitionChooser, showMatchFilter, showTitle, showSubMenus])

  return (
    <div className={className}>
      <div id={instanceId} ref={containerRef} className="min-h-[500px]">
        <p className="py-8 text-gray-400 text-center">Cargando datos...</p>
      </div>
    </div>
  )
}
