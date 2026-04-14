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
  ARBITRO: "Árbitro",
  ARBITRO_NAC: "Árbitro Nacional",
  ARBITRO_INTL: "Árbitro Internacional",
  OFICIAL_MESA: "Oficial de Mesa",
  ESTADISTICO: "Estadístico",
  RELATOR: "Relator",
}

function gs(n: number) {
  return `Gs. ${n.toLocaleString("es-PY")}`
}

function calcular(netoCalculable: number, feriado: boolean) {
  const iva = Math.round(netoCalculable * 0.1)
  const totalConIva = netoCalculable + iva
  const totalFeriado = feriado ? Math.round(totalConIva * 1.5) : null
  return { iva, totalConIva, totalFeriado }
}

// ─── CALCULADORA ─────────────────────────────────────────

function Calculadora({ fases }: { fases: Fase[] }) {
  const [faseKey, setFaseKey] = useState<string>(fases[0]?.fase ?? "")
  const [feriado, setFeriado] = useState(false)

  const fase = fases.find((f) => f.fase === faseKey)
  if (!fase) return null

  const { iva, totalConIva, totalFeriado } = calcular(fase.netoCalculable, feriado)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Calculadora de honorarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Selección */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fase del torneo</Label>
            <Select value={faseKey} onValueChange={setFaseKey}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fases.map((f) => (
                  <SelectItem key={f.fase} value={f.fase}>{f.faseNombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>

        {/* Desglose por roles */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Desglose — {fase.faseNombre}
          </p>
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
                    {r.esManual && (
                      <Badge variant="outline" className="ml-2 text-[10px] py-0">manual</Badge>
                    )}
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
            <span>{gs(totalConIva)}</span>
          </div>
          {feriado && totalFeriado !== null && (
            <div className="flex justify-between text-sm font-bold text-amber-700 border-t border-amber-200 pt-2 bg-amber-50 -mx-4 px-4 pb-1 -mb-1 rounded-b-xl">
              <span>Total feriado (+50%)</span>
              <span>{gs(totalFeriado)}</span>
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
        const { iva, totalConIva, totalFeriado } = calcular(fase.netoCalculable, true)
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
                        {r.esManual && (
                          <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1">manual</Badge>
                        )}
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

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs border-t pt-2">
                <span className="text-gray-500">
                  Neto: <span className="font-semibold text-gray-800">{gs(fase.netoCalculable)}</span>
                  {fase.tieneManual && <span className="text-muted-foreground"> (sin intl.)</span>}
                </span>
                <span className="text-gray-500">
                  c/IVA: <span className="font-semibold text-gray-800">{gs(totalConIva)}</span>
                </span>
                <span className="text-amber-700">
                  Feriado: <span className="font-semibold">{gs(totalFeriado!)}</span>
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
  const [fases, setFases] = useState<Fase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"calculadora" | "tabla">("calculadora")

  useEffect(() => {
    fetch("/api/admin/aranceles-lnb?torneo=LNB_MASC")
      .then((r) => r.json())
      .then((data) => {
        if (data.fases) setFases(data.fases)
        else setError("No se pudieron cargar los aranceles")
      })
      .catch(() => setError("Error al cargar los aranceles"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Aranceles LNB Masculino 2026</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tarifas v2 — IVA 10% incluido. Feriados/suspendidos: +50% sobre total c/IVA.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("calculadora")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "calculadora"
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Calculadora
        </button>
        <button
          onClick={() => setTab("tabla")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "tabla"
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Tabla completa
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Cargando aranceles...</div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-red-500">{error}</CardContent>
        </Card>
      ) : fases.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay aranceles cargados. Ejecutá el SQL de migración en Supabase primero.
          </CardContent>
        </Card>
      ) : tab === "calculadora" ? (
        <Calculadora fases={fases} />
      ) : (
        <TablaResumen fases={fases} />
      )}
    </div>
  )
}
