"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { ROL_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"

interface UsuarioDetalle {
  id: string
  nombre: string
  apellido: string
  cedula: string
  fechaNacimiento: string
  telefono: string
  ciudad: string
  email: string
  estadoVerificacion: EstadoVerificacion
  verificadoEn: string | null
  motivoRechazo: string | null
  fotoCedulaUrl: string | null
  fotoCarnetUrl: string | null
  createdAt: string
  roles: { rol: TipoRol }[]
}

export default function AdminUsuarioDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRechazoForm, setShowRechazoForm] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  const loadUser = () => {
    fetch(`/api/admin/usuarios/${params.id}`)
      .then((res) => res.json())
      .then((data) => setUsuario(data.usuario))
      .catch(() => {})
  }

  useEffect(() => { loadUser() }, [params.id])

  const handleAction = async (accion: string) => {
    if (accion === "rechazar" && !motivoRechazo.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ingresá un motivo de rechazo",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, motivoRechazo }),
      })

      if (res.ok) {
        const data = await res.json()
        setUsuario(data.usuario)
        setShowRechazoForm(false)
        setMotivoRechazo("")

        const labels: Record<string, string> = {
          verificar: "verificado",
          rechazar: "rechazado",
          suspender: "suspendido",
        }
        toast({ title: `Usuario ${labels[accion]}` })
      } else {
        const error = await res.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error,
        })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  const estadoColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    VERIFICADO: "success",
    PENDIENTE: "warning",
    RECHAZADO: "destructive",
    SUSPENDIDO: "secondary",
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {usuario.nombre} {usuario.apellido}
          </h1>
          <p className="text-muted-foreground">CI: {usuario.cedula}</p>
        </div>
        <Badge variant={estadoColor[usuario.estadoVerificacion]} className="text-sm">
          {usuario.estadoVerificacion}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User data */}
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Email" value={usuario.email} />
            <InfoRow label="Teléfono" value={usuario.telefono} />
            <InfoRow label="Ciudad" value={usuario.ciudad} />
            <InfoRow
              label="Fecha de nacimiento"
              value={formatDate(usuario.fechaNacimiento)}
            />
            <InfoRow label="Registrado el" value={formatDate(usuario.createdAt)} />
            {usuario.verificadoEn && (
              <InfoRow
                label="Verificado el"
                value={formatDate(usuario.verificadoEn)}
              />
            )}
            {usuario.motivoRechazo && (
              <div>
                <Label className="text-muted-foreground text-xs">
                  Motivo de rechazo
                </Label>
                <p className="text-sm text-red-600">{usuario.motivoRechazo}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">Roles</Label>
              <div className="flex gap-2 mt-1">
                {usuario.roles.map((r) => (
                  <Badge key={r.rol} variant="secondary">
                    {ROL_LABELS[r.rol] || r.rol}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs mb-2 block">
                Foto tipo carnet
              </Label>
              {usuario.fotoCarnetUrl ? (
                <img
                  src={usuario.fotoCarnetUrl}
                  alt="Foto carnet"
                  className="h-36 w-36 rounded-xl object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 hover:shadow-md transition-all"
                  onClick={() => setViewingImage(usuario.fotoCarnetUrl)}
                />
              ) : (
                <div className="h-36 w-36 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center">No disponible</p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-2 block">
                Foto de cédula
              </Label>
              {usuario.fotoCedulaUrl ? (
                <img
                  src={usuario.fotoCedulaUrl}
                  alt="Foto cédula"
                  className="max-w-full max-h-48 rounded-xl object-contain border-2 border-gray-200 cursor-pointer hover:opacity-80 hover:shadow-md transition-all"
                  onClick={() => setViewingImage(usuario.fotoCedulaUrl)}
                />
              ) : (
                <div className="h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">No disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image viewer overlay */}
        {viewingImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setViewingImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img
                src={viewingImage}
                alt="Documento"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setViewingImage(null)}
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(usuario.estadoVerificacion === "PENDIENTE" ||
        usuario.estadoVerificacion === "RECHAZADO") && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showRechazoForm ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo del rechazo *</Label>
                  <Input
                    id="motivo"
                    placeholder="Ej: La foto de cédula no es legible"
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("rechazar")}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar rechazo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRechazoForm(false)
                      setMotivoRechazo("")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleAction("verificar")}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRechazoForm(true)}
                  disabled={loading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction("suspender")}
                  disabled={loading}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspender
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {usuario.estadoVerificacion === "VERIFICADO" && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => handleAction("suspender")}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Ban className="mr-2 h-4 w-4" />
              Suspender usuario
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Role management */}
      {usuario.estadoVerificacion === "VERIFICADO" && (
        <RoleManager usuarioId={usuario.id} currentRoles={usuario.roles.map((r) => r.rol)} onUpdate={loadUser} />
      )}
    </div>
  )
}

function RoleManager({ usuarioId, currentRoles, onUpdate }: { usuarioId: string; currentRoles: string[]; onUpdate: () => void }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const adminRoles = [
    { rol: "INSTRUCTOR", label: "Instructor", desc: "Puede crear y gestionar cursos, revisar exámenes" },
    { rol: "DESIGNADOR", label: "Designador", desc: "Puede crear partidos y designar oficiales" },
  ]

  const toggleRole = async (rol: string) => {
    setSaving(true)
    try {
      const hasRole = currentRoles.includes(rol)
      const res = await fetch(`/api/admin/usuarios/${usuarioId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, accion: hasRole ? "quitar" : "agregar" }),
      })
      if (res.ok) {
        toast({ title: hasRole ? `Rol ${rol} removido` : `Rol ${rol} asignado` })
        onUpdate()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles administrativos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Asigná roles especiales a este usuario. Un usuario puede tener múltiples roles.</p>
        {adminRoles.map((r) => {
          const hasRole = currentRoles.includes(r.rol)
          return (
            <div key={r.rol} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Button
                size="sm"
                variant={hasRole ? "default" : "outline"}
                onClick={() => toggleRole(r.rol)}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {hasRole ? "Activo" : "Asignar"}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
