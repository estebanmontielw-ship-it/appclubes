"use client"

import { useEffect, useRef } from "react"

interface GeniusSportsWidgetProps {
  page: string
  showNavBar?: boolean
  showCompetitionChooser?: boolean
  showMatchFilter?: boolean
  showTitle?: boolean
  showSubMenus?: boolean
  className?: string
}

export default function GeniusSportsWidget({
  page,
  showNavBar = false,
  showCompetitionChooser = true,
  showMatchFilter = true,
  showTitle = true,
  showSubMenus = true,
  className,
}: GeniusSportsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    // Set config on window
    ;(window as any).spilWHH = {
      placeHolder: "spil_w_h",
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

    // Create and inject script
    const script = document.createElement("script")
    script.async = true
    script.src = "https://hosted.dcd.shared.geniussports.com/embed/?CPDB|spilWHH"
    document.body.appendChild(script)
    scriptRef.current = script

    return () => {
      // Cleanup
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current)
      }
      // Clean up container content
      if (containerRef.current) {
        containerRef.current.innerHTML = '<div class="hs-loader" style="text-align: center"><p style="padding: 2rem; color: #999;">Cargando...</p></div>'
      }
      // Clean up window config
      delete (window as any).spilWHH
    }
  }, [page, showNavBar, showCompetitionChooser, showMatchFilter, showTitle, showSubMenus])

  return (
    <div className={className}>
      <div id="spil_w_h" ref={containerRef} className="min-h-[500px]">
        <div className="hs-loader" style={{ textAlign: "center" }}>
          <p className="py-8 text-gray-400">Cargando datos...</p>
        </div>
      </div>
    </div>
  )
}
