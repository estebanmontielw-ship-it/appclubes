"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft, CheckCircle, AlertCircle, Search, X,
  Loader2, User, MapPin, Clock, Save, Check, ChevronDown,
  Trash2, History,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────

interface Oficial {
  id: string
  nombre: string
  apellido: string
  nombreCompleto: string
  cedula: string
  fotoCarnetUrl: string | null
  ciudad: string
  roles: string[]
}

interface Posicion {
  campo: string
  label: string
  userId: string | null
  nombre: string | null
  required: boolean
  rolFilter: string
}

interface Log {
  id: string
  accion: string
  campo: string | null
  valorAnteriorNombre: string | null
  valorNuevoNombre: string | null
  cambiadoPorNombre: string
  cambiadoEn: string
}

interface Planilla {
  id: string
  matchId: string
  fecha: string
  horaStr: string
  equipoLocal: string
  equipoVisit: string
  cancha: string | null
  estado: string
  ccId: string | null; ccNombre: string | null
  a1Id: string | null; a1Nombre: string | null
  a2Id: string | null; a2Nombre: string | null
  apId: string | null; apNombre: string | null
  cronId: string | null; cronNombre: string | null
  lanzId: string | null; lanzNombre: string | null
  estaId: string | null; estaNombre: string | null
  relaId: string | null; relaNombre: string | null
  obs: string | null
  confirmadaEn: string | null
  confirmadoPorNombre: string | null
  logs: Log[]
}

const POSICIONES: Omit<Posicion, "userId" | "nombre">[] = [
  { campo: "cc", label: "Crew Chief", required: true, rolFilter: "ARBITRO" },
  { campo: "a1", label: "Auxiliar 1", required: true, rolFilter: "ARBITRO" },
  { campo: "a2", label: "Auxiliar 2 (opcional)", required: false, rolFilter: "ARBITRO" },
  { campo: "ap", label: "Apuntador", required: true, rolFilter: "MESA" },
  { campo: "cron", label: "Cronómetro", required: true, rolFilter: "MESA" },
  { campo: "lanz", label: "Lanzamiento 24s", required: true, rolFilter: "MESA" },
  { campo: "esta", label: "Estadístico (opcional)", required: false, rolFilter: "MESA" },
  { campo: "rela", label: "Relator (opcional)", required: false, rolFilter: "MESA" },
]

// ─── OfficialPicker ──────────────────────────────────────────

