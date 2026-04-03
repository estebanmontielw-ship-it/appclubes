"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Users, UserCheck, Clock, DollarSign, Trash2, RotateCcw } from "lucide-react"
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
  activo: boolean
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
  { label: "Eliminados", value: "ELIMINADOS" },
]

const estadoColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  HABILITADO: "success", PENDIENTE: "warning", RECHAZADO: "destructive", SUSPENDIDO: "secondary",
}

function AdminCTContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL es la fuente de verdad
  const eliminados = searchParams.get("eliminados") === "true"
  const filtro = eliminados ? "ELIMINADOS" : (searchParams.get("estado") || "")

  const [miembros, setMiembros] = useState<CTMember[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<CTMember | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const setFiltro = (value: string) => {
    const base = "/oficiales/admin/cuerpotecnico"
    if (value === "ELIMINADOS") router.push(`${base}?eliminados=true`)
    else if (value) router.push(`${base}?estado=${value}`)
    else router.push(base)
  }

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtro === "ELIMINADOS") {
      params.set("eliminados", "true")
    } else if (filtro) {
      params.set("estado", filtro)
    }

    Promise.all([
      fetch(`/api/admin/cuerpotecnico?${params}`).then(r => r.json()),
      fetch("/api/admin/cuerpotecnico?tipo=stats").then(r => r.json()),
    ]).then(([data, statsData]) => {
      setMiembros(data.miembros || [])
      setStats(statsData)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filtro])

  const filtered = miembros.filter(m =>
    !buscar || `${m.nombre} ${m.apellido} ${m.cedula}`.toLowerCase().includes(buscar.toLowerCase())
  )

  const handleEliminar = async () => {
    if (!confirmDelete) return
    setActionLoading(true)
    try {
      await fetch(`/api/admin/cuerpotecnico/${confirmDelete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "eliminar" }),
      })
      setConfirmDelete(null)
      fetchData()
    } catch {} finally {
      setActionLoading(false)
    }
  }

  const handleRestaurar = async (m: CTMember) => {
    setActionLoading(true)
    try {
      await fetch(`/api/admin/cuerpotecnico/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "restaurar" }),
      })
      fetchData()
    } catch {} finally {
      setActionLoading(false)
    }
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
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TABS.map(t => (
            <Button
              key={t.value}
              variant={filtro === t.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(t.value)}
              className={`shrink-0 ${t.value === "ELIMINADOS" ? "border-red-200 text-red-600 hover:bg-red-50" : ""}`}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o CI..." className="pl-9" value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {filtro === "ELIMINADOS" ? "No hay miembros eliminados" : "No se encontraron miembros"}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map(m => {
                  const pagoBadge = m.pagoAutoVerificado
                    ? <Badge variant="success" className="text-[10px]">Auto-verificado</Badge>
                    : m.pagoVerificado
                    ? <Badge variant="success" className="text-[10px]">Pago ok</Badge>
                    : m.comprobanteUrl
                    ? <Badge variant="secondary" className="text-[10px]">Pago pendiente</Badge>
                    : <Badge variant="warning" className="text-[10px]">Sin pago</Badge>

                  return (
                    <div key={m.id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{m.nombre} {m.apellido}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">CI: {m.cedula}</p>
                          <div className="flex gap-1.5 flex-wrap mt-1.5">
                            <Badge variant="outline" className="text-[10px]">{ROL_LABELS[m.rol] || m.rol}</Badge>
                            {pagoBadge}
                            {filtro !== "ELIMINADOS" && (
                              <Badge variant={estadoColor[m.estadoHabilitacion]} className="text-[10px]">{m.estadoHabilitacion}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {filtro === "ELIMINADOS" ? (
                          <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRestaurar(m)} disabled={actionLoading}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Restaurar
                          </Button>
                        ) : (
                          <>
                            <Link href={`/oficiales/admin/cuerpotecnico/${m.id}`} className="flex-1">
                              <Button size="sm" variant={m.estadoHabilitacion === "PENDIENTE" ? "default" : "outline"} className="w-full">
                                {m.estadoHabilitacion === "PENDIENTE" ? "Revisar" : "Ver"}
                              </Button>
                            </Link>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3" onClick={() => setConfirmDelete(m)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nombre</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rol</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Pago</th>
                      {filtro !== "ELIMINADOS" && (
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estado</th>
                      )}
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
                        <td className="p-3">
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
                        {filtro !== "ELIMINADOS" && (
                          <td className="p-3">
                            <Badge variant={estadoColor[m.estadoHabilitacion]} className="text-xs">
                              {m.estadoHabilitacion}
                            </Badge>
                          </td>
                        )}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {filtro === "ELIMINADOS" ? (
                              <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRestaurar(m)} disabled={actionLoading}>
                                <RotateCcw className="h-3 w-3 mr-1" />Restaurar
                              </Button>
                            ) : (
                              <>
                                <Link href={`/oficiales/admin/cuerpotecnico/${m.id}`}>
                                  <Button size="sm" variant={m.estadoHabilitacion === "PENDIENTE" ? "default" : "outline"} className="text-xs h-7">
                                    {m.estadoHabilitacion === "PENDIENTE" ? "Revisar" : "Ver"}
                                  </Button>
                                </Link>
                                <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50 px-2" onClick={() => setConfirmDelete(m)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a <strong>{confirmDelete?.nombre} {confirmDelete?.apellido}</strong>. Esta acción puede revertirse desde la pestaña "Eliminados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminCTPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminCTContent />
    </Suspense>
  )
}
