"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageSkeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Users, BookOpen, Clock, CheckCircle, ExternalLink } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface DashboardStats {
  totalIngresosCursos: number
  pagosPendientes: number
  pagosConfirmados: number
  totalInscripciones: number
  inscripcionesActivas: number
  cursosActivos: number
  ingresosPorMes: Record<string, number>
}

interface CursoIngreso {
  id: string
  nombre: string
  disciplina: string
  precio: number
  esGratuito: boolean
  estado: string
  totalInscriptos: number
  inscriptosActivos: number
  pendientesPago: number
  totalIngresos: number
}

interface PagoDetalle {
  id: string
  monto: number
  estado: string
  createdAt: string
  inscripcion: {
    usuario: { nombre: string; apellido: string; email: string }
    curso: { nombre: string; disciplina: string; precio: number }
  }
}

const MESES: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
}

const DISC_LABELS: Record<string, string> = {
  ARBITROS: "Árbitros", MESA: "Mesa", ESTADISTICOS: "Estadísticos",
}

export default function FinanzasCursosPage() {
  const [tab, setTab] = useState<"dashboard" | "por-curso" | "detalle">("dashboard")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cursos, setCursos] = useState<CursoIngreso[]>([])
  const [pagos, setPagos] = useState<PagoDetalle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const tipo = tab === "dashboard" ? "stats" : tab
      const res = await fetch(`/api/admin/finanzas-cursos?tipo=${tipo}`)
      if (res.ok) {
        const data = await res.json()
        if (tab === "dashboard") setStats(data)
        else if (tab === "por-curso") setCursos(data.cursos)
        else setPagos(data.pagos)
      }
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas — Cursos</h1>
        <p className="text-sm text-muted-foreground mt-1">Ingresos por venta de cursos e inscripciones</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setTab("dashboard")}>Dashboard</Button>
        <Button variant={tab === "por-curso" ? "default" : "outline"} size="sm" onClick={() => setTab("por-curso")}>Por curso</Button>
        <Button variant={tab === "detalle" ? "default" : "outline"} size="sm" onClick={() => setTab("detalle")}>Detalle pagos</Button>
      </div>

      {loading ? <PageSkeleton /> : tab === "dashboard" && stats ? (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={<DollarSign className="h-5 w-5" />} label="Ingresos totales" value={formatCurrency(Number(stats.totalIngresosCursos))} color="text-green-600 bg-green-50" />
            <KPICard icon={<Clock className="h-5 w-5" />} label="Pagos pendientes" value={String(stats.pagosPendientes)} color="text-yellow-600 bg-yellow-50" />
            <KPICard icon={<Users className="h-5 w-5" />} label="Inscripciones activas" value={String(stats.inscripcionesActivas)} color="text-blue-600 bg-blue-50" />
            <KPICard icon={<BookOpen className="h-5 w-5" />} label="Cursos activos" value={String(stats.cursosActivos)} color="text-purple-600 bg-purple-50" />
          </div>

          {/* Monthly revenue */}
          {Object.keys(stats.ingresosPorMes).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Ingresos por mes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.ingresosPorMes).map(([key, monto]) => {
                    const [year, month] = key.split("-")
                    const maxMonto = Math.max(...Object.values(stats.ingresosPorMes))
                    const pct = maxMonto > 0 ? (monto / maxMonto) * 100 : 0
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-20">{MESES[month]} {year}</span>
                        <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                          <div className="h-full bg-primary/15 rounded-lg flex items-center px-3 transition-all" style={{ width: `${Math.max(pct, 10)}%` }}>
                            <span className="text-xs font-semibold text-primary">{formatCurrency(monto)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Total inscripciones</p>
                <p className="text-2xl font-bold mt-1">{stats.totalInscripciones}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Pagos confirmados</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.pagosConfirmados}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : tab === "por-curso" ? (
        <div className="space-y-3">
          {cursos.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No hay cursos</CardContent></Card>
          ) : cursos.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{c.nombre}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{DISC_LABELS[c.disciplina] || c.disciplina}</Badge>
                      <Badge variant={c.estado === "ACTIVO" ? "success" : "secondary"} className="text-xs">{c.estado}</Badge>
                      {c.esGratuito && <Badge variant="outline" className="text-xs">Gratis</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(c.totalIngresos)}</p>
                    <p className="text-xs text-muted-foreground">ingresados</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold">{c.totalInscriptos}</p>
                    <p className="text-[10px] text-muted-foreground">Inscriptos</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-600">{c.inscriptosActivos}</p>
                    <p className="text-[10px] text-muted-foreground">Activos</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-yellow-600">{c.pendientesPago}</p>
                    <p className="text-[10px] text-muted-foreground">Pend. pago</p>
                  </div>
                </div>
                {!c.esGratuito && c.totalInscriptos > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Precio: {formatCurrency(c.precio)} · Potencial: {formatCurrency(c.precio * c.totalInscriptos)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tab === "detalle" ? (
        <div className="space-y-2">
          {pagos.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No hay pagos registrados</CardContent></Card>
          ) : pagos.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.inscripcion.usuario.nombre} {p.inscripcion.usuario.apellido}</p>
                  <p className="text-xs text-muted-foreground">{p.inscripcion.curso.nombre} · {formatDate(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-sm">{formatCurrency(Number(p.monto))}</p>
                  <Badge variant={p.estado === "CONFIRMADO" ? "success" : p.estado === "RECHAZADO" ? "destructive" : "warning"} className="text-xs">
                    {p.estado === "CONFIRMADO" ? "Confirmado" : p.estado === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
