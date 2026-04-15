"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

// ─── TIPOS ───────────────────────────────────────────────

interface RolFase {
  rol: string
  montoUnitario: number
  cantPersonas: number
  esManual: boolean
  subtotal: number | null
}

interface Fase {
  fase: string
  faseNombre: string
  roles: RolFase[]
  netoCalculable: number
  tieneManual: boolean
}

// ─── HELPERS ─────────────────────────────────────────────

const ROL_LABELS: Record<string, string> = {
  ARBITRO:       "Árbitro",
  ARBITRO_NAC:   "Árbitro Nacional",
  ARBITRO_INTL:  "Árbitro Internacional",
  OFICIAL_MESA:  "Oficial de Mesa",
  AUXILIAR:      "Auxiliar (Of. de Mesa)",
  ESTADISTICO:   "Estadístico",
  RELATOR:       "Relator",
}

function gs(n: number) {
  return `Gs. ${Math.round(n).toLocaleString("es-PY")}`
}

function calcular(neto: number, feriado: boolean, transporte: number) {
  const iva     = Math.round(neto * 0.1)
  const cIVA    = neto + iva
  const baseFin = feriado ? Math.round(cIVA * 1.5) : cIVA
  const total   = baseFin + transporte
  return { iva, cIVA, baseFin, total }
}

// ─── CATEGORÍAS ──────────────────────────────────────────

const CATEGORIAS_CALC = [
  { value: "LNB",     label: "LNB — Liga Nacional",   hasMasc: true,  hasFem: false, tieneTransporte: false },
  { value: "LNBF",    label: "LNBF — Liga Nacional",  hasMasc: false, hasFem: true,  tieneTransporte: false },
  { value: "U22",     label: "Sub-22",                hasMasc: true,  hasFem: true,  tieneTransporte: false },
  { value: "U19",     label: "Sub-19",                hasMasc: true,  hasFem: false, tieneTransporte: true  },
  { value: "U17",     label: "Sub-17",                hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "U15",     label: "Sub-15",                hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "U13",     label: "Sub-13",                hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "ESPECIAL",label: "Especial / Amistoso",   hasMasc: true,  hasFem: true,  tieneTransporte: false },
]

const RAMAS = ["Masculino", "Femenino"] as const

