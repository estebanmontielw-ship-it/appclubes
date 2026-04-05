"use client"

import { useState } from "react"
import { Search, Loader2, CheckCircle, Clock, UserPlus, CreditCard, User, QrCode } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || query.trim().length < 2) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/ct/buscar?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setRegistered(data.registered || [])
      setPreVerified(data.preVerified || [])
    } catch {
      setRegistered([])
      setPreVerified([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl text-gray-900">Verificar Cuerpo Técnico</h1>
        <p className="text-gray-500 mt-2">Buscá por nombre, apellido o número de cédula</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, apellido o CI..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              style={{ fontSize: "16px" }}
            />
          </div>
          <button type="submit" disabled={loading || query.trim().length < 2}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 shrink-0">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-4">
          {/* Registered members */}
          {registered.map((ct) => (
            <div key={ct.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {ct.fotoCarnetUrl ? (
                    <img src={ct.fotoCarnetUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{ct.nombre} {ct.apellido}</h3>
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

                {/* Carnet preview for habilitados */}
                {ct.estadoHabilitacion === "HABILITADO" && ct.qrToken && (
                  <div className="mt-4 bg-gradient-to-br from-[#0a1628] to-[#132043] rounded-xl p-4 flex items-center justify-between">
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
            </div>
          ))}

          {/* Pre-verified (not yet registered) */}
          {preVerified.map((p, i) => (
            <div key={i} className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <UserPlus className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                  <p className="text-sm text-amber-700">Pre-registrado como {p.rol}</p>
                  <p className="text-xs text-amber-600 mt-1">Debe completar su registro en el portal</p>
                </div>
              </div>
              <Link href="/cuerpotecnico/registro"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700">
                <UserPlus className="h-4 w-4" /> Registrarse ahora
              </Link>
            </div>
          ))}

          {/* No results */}
          {registered.length === 0 && preVerified.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No se encontraron resultados</p>
              <p className="text-sm text-gray-400 mt-1">Verificá el nombre o número de cédula</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl inline-block">
                <p className="text-xs text-gray-500 mb-2">¿Todavía no estás registrado?</p>
                <Link href="/cuerpotecnico/registro"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90">
                  <UserPlus className="h-4 w-4" /> Registrarse
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
