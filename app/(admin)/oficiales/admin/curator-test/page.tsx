"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Code2, Eye } from "lucide-react"
import SocialCarousel from "@/components/website/SocialCarousel"

export default function CuratorTestPage() {
  const [rawData, setRawData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  async function loadRaw() {
    setLoading(true)
    try {
      const res = await fetch("/api/curator/posts?limit=20")
      const data = await res.json()
      setRawData(data)
    } catch (e: any) {
      setRawData({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRaw()
  }, [])

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curator Test — Carrusel Nativo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prueba del widget nativo usando el endpoint público v1 de Curator (sin API key)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
          >
            {showDebug ? <Eye className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {showDebug ? "Vista previa" : "Ver JSON"}
          </button>
          <button
            onClick={loadRaw}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </button>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Feed ID</p>
            <p className="font-mono text-xs text-gray-700 mt-1 truncate">7d577115-2af2-45ac-b52b-3b583d452e4e</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Endpoint</p>
            <p className="font-mono text-xs text-gray-700 mt-1">api.curator.io/v1</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Posts recibidos</p>
            <p className="font-bold text-gray-900 mt-1">
              {rawData?.ok ? `${rawData.posts?.length || 0} posts` : rawData?.error ? "Error" : "Cargando..."}
            </p>
          </div>
        </div>
      </div>

      {/* Preview o Debug */}
      {showDebug ? (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-auto max-h-[70vh]">
          <pre className="text-xs font-mono">
            {rawData ? JSON.stringify(rawData, null, 2) : "Cargando..."}
          </pre>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Seguinos en Redes</h2>
            <p className="text-sm text-gray-500">Las últimas publicaciones de la CPB</p>
          </div>
          <SocialCarousel />
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">Cómo funciona:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
          <li>El backend llama a <code className="bg-blue-100 px-1 rounded">api.curator.io/v1/feeds/{"{id}"}/posts</code> (público, sin auth)</li>
          <li>Se cachea en memoria por 15 minutos para reducir llamadas</li>
          <li>Se normaliza la respuesta a un formato estándar</li>
          <li>El componente carrusel renderiza los posts con diseño custom</li>
        </ol>
        <p className="mt-3 text-xs">
          Si funciona bien acá, podemos reemplazar el CuratorFeed actual en la home por este carrusel.
        </p>
      </div>
    </div>
  )
}
