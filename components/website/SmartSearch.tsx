"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, X } from "lucide-react"

export default function SmartSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, tipo: "buscar" }),
      })

      const { result } = await res.json()

      if (result?.url) {
        setMessage(result.mensaje || "Redirigiendo...")
        setTimeout(() => {
          router.push(result.url)
          setOpen(false)
          setQuery("")
          setMessage("")
        }, 800)
      }
    } catch {
      setMessage("No pude procesar tu búsqueda. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Search button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Buscar"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Search modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch}>
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
                  placeholder="¿Qué estás buscando? Ej: partidos de esta semana..."
                  className="flex-1 text-base outline-none placeholder:text-gray-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>

            {message && (
              <div className="px-5 py-3 text-sm text-primary bg-primary/5">
                {message}
              </div>
            )}

            <div className="px-5 py-3 text-xs text-gray-400">
              Buscador inteligente con IA — Escribí lo que necesitás en tus palabras
            </div>
          </div>
        </div>
      )}
    </>
  )
}
