"use client"

import { useEffect, useRef } from "react"

export default function MatchTicker() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set widget config
    ;(window as any).spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M = {}

    // Load widget script
    const script = document.createElement("script")
    script.async = true
    script.src = "https://widget.wh.geniussports.com/widget/?VMITW7QLE90YMYLHAGF6OKKQ6UJG3M"
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
      delete (window as any).spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M
    }
  }, [])

  return (
    <div className="bg-[#0a1628] border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div
          id="spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M"
          ref={containerRef}
        />
      </div>
    </div>
  )
}
