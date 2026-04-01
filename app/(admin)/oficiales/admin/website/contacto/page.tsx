"use client"

import { useState, useEffect } from "react"
import { Mail, MailOpen, Trash2 } from "lucide-react"

export default function AdminContactoPage() {
  const [mensajes, setMensajes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    // We'll fetch directly from the DB via a simple API
    // For now, list messages (we'd need a GET endpoint for admin)
    fetch("/api/website/contacto", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMensajes(data.mensajes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mensajes de Contacto</h1>
        <p className="text-sm text-gray-500 mt-1">Mensajes recibidos del formulario de contacto</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : mensajes.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No hay mensajes recibidos</p>
          <p className="text-xs text-gray-400 mt-1">Los mensajes del formulario de contacto aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mensajes.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => setSelected(selected?.id === msg.id ? null : msg)}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 ${msg.leido ? "text-gray-300" : "text-primary"}`}>
                  {msg.leido ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${msg.leido ? "text-gray-600" : "font-semibold text-gray-900"}`}>{msg.asunto}</p>
                  </div>
                  <p className="text-xs text-gray-500">{msg.nombre} &lt;{msg.email}&gt; · {new Date(msg.createdAt).toLocaleDateString("es-PY")}</p>
                </div>
              </div>
              {selected?.id === msg.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.mensaje}</p>
                  {msg.telefono && <p className="text-xs text-gray-400 mt-2">Tel: {msg.telefono}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
