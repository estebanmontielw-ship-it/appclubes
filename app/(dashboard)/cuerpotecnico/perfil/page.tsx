"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"

export default function CTPerfilPage() {
  const [ct, setCt] = useState<any>(null)

  useEffect(() => {
    fetch("/api/ct/me").then(r => r.json()).then(data => setCt(data.ct)).catch(() => {})
  }, [])

  if (!ct) return <div className="py-12 text-center text-gray-400">Cargando...</div>

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" }) : "-"

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          {ct.fotoCarnetUrl ? (
            <img src={ct.fotoCarnetUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ct.nombre} {ct.apellido}</h2>
            <p className="text-sm text-gray-500">{ct.rol}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1"><p className="text-gray-500">Email</p><p className="font-medium break-all">{ct.email}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Teléfono</p><p className="font-medium">{ct.telefono}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Cédula</p><p className="font-medium">{ct.cedula}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Ciudad</p><p className="font-medium">{ct.ciudad}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Género</p><p className="font-medium">{ct.genero}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Nacionalidad</p><p className="font-medium">{ct.nacionalidad}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Fecha de nacimiento</p><p className="font-medium">{formatDate(ct.fechaNacimiento)}</p></div>
          <div className="space-y-1"><p className="text-gray-500">Registrado</p><p className="font-medium">{formatDate(ct.createdAt)}</p></div>
        </div>
      </div>

      <p className="text-xs text-gray-400">Para modificar tus datos contactá a cpb@cpb.com.py</p>
    </div>
  )
}
