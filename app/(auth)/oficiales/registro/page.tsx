"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  registroStep1Schema,
  registroStep2Schema,
  registroStep3Schema,
  type RegistroStep1Data,
  type RegistroStep2Data,
} from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, ArrowLeft, ArrowRight, Upload, Gavel, ClipboardList, BarChart3 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CIUDADES_PY } from "@/lib/constants"
import type { TipoRol } from "@prisma/client"

const STEP_TITLES = [
  "Datos personales",
  "Seleccioná tu rol",
  "Documentación",
]

export default function RegistroPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1 data
  const [step1Data, setStep1Data] = useState<RegistroStep1Data | null>(null)
  // Step 2 data
  const [selectedRoles, setSelectedRoles] = useState<TipoRol[]>([])
  // Step 3 files
  const [fotoCedula, setFotoCedula] = useState<File | null>(null)
  const [fotoCarnet, setFotoCarnet] = useState<File | null>(null)
  const [confirmaDatos, setConfirmaDatos] = useState(false)

  // Step 1 form
  const step1Form = useForm<RegistroStep1Data>({
    resolver: zodResolver(registroStep1Schema),
    defaultValues: step1Data || undefined,
  })

  const handleStep1 = (data: RegistroStep1Data) => {
    setStep1Data(data)
    setStep(2)
  }

  const handleStep2 = () => {
    const result = registroStep2Schema.safeParse({ roles: selectedRoles })
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Seleccioná al menos un rol",
      })
      return
    }
    setStep(3)
  }

  const toggleRole = (role: TipoRol) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("bucket", bucket)

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  const handleSubmit = async () => {
    const step3Result = registroStep3Schema.safeParse({ confirmaDatos })
    if (!step3Result.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debés confirmar que los datos son verídicos",
      })
      return
    }

    if (!fotoCedula || !fotoCarnet) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Subí ambas fotos (cédula y tipo carnet)",
      })
      return
    }

    if (!step1Data) return

    setLoading(true)
    try {
      // Upload files
      const [fotoCedulaUrl, fotoCarnetUrl] = await Promise.all([
        uploadFile(fotoCedula, "fotos-cedula"),
        uploadFile(fotoCarnet, "fotos-carnet"),
      ])

      if (!fotoCedulaUrl || !fotoCarnetUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al subir los archivos. Intentá de nuevo.",
        })
        return
      }

      // Register user
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          roles: selectedRoles,
          fotoCedulaUrl,
          fotoCarnetUrl,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: error.error,
        })
        return
      }

      toast({
        title: "Registro exitoso",
        description: "Tu solicitud fue enviada. Te avisaremos cuando sea revisada.",
      })

      router.push("/oficiales/login")
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar el registro",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">CPB</span>
          </div>
          <CardTitle className="text-2xl">Registro — CPB Oficiales</CardTitle>
          <CardDescription>
            Paso {step} de 3 — {STEP_TITLES[step - 1]}
          </CardDescription>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        {/* STEP 1 — Datos personales */}
        {step === 1 && (
          <form onSubmit={step1Form.handleSubmit(handleStep1)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" {...step1Form.register("nombre")} />
                  {step1Form.formState.errors.nombre && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input id="apellido" {...step1Form.register("apellido")} />
                  {step1Form.formState.errors.apellido && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.apellido.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Número de CI *</Label>
                <Input
                  id="cedula"
                  placeholder="1234567"
                  {...step1Form.register("cedula")}
                />
                {step1Form.formState.errors.cedula && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.cedula.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de nacimiento *</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  {...step1Form.register("fechaNacimiento")}
                />
                {step1Form.formState.errors.fechaNacimiento && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.fechaNacimiento.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  placeholder="0981123456"
                  {...step1Form.register("telefono")}
                />
                {step1Form.formState.errors.telefono && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.telefono.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Select
                  onValueChange={(value) => step1Form.setValue("ciudad", value)}
                  defaultValue={step1Data?.ciudad}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná tu ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIUDADES_PY.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step1Form.formState.errors.ciudad && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.ciudad.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  {...step1Form.register("email")}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...step1Form.register("password")}
                  />
                  {step1Form.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repetí la contraseña"
                    {...step1Form.register("confirmPassword")}
                  />
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                ¿Ya tenés cuenta?{" "}
                <Link href="/oficiales/login" className="text-primary hover:underline font-medium">
                  Iniciá sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {/* STEP 2 — Roles */}
        {step === 2 && (
          <>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Podés seleccionar más de un rol
              </p>
              <div className="space-y-3">
                <RoleOption
                  icon={<Gavel className="h-6 w-6" />}
                  title="Árbitro"
                  description="Árbitro de partidos de basketball"
                  selected={selectedRoles.includes("ARBITRO")}
                  onClick={() => toggleRole("ARBITRO")}
                />
                <RoleOption
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="Oficial de Mesa"
                  description="Anotador, cronometrador u operador del marcador de 24s"
                  selected={selectedRoles.includes("MESA")}
                  onClick={() => toggleRole("MESA")}
                />
                <RoleOption
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Estadístico"
                  description="Registro de estadísticas durante los partidos"
                  selected={selectedRoles.includes("ESTADISTICO")}
                  onClick={() => toggleRole("ESTADISTICO")}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
              <Button className="flex-1" onClick={handleStep2}>
                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </>
        )}

        {/* STEP 3 — Documentación */}
        {step === 3 && (
          <>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Foto de cédula (frente y dorso) *</Label>
                <p className="text-xs text-muted-foreground">
                  Subí una foto clara donde se lean todos los datos. JPG, PNG o PDF, máx 5MB.
                </p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {fotoCedula ? fotoCedula.name : "Click para seleccionar archivo"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => setFotoCedula(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Foto tipo carnet *</Label>
                <p className="text-xs text-muted-foreground">
                  Foto de frente, fondo claro, sin sombras. JPG o PNG, máx 2MB.
                </p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {fotoCarnet ? fotoCarnet.name : "Click para seleccionar archivo"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setFotoCarnet(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirma"
                  checked={confirmaDatos}
                  onCheckedChange={(checked) =>
                    setConfirmaDatos(checked === true)
                  }
                />
                <label htmlFor="confirma" className="text-sm cursor-pointer">
                  Confirmo que los datos ingresados son verídicos
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar solicitud
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

function RoleOption({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
        selected
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          selected ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-primary bg-primary" : "border-gray-300"
        }`}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </button>
  )
}
