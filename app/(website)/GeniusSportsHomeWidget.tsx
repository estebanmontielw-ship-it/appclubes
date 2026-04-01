"use client"

import { useEffect, useRef } from "react"

export default function GeniusSportsHomeWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L = {}

    // Inject custom styles
    const style = document.createElement("style")
    style.id = "home-widget-styles"
    style.textContent = `
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L {
        font-family: 'Source Sans 3', sans-serif;
      }

      /* Hide branding */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="branding"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="powered"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="logo-container"] {
        display: none !important;
      }

      /* Container */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L > div,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 0 8px !important;
      }

      /* Competition header */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="competition"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="header"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="title"] {
        font-family: 'Bebas Neue', sans-serif !important;
        font-size: 14px !important;
        letter-spacing: 1px !important;
        color: #2563eb !important;
        padding: 4px 0 !important;
      }

      /* Match rows */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L tr,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="match"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="game"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="fixture"] {
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
        margin-bottom: 8px !important;
        overflow: hidden !important;
        border: 1px solid #f1f5f9 !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      }

      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L tr:hover,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="match"]:hover,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="game"]:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
      }

      /* Team names */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="team"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L a {
        color: #0f172a !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        text-decoration: none !important;
      }

      /* Team logos */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L img {
        border-radius: 8px !important;
        width: 36px !important;
        height: 36px !important;
        object-fit: contain !important;
      }

      /* Date/time */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="date"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="time"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="status"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="venue"] {
        color: #64748b !important;
        font-size: 12px !important;
      }

      /* Score */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="score"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="result"] {
        font-family: 'Bebas Neue', sans-serif !important;
        font-size: 22px !important;
        color: #0f172a !important;
      }

      /* Buttons/links */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="button"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="btn"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="preview"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="PREVIA"] {
        background: #2563eb !important;
        color: white !important;
        border-radius: 8px !important;
        padding: 6px 16px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        border: none !important;
      }

      /* Bottom bar per match */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="footer"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="bottom"] {
        background: #f8fafc !important;
        border-top: 1px solid #f1f5f9 !important;
        padding: 6px 12px !important;
      }

      /* Cells padding */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L td,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L th {
        padding: 10px 12px !important;
        border: none !important;
      }

      /* Scrollbar inside widget */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L ::-webkit-scrollbar {
        width: 6px;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
    `
    document.head.appendChild(style)

    const script = document.createElement("script")
    script.async = true
    script.src = "https://widget.wh.geniussports.com/widget/?LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
      const existingStyle = document.getElementById("home-widget-styles")
      if (existingStyle) existingStyle.remove()
      delete (window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L
    }
  }, [])

  return (
    <div className="max-h-[600px] overflow-y-auto rounded-2xl border border-gray-100">
      <div
        id="spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
        ref={containerRef}
        className="min-h-[200px]"
      />
    </div>
  )
}
