"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  DollarSign, Plus, CheckCircle, Clock, TrendingUp,
  Pencil, Trash2, ChevronDown, ChevronUp, X, Loader2,
  CalendarDays, Trophy, Lightbulb,
} from "lucide-react"

// ─── CONSTANTES ──────────────────────────────────────────

const RAMAS = ["Masculino", "Femenino"]

const CATEGORIAS: { value: string; label: string }[] = [
  { value: "LNB",      label: "LNB — Liga Nacional Masc." },
  { value: "LNBF",     label: "LNBF — Liga Nacional Fem." },
  { value: "U22",      label: "Sub-22" },
  { value: "U19",      label: "Sub-19 (Masculino)" },
  { value: "U17",      label: "Sub-17" },
  { value: "U15",      label: "Sub-15" },
  { value: "U13",      label: "Sub-13" },
  { value: "ESPECIAL", label: "Especial / Amistoso" },
]

const ROLES: { value: string; label: string }[] = [
  { value: "ARBITRO", label: "Árbitro" },
  { value: "OFICIAL_MESA", label: "Oficial de Mesa" },
  { value: "ESTADISTICO", label: "Estadístico" },
  { value: "RELATOR", label: "Relator" },
]

// ─── TIPOS ───────────────────────────────────────────────

interface Registro {
  id: string
  fecha: string
  rama: string
  categoria: string
  equipoA: string
  equipoB: string
  rol: string
  fase: string | null
  faseNombre: string | null
  montoSugerido: number | null
  monto: number
  estado: string
  pagadoEn: string | null
  notas: string | null
}

interface Stats {
  totalAcumulado: number
  totalPendiente: number
  totalPagado: number
  countPendiente: number
  countPagado: number
  countTotal: number
}

interface FaseSugerida {
  fase: string
  faseNombre: string
  montosPorRol: Record<string, number>
}

// ─── HELPERS ─────────────────────────────────────────────

function gs(n: number) {
  return `Gs. ${Math.round(n).toLocaleString("es-PY")}`
}

function fmtFecha(iso: string) {
  // Extract date part directly — avoids UTC→local timezone shift (e.g. UTC midnight = prev day in PY)
  const datePart = iso.split("T")[0] // "2026-04-13"
  const [y, m, d] = datePart.split("-")
  return `${d}/${m}/${y}`
}

// Legacy mapping for categoria values stored before the category rename (PR #16)
const CAT_LEGACY: Record<string, string> = {
  PRIMERA_DIVISION: "Liga Nacional Masc. (LNB)",
  SEGUNDA_DIVISION: "2da División Masc.",
  U21: "Sub-22",
  U18: "Sub-17",
  U16: "Sub-15",
  U14: "Sub-13",
}

function catLabel(v: string) {
  return CATEGORIAS.find((c) => c.value === v)?.label ?? CAT_LEGACY[v] ?? v
}
function rolLabel(v: string) {
  return ROLES.find((r) => r.value === v)?.label ?? v
}

// ─── SUGERENCIAS DESDE DESIGNACIONES ─────────────────────

interface DesignacionSugerida {
  id: string
  rol: string
  partido: {
    fecha: string
    hora: string
    categoria: string
    equipoLocal: string
    equipoVisit: string
  }
}

function mapRolDesignacion(rol: string): string {
  if (["ARBITRO_PRINCIPAL", "ARBITRO_ASISTENTE_1", "ARBITRO_ASISTENTE_2"].includes(rol)) return "ARBITRO"
  if (["MESA_ANOTADOR", "MESA_CRONOMETRADOR", "MESA_OPERADOR_24S"].includes(rol)) return "OFICIAL_MESA"
  if (rol === "MESA_ASISTENTE") return "RELATOR"
  if (rol === "ESTADISTICO") return "ESTADISTICO"
  return ""
}

