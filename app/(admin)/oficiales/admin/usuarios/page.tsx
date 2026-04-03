"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"
import { ROL_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"

interface UsuarioRow {
  id: string
  nombre: string
  apellido: string
  cedula: string
  ciudad: string
  estadoVerificacion: EstadoVerificacion
  createdAt: string
  roles: { rol: TipoRol }[]
}

const TABS = [
  { label: "Todos", value: "" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Verificados", value: "VERIFICADO" },
  { label: "Rechazados", value: "RECHAZADO" },
]

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [filtro, setFiltro] = useState("")
  const [buscar, setBuscar] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtro) params.set("estado", filtro)
    if (buscar) params.set("buscar", buscar)

    fetch(`/api/admin/usuarios?${params}`)
      .then((res) => res.json())
      .then((data) => setUsuarios(data.usuarios || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filtro, buscar])

  const estadoBadge: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    VERIFICADO: "success",
    PENDIENTE: "warning",
    RECHAZADO: "destructive",
    SUSPENDIDO: "secondary",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={filtro === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(tab.value)}
              className="shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o CI..."
            className="pl-9"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Cargando...
            </div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <Link key={u.id} href={`/oficiales/admin/usuarios/${u.id}`} className="block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{u.nombre} {u.apellido}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">CI: {u.cedula} · {u.ciudad}</p>
                        {u.roles.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1.5">
                            {u.roles.map((r) => (
                              <Badge key={r.rol} variant="outline" className="text-[10px]">
                                {ROL_LABELS[r.rol] || r.rol}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant={estadoBadge[u.estadoVerificacion]} className="shrink-0 text-xs">
                        {u.estadoVerificacion}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Nombre
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        CI
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Roles
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                        Ciudad
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                        Registro
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                        Estado
                      </th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-medium">
                            {u.nombre} {u.apellido}
                          </p>
                        </td>
                        <td className="p-4 text-sm">{u.cedula}</td>
                        <td className="p-4">
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map((r) => (
                              <Badge key={r.rol} variant="outline" className="text-xs">
                                {ROL_LABELS[r.rol] || r.rol}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-sm hidden lg:table-cell">{u.ciudad}</td>
                        <td className="p-4 text-sm hidden lg:table-cell">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="p-4">
                          <Badge variant={estadoBadge[u.estadoVerificacion]}>
                            {u.estadoVerificacion}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/oficiales/admin/usuarios/${u.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
