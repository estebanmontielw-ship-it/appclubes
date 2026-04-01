"use client"

import { useEffect, useRef } from "react"

export default function GeniusSportsHomeWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L = {}

    const style = document.createElement("style")
    style.id = "home-widget-styles"
    style.textContent = `
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L {
        font-family: 'Source Sans 3', sans-serif !important;
      }

      /* Hide branding */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="branding"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="powered"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="logo-container"] {
        display: none !important;
      }

      /* Main table */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L table {
        width: 100% !important;
        border-collapse: separate !important;
        border-spacing: 0 6px !important;
      }

      /* All table rows - card style */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L tr {
        background: #f8fafc !important;
        border-radius: 16px !important;
        transition: all 0.25s ease !important;
        border: none !important;
      }

      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L tr:hover {
        background: #f1f5f9 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
      }

      /* Cells */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L td,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L th {
        padding: 14px 16px !important;
        border: none !important;
        vertical-align: middle !important;
      }

      /* Team logos - bigger */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L img {
        width: 44px !important;
        height: 44px !important;
        object-fit: contain !important;
        border-radius: 10px !important;
        background: white !important;
        padding: 2px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
      }

      /* Team names - bigger and bolder */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L a,
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="team"] {
        color: #0f172a !important;
        font-weight: 700 !important;
        font-size: 15px !important;
        text-decoration: none !important;
      }

      /* Competition name - LNB APERTURA 2026 */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="competition"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="header"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="title"] {
        font-family: 'Bebas Neue', sans-serif !important;
        font-size: 13px !important;
        letter-spacing: 1.5px !important;
        color: #2563eb !important;
      }

      /* "Próximo" → style as "Ver más" button */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="status"] {
        font-size: 0px !important;
        background: #2563eb !important;
        padding: 6px 14px !important;
        border-radius: 8px !important;
        display: inline-block !important;
        cursor: pointer !important;
        transition: background 0.2s !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="status"]::after {
        content: "Ver más" !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        color: white !important;
        letter-spacing: 0.5px !important;
      }
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="status"]:hover {
        background: #1d4ed8 !important;
      }

      /* Date */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="date"] {
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #334155 !important;
      }

      /* Time */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="time"] {
        font-family: 'Bebas Neue', sans-serif !important;
        font-size: 20px !important;
        color: #0f172a !important;
        letter-spacing: 1px !important;
      }

      /* Score */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="score"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="result"] {
        font-family: 'Bebas Neue', sans-serif !important;
        font-size: 28px !important;
        color: #0f172a !important;
      }

      /* Hide PRÓXIMO button on the right (redundant) */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="button"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="btn"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L input[type="button"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L button {
        display: none !important;
      }

      /* Make entire row clickeable */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L tr {
        cursor: pointer !important;
      }

      /* Venue/Pista info */
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="venue"],
      #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="pista"] {
        font-size: 11px !important;
        color: #94a3b8 !important;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L td,
        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L th {
          padding: 10px 8px !important;
        }

        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L img {
          width: 36px !important;
          height: 36px !important;
        }

        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L a,
        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="team"] {
          font-size: 13px !important;
        }

        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L [class*="time"] {
          font-size: 16px !important;
        }

        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L button,
        #spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L input[type="button"] {
          padding: 6px 12px !important;
          font-size: 10px !important;
        }
      }
    `
    document.head.appendChild(style)

    const script = document.createElement("script")
    script.async = true
    script.src = "https://widget.wh.geniussports.com/widget/?LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
    document.body.appendChild(script)

    // Make rows clickeable - click anywhere triggers the button
    const observer = new MutationObserver(() => {
      const container = document.getElementById("spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L")
      if (!container) return
      const rows = container.querySelectorAll("tr")
      rows.forEach((row) => {
        if (row.dataset.clickable) return
        row.dataset.clickable = "true"
        row.addEventListener("click", (e) => {
          const target = e.target as HTMLElement
          if (target.tagName === "A" || target.tagName === "BUTTON" || target.tagName === "INPUT") return
          const btn = row.querySelector("button, input[type='button'], a[class*='btn'], a[class*='button']") as HTMLElement
          if (btn) btn.click()
        })
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (document.body.contains(script)) document.body.removeChild(script)
      const existingStyle = document.getElementById("home-widget-styles")
      if (existingStyle) existingStyle.remove()
      delete (window as any).spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L
    }
  }, [])

  return (
    <div className="max-h-[600px] overflow-y-auto rounded-2xl">
      <div
        id="spw_LILUXVQFU4GM9DOWMOJH6D75T3Y33L"
        ref={containerRef}
        className="min-h-[200px]"
      />
    </div>
  )
}
