"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, X, Calendar, Trophy, BarChart3, Newspaper, Shield, Users, FileText, Building2, Mail, UserPlus } from "lucide-react"

const quickLinks = [
  { label: "Calendario de partidos", href: "/calendario", icon: Calendar, keywords: ["partido", "calendario", "fixture", "fecha", "juego", "juega", "cuando", "horario", "programacion"] },
  { label: "Tabla de posiciones", href: "/posiciones", icon: Trophy, keywords: ["posicion", "tabla", "clasificacion", "standing", "puntaje", "puesto", "primero"] },
  { label: "Estadísticas de jugadores", href: "/estadisticas", icon: BarChart3, keywords: ["estadistica", "stat", "goleador", "puntos", "rebote", "asistencia", "jugador"] },
  { label: "Noticias", href: "/noticias", icon: Newspaper, keywords: ["noticia", "novedad", "articulo", "nuevo", "ultima"] },
  { label: "Clubes afiliados", href: "/clubes", icon: Shield, keywords: ["club", "equipo", "afiliado", "olimpia", "cerro", "guarani", "libertad"] },
  { label: "Selecciones nacionales", href: "/selecciones", icon: Users, keywords: ["seleccion", "nacional", "seleccionado", "paraguaya", "paraguay"] },
  { label: "Reglamentos", href: "/reglamentos", icon: FileText, keywords: ["reglamento", "regla", "norma", "documento", "fiba", "estatuto"] },
  { label: "Institucional - Sobre la CPB", href: "/institucional", icon: Building2, keywords: ["institucional", "cpb", "confederacion", "historia", "autoridad", "sobre"] },
  { label: "Contacto", href: "/contacto", icon: Mail, keywords: ["contacto", "email", "telefono", "direccion", "mensaje", "escribir"] },
  { label: "Registrarse como oficial", href: "/oficiales/registro", icon: UserPlus, keywords: ["registr", "arbitro", "oficial", "mesa", "inscrib"] },
]

export default function SmartSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ url: string; mensaje: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Filter quick links based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return quickLinks
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return quickLinks.filter((link) =>
      link.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
      link.keywords.some((kw) => q.includes(kw) || kw.includes(q))
    )
  }, [query])

  // Auto-search with AI after typing stops
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setAiResult(null)

    if (query.trim().length < 5 || filtered.length > 0) return

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: query, tipo: "buscar" }),
        })
        const { result } = await res.json()
        if (result?.url) setAiResult(result)
      } catch {}
      setLoading(false)
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, filtered.length])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
    setQuery("")
    setAiResult(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-white/80 hover:bg-white/10 lg:text-gray-500 lg:hover:bg-gray-100 lg:hover:text-gray-700 transition-colors"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              {loading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="flex-1 text-base outline-none placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setAiResult(null) }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {/* AI result */}
              {aiResult && (
                <button
                  onClick={() => navigate(aiResult.url)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-primary/5 transition-colors text-left border-b border-gray-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Search className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{aiResult.mensaje}</p>
                    <p className="text-xs text-violet-600">Sugerencia de IA</p>
                  </div>
                </button>
              )}

              {/* Quick links */}
              {filtered.map((link) => (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <link.icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-700">{link.label}</p>
                </button>
              ))}

              {filtered.length === 0 && !aiResult && !loading && query.trim().length > 0 && (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">
                  Buscando con IA...
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              Buscador inteligente con IA
            </div>
          </div>
        </div>
      )}
    </>
  )
}
