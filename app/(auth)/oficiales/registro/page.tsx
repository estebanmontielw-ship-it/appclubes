"use client"

import { useState, useCallback } from "react"
import Cropper, { Area } from "react-easy-crop"
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
import { Combobox } from "@/components/ui/combobox"
import { Loader2, ArrowLeft, ArrowRight, Upload, Gavel, ClipboardList, BarChart3 } from "lucide-react"
import { getBarrios } from "@/lib/barrios"
import { useToast } from "@/components/ui/use-toast"
import { CIUDADES_PARAGUAY } from "@/lib/ciudades-paraguay"
import { NACIONALIDADES } from "@/lib/nacionalidades"
import type { TipoRol } from "@prisma/client"

const STEP_TITLES = [
  "Datos personales",
  "Seleccioná tu rol",
  "Documentación",
]

async function getCroppedImg(imageSrc: string, pixelCrop: Area, size = 500): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = "anonymous"
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageSrc })
  const canvas = document.createElement("canvas")
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)
  return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9) })
}

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
  // Cropper state for foto carnet
  // Barrio
  const [selectedCiudad, setSelectedCiudad] = useState("")
  const [barrio, setBarrio] = useState("")
  const [barrioCustom, setBarrioCustom] = useState("")

  const [carnetSrc, setCarnetSrc] = useState<string | null>(null)
  const [carnetCrop, setCarnetCrop] = useState({ x: 0, y: 0 })
  const [carnetZoom, setCarnetZoom] = useState(1)
  const [carnetCroppedArea, setCarnetCroppedArea] = useState<Area | null>(null)
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null)

  const onCarnetCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCarnetCroppedArea(croppedPixels)
  }, [])

  const handleCarnetFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setCarnetSrc(reader.result as string)
      setCarnetCrop({ x: 0, y: 0 })
      setCarnetZoom(1)
      setCarnetPreview(null)
    }
    reader.readAsDataURL(file)
  }

  const handleCarnetCropConfirm = async () => {
    if (!carnetSrc || !carnetCroppedArea) return
    const blob = await getCroppedImg(carnetSrc, carnetCroppedArea, 500)
    const file = new File([blob], "foto-carnet.jpg", { type: "image/jpeg" })
    setFotoCarnet(file)
    setCarnetPreview(URL.createObjectURL(blob))
    setCarnetSrc(null)
  }

  // Step 1 form
  const step1Form = useForm<RegistroStep1Data>({
    resolver: zodResolver(registroStep1Schema),
    defaultValues: step1Data || { segundoNombre: "", segundoApellido: "" },
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

      // Concatenate name fields
      const nombre = [step1Data.primerNombre, step1Data.segundoNombre].filter(Boolean).join(" ")
      const apellido = [step1Data.primerApellido, step1Data.segundoApellido].filter(Boolean).join(" ")

      // Register user
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          nombre,
          apellido,
          barrio: barrio === "Mi barrio no figura" ? barrioCustom : barrio,
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
          <img src="/logo-cpb.jpg" alt="CPB" className="mx-auto mb-4 h-20 w-20 object-contain" />
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
                  <Label htmlFor="primerNombre">Primer nombre *</Label>
                  <Input id="primerNombre" {...step1Form.register("primerNombre")} />
                  {step1Form.formState.errors.primerNombre && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.primerNombre.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segundoNombre">Segundo nombre</Label>
                  <Input id="segundoNombre" {...step1Form.register("segundoNombre")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primerApellido">Primer apellido *</Label>
                  <Input id="primerApellido" {...step1Form.register("primerApellido")} />
                  {step1Form.formState.errors.primerApellido && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.primerApellido.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segundoApellido">Segundo apellido</Label>
                  <Input id="segundoApellido" {...step1Form.register("segundoApellido")} />
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
                <Combobox
                  options={CIUDADES_PARAGUAY}
                  value={step1Form.watch("ciudad") || ""}
                  onValueChange={(value) => { step1Form.setValue("ciudad", value); setSelectedCiudad(value); setBarrio(""); setBarrioCustom("") }}
                  placeholder="Seleccioná tu ciudad"
                  searchPlaceholder="Escribí para buscar ciudad..."
                  emptyMessage="Ciudad no encontrada"
                />
                {step1Form.formState.errors.ciudad && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.ciudad.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nacionalidad *</Label>
                <Combobox
                  options={NACIONALIDADES}
                  value={step1Form.watch("nacionalidad") || ""}
                  onValueChange={(value) => step1Form.setValue("nacionalidad", value)}
                  placeholder="Seleccioná tu nacionalidad"
                  searchPlaceholder="Escribí para buscar..."
                  emptyMessage="Nacionalidad no encontrada"
                />
                {step1Form.formState.errors.nacionalidad && (
                  <p className="text-xs text-destructive">
                    {step1Form.formState.errors.nacionalidad.message}
                  </p>
                )}
              </div>

              {selectedCiudad && (
                <div className="space-y-2">
                  <Label>Barrio</Label>
                  <Select value={barrio} onValueChange={(v) => { setBarrio(v); if (v !== "Mi barrio no figura") setBarrioCustom("") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná tu barrio" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBarrios(selectedCiudad).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {barrio === "Mi barrio no figura" && (
                    <Input placeholder="Escribí tu barrio" value={barrioCustom} onChange={(e) => setBarrioCustom(e.target.value)} />
                  )}
                </div>
              )}

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
                    placeholder="Mín 8 caracteres"
                    {...step1Form.register("password")}
                  />
                  {step1Form.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {step1Form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
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
              {(() => {
                const pwd = step1Form.watch("password") || ""
                return (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">Requisitos de la contraseña:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      <li className={pwd.length >= 8 ? "text-green-600" : ""}>
                        {pwd.length >= 8 ? "\u2713" : "\u2022"} Mínimo 8 caracteres
                      </li>
                      <li className={/[A-Z]/.test(pwd) ? "text-green-600" : ""}>
                        {/[A-Z]/.test(pwd) ? "\u2713" : "\u2022"} Al menos una letra mayúscula
                      </li>
                      <li className={/[0-9]/.test(pwd) ? "text-green-600" : ""}>
                        {/[0-9]/.test(pwd) ? "\u2713" : "\u2022"} Al menos un número
                      </li>
                    </ul>
                  </div>
                )
              })()}
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
                  Foto de frente, fondo claro, sin sombras. Se recorta a 500x500 automáticamente.
                </p>

                {carnetPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={carnetPreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border-2 border-green-200" />
                    <Button type="button" variant="outline" size="sm" onClick={() => { setCarnetPreview(null); setFotoCarnet(null); setCarnetSrc(null) }}>
                      Cambiar foto
                    </Button>
                  </div>
                ) : carnetSrc ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden bg-black">
                      <Cropper
                        image={carnetSrc}
                        crop={carnetCrop}
                        zoom={carnetZoom}
                        aspect={1}
                        onCropChange={setCarnetCrop}
                        onZoomChange={setCarnetZoom}
                        onCropComplete={onCarnetCropComplete}
                        cropShape="rect"
                        showGrid={true}
                      />
                    </div>
                    <div className="flex items-center gap-3 max-w-[280px] mx-auto">
                      <span className="text-xs text-muted-foreground">Zoom</span>
                      <input type="range" min={1} max={3} step={0.1} value={carnetZoom}
                        onChange={(e) => setCarnetZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button type="button" size="sm" onClick={handleCarnetCropConfirm}>Confirmar recorte</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setCarnetSrc(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click para seleccionar foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCarnetFileSelect} />
                  </label>
                )}
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
