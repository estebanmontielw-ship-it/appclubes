"use client"

import { useEffect, useRef } from "react"

export default function Torneo3x3Page() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const s = document.createElement("script")
    s.src = "https://play.fiba3x3.com/embed.js"
    s.setAttribute("data-fiba-embedtype", "results")
    s.setAttribute("data-fiba-eventid", "1df65c77-d14f-4592-a03d-609fdc9a5a93")
    s.async = true
    containerRef.current.appendChild(s)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Competencias</p>
        <h1 className="text-3xl font-black text-gray-900">Torneo 3x3 CPB 2026</h1>
        <p className="text-gray-500 mt-1">Fixture, grupos y resultados en tiempo real</p>
      </div>

      {/* FIBA 3x3 embed */}
      <div ref={containerRef} className="min-h-[400px]" />

      <p className="text-center text-xs text-gray-400 mt-8">
        Resultados provistos por{" "}
        <a
          href="https://play.fiba3x3.com/events/1df65c77-d14f-4592-a03d-609fdc9a5a93/schedule"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          fiba3x3.com
        </a>
      </p>
    </div>
  )
}
