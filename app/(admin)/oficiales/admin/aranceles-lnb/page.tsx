"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

// ─── TIPOS ───────────────────────────────────────────────

interface RolFase {
  id: string
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
  return `Gs. ${n.toLocaleString("es-PY")}`
}

function calcular(neto: number, feriado: boolean, transporte: number) {
  const iva       = Math.round(neto * 0.1)
  const cIVA      = neto + iva
  const baseFin   = feriado ? Math.round(cIVA * 1.5) : cIVA
  const total     = baseFin + transporte
  return { iva, cIVA, baseFin, total }
}

// ─── CATEGORÍAS ───────────────────────────────────────────
//
// hasMasc / hasFem  → controla qué aparece según la rama seleccionada
// torneoMasc / torneoFem → clave en aranceles_lnb
// tieneTransporte   → muestra selector Asunción / Luque / Capiatá
//
const CATEGORIAS_CALC = [
  { value: "LNB",     label: "LNB — Liga Nacional",    torneoMasc: "LNB_MASC",       torneoFem: null,       hasMasc: true,  hasFem: false, tieneTransporte: false },
  { value: "LNBF",    label: "LNBF — Liga Nacional",   torneoMasc: null,              torneoFem: "LNB_FEM",  hasMasc: false, hasFem: true,  tieneTransporte: false },
  { value: "U22",     label: "Sub-22",                 torneoMasc: "U22_MASC",        torneoFem: "U22_FEM",  hasMasc: true,  hasFem: true,  tieneTransporte: false },
  { value: "U19",     label: "Sub-19",                 torneoMasc: "INF_MASC_U19",    torneoFem: null,       hasMasc: true,  hasFem: false, tieneTransporte: true  },
  { value: "U17",     label: "Sub-17",                 torneoMasc: "INF_MASC_U1517",  torneoFem: "INF_FEM",  hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "U15",     label: "Sub-15",                 torneoMasc: "INF_MASC_U1517",  torneoFem: "INF_FEM",  hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "U13",     label: "Sub-13",                 torneoMasc: "INF_MASC_U1517",  torneoFem: "INF_FEM",  hasMasc: true,  hasFem: true,  tieneTransporte: true  },
  { value: "ESPECIAL",label: "Especial / Amistoso",    torneoMasc: "ESP_MASC",        torneoFem: "ESP_FEM",  hasMasc: true,  hasFem: true,  tieneTransporte: false },
]

const RAMAS = ["Masculino", "Femenino"] as const

function computeTorneo(categoria: string, rama: string): string {
  const cat = CATEGORIAS_CALC.find((c) => c.value === categoria)
  if (!cat) return ""
  return rama === "Femenino" ? (cat.torneoFem ?? "") : (cat.torneoMasc ?? "")
}

// ─── GRUPOS DE FASES LNB MASC ────────────────────────────
// Solo aplica cuando torneo = LNB_MASC

