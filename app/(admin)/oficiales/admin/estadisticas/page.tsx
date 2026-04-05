"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSkeleton } from "@/components/ui/skeleton"
import {
  Users, UserCheck, GraduationCap, Trophy, DollarSign,
  Globe, Download, TrendingUp, BookOpen, CreditCard,
  FileText, Clock, Mars, Venus, MapPin,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  INSTRUCTOR: "Instructor",
  DESIGNADOR: "Designador",
  VERIFICADOR: "Verificador",
  ARBITRO: "Árbitro",
  MESA: "Oficial de Mesa",
  ESTADISTICO: "Estadístico",
}

const CT_ROL_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function EstadisticasPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/estadisticas")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExportPDF = () => {
    // Open directly — the endpoint returns HTML that can be printed as PDF
    window.open("/api/admin/estadisticas/pdf", "_blank")
  }

  if (loading || !data) return <PageSkeleton />

  const { oficiales, cuerpoTecnico, cursos, finanzas, partidos, website, registrosPorMes } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estadísticas Completas</h1>
          <p className="text-sm text-muted-foreground">
            Reporte general de la CPB &mdash; {new Date().toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
      </div>

      {/* ═══ OFICIALES ═══ */}
      <Section title="Oficiales" icon={<Users className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total" value={oficiales.total} icon={<Users className="h-5 w-5" />} color="bg-blue-100 text-blue-600" />
          <KPI label="Verificados" value={oficiales.verificados} icon={<UserCheck className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Pendientes" value={oficiales.pendientes} icon={<Clock className="h-5 w-5" />} color="bg-yellow-100 text-yellow-600" />
          <KPI label="Rechazados" value={oficiales.rechazados} icon={<FileText className="h-5 w-5" />} color="bg-red-100 text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Gender */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Género</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <GenderBar icon={<Mars className="h-4 w-4" />} label="Masculino" value={oficiales.hombres} total={oficiales.total} color="bg-blue-500" bgColor="bg-blue-100 text-blue-600" />
              <GenderBar icon={<Venus className="h-4 w-4" />} label="Femenino" value={oficiales.mujeres} total={oficiales.total} color="bg-pink-500" bgColor="bg-pink-100 text-pink-600" />
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Distribución por rol</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(oficiales.roleCount as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([rol, count]) => (
                  <HBar key={rol} label={ROL_LABELS[rol] || rol} value={count} max={Math.max(...Object.values(oficiales.roleCount as Record<string, number>))} />
                ))}
              {Object.keys(oficiales.roleCount).length === 0 && <EmptyState />}
            </CardContent>
          </Card>

          {/* Top cities */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Top 10 ciudades</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(oficiales.topCiudades as [string, number][]).map(([city, count], i) => (
                <div key={city} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <HBar label={city} value={count} max={oficiales.topCiudades[0]?.[1] || 1} />
                </div>
              ))}
              {oficiales.topCiudades.length === 0 && <EmptyState />}
            </CardContent>
          </Card>

          {/* Age */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Distribución por edad</CardTitle></CardHeader>
            <CardContent>
              <BarChart data={oficiales.ageRanges} />
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══ CUERPO TÉCNICO ═══ */}
      <Section title="Cuerpo Técnico" icon={<UserCheck className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total" value={cuerpoTecnico.total} icon={<Users className="h-5 w-5" />} color="bg-indigo-100 text-indigo-600" />
          <KPI label="Habilitados" value={cuerpoTecnico.habilitados} icon={<UserCheck className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Pendientes" value={cuerpoTecnico.pendientes} icon={<Clock className="h-5 w-5" />} color="bg-yellow-100 text-yellow-600" />
          <KPI label="Ingreso total" value={formatCurrency(cuerpoTecnico.ingresoTotal)} icon={<DollarSign className="h-5 w-5" />} color="bg-emerald-100 text-emerald-600" isText />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* CT Roles */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Distribución por rol</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(cuerpoTecnico.roleCount as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([rol, count]) => (
                  <HBar key={rol} label={CT_ROL_LABELS[rol] || rol.replace("_", " ")} value={count} max={Math.max(...Object.values(cuerpoTecnico.roleCount as Record<string, number>), 1)} color="bg-indigo-500" />
                ))}
              {Object.keys(cuerpoTecnico.roleCount).length === 0 && <EmptyState />}
            </CardContent>
          </Card>

          {/* CT Extra stats */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Datos adicionales</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <StatRow label="Con título habilitante" value={cuerpoTecnico.conTitulo} />
              <StatRow label="Sin título" value={cuerpoTecnico.sinTitulo} />
              <StatRow label="Ingreso potencial" value={formatCurrency(cuerpoTecnico.ingresoPotencial)} />
              {Object.entries(cuerpoTecnico.nacionalidad as Record<string, number>).map(([nat, count]) => (
                <StatRow key={nat} label={nat} value={count} />
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══ CURSOS ═══ */}
      <Section title="Cursos y Formación" icon={<GraduationCap className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPI label="Cursos activos" value={cursos.activos} icon={<BookOpen className="h-5 w-5" />} color="bg-blue-100 text-blue-600" />
          <KPI label="En borrador" value={cursos.borrador} icon={<FileText className="h-5 w-5" />} color="bg-gray-100 text-gray-600" />
          <KPI label="Inscripciones" value={cursos.totalInscripciones} icon={<Users className="h-5 w-5" />} color="bg-purple-100 text-purple-600" />
          <KPI label="Activas" value={cursos.inscripcionesActivas} icon={<TrendingUp className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Completadas" value={cursos.inscripcionesCompletadas} icon={<UserCheck className="h-5 w-5" />} color="bg-emerald-100 text-emerald-600" />
          <KPI label="Certificados" value={cursos.certificadosEmitidos} icon={<CreditCard className="h-5 w-5" />} color="bg-orange-100 text-orange-600" />
        </div>
      </Section>

      {/* ═══ FINANZAS ═══ */}
      <Section title="Finanzas" icon={<DollarSign className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Ingresos cursos" value={formatCurrency(finanzas.ingresosCursos)} icon={<DollarSign className="h-5 w-5" />} color="bg-emerald-100 text-emerald-600" isText />
          <KPI label="Pagos confirmados" value={finanzas.pagosConfirmados} icon={<UserCheck className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Pagos pendientes" value={finanzas.pagosPendientes} icon={<Clock className="h-5 w-5" />} color="bg-yellow-100 text-yellow-600" />
          <KPI label="Honorarios pagados" value={formatCurrency(finanzas.honorariosPagados)} icon={<CreditCard className="h-5 w-5" />} color="bg-blue-100 text-blue-600" isText />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Honorarios pendientes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(finanzas.honorariosPendientes)}</p>
              <p className="text-xs text-muted-foreground mt-1">Monto total pendiente de pago a oficiales</p>
            </CardContent>
          </Card>

          {/* Revenue by month */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Ingresos cursos por mes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(finanzas.ingresosPorMes as Record<string, number>)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 6)
                .map(([month, amount]) => {
                  const [y, m] = month.split("-")
                  return (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{MESES[parseInt(m)]} {y}</span>
                      <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-emerald-100 rounded-lg flex items-center px-2"
                          style={{ width: `${Math.max((amount / Math.max(...Object.values(finanzas.ingresosPorMes as Record<string, number>), 1)) * 100, 15)}%` }}
                        >
                          <span className="text-xs font-bold text-emerald-700">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(finanzas.ingresosPorMes).length === 0 && <EmptyState />}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ═══ PARTIDOS ═══ */}
      <Section title="Partidos y Designaciones" icon={<Trophy className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Total partidos" value={partidos.total} icon={<Trophy className="h-5 w-5" />} color="bg-orange-100 text-orange-600" />
          <KPI label="Programados" value={partidos.programados} icon={<Clock className="h-5 w-5" />} color="bg-blue-100 text-blue-600" />
          <KPI label="Finalizados" value={partidos.finalizados} icon={<UserCheck className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Designaciones" value={partidos.totalDesignaciones} icon={<Users className="h-5 w-5" />} color="bg-purple-100 text-purple-600" />
        </div>
      </Section>

      {/* ═══ SITIO WEB ═══ */}
      <Section title="Sitio Web" icon={<Globe className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Noticias publicadas" value={website.noticiasPublicadas} icon={<FileText className="h-5 w-5" />} color="bg-blue-100 text-blue-600" />
          <KPI label="Clubes activos" value={website.clubesActivos} icon={<MapPin className="h-5 w-5" />} color="bg-green-100 text-green-600" />
          <KPI label="Selecciones" value={website.seleccionesActivas} icon={<Trophy className="h-5 w-5" />} color="bg-purple-100 text-purple-600" />
          <KPI label="Mensajes sin leer" value={website.mensajesSinLeer} icon={<FileText className="h-5 w-5" />} color="bg-red-100 text-red-600" />
        </div>
      </Section>

      {/* ═══ TENDENCIAS ═══ */}
      <Section title="Registros por mes" icon={<TrendingUp className="h-5 w-5" />}>
        <Card>
          <CardContent className="pt-6">
            <BarChart data={registrosPorMes} labelFormatter={(k) => {
              const [y, m] = k.split("-")
              return `${MESES[parseInt(m)]} ${y}`
            }} />
          </CardContent>
        </Card>
      </Section>
    </div>
  )
}

// ─── COMPONENTS ──────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function KPI({ label, value, icon, color, isText }: { label: string; value: number | string; icon: React.ReactNode; color: string; isText?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`${isText ? "text-lg" : "text-2xl"} font-bold mt-1 truncate`}>{value}</p>
          </div>
          <div className={`p-2 rounded-xl shrink-0 ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function GenderBar({ icon, label, value, total, color, bgColor }: { icon: React.ReactNode; label: string; value: number; total: number; color: string; bgColor: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="font-bold">{value} ({pct}%)</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function HBar({ label, value, max, color = "bg-primary" }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-sm">
        <span className="truncate">{label}</span>
        <span className="font-bold shrink-0 ml-2">{value}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((value / max) * 100, 3)}%` }} />
      </div>
    </div>
  )
}

function BarChart({ data, labelFormatter }: { data: Record<string, number>; labelFormatter?: (k: string) => string }) {
  const entries = Object.entries(data)
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <div className="flex items-end gap-2 h-40">
      {entries.map(([key, count]) => (
        <div key={key} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold">{count}</span>
          <div
            className="w-full bg-primary rounded-t-md"
            style={{ height: `${Math.max((count / maxVal) * 100, 4)}%`, opacity: count > 0 ? 1 : 0.2 }}
          />
          <span className="text-[10px] text-muted-foreground text-center leading-tight">{labelFormatter ? labelFormatter(key) : key}</span>
        </div>
      ))}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  )
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
}
