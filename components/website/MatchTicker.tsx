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

    // Add custom styles to override widget appearance
    const style = document.createElement("style")
    style.id = "match-ticker-styles"
    style.textContent = `
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M {
        background: #0a1628 !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M * {
        border-color: rgba(255,255,255,0.1) !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M .spw-header,
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M .spw-branding,
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M .spw-logo,
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="branding"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="logo-container"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="powered"] {
        display: none !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M .spw-container,
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="container"] {
        background: #0a1628 !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="match"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="card"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="game"] {
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 8px !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="team-name"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="teamname"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M a {
        color: #ffffff !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="date"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="time"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="status"] {
        color: rgba(255,255,255,0.6) !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="competition"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="league"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="title"] {
        color: #60a5fa !important;
        font-size: 10px !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="footer-bar"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="bottom"] {
        background: #2563eb !important;
        border-radius: 0 0 8px 8px !important;
      }
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="arrow"],
      #spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M [class*="nav"] button {
        color: white !important;
        background: rgba(255,255,255,0.1) !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
      const existingStyle = document.getElementById("match-ticker-styles")
      if (existingStyle) existingStyle.remove()
      delete (window as any).spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M
    }
  }, [])

  return (
    <div className="bg-[#0a1628] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div
          id="spw_VMITW7QLE90YMYLHAGF6OKKQ6UJG3M"
          ref={containerRef}
        />
      </div>
    </div>
  )
}
