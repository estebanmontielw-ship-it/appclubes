"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, CheckCircle, Clock, User, UserPlus } from "lucide-react"

const rolLabels: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

export default function VerificarCTPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState<any[]>([])
  const [preVerified, setPreVerified] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Debounced live search — triggers 300ms after the user stops typing
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setRegistered([])
      setPreVerified([])
      setSearched(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      // Cancel any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      fetch(`/api/ct/buscar?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setRegistered(data.registered || [])
          setPreVerified(data.preVerified || [])
          setSearched(true)
          setLoading(false)
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setRegistered([])
            setPreVerified([])
            setSearched(true)
            setLoading(false)
          }
        })
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificar Cuerpo Técnico</h1>
      <p className="text-sm text-gray-500 mb-6">Buscá por nombre, apellido o número de cédula</p>

      <div className="mb-6">
        <div className="relative">
          {loading ? (
            <Loader2 className="absolute left-3 top-3 h-5 w-5 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, apellido o CI..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            style={{ fontSize: "16px" }}
            autoFocus
          />
        </div>
      </div>

      {searched && !loading && (
        <div className="space-y-3">
          {/* Registered CT */}
          {registered.map((ct) => (
            <div key={ct.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                {ct.fotoCarnetUrl ? (
                  <img src={ct.fotoCarnetUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{ct.nombre} {ct.apellido}</h3>
                  <p className="text-sm text-gray-500">{rolLabels[ct.rol] || ct.rol}</p>
                  <p className="text-xs text-gray-400">CI: {ct.cedula} · {ct.ciudad}</p>
                </div>
                <div className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  ct.estadoHabilitacion === "HABILITADO" ? "bg-green-100 text-green-700" :
                  ct.estadoHabilitacion === "PENDIENTE" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {ct.estadoHabilitacion === "HABILITADO" ? (
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Habilitado</span>
                  ) : ct.estadoHabilitacion === "PENDIENTE" ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendiente</span>
                  ) : ct.estadoHabilitacion}
                </div>
              </div>

              {ct.estadoHabilitacion === "HABILITADO" && ct.qrToken && (
                <div className="mt-3 bg-gradient-to-br from-[#0a1628] to-[#132043] rounded-xl p-4 flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Carnet Digital</p>
                    <p className="font-bold text-sm">{ct.nombre} {ct.apellido}</p>
                    <p className="text-xs text-blue-300">{rolLabels[ct.rol] || ct.rol}</p>
                    <p className="text-green-400 text-xs font-semibold mt-1">HABILITADO</p>
                  </div>
                  <div className="bg-white rounded-lg p-1">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://cpb.com.py/verificar/${ct.qrToken}`)}`} alt="QR" className="w-16 h-16" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pre-verified (108 not registered yet) */}
          {preVerified.map((p, i) => (
            <div key={i} className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <UserPlus className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                  <p className="text-sm text-amber-700">Pre-registrado como {p.rol}</p>
                  <p className="text-xs text-amber-600 mt-0.5">Puede estar en la cancha pero debe registrarse en el portal</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  NO REGISTRADO
                </span>
              </div>
            </div>
          ))}

          {/* No results */}
          {registered.length === 0 && preVerified.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron resultados</p>
              <p className="text-xs text-gray-400 mt-1">Verificá el nombre o número de cédula</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
