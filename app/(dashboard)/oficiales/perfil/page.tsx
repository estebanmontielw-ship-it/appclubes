"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, ShieldCheck, Trash2 } from "lucide-react"
import Link from "next/link"
import { ProfileSkeleton } from "@/components/ui/skeleton"
import { ROL_LABELS, CIUDADES_PY } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import PhotoUpload from "@/components/profile/PhotoUpload"
import type { TipoRol, EstadoVerificacion } from "@prisma/client"

interface PerfilData {
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
  fotoCarnetUrl: string | null
  fotoCedulaUrl: string | null
  genero: string
  roles: { rol: TipoRol }[]
}

interface EditForm {
  telefono: string
  ciudad: string
}

export default function PerfilPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch("/api/cuenta", { method: "DELETE" })
      if (res.ok) {
        router.push("/login?cuenta=eliminada")
      } else {
        const data = await res.json()
        toast({ variant: "destructive", title: data.error || "Error al eliminar la cuenta" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setDeleting(false)
    }
  }

  const { register, handleSubmit, setValue, reset } = useForm<EditForm>()

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setPerfil(data.usuario)
        reset({
          telefono: data.usuario.telefono,
          ciudad: data.usuario.ciudad,
        })
      })
      .catch(() => {})
  }, [reset])

  const onSubmit = async (formData: EditForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const updated = await res.json()
        setPerfil((prev) => (prev ? { ...prev, ...updated.usuario } : prev))
        setEditing(false)
        toast({ title: "Perfil actualizado" })
      } else {
        toast({ variant: "destructive", title: "Error al guardar" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  if (!perfil) {
    return <ProfileSkeleton />
  }

  const estadoColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    VERIFICADO: "success",
    PENDIENTE: "warning",
    RECHAZADO: "destructive",
    SUSPENDIDO: "secondary",
  }

  const estadoLabel: Record<string, string> = {
    VERIFICADO: "Verificado",
    PENDIENTE: "Pendiente",
    RECHAZADO: "Rechazado",
    SUSPENDIDO: "Suspendido",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {perfil.roles.some((r) => r.rol === "VERIFICADOR") && (
        <Link href="/oficiales/admin/usuarios?estado=PENDIENTE">
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
            <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">Tenés acceso al panel de verificación</p>
              <p className="text-xs text-blue-600">Tocá para ver los oficiales pendientes</p>
            </div>
            <span className="text-blue-400 text-lg">›</span>
          </div>
        </Link>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos personales</CardTitle>
            <Badge variant={estadoColor[perfil.estadoVerificacion]}>
              {estadoLabel[perfil.estadoVerificacion]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo Upload */}
          <div className="mb-4">
            <PhotoUpload
              currentPhotoUrl={perfil.fotoCarnetUrl}
              onPhotoUpdated={(url) =>
                setPerfil((prev) => (prev ? { ...prev, fotoCarnetUrl: url } : prev))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Nombre</Label>
              <p className="font-medium">{perfil.nombre}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Apellido</Label>
              <p className="font-medium">{perfil.apellido}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">CI</Label>
              <p className="font-medium">{perfil.cedula}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Fecha de nacimiento</Label>
              <p className="font-medium">{formatDate(perfil.fechaNacimiento)}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Género</Label>
            <p className="font-medium">{perfil.genero || "—"}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p className="font-medium">{perfil.email}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Roles</Label>
            <div className="flex gap-2 mt-1">
              {perfil.roles.map((r) => (
                <Badge key={r.rol} variant="secondary">
                  {ROL_LABELS[r.rol] || r.rol}
                </Badge>
              ))}
            </div>
          </div>

          {perfil.verificadoEn && (
            <div>
              <Label className="text-muted-foreground text-xs">
                Verificado el
              </Label>
              <p className="font-medium">{formatDate(perfil.verificadoEn)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datos editables</CardTitle>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                disabled={!editing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              {editing ? (
                <Select
                  defaultValue={perfil.ciudad}
                  onValueChange={(v) => setValue("ciudad", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_PY.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={perfil.ciudad} disabled />
              )}
            </div>

            {editing && (
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    reset({
                      telefono: perfil.telefono,
                      ciudad: perfil.ciudad,
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 text-base">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Eliminar tu cuenta es una acción permanente. Se borrarán tus datos personales,
            fotos y acceso al portal. Los registros de partidos arbitrados se conservan
            de forma anónima por requisitos deportivos.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar mi cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán
                  tu nombre, email, teléfono, foto, cédula, carnet y acceso al portal.
                  {"\n\n"}
                  Los registros de partidos arbitrados se conservan de forma anónima
                  por requisitos deportivos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sí, eliminar mi cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
