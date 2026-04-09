"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageSkeleton } from "@/components/ui/skeleton"
import {
  Users, UserCheck, Clock, DollarSign, BookOpen,
  ArrowRight, Eye, Trophy, Upload, Send, GraduationCap,
  AlertCircle, CheckCircle, XCircle, CreditCard, Bell,
  Search, Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import PortalInstallPrompt from "@/components/PortalInstallPrompt"
import { ROL_LABELS } from "@/lib/constants"

interface Stats {
  usuariosTotales: number
  verificados: number
  pendientesVerificacion: number
  rechazados: number
  pendientesPagos: number
  cursosActivos: number
  inscripcionesActivas: number
  ctTotal: number
  ctHabilitados: number
  ctPendientes: number
  ctSinPago: number
  noticiasPublicadas: number
  mensajesSinLeer: number
  ultimosUsuarios: {
    id: string
    nombre: string
    apellido: string
    cedula: string
    ciudad: string
    estadoVerificacion: string
    createdAt: string
    fotoCarnetUrl?: string | null
    roles: { rol: string }[]
  }[]
  ultimosPagos: {
    id: string
    monto: number
    createdAt: string
    inscripcion: {
      usuario: { nombre: string; apellido: string }
      curso: { nombre: string }
    }
  }[]
  ultimosCT: {
    id: string
    nombre: string
    apellido: string
    rol: string
    estadoHabilitacion: string
    createdAt: string
    fotoCarnetUrl?: string | null
  }[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const [res1, res2, res3] = await Promise.all([
        fetch(`/api/admin/usuarios?buscar=${encodeURIComponent(q)}&limite=5`),
        fetch(`/api/admin/cuerpotecnico?buscar=${encodeURIComponent(q)}&limite=5`),
        fetch(`/api/ct/buscar?q=${encodeURIComponent(q)}`),
      ])
      const [data1, data2, data3] = await Promise.all([res1.json(), res2.json(), res3.json()])
      const oficiales = (data1.usuarios || []).map((u: any) => ({ ...u, _type: "oficial" }))
      const cts = (data2.miembros || []).map((c: any) => ({ ...c, _type: "ct" }))
      const preVerified = (data3.preVerified || []).map((p: any) => ({ ...p, _type: "pre", id: `pre-${p.nombre}` }))
      setSearchResults([...oficiales, ...cts, ...preVerified])
    } catch {} finally { setSearching(false) }
  }

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) return <PageSkeleton />

  const hora = new Date().getHours()
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches"
  const totalPendientes = stats.pendientesVerificacion + stats.pendientesPagos + stats.ctPendientes

  const estadoColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    VERIFICADO: "success", PENDIENTE: "warning", RECHAZADO: "destructive", SUSPENDIDO: "secondary",
  }

  return (
    <div className="space-y-6">
      <PortalInstallPrompt portalName="CPB Admin" portalDesc="Accedé directo al panel de administración desde tu celular" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{saludo}</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar oficial o cuerpo técnico por nombre, CI o email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            style={{ fontSize: "16px" }}
          />
          {searching && <Loader2 className="absolute right-3 top-3 h-5 w-5 text-gray-400 animate-spin" />}
        </div>
        {searchResults.length > 0 && searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 max-h-80 overflow-y-auto">
            {searchResults.map((r) => (
              r._type === "pre" ? (
                <div key={r.id} className="border-b border-gray-50 last:border-0 bg-amber-50/50">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-amber-100">
                      <Users className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                      <p className="text-xs text-amber-600">Pre-registrado (108) · {r.rol}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Puede estar en la cancha pero debe registrarse en el portal para el siguiente encuentro</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                      NO REGISTRADO
                    </span>
                  </div>
                  <div className="px-4 pb-3 flex items-center gap-3">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent("https://cpb.com.py/cuerpotecnico/registro")}`} alt="QR" className="w-14 h-14 rounded-lg border" />
                    <div className="text-xs text-amber-700">
                      <p className="font-semibold">QR de registro</p>
                      <p>Escaneá para registrarte en cpb.com.py/cuerpotecnico/registro</p>
                    </div>
                  </div>
                </div>
              ) : (
              <Link
                key={r.id}
                href={r._type === "oficial" ? `/oficiales/admin/usuarios/${r.id}` : `/oficiales/admin/cuerpotecnico/${r.id}`}
                onClick={() => { setSearchQuery(""); setSearchResults([]) }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                {r.fotoCarnetUrl ? (
                  <img src={r.fotoCarnetUrl} alt="" className="shrink-0 w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${r._type === "oficial" ? "bg-blue-100" : "bg-green-100"}`}>
                    <Users className={`h-4 w-4 ${r._type === "oficial" ? "text-blue-600" : "text-green-600"}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.nombre} {r.apellido}</p>
                  <p className="text-xs text-gray-500">
                    CI: {r.cedula} · {r._type === "oficial" ? "Oficial" : `CT - ${r.rol}`}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  (r.estadoVerificacion === "VERIFICADO" || r.estadoHabilitacion === "HABILITADO") ? "bg-green-100 text-green-700" :
                  (r.estadoVerificacion === "PENDIENTE" || r.estadoHabilitacion === "PENDIENTE") ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {r.estadoVerificacion || r.estadoHabilitacion}
                </span>
              </Link>
              )
            ))}
            {searchResults.length === 0 && (
              <div className="p-5 text-center">
                <p className="text-sm text-gray-500 mb-3">No se encontró a <strong>{searchQuery}</strong></p>
                <p className="text-xs text-gray-400 mb-4">Si es miembro del cuerpo técnico, puede registrarse escaneando este QR:</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://cpb.com.py/cuerpotecnico/registro")}`} alt="QR Registro" className="w-32 h-32 mx-auto rounded-xl border" />
                <p className="text-xs text-primary font-medium mt-2">cpb.com.py/cuerpotecnico/registro</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alert banner */}
      {totalPendientes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Tenés{" "}
              {stats.pendientesVerificacion > 0 && (
                <strong>{stats.pendientesVerificacion} perfil{stats.pendientesVerificacion > 1 ? "es" : ""} pendiente{stats.pendientesVerificacion > 1 ? "s" : ""}</strong>
              )}
              {stats.pendientesVerificacion > 0 && stats.pendientesPagos > 0 && " y "}
              {stats.pendientesPagos > 0 && (
                <strong>{stats.pendientesPagos} pago{stats.pendientesPagos > 1 ? "s" : ""} por revisar</strong>
              )}
              {(stats.pendientesVerificacion > 0 || stats.pendientesPagos > 0) && stats.ctPendientes > 0 && " y "}
              {stats.ctPendientes > 0 && (
                <strong>{stats.ctPendientes} CT pendiente{stats.ctPendientes > 1 ? "s" : ""}</strong>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {stats.pendientesVerificacion > 0 && (
              <Link href="/oficiales/admin/usuarios?estado=PENDIENTE">
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  Ver perfiles
                </Button>
              </Link>
            )}
            {stats.pendientesPagos > 0 && (
              <Link href="/oficiales/admin/pagos">
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  Ver pagos
                </Button>
              </Link>
            )}
            {stats.ctPendientes > 0 && (
              <Link href="/oficiales/admin/cuerpotecnico?estado=PENDIENTE">
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  Ver CT
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Oficiales Metrics */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Oficiales</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard href="/oficiales/admin/usuarios" icon={Users} label="Usuarios" value={stats.usuariosTotales} desc="registrados" color="blue" />
        <MetricCard href="/oficiales/admin/usuarios?estado=VERIFICADO" icon={UserCheck} label="Verificados" value={stats.verificados} desc="con carnet activo" color="green" />
        <MetricCard href="/oficiales/admin/usuarios?estado=PENDIENTE" icon={Clock} label="Pendientes" value={stats.pendientesVerificacion} desc="esperando verificación" color={stats.pendientesVerificacion > 0 ? "amber" : "gray"} urgent={stats.pendientesVerificacion > 0} />
        <MetricCard href="/oficiales/admin/pagos" icon={DollarSign} label="Pagos" value={stats.pendientesPagos} desc="por revisar" color={stats.pendientesPagos > 0 ? "amber" : "gray"} urgent={stats.pendientesPagos > 0} />
        <MetricCard href="/oficiales/admin/cursos" icon={BookOpen} label="Cursos" value={stats.cursosActivos} desc="activos" color="purple" />
      </div>
      </div>

      {/* CT Metrics */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cuerpo Técnico</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard href="/oficiales/admin/cuerpotecnico" icon={Users} label="CT Total" value={stats.ctTotal} desc="registrados" color="blue" />
          <MetricCard href="/oficiales/admin/cuerpotecnico?estado=HABILITADO" icon={UserCheck} label="Habilitados" value={stats.ctHabilitados} desc="con carnet activo" color="green" />
          <MetricCard href="/oficiales/admin/cuerpotecnico?estado=PENDIENTE" icon={Clock} label="CT Pendientes" value={stats.ctPendientes} desc="esperando habilitación" color={stats.ctPendientes > 0 ? "amber" : "gray"} urgent={stats.ctPendientes > 0} />
          <MetricCard href="/oficiales/admin/website/contacto" icon={Bell} label="Mensajes" value={stats.mensajesSinLeer} desc="sin leer" color={stats.mensajesSinLeer > 0 ? "amber" : "gray"} urgent={stats.mensajesSinLeer > 0} />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.pendientesVerificacion > 0 && (
              <ActionItem href="/oficiales/admin/usuarios?estado=PENDIENTE" icon={UserCheck} label="Verificar perfiles" desc={`${stats.pendientesVerificacion} esperando`} color="amber" />
            )}
            {stats.pendientesPagos > 0 && (
              <ActionItem href="/oficiales/admin/pagos" icon={DollarSign} label="Revisar comprobantes" desc={`${stats.pendientesPagos} por confirmar`} color="amber" />
            )}
            {stats.ctPendientes > 0 && (
              <ActionItem href="/oficiales/admin/cuerpotecnico?estado=PENDIENTE" icon={UserCheck} label="Habilitar cuerpo técnico" desc={`${stats.ctPendientes} esperando`} color="amber" />
            )}
            {stats.mensajesSinLeer > 0 && (
              <ActionItem href="/oficiales/admin/website/contacto" icon={Bell} label="Mensajes de contacto" desc={`${stats.mensajesSinLeer} sin leer`} color="amber" />
            )}
            <ActionItem href="/oficiales/admin/partidos" icon={Trophy} label="Crear nuevo partido" desc="Programar partido oficial" color="blue" />
            <ActionItem href="/oficiales/admin/recursos" icon={Upload} label="Agregar recurso" desc="PDF, video o link FIBA" color="green" />
            <ActionItem href="/oficiales/admin/notificaciones" icon={Send} label="Enviar comunicación" desc="Notificación o email masivo" color="purple" />
            <ActionItem href="/oficiales/admin/cursos" icon={GraduationCap} label="Gestionar cursos" desc={`${stats.cursosActivos} activos, ${stats.inscripcionesActivas} inscriptos`} color="indigo" />
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ultimosUsuarios.length === 0 && stats.ultimosPagos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Recent payments pending */}
                {stats.ultimosPagos.map((pago) => (
                  <div key={pago.id} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-yellow-100 mt-0.5">
                      <CreditCard className="h-3.5 w-3.5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <strong>{pago.inscripcion.usuario.nombre} {pago.inscripcion.usuario.apellido}</strong> envió comprobante para <strong>{pago.inscripcion.curso.nombre}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(pago.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {/* Recent CT */}
                {stats.ultimosCT?.slice(0, 3).map((ct) => (
                  <Link key={ct.id} href={`/oficiales/admin/cuerpotecnico/${ct.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors">
                    {ct.fotoCarnetUrl ? (
                      <img src={ct.fotoCarnetUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${ct.estadoHabilitacion === "HABILITADO" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {ct.nombre.charAt(0)}{ct.apellido.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <strong>{ct.nombre} {ct.apellido}</strong> (CT - {ct.rol}){" "}
                        {ct.estadoHabilitacion === "HABILITADO" ? "fue habilitado" : "se registró"}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(ct.createdAt)}</p>
                    </div>
                  </Link>
                ))}
                {/* Recent users */}
                {stats.ultimosUsuarios.slice(0, 5).map((u) => (
                  <Link key={u.id} href={`/oficiales/admin/usuarios/${u.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors">
                    {u.fotoCarnetUrl ? (
                      <img src={u.fotoCarnetUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        u.estadoVerificacion === "VERIFICADO" ? "bg-green-100 text-green-700" :
                        u.estadoVerificacion === "PENDIENTE" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      }`}>
                        {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <strong>{u.nombre} {u.apellido}</strong>{" "}
                        {u.estadoVerificacion === "VERIFICADO" ? "fue verificado" :
                         u.estadoVerificacion === "PENDIENTE" ? "se registró" : "fue rechazado"}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent users table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Últimos usuarios registrados</CardTitle>
            <Link href="/oficiales/admin/usuarios">
              <Button variant="ghost" size="sm" className="text-xs">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Roles</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Ciudad</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosUsuarios.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{u.nombre.charAt(0)}{u.apellido.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.nombre} {u.apellido}</p>
                          <p className="text-xs text-muted-foreground">CI: {u.cedula}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <Badge key={r.rol} variant="outline" className="text-[10px]">{ROL_LABELS[r.rol] || r.rol}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell">{u.ciudad}</td>
                    <td className="p-3">
                      <Badge variant={estadoColor[u.estadoVerificacion]} className="text-[10px]">
                        {u.estadoVerificacion}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/oficiales/admin/usuarios/${u.id}`}>
                        <Button size="sm" variant={u.estadoVerificacion === "PENDIENTE" ? "default" : "outline"} className="text-xs h-7">
                          {u.estadoVerificacion === "PENDIENTE" ? "Verificar" : "Ver"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ href, icon: Icon, label, value, desc, color, urgent }: {
  href: string; icon: React.ElementType; label: string; value: number; desc: string; color: string; urgent?: boolean
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-400",
    indigo: "bg-indigo-100 text-indigo-600",
  }
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-all cursor-pointer h-full ${urgent ? "border-amber-200 bg-amber-50/30" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${colors[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
            {urgent && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <p className="text-2xl font-bold">{value.toLocaleString("es-PY")}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function ActionItem({ href, icon: Icon, label, desc, color }: {
  href: string; icon: React.ElementType; label: string; desc: string; color: string
}) {
  const colors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
  }
  const isUrgent = color === "amber"
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-all hover:bg-gray-50 ${isUrgent ? "bg-amber-50/50" : ""}`}>
        <div className={`p-2 rounded-lg shrink-0 ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
      </div>
    </Link>
  )
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return formatDate(dateStr)
}
