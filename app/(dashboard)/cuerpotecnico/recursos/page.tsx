"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Video, Link as LinkIcon, Image } from "lucide-react"

const tipoIcons: Record<string, any> = {
  PDF: FileText,
  VIDEO: Video,
  LINK: LinkIcon,
  IMAGEN: Image,
}

export default function CTRecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/recursos")
      .then(r => r.json())
      .then(data => setRecursos(data.recursos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recursos</h1>
      <p className="text-sm text-gray-500 mb-6">Material de estudio gratuito de la CPB</p>

      {recursos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay recursos disponibles aún</p>
          <p className="text-xs text-gray-400 mt-1">Los recursos se irán agregando próximamente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recursos.map((r) => {
            const Icon = tipoIcons[r.tipo] || FileText
            return (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{r.titulo}</p>
                  {r.descripcion && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{r.descripcion}</p>}
                </div>
                <Download className="h-4 w-4 text-gray-400 group-hover:text-primary shrink-0" />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
