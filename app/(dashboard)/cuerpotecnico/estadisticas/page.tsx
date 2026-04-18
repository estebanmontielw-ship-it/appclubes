"use client"

import { ExternalLink, BarChart3 } from "lucide-react"

export default function EstadisticasPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estadísticas LNB
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Promedios, box scores, líderes y rendimientos individuales de la temporada
          </p>
        </div>
        <a
          href="/estadisticas"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir en pestaña nueva
        </a>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
        <iframe
          src="/estadisticas"
          className="w-full h-full"
          title="Estadísticas LNB"
          loading="lazy"
        />
      </div>

      <a
        href="/estadisticas"
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-primary shrink-0"
      >
        <ExternalLink className="h-4 w-4" />
        Abrir en pestaña nueva
      </a>
    </div>
  )
}
