"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Eye, Users, UserCheck, Clock, DollarSign } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { PageSkeleton } from "@/components/ui/skeleton"

interface CTMember {
  id: string
  nombre: string
  apellido: string
  cedula: string
  ciudad: string
  rol: string
  estadoHabilitacion: string
  pagoVerificado: boolean
  pagoAutoVerificado: boolean
  comprobanteUrl: string | null
  montoHabilitacion: number
  createdAt: string
}

const ROL_LABELS: Record<string, string> = {
  ENTRENADOR_NACIONAL: "Entrenador Nacional",
  ENTRENADOR_EXTRANJERO: "Entrenador Extranjero",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Preparador Físico",
  FISIO: "Fisioterapeuta",
  UTILERO: "Utilero",
}

const TABS = [
  { label: "Todos", value: "" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Habilitados", value: "HABILITADO" },
  { label: "Rechazados", value: "RECHAZADO" },
]

export default function AdminCTPage() {
  const [miembros, setMiembros] = useState<CTMember[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [buscar, setBuscar] = useState("")

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtro) params.set("estado", filtro)
    Promise.all([
      fetch(`/api/admin/cuerpotecnico?${params}`).then(r => r.json()),
      fetch("/api/admin/cuerpotecnico?tipo=stats").then(r => r.json()),
    ]).then(([data, statsData]) => {
      setMiembros(data.miembros || [])
      setStats(statsData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [filtro])

  const filtered = miembros.filter(m =>
    !buscar || `${m.nombre} ${m.apellido} ${m.cedula}`.toLowerCase().includes(buscar.toLowerCase())
  )

  const estadoColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    HABILITADO: "success", PENDIENTE: "warning", RECHAZADO: "destructive", SUSPENDIDO: "secondary",
  }

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuerpo Técnico</h1>
        <p className="text-sm text-muted-foreground">Habilitación anual de entrenadores, asistentes y staff</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div><Users className="h-5 w-5 text-blue-500" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Habilitados</p><p className="text-2xl font-bold text-green-600">{stats.habilitados}</p></div><UserCheck className="h-5 w-5 text-green-500" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p></div><Clock className="h-5 w-5 text-yellow-500" /></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Sin pago</p><p className="text-2xl font-bold text-red-600">{stats.pendientesPago}</p></div><DollarSign className="h-5 w-5 text-red-500" /></div></CardContent></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {TABS.map(t => (
            <Button key={t.value} variant={filtro === t.value ? "default" : "outline"} size="sm" onClick={() => setFiltro(t.value)}>{t.label}</Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o CI..." className="pl-9" value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No se encontraron miembros</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rol</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Pago</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="p-3">
                        <p className="font-medium text-sm">{m.nombre} {m.apellido}</p>
                        <p className="text-xs text-muted-foreground">CI: {m.cedula}</p>
                      </td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{ROL_LABELS[m.rol] || m.rol}</Badge></td>
                      <td className="p-3 hidden md:table-cell">
                        {m.pagoAutoVerificado ? (
                          <Badge variant="success" className="text-xs">Auto-verificado</Badge>
                        ) : m.pagoVerificado ? (
                          <Badge variant="success" className="text-xs">Verificado</Badge>
                        ) : m.comprobanteUrl ? (
                          <Badge variant="secondary" className="text-xs">Pendiente de aprobación</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Sin pago</Badge>
                        )}
                      </td>
                      <td className="p-3"><Badge variant={estadoColor[m.estadoHabilitacion]} className="text-xs">{m.estadoHabilitacion}</Badge></td>
                      <td className="p-3 text-right">
                        <Link href={`/oficiales/admin/cuerpotecnico/${m.id}`}>
                          <Button size="sm" variant={m.estadoHabilitacion === "PENDIENTE" ? "default" : "outline"} className="text-xs h-7">
                            {m.estadoHabilitacion === "PENDIENTE" ? "Revisar" : "Ver"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
