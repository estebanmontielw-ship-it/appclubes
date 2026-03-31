"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageSkeleton } from "@/components/ui/skeleton"
import { Users, UserCheck, Clock, XCircle, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", INSTRUCTOR: "Instructor", DESIGNADOR: "Designador",
  ARBITRO: "Árbitro", MESA: "Oficial de Mesa", ESTADISTICO: "Estadístico",
}

const ROL_COLORS: Record<string, string> = {
  ARBITRO: "bg-blue-500", MESA: "bg-green-500", ESTADISTICO: "bg-purple-500",
  INSTRUCTOR: "bg-orange-500", DESIGNADOR: "bg-yellow-500", SUPER_ADMIN: "bg-red-500",
}

export default function OficialesDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/usuarios/dashboard")
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <PageSkeleton />

  const maxRoleCount = Math.max(...Object.values(data.roleCount as Record<string, number>), 1)
  const maxCityCount = data.topCities.length > 0 ? data.topCities[0][1] : 1
  const maxAge = Math.max(...Object.values(data.ageRanges as Record<string, number>), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Oficiales</h1>
        <p className="text-sm text-muted-foreground">Estadísticas y distribución de oficiales registrados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={<Users className="h-5 w-5" />} label="Total" value={data.total} color="bg-blue-100 text-blue-600" />
        <KPI icon={<UserCheck className="h-5 w-5" />} label="Verificados" value={data.verificados} color="bg-green-100 text-green-600" />
        <KPI icon={<Clock className="h-5 w-5" />} label="Pendientes" value={data.pendientes} color="bg-yellow-100 text-yellow-600" />
        <KPI icon={<XCircle className="h-5 w-5" />} label="Rechazados" value={data.rechazados} color="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By role */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por rol</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.roleCount as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([rol, count]) => (
              <div key={rol} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{ROL_LABELS[rol] || rol}</span>
                  <span className="font-bold">{count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ROL_COLORS[rol] || "bg-blue-500"}`} style={{ width: `${(count / maxRoleCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By city */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top ciudades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.topCities.map(([city, count]: [string, number], i: number) => (
              <div key={city} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{city}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / maxCityCount) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {data.topCities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Age distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por edad</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {Object.entries(data.ageRanges as Record<string, number>).map(([range, count]) => (
                <div key={range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold">{count}</span>
                  <div className="w-full bg-primary/20 rounded-t-md relative" style={{ height: `${Math.max((count / maxAge) * 100, 5)}%` }}>
                    <div className="absolute inset-0 bg-primary rounded-t-md" style={{ opacity: count > 0 ? 1 : 0.2 }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{range}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Registrations by month */}
        <Card>
          <CardHeader><CardTitle className="text-base">Registros por mes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.monthCount as Record<string, number>)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 6)
              .map(([month, count]) => {
                const [y, m] = month.split("-")
                const meses = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">{meses[parseInt(m)]} {y}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                      <div className="h-full bg-primary/15 rounded-lg flex items-center px-2" style={{ width: `${Math.max((count / data.total) * 300, 15)}%` }}>
                        <span className="text-xs font-bold text-primary">{count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            {Object.keys(data.monthCount).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPI({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
