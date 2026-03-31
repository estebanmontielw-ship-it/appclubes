"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSkeleton } from "@/components/ui/skeleton"
import { Users, UserCheck, Clock, DollarSign, GraduationCap, Globe, Flag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const ROL_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

const ROL_COLORS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "bg-blue-500",
  ENTRENADOR_EXTRANJERO: "bg-indigo-500",
  ASISTENTE: "bg-green-500",
  PREPARADOR_FISICO: "bg-orange-500",
  FISIO: "bg-pink-500",
  UTILERO: "bg-gray-500",
}

export default function CTDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/cuerpotecnico/dashboard")
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <PageSkeleton />

  const maxRoleCount = Math.max(...Object.values(data.roleCount as Record<string, number>), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Cuerpo Técnico</h1>
        <p className="text-sm text-muted-foreground">Estadísticas de habilitación anual</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI icon={<Users className="h-5 w-5" />} label="Total" value={String(data.total)} color="bg-blue-100 text-blue-600" />
        <KPI icon={<UserCheck className="h-5 w-5" />} label="Habilitados" value={String(data.habilitados)} color="bg-green-100 text-green-600" />
        <KPI icon={<Clock className="h-5 w-5" />} label="Pendientes" value={String(data.pendientes)} color="bg-yellow-100 text-yellow-600" />
        <KPI icon={<DollarSign className="h-5 w-5" />} label="Recaudado" value={formatCurrency(data.ingresoTotal)} color="bg-emerald-100 text-emerald-600" small />
        <KPI icon={<DollarSign className="h-5 w-5" />} label="Potencial" value={formatCurrency(data.ingresoPotencial)} color="bg-purple-100 text-purple-600" small />
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

        {/* Nationality + Gender + Title */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Nacionalidad</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(data.natCount as Record<string, number>).map(([nat, count]) => (
                  <div key={nat} className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">{nat === "Paraguaya" ? "🇵🇾" : "🌎"}</div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{nat}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Género</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {Object.entries(data.generoCount as Record<string, number>).map(([gen, count]) => (
                  <div key={gen} className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{gen}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Título de entrenador</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-3 bg-green-50 rounded-xl">
                  <GraduationCap className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{data.conTitulo}</p>
                  <p className="text-xs text-muted-foreground">Con título</p>
                </div>
                <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-500">{data.sinTitulo}</p>
                  <p className="text-xs text-muted-foreground">Sin título</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top cities */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top ciudades</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.topCities.map(([city, count]: [string, number], i: number) => (
              <div key={city} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                <span className="flex-1 text-sm">{city}</span>
                <span className="font-bold text-sm">{count}</span>
              </div>
            ))}
            {data.topCities.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Payment auto-verification */}
        <Card>
          <CardHeader><CardTitle className="text-base">Verificación de pagos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-sm">Auto-verificados (del Excel)</span>
                <span className="font-bold text-green-700">{data.pagoAuto}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm">Verificados manualmente</span>
                <span className="font-bold text-blue-700">{data.habilitados - data.pagoAuto}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                <span className="text-sm">Sin verificar</span>
                <span className="font-bold text-yellow-700">{data.sinPago}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPI({ icon, label, value, color, small }: { icon: React.ReactNode; label: string; value: string; color: string; small?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">{label}</p><p className={`font-bold mt-1 ${small ? "text-lg" : "text-2xl"}`}>{value}</p></div>
          <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