function mapCategoriaDesignacion(cat: string): { categoria: string; rama: string } {
  if (cat === "LNB")                  return { categoria: "LNB",      rama: "Masculino" }
  if (cat === "LNBF")                 return { categoria: "LNBF",     rama: "Femenino"  }
  if (cat === "U22")                  return { categoria: "U22",      rama: "Masculino" }
  if (cat === "U22F")                 return { categoria: "U22",      rama: "Femenino"  }
  if (cat === "U19")                  return { categoria: "U19",      rama: "Masculino" }
  if (cat === "U17")                  return { categoria: "U17",      rama: "Masculino" }
  if (cat === "U17F")                 return { categoria: "U17",      rama: "Femenino"  }
  if (cat === "U15")                  return { categoria: "U15",      rama: "Masculino" }
  if (cat === "U15F")                 return { categoria: "U15",      rama: "Femenino"  }
  if (cat === "U13")                  return { categoria: "U13",      rama: "Masculino" }
  if (cat === "U13F")                 return { categoria: "U13",      rama: "Femenino"  }
  // Legacy / alias
  if (cat === "U21" || cat === "U22_MASC") return { categoria: "U22", rama: "Masculino" }
  return { categoria: "", rama: "Masculino" }
}

function SugerenciasPanel({ onSelect }: { onSelect: (initial: Partial<FormData>) => void }) {
  const [designaciones, setDesignaciones] = useState<DesignacionSugerida[]>([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    fetch("/api/mis-partidos")
      .then((r) => r.json())
      .then((data) => {
        const hoy = new Date().toISOString().split("T")[0]
        const pasadas = ((data.designaciones ?? []) as DesignacionSugerida[])
          .filter((d) => d.partido.fecha.split("T")[0] <= hoy)
          .sort((a, b) => b.partido.fecha.localeCompare(a.partido.fecha))
          .slice(0, 6)
        setDesignaciones(pasadas)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || designaciones.length === 0) return null

  function handleSelect(d: DesignacionSugerida) {
    const { categoria, rama } = mapCategoriaDesignacion(d.partido.categoria)
    onSelect({
      fecha: d.partido.fecha.split("T")[0],
      rama,
      categoria,
      equipoA: d.partido.equipoLocal,
      equipoB: d.partido.equipoVisit,
      rol: mapRolDesignacion(d.rol),
    })
    setAbierto(false)
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Cargar desde mis designaciones</span>
          <span className="text-xs text-muted-foreground">({designaciones.length} recientes)</span>
        </div>
        {abierto
          ? <ChevronUp className="h-4 w-4 text-primary shrink-0" />
          : <ChevronDown className="h-4 w-4 text-primary shrink-0" />}
      </button>

      {abierto && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Tocá un partido para autocompletar el formulario. Podés editar antes de guardar.
          </p>
          {designaciones.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d)}
              className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {d.partido.equipoLocal} vs {d.partido.equipoVisit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fmtFecha(d.partido.fecha)}{d.partido.hora ? ` · ${d.partido.hora}` : ""} · {d.partido.categoria}
                </p>
              </div>
              <span className="text-xs font-medium text-primary shrink-0 bg-primary/10 px-2 py-1 rounded-md">
                Usar
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MONEY INPUT ─────────────────────────────────────────

function MoneyInput({
  value,
  onChange,
  className = "",
}: {
  value: string
  onChange: (raw: string) => void
  className?: string
}) {
  // Strip non-digits and format with dots (Guaraní style: 350.000)
  function formatGs(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    return Number(digits).toLocaleString("es-PY")
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "")
    onChange(raw)
  }

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">Gs.</span>
      <Input
        type="text"
        inputMode="numeric"
        value={formatGs(value)}
        onChange={handleChange}
        placeholder="0"
        className="pl-10 h-9"
      />
    </div>
  )
}

// ─── FORMULARIO (crear o editar) ──────────────────────────

interface FormData {
  fecha: string
  rama: string
  categoria: string
  equipoA: string
  equipoB: string
  rol: string
  fase: string
  faseNombre: string
  montoSugerido: number | null
  monto: string
  estado: string
  notas: string
}

const FORM_VACIO: FormData = {
  fecha: new Date().toISOString().split("T")[0],
  rama: "Masculino",
  categoria: "",
  equipoA: "",
  equipoB: "",
  rol: "",
  fase: "",
  faseNombre: "",
  montoSugerido: null,
  monto: "",
  estado: "PENDIENTE",
  notas: "",
}

function FormPartido({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<FormData>
  onSave: (data: FormData) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormData>({ ...FORM_VACIO, ...initial })
  const [fasesSugeridas, setFasesSugeridas] = useState<FaseSugerida[]>([])
  const [loadingFases, setLoadingFases] = useState(false)
  const [sugerido, setSugerido] = useState(false)

  const set = (k: keyof FormData, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }))

  // Cargar fases sugeridas cuando categoria+rama cambian
  useEffect(() => {
    const { categoria, rama } = form
    if (!categoria || !rama) { setFasesSugeridas([]); return }
    setLoadingFases(true)
    fetch(`/api/oficiales/aranceles-sugeridos?categoria=${categoria}&rama=${encodeURIComponent(rama)}`)
      .then((r) => r.json())
      .then((data) => setFasesSugeridas(data.fases ?? []))
      .catch(() => setFasesSugeridas([]))
      .finally(() => setLoadingFases(false))
  }, [form.categoria, form.rama])

  // Auto-sugerir monto cuando fase + rol están seleccionados
  useEffect(() => {
    const faseDatos = fasesSugeridas.find((f) => f.fase === form.fase)
    if (faseDatos && form.rol && faseDatos.montosPorRol[form.rol] != null) {
      const sugeridoMonto = faseDatos.montosPorRol[form.rol]
      setForm((f) => ({
        ...f,
        faseNombre: faseDatos.faseNombre,
        montoSugerido: sugeridoMonto,
        monto: String(sugeridoMonto),
      }))
      setSugerido(true)
    } else {
      setSugerido(false)
    }
  }, [form.fase, form.rol, fasesSugeridas])

  // Limpiar fase cuando categoria/rama cambian
  useEffect(() => {
    setForm((f) => ({ ...f, fase: "", faseNombre: "", montoSugerido: null }))
    setSugerido(false)
  }, [form.categoria, form.rama])

  const valid =
    form.fecha && form.rama && form.categoria &&
    form.equipoA.trim() && form.equipoB.trim() &&
    form.rol && Number(form.monto) > 0

  return (
    <div className="space-y-4">
      {/* Fecha */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Fecha del partido</Label>
        <Input
          type="date"
          value={form.fecha}
          onChange={(e) => set("fecha", e.target.value)}
          className="h-9 max-w-[200px]"
        />
      </div>

      {/* Rama */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Rama</Label>
        <div className="flex gap-2">
          {RAMAS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set("rama", r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.rama === r
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Categoría + Rol — en la misma fila */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Categoría</Label>
          <Select value={form.categoria} onValueChange={(v) => set("categoria", v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Seleccioná..." /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tu rol</Label>
          <Select value={form.rol} onValueChange={(v) => set("rol", v)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Seleccioná..." /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Equipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Equipo A (local)</Label>
          <Input
            value={form.equipoA}
            onChange={(e) => set("equipoA", e.target.value)}
            placeholder="Ej: Olimpia"
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Equipo B (visitante)</Label>
          <Input
            value={form.equipoB}
            onChange={(e) => set("equipoB", e.target.value)}
            placeholder="Ej: Libertad"
            className="h-9"
          />
        </div>
      </div>

      {/* Fase (solo si hay sugerencias disponibles) */}
      {fasesSugeridas.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Fase del torneo{" "}
            <span className="text-primary font-medium">(opcional — sugiere el arancel)</span>
          </Label>
          {loadingFases ? (
            <div className="h-9 flex items-center text-xs text-muted-foreground gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Cargando fases...
            </div>
          ) : (
            <Select value={form.fase} onValueChange={(v) => set("fase", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Elegí la fase para sugerir monto..." />
              </SelectTrigger>
              <SelectContent>
                {fasesSugeridas.map((f) => (
                  <SelectItem key={f.fase} value={f.fase}>{f.faseNombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Monto */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          Monto (Gs.)
          {sugerido && (
            <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
              <Lightbulb className="h-3 w-3" /> sugerido por sistema
            </span>
          )}
        </Label>
        <MoneyInput
          value={form.monto}
          onChange={(raw) => { set("monto", raw); setSugerido(false) }}
          className="max-w-[220px]"
        />
        {sugerido && form.montoSugerido && (
          <p className="text-xs text-muted-foreground mt-1">
            Arancel unitario LNB: {gs(form.montoSugerido)}. Podés editarlo libremente.
          </p>
        )}
      </div>

      {/* Estado */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Estado del cobro</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set("estado", "PENDIENTE")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.estado === "PENDIENTE"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <Clock className="h-4 w-4" /> Pendiente de cobro
          </button>
          <button
            type="button"
            onClick={() => set("estado", "PAGADO")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              form.estado === "PAGADO"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <CheckCircle className="h-4 w-4" /> Ya cobrado
          </button>
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</Label>
        <Input
          value={form.notas}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Observaciones, sede, etc."
          className="h-9"
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar partido
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── MODAL EDICIÓN ────────────────────────────────────────

function ModalEdicion({
  registro,
  onSave,
  onClose,
  saving,
}: {
  registro: Registro
  onSave: (data: FormData) => void
  onClose: () => void
  saving: boolean
}) {
  const initial: Partial<FormData> = {
    fecha: registro.fecha.split("T")[0],
    rama: registro.rama,
    categoria: registro.categoria,
    equipoA: registro.equipoA,
    equipoB: registro.equipoB,
    rol: registro.rol,
    fase: registro.fase ?? "",
    faseNombre: registro.faseNombre ?? "",
    montoSugerido: registro.montoSugerido,
    monto: String(registro.monto),
    estado: registro.estado,
    notas: registro.notas ?? "",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">Editar partido</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <FormPartido initial={initial} onSave={onSave} onCancel={onClose} saving={saving} />
      </div>
    </div>
  )
}

// ─── TAB: DASHBOARD ───────────────────────────────────────

function TabDashboard({
  stats,
  registros,
  onCargar,
  onMarcarPagado,
  marking,
}: {
  stats: Stats
  registros: Registro[]
  onCargar: () => void
  onMarcarPagado: (id: string) => void
  marking: string | null
}) {
  const recientes = registros.slice(0, 5)

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total acumulado</p>
                <p className="text-2xl font-bold mt-0.5">{gs(stats.totalAcumulado)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.countTotal} partido{stats.countTotal !== 1 ? "s" : ""}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{gs(stats.totalPendiente)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.countPendiente} partido{stats.countPendiente !== 1 ? "s" : ""}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total cobrado</p>
                <p className="text-2xl font-bold text-green-600 mt-0.5">{gs(stats.totalPagado)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.countPagado} partido{stats.countPagado !== 1 ? "s" : ""}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA cargar */}
      <button
        onClick={onCargar}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-4 w-4" /> Cargar nuevo partido
      </button>

      {/* Pendientes de cobrar */}
      {registros.filter((r) => r.estado === "PENDIENTE").length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Pendientes de cobro
          </p>
          <div className="space-y-2">
            {registros
              .filter((r) => r.estado === "PENDIENTE")
              .slice(0, 4)
              .map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.equipoA} vs {r.equipoB}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtFecha(r.fecha)} · {catLabel(r.categoria)} {r.rama} · {rolLabel(r.rol)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm">{gs(r.monto)}</span>
                      <button
                        onClick={() => onMarcarPagado(r.id)}
                        disabled={marking === r.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        {marking === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Cobrado
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Últimos partidos */}
      {recientes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Últimos registrados
          </p>
          <div className="space-y-1.5">
            {recientes.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.equipoA} vs {r.equipoB}</p>
                  <p className="text-xs text-muted-foreground">{fmtFecha(r.fecha)} · {rolLabel(r.rol)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold">{gs(r.monto)}</span>
                  <Badge variant={r.estado === "PAGADO" ? "success" : "warning"} className="text-[10px]">
                    {r.estado === "PAGADO" ? "Cobrado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {registros.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-medium">Todavía no cargaste partidos</p>
            <p className="text-sm mt-1">Usá el botón de arriba para registrar tu primer honorario</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── TAB: HISTORIAL ───────────────────────────────────────

function TabHistorial({
  registros,
  onEdit,
  onDelete,
  onMarcarPagado,
  onMarcarPendiente,
  deleting,
  marking,
}: {
  registros: Registro[]
  onEdit: (r: Registro) => void
  onDelete: (id: string) => void
  onMarcarPagado: (id: string) => void
  onMarcarPendiente: (id: string) => void
  deleting: string | null
  marking: string | null
}) {
  const [filtroEstado, setFiltroEstado] = useState<"TODOS" | "PENDIENTE" | "PAGADO">("TODOS")
  const [expandido, setExpandido] = useState<string | null>(null)

  const filtrados = filtroEstado === "TODOS" ? registros : registros.filter((r) => r.estado === filtroEstado)

  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p>No hay partidos registrados todavía</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["TODOS", "PENDIENTE", "PAGADO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filtroEstado === f
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f === "TODOS" ? "Todos" : f === "PENDIENTE" ? "Pendientes" : "Cobrados"}
            <span className="ml-1.5 text-[10px] opacity-70">
              ({f === "TODOS" ? registros.length : registros.filter((r) => r.estado === f).length})
            </span>
          </button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No hay registros con este filtro</p>
      )}

      <div className="space-y-2">
        {filtrados.map((r) => {
          const isOpen = expandido === r.id
          return (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Fila principal */}
                <button
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50/80 transition-colors"
                  onClick={() => setExpandido(isOpen ? null : r.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{r.equipoA} vs {r.equipoB}</p>
                      <Badge variant={r.estado === "PAGADO" ? "success" : "warning"} className="text-[10px]">
                        {r.estado === "PAGADO" ? "Cobrado" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />{fmtFecha(r.fecha)}
                      </span>
                      {" · "}{catLabel(r.categoria)} {r.rama}{" · "}{rolLabel(r.rol)}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-bold text-sm">{gs(r.monto)}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Panel expandido */}
                {isOpen && (
                  <div className="border-t bg-gray-50 px-4 pb-4 pt-3 space-y-3">
                    {r.faseNombre && (
                      <p className="text-xs text-muted-foreground">
                        Fase: <span className="font-medium text-gray-700">{r.faseNombre}</span>
                      </p>
                    )}
                    {r.montoSugerido && r.montoSugerido !== r.monto && (
                      <p className="text-xs text-muted-foreground">
                        Arancel sugerido: <span className="font-medium">{gs(r.montoSugerido)}</span>
                        {" · "}Cobrado: <span className="font-medium">{gs(r.monto)}</span>
                      </p>
                    )}
                    {r.notas && (
                      <p className="text-xs text-muted-foreground italic">"{r.notas}"</p>
                    )}
                    {r.pagadoEn && (
                      <p className="text-xs text-green-700">
                        Cobrado el {fmtFecha(r.pagadoEn)}
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      {r.estado === "PENDIENTE" ? (
                        <button
                          onClick={() => onMarcarPagado(r.id)}
                          disabled={marking === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {marking === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Marcar cobrado
                        </button>
                      ) : (
                        <button
                          onClick={() => onMarcarPendiente(r.id)}
                          disabled={marking === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {marking === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                          Marcar pendiente
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        disabled={deleting === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────

export default function MisHonorariosPage() {
  const { toast } = useToast()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [stats, setStats] = useState<Stats>({ totalAcumulado: 0, totalPendiente: 0, totalPagado: 0, countPendiente: 0, countPagado: 0, countTotal: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"dashboard" | "historial" | "cargar">("dashboard")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [formInitial, setFormInitial] = useState<Partial<FormData>>({})

  function handleApplyDesignacion(initial: Partial<FormData>) {
    setFormInitial(initial)
    setFormKey((k) => k + 1)
  }

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch("/api/oficiales/honorarios-propios")
      if (res.ok) {
        const data = await res.json()
        setRegistros(data.registros ?? [])
        setStats(data.stats ?? stats)
      }
    } catch {}
    finally { setLoading(false) }
  }, []) // eslint-disable-line

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleSave = async (form: FormData) => {
    setSaving(true)
    try {
      const url = editando
        ? `/api/oficiales/honorarios-propios/${editando.id}`
        : "/api/oficiales/honorarios-propios"
      const method = editando ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: form.fecha,
          rama: form.rama,
          categoria: form.categoria,
          equipoA: form.equipoA,
          equipoB: form.equipoB,
          rol: form.rol,
          fase: form.fase || null,
          faseNombre: form.faseNombre || null,
          montoSugerido: form.montoSugerido,
          monto: Number(form.monto),
          estado: form.estado,
          notas: form.notas || null,
        }),
      })
      if (res.ok) {
        toast({ title: editando ? "Partido actualizado" : "Partido guardado" })
        setEditando(null)
        setTab("historial")
        await cargarDatos()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: err.error || "Error al guardar" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de red" })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/oficiales/honorarios-propios/${id}`, { method: "DELETE" })
      if (res.ok) { toast({ title: "Registro eliminado" }); await cargarDatos() }
    } catch {}
    finally { setDeleting(null) }
  }

  const handleMarcarPagado = async (id: string) => {
    setMarking(id)
    try {
      const res = await fetch(`/api/oficiales/honorarios-propios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "marcar_pagado" }),
      })
      if (res.ok) { toast({ title: "Marcado como cobrado" }); await cargarDatos() }
    } catch {}
    finally { setMarking(null) }
  }

  const handleMarcarPendiente = async (id: string) => {
    setMarking(id)
    try {
      const res = await fetch(`/api/oficiales/honorarios-propios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "marcar_pendiente" }),
      })
      if (res.ok) { toast({ title: "Marcado como pendiente" }); await cargarDatos() }
    } catch {}
    finally { setMarking(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mis Honorarios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registrá tus partidos, controlá cuánto ganás y qué te deben.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-1">
        {([
          { key: "dashboard", label: "Dashboard" },
          { key: "historial", label: `Historial${registros.length > 0 ? ` (${registros.length})` : ""}` },
          { key: "cargar", label: "Cargar partido" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-[1px] ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      {tab === "dashboard" && (
        <TabDashboard
          stats={stats}
          registros={registros}
          onCargar={() => setTab("cargar")}
          onMarcarPagado={handleMarcarPagado}
          marking={marking}
        />
      )}

      {tab === "historial" && (
        <TabHistorial
          registros={registros}
          onEdit={(r) => { setEditando(r); }}
          onDelete={handleDelete}
          onMarcarPagado={handleMarcarPagado}
          onMarcarPendiente={handleMarcarPendiente}
          deleting={deleting}
          marking={marking}
        />
      )}

      {tab === "cargar" && (
        <div className="space-y-4">
          <SugerenciasPanel onSelect={handleApplyDesignacion} />
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Cargar nuevo partido
              </h2>
              <FormPartido
                key={formKey}
                initial={formInitial}
                onSave={handleSave}
                onCancel={() => setTab("dashboard")}
                saving={saving}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal edición */}
      {editando && (
        <ModalEdicion
          registro={editando}
          onSave={handleSave}
          onClose={() => setEditando(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
