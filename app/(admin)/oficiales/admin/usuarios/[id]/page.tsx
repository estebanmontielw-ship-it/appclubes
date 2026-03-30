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

  useEffect(() => {
    fetch(`/api/admin/usuarios/${params.id}`)
      .then((res) => res.json())
      .then((data) => setUsuario(data.usuario))
      .catch(() => {})
  }, [params.id])

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
                <a href={usuario.fotoCarnetUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={usuario.fotoCarnetUrl}
                    alt="Foto carnet"
                    className="h-32 w-32 rounded-lg object-cover border cursor-pointer hover:opacity-80"
                  />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No disponible</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-2 block">
                Foto de cédula
              </Label>
              {usuario.fotoCedulaUrl ? (
                <a
                  href={usuario.fotoCedulaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver foto de cédula
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
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
    </div>
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