const FASE_GRUPOS = [
  { key: "etapa1",    label: "Etapa 1",              sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_ETAPA1_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_ETAPA1_INT" }] },
  { key: "comuneros", label: "Comuneros",             sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_COMUNEROS_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_COMUNEROS_INT" }] },
  { key: "final_com", label: "Final Comuneros",       sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_COM" }] },
  { key: "top4",      label: "Top 4",                 sedes: [{ k: "ASU", label: "Asunción", faseKey: "LNB_TOP4_ASU" }, { k: "INT", label: "Interior", faseKey: "LNB_TOP4_INT" }, { k: "EXT", label: "Internacional", faseKey: "LNB_TOP4_EXT" }] },
  { key: "final_t4",  label: "Final Top 4",           sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_TOP4" }] },
  { key: "final_ext", label: "Final — Internacional", sedes: [{ k: "UNICA", label: "", faseKey: "LNB_FINAL_EXT" }] },
]

// ─── CALCULADORA ─────────────────────────────────────────

function Calculadora({
  fases,
  esLnbMasc,
  tieneTransporte,
}: {
  fases: Fase[]
  esLnbMasc: boolean
  tieneTransporte: boolean
}) {
  const [grupoKey,   setGrupoKey]   = useState<string>("etapa1")
  const [sedeKey,    setSedeKey]    = useState<string>("ASU")
  const [faseSimple, setFaseSimple] = useState<string>(fases[0]?.fase ?? "")
  const [feriado,    setFeriado]    = useState(false)
  const [transport,  setTransport]  = useState<number>(0)  // 0 / 60000 / 80000

  useEffect(() => {
    setGrupoKey("etapa1")
    setSedeKey("ASU")
    setFaseSimple(fases[0]?.fase ?? "")
    setFeriado(false)
    setTransport(0)
  }, [fases])

  // ── modo LNB Masc ──
  const grupo     = FASE_GRUPOS.find((g) => g.key === grupoKey) ?? FASE_GRUPOS[0]
  const sedeValida = grupo.sedes.find((s) => s.k === sedeKey) ? sedeKey : grupo.sedes[0].k
  const sede      = grupo.sedes.find((s) => s.k === sedeValida) ?? grupo.sedes[0]
  const faseLnb   = fases.find((f) => f.fase === sede.faseKey)

  // ── modo simple ──
  const faseSimpleObj = fases.find((f) => f.fase === faseSimple)

  const fase = esLnbMasc ? faseLnb : faseSimpleObj
  if (!fase) return null

  const { iva, cIVA, baseFin, total } = calcular(fase.netoCalculable, feriado, transport)
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

        {/* Selector de fase */}
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
                  <SelectItem key={f.fase} value={f.fase}>{f.faseNombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botones sede — LNB Masc con múltiples sedes */}
        {tieneSedes && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Sede</Label>
            <div className="flex gap-2 flex-wrap">
              {grupo.sedes.map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSedeKey(s.k)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
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

        {/* Plus transporte — solo torneos de Inferiores */}
        {tieneTransporte && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Sede / Plus transporte</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Asunción",  value: 0     },
                { label: "Luque +60k",value: 60000 },
                { label: "Capiatá +80k",value: 80000 },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setTransport(s.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    transport === s.value
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

        {/* Feriado */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Condición</Label>
          <button
            onClick={() => setFeriado(!feriado)}
            className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${
              feriado
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {feriado ? "Feriado (+50%)" : "Día normal"}
          </button>
        </div>

        {/* Desglose por roles */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Desglose — {fase.faseNombre}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-1.5 font-medium">Rol</th>
                  <th className="text-center py-1.5 font-medium">Cant.</th>
                  <th className="text-right py-1.5 font-medium">Unitario</th>
                  <th className="text-right py-1.5 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {fase.roles.map((r) => (
                  <tr key={r.rol} className="border-b last:border-0">
                    <td className="py-2 text-gray-800">
                      {ROL_LABELS[r.rol] ?? r.rol}
                      {r.esManual && <Badge variant="outline" className="ml-2 text-[10px] py-0">manual</Badge>}
                    </td>
                    <td className="py-2 text-center text-gray-500">{r.cantPersonas}</td>
                    <td className="py-2 text-right text-gray-600">
                      {r.esManual ? <span className="text-muted-foreground italic">a cotizar</span> : gs(r.montoUnitario)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {r.esManual ? <span className="text-muted-foreground">—</span> : gs(r.subtotal!)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Neto calculable{fase.tieneManual && <span className="text-xs text-muted-foreground ml-1">(sin árb. intl.)</span>}
            </span>
            <span className="font-medium">{gs(fase.netoCalculable)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA 10%</span>
            <span className="font-medium">{gs(iva)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Total con IVA</span>
            <span>{gs(cIVA)}</span>
          </div>
          {feriado && (
            <div className="flex justify-between text-sm font-bold text-amber-700 border-t border-amber-200 pt-2">
              <span>Feriado (+50%)</span>
              <span>{gs(baseFin)}</span>
            </div>
          )}
          {transport > 0 && (
            <div className="flex justify-between text-sm text-blue-700 border-t border-blue-100 pt-2">
              <span>Plus transporte</span>
              <span className="font-medium">+ {gs(transport)}</span>
            </div>
          )}
          {(feriado || transport > 0) && (
            <div className="flex justify-between text-base font-extrabold border-t-2 pt-2 text-gray-900">
              <span>Total final</span>
              <span>{gs(total)}</span>
            </div>
          )}
        </div>

        {fase.tieneManual && (
          <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            El árbitro internacional no se calcula automáticamente. Su honorario debe cargarse manualmente según cotización acordada.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── TABLA RESUMEN ────────────────────────────────────────

function TablaResumen({ fases }: { fases: Fase[] }) {
  return (
    <div className="space-y-4">
      {fases.map((fase) => {
        const { iva, cIVA, baseFin } = calcular(fase.netoCalculable, true, 0)
        return (
          <Card key={fase.fase}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{fase.faseNombre}</CardTitle>
                <span className="text-[11px] text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded">
                  {fase.fase}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs mb-3">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1 font-medium">Rol</th>
                      <th className="text-center py-1 font-medium">Cant.</th>
                      <th className="text-right py-1 font-medium">Unitario</th>
                      <th className="text-right py-1 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fase.roles.map((r) => (
                      <tr key={r.rol} className="border-b last:border-0">
                        <td className="py-1.5 text-gray-700">
                          {ROL_LABELS[r.rol] ?? r.rol}
                          {r.esManual && <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1">manual</Badge>}
                        </td>
                        <td className="py-1.5 text-center text-gray-500">{r.cantPersonas}</td>
                        <td className="py-1.5 text-right text-gray-500">
                          {r.esManual ? <span className="italic text-muted-foreground">cotizar</span> : gs(r.montoUnitario)}
                        </td>
                        <td className="py-1.5 text-right font-medium">
                          {r.esManual ? "—" : gs(r.subtotal!)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs border-t pt-2">
                <span className="text-gray-500">
                  Neto: <span className="font-semibold text-gray-800">{gs(fase.netoCalculable)}</span>
                  {fase.tieneManual && <span className="text-muted-foreground"> (sin intl.)</span>}
                </span>
                <span className="text-gray-500">
                  c/IVA: <span className="font-semibold text-gray-800">{gs(cIVA)}</span>
                </span>
                <span className="text-amber-700">
                  Feriado: <span className="font-semibold">{gs(baseFin)}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────

export default function ArancelesLnbPage() {
  const [rama,      setRama]      = useState<string>("Masculino")
  const [categoria, setCategoria] = useState<string>("LNB")
  const [fases,     setFases]     = useState<Fase[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<"calculadora" | "tabla">("calculadora")

  // Categorías válidas para la rama seleccionada
  const categoriasVisibles = CATEGORIAS_CALC.filter((c) =>
    rama === "Femenino" ? c.hasFem : c.hasMasc
  )

  // Si la categoría actual no es válida para la nueva rama, resetear
  const catObj = CATEGORIAS_CALC.find((c) => c.value === categoria)
  const catValida = rama === "Femenino" ? catObj?.hasFem : catObj?.hasMasc

  const torneo = computeTorneo(categoria, rama)
  const esLnbMasc = torneo === "LNB_MASC"
  const tieneTransporte = catObj?.tieneTransporte ?? false

  // Cargar fases cuando cambia el torneo
  useEffect(() => {
    if (!torneo) { setFases([]); setLoading(false); return }
    setLoading(true)
    setFases([])
    fetch(`/api/admin/aranceles-lnb?torneo=${torneo}`)
      .then((r) => r.json())
      .then((data) => setFases(data.fases ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [torneo])

  // Resetear categoría si no es válida para la rama
  useEffect(() => {
    if (!catValida) {
      const primera = categoriasVisibles[0]?.value ?? ""
      setCategoria(primera)
    }
  }, [rama]) // eslint-disable-line

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Calculadora de Aranceles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          IVA 10% incluido · Feriados/suspendidos: +50% sobre total c/IVA
        </p>
      </div>

      {/* 1) Rama primero */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Rama</Label>
        <div className="flex gap-2">
          {RAMAS.map((r) => (
            <button
              key={r}
              onClick={() => { setRama(r); setTab("calculadora") }}
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

      {/* 2) Categoría filtrada por rama */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Categoría</Label>
        <Select
          value={catValida ? categoria : (categoriasVisibles[0]?.value ?? "")}
          onValueChange={(v) => { setCategoria(v); setTab("calculadora") }}
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

      {/* 3) Tabs */}
      <div className="flex gap-2 pt-1">
        {(["calculadora", "tabla"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {t === "calculadora" ? "Calculadora" : "Tabla completa"}
          </button>
        ))}
      </div>

      {/* 4) Contenido */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Cargando...</div>
      ) : fases.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay aranceles configurados para{" "}
            <strong>
              {catObj?.label ?? categoria} {rama}
            </strong>.
          </CardContent>
        </Card>
      ) : tab === "calculadora" ? (
        <Calculadora
          key={torneo}
          fases={fases}
          esLnbMasc={esLnbMasc}
          tieneTransporte={tieneTransporte}
        />
      ) : (
        <TablaResumen fases={fases} />
      )}
    </div>
  )
}
