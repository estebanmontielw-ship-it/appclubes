"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle, ChevronLeft, Save, AlertCircle, User, Search, UserPlus } from "lucide-react"

interface Jugador {
  id: string
  nombre: string
  posicion: number
  fechaNac: string | null
  nroCi: string | null
  celular: string | null
  camiseta: string | null
}

interface Equipo {
  id: string
  nombre: string
  ciudad: string | null
  categoria: string
  jugadores: Jugador[]
}

type Categoria = "Femenino Open" | "Masculino Open"

function hasRealName(j: Jugador) {
  return !!(j.nombre && !j.nombre.includes("sin registrar"))
}

function isComplete(j: Jugador) {
  return !!(hasRealName(j) && j.fechaNac && j.nroCi && j.celular && j.camiseta)
}

function isPlaceholder(j: Jugador) {
  return j.nombre.includes("sin registrar") || j.id.startsWith("new-")
}

function completosCount(equipo: Equipo) {
  return equipo.jugadores.filter(isComplete).length
}

function statusColor(equipo: Equipo) {
  const c = completosCount(equipo)
  if (c >= 3) return "bg-green-500"
  if (c >= 1) return "bg-yellow-400"
  return "bg-red-400"
}

// ─── Team Detail View ────────────────────────────────────
function EquipoView({
  equipo,
  onBack,
}: {
  equipo: Equipo
  onBack: (updated: Equipo) => void
}) {
  const [jugadoresList, setJugadoresList] = useState<Jugador[]>(equipo.jugadores)
  const [forms, setForms] = useState<Record<string, Jugador>>(() => {
    const init: Record<string, Jugador> = {}
    for (const j of equipo.jugadores) init[j.id] = { ...j }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function setField(jId: string, field: keyof Jugador, val: string) {
    setForms(f => ({ ...f, [jId]: { ...f[jId], [field]: val } }))
    setSaved(false)
  }

  function addJugador() {
    const newId = `new-${Date.now()}`
    const posicion = jugadoresList.length + 1
    const newJ: Jugador = { id: newId, nombre: "", posicion, fechaNac: null, nroCi: null, celular: null, camiseta: null }
    setJugadoresList(prev => [...prev, newJ])
    setForms(f => ({ ...f, [newId]: newJ }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      type SaveResult = { oldId: string; newJugador: Jugador } | null

      const operations: Promise<SaveResult>[] = jugadoresList.map(jOrig => {
        const j = forms[jOrig.id] || jOrig

        if (j.id.startsWith("new-")) {
          if (!j.nombre?.trim()) return Promise.resolve(null)
          return fetch(`/api/torneo3x3/equipos/${equipo.id}/jugadores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: j.nombre.trim(),
              posicion: j.posicion,
              fechaNac: j.fechaNac || null,
              nroCi: j.nroCi || null,
              celular: j.celular || null,
              camiseta: j.camiseta || null,
            }),
          })
            .then(r => r.json())
            .then(data => ({ oldId: j.id, newJugador: data.jugador } as SaveResult))
        } else {
          const body: Record<string, string | null | undefined> = {
            fechaNac: j.fechaNac || null,
            nroCi: j.nroCi || null,
            celular: j.celular || null,
            camiseta: j.camiseta || null,
          }
          if (isPlaceholder(jOrig) && j.nombre?.trim()) {
            body.nombre = j.nombre.trim()
          }
          return fetch(`/api/torneo3x3/jugadores/${j.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(() => null)
        }
      })

      const results = await Promise.allSettled(operations)
      const failed = results.filter(r => r.status === "rejected").length

      if (failed > 0) {
        setError(`${failed} jugador(es) no se pudieron guardar. Intentá de nuevo.`)
      } else {
        // Replace temp IDs with real server IDs for newly created players
        let finalList = [...jugadoresList]
        let finalForms = { ...forms }

        for (const r of results) {
          if (r.status === "fulfilled" && r.value?.oldId && r.value?.newJugador) {
            const { oldId, newJugador } = r.value
            const formData = finalForms[oldId]
            finalList = finalList.map(j =>
              j.id === oldId ? { ...formData, id: newJugador.id } : j
            )
            finalForms[newJugador.id] = { ...formData, id: newJugador.id }
            delete finalForms[oldId]
          }
        }

        setSaved(true)
        const updatedJugadores = finalList.map(j => finalForms[j.id] || j)
        onBack({ ...equipo, jugadores: updatedJugadores })
      }
    } catch {
      setError("Error de conexión. Verificá tu internet e intentá de nuevo.")
    }
    setSaving(false)
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1"

  const completados = Object.values(forms).filter(isComplete).length
  const totalReales = jugadoresList.filter(j => hasRealName(forms[j.id] || j)).length
  const canAddMore = jugadoresList.length < 4

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => {
              const updatedJugadores = jugadoresList.map(j => forms[j.id] || j)
              onBack({ ...equipo, jugadores: updatedJugadores })
            }}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors -ml-2"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{equipo.nombre}</h1>
            <p className="text-xs text-gray-500">{equipo.ciudad} · {equipo.categoria}</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white ${
            completados >= 3 ? "bg-green-500" : completados >= 1 ? "bg-yellow-500" : "bg-red-400"
          }`}>
            {completados}/{totalReales}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          Completá los datos de cada jugador. El <strong>4to jugador es opcional</strong>. Tené a mano la cédula de identidad de cada uno.
        </p>

        {jugadoresList.map((jOrig, idx) => {
          const j = forms[jOrig.id] || jOrig
          const completo = isComplete(j)
          const editable = isPlaceholder(jOrig)
          const esOpcional = jOrig.posicion === 4

          return (
            <div key={jOrig.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Player header */}
              <div className={`px-4 py-3 flex items-center gap-3 border-b border-gray-50 ${completo ? "bg-green-50" : "bg-gray-50"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  completo ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {completo ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {editable ? (
                    <input
                      type="text"
                      placeholder="Apellido, Nombre *"
                      value={j.nombre.includes("sin registrar") ? "" : j.nombre}
                      onChange={e => setField(jOrig.id, "nombre", e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-transparent border-0 border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 pb-0.5 placeholder:font-normal placeholder:text-gray-400"
                    />
                  ) : (
                    <p className="font-semibold text-sm text-gray-900 truncate">{jOrig.nombre}</p>
                  )}
                  {esOpcional && (
                    <span className="text-[10px] text-gray-400 font-medium">Opcional</span>
                  )}
                </div>
                {completo && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Completo ✓
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    value={j.fechaNac || ""}
                    onChange={e => setField(jOrig.id, "fechaNac", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nro de CI *</label>
                  <input
                    type="text"
                    placeholder="Ej: 4523687"
                    value={j.nroCi || ""}
                    onChange={e => setField(jOrig.id, "nroCi", e.target.value)}
                    className={inputCls}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className={labelCls}>Camiseta *</label>
                  <input
                    type="number"
                    placeholder="Nro"
                    value={j.camiseta || ""}
                    onChange={e => setField(jOrig.id, "camiseta", e.target.value)}
                    className={inputCls}
                    min={0}
                    max={99}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Celular *</label>
                  <input
                    type="tel"
                    placeholder="Ej: 0981 234 567"
                    value={j.celular || ""}
                    onChange={e => setField(jOrig.id, "celular", e.target.value)}
                    className={inputCls}
                    inputMode="tel"
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* Add player button */}
        {canAddMore && (
          <button
            onClick={addJugador}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Agregar jugador {jugadoresList.length + 1 <= 4 ? `(${jugadoresList.length + 1}°)` : ""}
          </button>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-700 font-medium">¡Datos guardados correctamente!</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar datos del equipo
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Podés volver a esta página para editar los datos si cometiste algún error.
        </p>
      </div>
    </div>
  )
}

// ─── Team List View ──────────────────────────────────────
function TeamList({
  equipos,
  onSelect,
}: {
  equipos: Equipo[]
  onSelect: (e: Equipo) => void
}) {
  if (equipos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <User className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No hay equipos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {equipos.map(e => {
        const c = completosCount(e)
        const total = e.jugadores.filter(hasRealName).length
        const listo = c >= 3

        return (
          <button
            key={e.id}
            onClick={() => onSelect(e)}
            className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm active:bg-gray-50 transition-all text-left"
          >
            {/* Status dot */}
            <div className={`h-3 w-3 rounded-full shrink-0 ${statusColor(e)}`} />

            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{e.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">{e.ciudad || "—"}</p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                listo
                  ? "bg-green-100 text-green-700"
                  : c === 0
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {c}/{total} completos
              </span>
              {listo && (
                <span className="text-[10px] text-green-600 font-semibold">✓ Listo</span>
              )}
            </div>
            <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180 shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────
export default function Torneo3x3Page() {
  const [categoria, setCategoria] = useState<Categoria>("Masculino Open")
  const [equiposMasc, setEquiposMasc] = useState<Equipo[]>([])
  const [equiposFem, setEquiposFem] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Equipo | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rM, rF] = await Promise.all([
        fetch("/api/torneo3x3?categoria=Masculino+Open").then(r => r.json()),
        fetch("/api/torneo3x3?categoria=Femenino+Open").then(r => r.json()),
      ])
      setEquiposMasc(rM.equipos || [])
      setEquiposFem(rF.equipos || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const equiposBase = categoria === "Masculino Open" ? equiposMasc : equiposFem
  const equipos = busqueda.trim()
    ? equiposBase.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()))
    : equiposBase

  function handleBack(updated: Equipo) {
    const setter = updated.categoria === "Masculino Open" ? setEquiposMasc : setEquiposFem
    setter(prev => prev.map(e => e.id === updated.id ? updated : e))
    setSelected(null)
  }

  if (selected) {
    return <EquipoView equipo={selected} onBack={handleBack} />
  }

  const mascListos = equiposMasc.filter(e => completosCount(e) >= 3).length
  const femListos  = equiposFem.filter(e => completosCount(e) >= 3).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-lg">3</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Torneo 3x3 CPB</h1>
              <p className="text-xs text-gray-500">Registro de jugadores · 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Instructions */}
        <div className="bg-blue-600 text-white rounded-2xl p-4">
          <p className="font-bold text-sm mb-1">Instrucciones para delegados</p>
          <ol className="text-xs text-blue-100 space-y-1 list-decimal list-inside">
            <li>Elegí tu rama (Masculino / Femenino)</li>
            <li>Buscá tu equipo en la lista</li>
            <li>Completá los datos de cada jugador</li>
            <li>Hacé click en "Guardar"</li>
          </ol>
        </div>

        {/* Category tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
          {(["Masculino Open", "Femenino Open"] as Categoria[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoria(cat); setBusqueda("") }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                categoria === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat === "Masculino Open" ? (
                <>♂ Masculino{!loading && ` (${mascListos}/${equiposMasc.length})`}</>
              ) : (
                <>♀ Femenino{!loading && ` (${femListos}/${equiposFem.length})`}</>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            autoComplete="off"
          />
        </div>

        {/* Team list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TeamList equipos={equipos} onSelect={setSelected} />
        )}

        <p className="text-center text-xs text-gray-400 pb-8">
          Torneo 3x3 · Confederación Paraguaya de Básquetbol
        </p>
      </div>
    </div>
  )
}