// LNB_MASC groups for phase selection
const FASE_GRUPOS = [
  { key: "etapa1",    label: "Etapa 1",              sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_ETAPA1_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_ETAPA1_INT" }] },
  { key: "comuneros", label: "Comuneros",             sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_COMUNEROS_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_COMUNEROS_INT" }] },
  { key: "final_com", label: "Final Comuneros",       sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_COM" }] },
  { key: "top4",      label: "Top 4",                 sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_TOP4_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_TOP4_INT" }, { k: "EXT", label: "Internacional", faseKey: "LNB_TOP4_EXT" }] },
  { key: "final_t4",  label: "Final Top 4",           sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_TOP4" }] },
  { key: "final_ext", label: "Final — Internacional", sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_EXT" }] },
]

// ─── CALCULADORA ─────────────────────────────────────────

// Strip "— Asunción" suffix from phase names in dropdown (sede buttons handle the distinction)
function cleanFaseNombre(nombre: string) {
  return nombre.replace(/\s*—\s*Asunción\s*$/i, "").trim()
}

function Calculadora({ fases, esLnbMasc, tieneTransporte }: {
  fases: Fase[]
  esLnbMasc: boolean
  tieneTransporte: boolean
}) {
  const [grupoKey,   setGrupoKey]   = useState("etapa1")
  const [sedeKey,    setSedeKey]    = useState("ASU")
  const [faseSimple, setFaseSimple] = useState(fases[0]?.fase ?? "")
  const [feriado,    setFeriado]    = useState(false)
  const [transporte, setTransporte] = useState(0)

  useEffect(() => {
    setGrupoKey("etapa1")
    setSedeKey("ASU")
    setFaseSimple(fases[0]?.fase ?? "")
    setFeriado(false)
    setTransporte(0)
  }, [fases])

  const grupo      = FASE_GRUPOS.find((g) => g.key === grupoKey) ?? FASE_GRUPOS[0]
  const sedeValida = grupo.sedes.find((s) => s.k === sedeKey) ? sedeKey : grupo.sedes[0].k
  const sede       = grupo.sedes.find((s) => s.k === sedeValida) ?? grupo.sedes[0]
  const faseLnb    = fases.find((f) => f.fase === sede.faseKey)
  const faseSimpleObj = fases.find((f) => f.fase === faseSimple)
  const fase = esLnbMasc ? faseLnb : faseSimpleObj

  // Interior phases have their own higher rates — transport buttons don't apply
  const esInterior = !esLnbMasc && faseSimple.includes("INTERIOR")

  // Auto-reset transport when switching to/from interior phases
  useEffect(() => {
    if (esInterior) setTransporte(0)
  }, [esInterior])

  if (!fase) return null

  const transporteEfectivo = esInterior ? 0 : transporte
  const { iva, cIVA, baseFin, total } = calcular(fase.netoCalculable, feriado, transporteEfectivo)
  const tieneSedes = esLnbMasc && grupo.sedes.length > 1

  function handleGrupo(key: string) {
    setGrupoKey(key)
    const g = FASE_GRUPOS.find((g) => g.key === key)
    setSedeKey(g?.sedes[0].k ?? "UNICA")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calculadora de honorarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Fase selector */}
        {esLnbMasc ? (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fase del torneo</Label>
            <Select value={grupoKey} onValueChange={handleGrupo}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FASE_GRUPOS.map((g) => (
                  <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fase del torneo</Label>
            <Select value={faseSimple} onValueChange={setFaseSimple}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fases.map((f) => (
                  <SelectItem key={f.fase} value={f.fase}>
                    {cleanFaseNombre(f.faseNombre)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sede (LNB interior) */}
        {tieneSedes && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Sede</Label>
            <div className="flex gap-2 flex-wrap">
              {grupo.sedes.map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSedeKey(s.k)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    sedeValida === s.k
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plus transporte (solo Inferiores, no aplica en fases de Interior) */}
        {tieneTransporte && !esInterior && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Sede / Plus transporte <span className="text-gray-400 font-normal">(área metropolitana)</span>
            </Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { label: "Asunción", plus: 0 },
                { label: "Luque  +60k", plus: 60000 },
                { label: "Capiatá  +80k", plus: 80000 },
              ] as const).map((opt) => (
                <button
                  key={opt.plus}
                  onClick={() => setTransporte(opt.plus)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    transporte === opt.plus
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info: Interior tiene tarifas propias */}
        {tieneTransporte && esInterior && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
            <span className="text-amber-500 text-xs mt-0.5">ℹ</span>
            <p className="text-xs text-amber-700">
              Las fases de <strong>Interior</strong> ya incluyen tarifas de viaje. El plus transporte del área metropolitana no aplica.
            </p>
          </div>
        )}

        {/* Condición */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Condición</Label>
          <button
            onClick={() => setFeriado((f) => !f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              feriado
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {feriado ? "Feriado / Suspendido (+50%)" : "Día normal"}
          </button>
        </div>

        {/* Desglose */}
        <div className="border-t pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
            Desglose — {fase.faseNombre}
          </p>
          <div className="space-y-0">
            <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wide text-gray-400 pb-2 border-b">
              <span>Rol</span>
              <span className="text-center">Cant.</span>
              <span className="text-right">Unitario</span>
              <span className="text-right">Subtotal</span>
            </div>
            {fase.roles.map((r) => (
              <div key={r.rol} className="grid grid-cols-4 py-2.5 border-b border-gray-50 text-sm items-center">
                <span className="font-medium text-gray-800">{ROL_LABELS[r.rol] ?? r.rol}</span>
                <span className="text-center text-gray-500">{r.esManual ? "—" : r.cantPersonas}</span>
                <span className="text-right text-gray-600">{r.esManual ? "a cotiz." : gs(r.montoUnitario)}</span>
                <span className={`text-right font-bold ${r.esManual ? "text-amber-600 text-xs" : "text-gray-900"}`}>
                  {r.esManual ? "manual" : gs(r.subtotal ?? 0)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Neto calculable</span>
              <span className="font-semibold">{gs(fase.netoCalculable)}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>IVA 10%</span>
              <span className="font-semibold">{gs(iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
              <span>Total con IVA</span>
              <span>{gs(cIVA)}</span>
            </div>
            {feriado && (
              <div className="flex justify-between text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-semibold">Feriado ×1.5</span>
                <span className="font-bold">{gs(baseFin)}</span>
              </div>
            )}
            {transporteEfectivo > 0 && (
              <div className="flex justify-between text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-semibold">Plus transporte</span>
                <span className="font-bold">+ {gs(transporteEfectivo)}</span>
              </div>
            )}
            {(feriado || transporteEfectivo > 0) && (
              <div className="flex justify-between font-black text-base bg-gray-900 text-white px-4 py-3 rounded-xl mt-2">
                <span>TOTAL FINAL</span>
                <span>{gs(total)}</span>
              </div>
            )}
          </div>

          {fase.tieneManual && (
            <p className="text-xs text-amber-600 mt-3">
              * Árbitro internacional/extranjero a cotización — cargar manualmente.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── PÁGINA ──────────────────────────────────────────────

export default function CalculadoraOficialesPage() {
  const [rama,     setRama]     = useState<"Masculino" | "Femenino">("Masculino")
  const [categoria, setCategoria] = useState("LNB")
  const [fases,    setFases]    = useState<Fase[]>([])
  const [loading,  setLoading]  = useState(true)

  const categoriasVisibles = CATEGORIAS_CALC.filter((c) =>
    rama === "Femenino" ? c.hasFem : c.hasMasc
  )
  const catObj = CATEGORIAS_CALC.find((c) => c.value === categoria)
  const catValida = rama === "Femenino" ? catObj?.hasFem : catObj?.hasMasc
  const tieneTransporte = catObj?.tieneTransporte ?? false
  const esLnbMasc = categoria === "LNB" && rama === "Masculino"

  // Reset category if not valid for new rama
  useEffect(() => {
    if (!catValida) {
      setCategoria(categoriasVisibles[0]?.value ?? "")
    }
  }, [rama]) // eslint-disable-line

  // Fetch fases when categoria+rama change
  useEffect(() => {
    if (!categoria) return
    setLoading(true)
    setFases([])
    fetch(`/api/oficiales/aranceles-sugeridos?categoria=${categoria}&rama=${encodeURIComponent(rama)}`)
      .then((r) => r.json())
      .then((data) => setFases(data.fases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoria, rama])

  const catLabel = categoriasVisibles.find((c) => c.value === categoria)?.label ?? categoria

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Calculadora de Aranceles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          IVA 10% incluido · Feriados/suspendidos: +50% sobre total c/IVA
        </p>
      </div>

      {/* 1) Rama */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Rama</Label>
        <div className="flex gap-2">
          {RAMAS.map((r) => (
            <button
              key={r}
              onClick={() => setRama(r)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                rama === r
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 2) Categoría */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Categoría</Label>
        <Select
          value={catValida ? categoria : (categoriasVisibles[0]?.value ?? "")}
          onValueChange={setCategoria}
        >
          <SelectTrigger className="h-9 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoriasVisibles.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calculadora */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando aranceles...
        </div>
      ) : fases.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No hay aranceles configurados para{" "}
            <strong className="text-foreground">{catLabel} {rama}</strong>.
          </CardContent>
        </Card>
      ) : (
        <Calculadora
          fases={fases}
          esLnbMasc={esLnbMasc}
          tieneTransporte={tieneTransporte}
        />
      )}
    </div>
  )
}
