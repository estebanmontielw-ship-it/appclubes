"use client"

import { Bell } from "lucide-react"

export default function CTNotificacionesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notificaciones</h1>
      <p className="text-sm text-gray-500 mb-6">Mensajes y avisos de la CPB</p>

      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400">No tenés notificaciones</p>
        <p className="text-xs text-gray-400 mt-1">Las notificaciones aparecerán aquí cuando haya novedades</p>
      </div>
    </div>
  )
}