function OfficialPicker({
  campo, label, required, rolFilter,
  value, onChange, disabled,
}: {
  campo: string
  label: string
  required: boolean
  rolFilter: string
  value: { userId: string | null; nombre: string | null }
  onChange: (v: { userId: string | null; nombre: string | null }) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Oficial[]>([])
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/designaciones/oficiales?q=${encodeURIComponent(q)}&rol=${rolFilter}`)
        const data = await res.json()
        setResults(data.oficiales || [])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [q, open, rolFilter])

  const select = (o: Oficial) => {
    onChange({ userId: o.id, nombre: o.nombreCompleto })
    setOpen(false)
    setQ("")
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ userId: null, nombre: null })
  }

  return (
    <div className="relative">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
          value.userId
            ? "border-primary/30 bg-primary/5"
            : "border-gray-200 bg-white hover:border-gray-300"
        } disabled:opacity-50`}
      >
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          value.userId ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
        }`}>
          {value.userId ? (value.nombre?.charAt(0) || "?") : <User className="h-4 w-4" />}
        </div>
        <span className={`flex-1 text-sm font-medium truncate ${value.userId ? "text-gray-900" : "text-gray-400"}`}>
          {value.nombre || "Tocar para asignar..."}
        </span>
        {value.userId && !disabled ? (
          <button onClick={clear} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-300" />
        )}
      </button>

      {/* Dropdown modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-3 pb-3" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col z-10"
            style={{ maxHeight: "min(75dvh, 75vh)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b border-gray-100 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={`Buscar ${label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 shrink-0" />}
                {q.length > 0 && !searching && (
                  <button onClick={() => setQ("")} className="text-gray-300 hover:text-gray-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {results.length === 0 && !searching ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  {q.length < 2 ? "Escribí al menos 2 letras para buscar" : "Sin resultados"}
                </p>
              ) : (
                results.map(o => (
                  <button
                    key={o.id}
                    onClick={() => select(o)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {o.nombre.charAt(0)}{o.apellido.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{o.nombreCompleto}</p>
                      <p className="text-xs text-gray-400">{o.cedula} · {o.ciudad}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {o.roles.slice(0, 2).map(r => (
                        <span key={r} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{r}</span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────

export default function PlanillaPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [planilla, setPlanilla] = useState<Planilla | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [desconfirmando, setDesconfirmando] = useState(false)
  const [showDesconfirmarSheet, setShowDesconfirmarSheet] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [obs, setObs] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local positions state: { campo → { userId, nombre } }
  const [posiciones, setPosiciones] = useState<Record<string, { userId: string | null; nombre: string | null }>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/designaciones/${id}`)
      const data = await res.json()
      if (data.planilla) {
        const p = data.planilla as Planilla
        setPlanilla(p)
        setObs(p.obs || "")
        const pos: Record<string, { userId: string | null; nombre: string | null }> = {}
        for (const { campo } of POSICIONES) {
          pos[campo] = {
            userId: (p as any)[`${campo}Id`] || null,
            nombre: (p as any)[`${campo}Nombre`] || null,
          }
        }
        setPosiciones(pos)
        setDirty({})
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  function onChangePosicion(campo: string, val: { userId: string | null; nombre: string | null }) {
    setPosiciones(prev => ({ ...prev, [campo]: val }))
    setDirty(prev => ({ ...prev, [campo]: true }))
    setError(null)
  }

  const hasDirty = Object.values(dirty).some(Boolean) || (planilla && obs !== (planilla.obs || ""))

  async function guardar() {
    if (!hasDirty) return
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, any> = {}
      for (const campo of Object.keys(dirty)) {
        if (dirty[campo]) body[campo] = posiciones[campo]
      }
      if (obs !== (planilla?.obs || "")) body.obs = obs

      const res = await fetch(`/api/designaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al guardar")
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function desconfirmar(limpiar: boolean) {
    setShowDesconfirmarSheet(false)
    setDesconfirmando(true)
    setError(null)
    try {
      const res = await fetch(`/api/designaciones/${id}/desconfirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limpiar }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al des-confirmar")
      } else {
        router.refresh()
        await load()
      }
    } finally {
      setDesconfirmando(false)
    }
  }

  async function confirmar() {
    // Validate required locally first
    const missingLabels = POSICIONES
      .filter(p => p.required && !posiciones[p.campo]?.userId)
      .map(p => p.label)

    if (missingLabels.length > 0) {
      setError(`Faltan: ${missingLabels.join(", ")}`)
      return
    }

    // Save dirty changes first
    if (hasDirty) await guardar()

    setConfirmando(true)
    setError(null)
    try {
      const res = await fetch(`/api/designaciones/${id}/confirmar`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al confirmar")
      } else {
        router.refresh() // Invalidate list page cache
        await load()
      }
    } finally {
      setConfirmando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!planilla) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400">Planilla no encontrada</p>
        <button onClick={() => router.back()} className="mt-4 text-primary text-sm font-medium">
          Volver
        </button>
      </div>
    )
  }

  const isConfirmada = planilla.estado === "CONFIRMADA"

  const fechaDisplay = planilla.fecha
    ? new Date(planilla.fecha).toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "long" })
    : ""

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Match header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-primary">{planilla.horaStr.slice(0, 5)}</span>
              <span className="text-xs text-gray-400 capitalize">{fechaDisplay}</span>
            </div>
            <p className="font-bold text-gray-900">{planilla.equipoLocal}</p>
            <p className="text-xs text-gray-400 my-0.5">vs</p>
            <p className="font-bold text-gray-900">{planilla.equipoVisit}</p>
            {planilla.cancha && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <MapPin className="h-3 w-3" />
                {planilla.cancha}
              </p>
            )}
          </div>
          <div>
            {isConfirmada ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Confirmada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" /> Borrador
              </span>
            )}
          </div>
        </div>

        {isConfirmada && planilla.confirmadaEn && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
            Confirmada por <strong className="text-gray-600">{planilla.confirmadoPorNombre}</strong> el{" "}
            {new Date(planilla.confirmadaEn).toLocaleDateString("es-PY")}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Árbitros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Árbitros</p>
        <div className="space-y-4">
          {POSICIONES.filter(p => ["cc", "a1", "a2"].includes(p.campo)).map(p => (
            <OfficialPicker
              key={p.campo}
              {...p}
              value={posiciones[p.campo] || { userId: null, nombre: null }}
              onChange={val => onChangePosicion(p.campo, val)}
              disabled={isConfirmada}
            />
          ))}
        </div>
      </div>

      {/* Mesa */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Mesa de Control</p>
        <div className="space-y-4">
          {POSICIONES.filter(p => ["ap", "cron", "lanz", "esta", "rela"].includes(p.campo)).map(p => (
            <OfficialPicker
              key={p.campo}
              {...p}
              value={posiciones[p.campo] || { userId: null, nombre: null }}
              onChange={val => onChangePosicion(p.campo, val)}
              disabled={isConfirmada}
            />
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Observaciones</p>
        <textarea
          value={obs}
          onChange={e => { setObs(e.target.value); setError(null) }}
          disabled={isConfirmada}
          rows={3}
          placeholder="Notas internas..."
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 disabled:bg-gray-50"
        />
      </div>

      {/* Audit log */}
      {planilla.logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 mb-3 overflow-hidden">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              Historial de cambios ({planilla.logs.length})
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showLogs ? "rotate-180" : ""}`} />
          </button>
          {showLogs && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {planilla.logs.map(log => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-700">{log.cambiadoPorNombre}</span>
                      {log.campo && (
                        <span className="text-xs text-gray-400"> · {log.campo}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(log.cambiadoEn).toLocaleString("es-PY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {(log.valorAnteriorNombre || log.valorNuevoNombre) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.valorAnteriorNombre && <span className="line-through text-red-400">{log.valorAnteriorNombre}</span>}
                      {log.valorAnteriorNombre && log.valorNuevoNombre && " → "}
                      {log.valorNuevoNombre && <span className="text-green-600">{log.valorNuevoNombre}</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-white border-t border-gray-100 p-4 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3 pr-14 md:pr-0">
          {isConfirmada ? (
            <button
              onClick={() => setShowDesconfirmarSheet(true)}
              disabled={desconfirmando}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {desconfirmando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {desconfirmando ? "Revirtiendo..." : "Volver a borrador"}
            </button>
          ) : (
            <>
              {hasDirty && (
                <button
                  onClick={guardar}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Guardando..." : saveSuccess ? "Guardado" : "Guardar"}
                </button>
              )}
              <button
                onClick={confirmar}
                disabled={confirmando || saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                {confirmando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {confirmando ? "Confirmando..." : "Confirmar planilla"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desconfirmar bottom sheet */}
      {showDesconfirmarSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDesconfirmarSheet(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-6 pb-10 space-y-4">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <p className="text-base font-semibold text-gray-900 text-center">Volver a borrador</p>
            <p className="text-sm text-gray-500 text-center">
              Los oficiales dejarán de ver este partido en Mis Partidos.<br />
              ¿Querés mantener los nombres asignados o limpiar todo?
            </p>
            <button
              onClick={() => desconfirmar(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-semibold text-sm hover:bg-orange-100 transition-colors"
            >
              Mantener nombres y editar
            </button>
            <button
              onClick={() => desconfirmar(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar todos los nombres
            </button>
            <button
              onClick={() => setShowDesconfirmarSheet(false)}
              className="w-full py-3 text-sm text-gray-500 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
