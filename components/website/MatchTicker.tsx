"use client"

import { useEffect, useRef } from "react"

export default function MatchTicker() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set widget config
    ;(window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L = {}

    // Load widget script
    const script = document.createElement("script")
    script.async = true
    script.src = "https://widget.wh.geniussports.com/widget/?LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
    document.body.appendChild(script)

    // Add custom styles to override widget appearance
    const style = document.createElement("style")
    style.id = "match-ticker-styles"
    style.textContent = `
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L {
        background: #0a1628 !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L * {
        border-color: rgba(255,255,255,0.1) !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L .spw-header,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L .spw-branding,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L .spw-logo,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="branding"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="logo-container"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="powered"] {
        display: none !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L .spw-container,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="container"] {
        background: #0a1628 !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="match"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="card"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="game"] {
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 8px !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="team-name"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="teamname"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L a {
        color: #ffffff !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="date"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="time"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="status"] {
        color: rgba(255,255,255,0.6) !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="competition"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="league"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="title"] {
        color: #60a5fa !important;
        font-size: 10px !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="footer-bar"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="bottom"] {
        background: #2563eb !important;
        border-radius: 0 0 8px 8px !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="arrow"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="nav"] button {
        color: white !important;
        background: rgba(255,255,255,0.1) !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
      const existingStyle = document.getElementById("match-ticker-styles")
      if (existingStyle) existingStyle.remove()
      delete (window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L
    }
  }, [])

  return (
    <div className="bg-[#0a1628] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div
          id="spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
          ref={containerRef}
        />
      </div>
    </div>
  )
}
