"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cropper, { Area } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, ArrowLeft, ArrowRight, Upload, Camera } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CIUDADES_PARAGUAY } from "@/lib/ciudades-paraguay"
import { NACIONALIDADES } from "@/lib/nacionalidades"

const ROLES_CT = [
  { value: "ENTRENADOR_NACIONAL", label: "Entrenador Nacional", precio: "Gs. 300.000" },
  { value: "ENTRENADOR_EXTRANJERO", label: "Entrenador Extranjero", precio: "Gs. 700.000" },
  { value: "ASISTENTE", label: "Asistente", precio: "Gs. 200.000" },
  { value: "PREPARADOR_FISICO", label: "Preparador Físico", precio: "Gs. 200.000" },
  { value: "FISIO", label: "Fisioterapeuta", precio: "Gs. 200.000" },
  { value: "UTILERO", label: "Utilero", precio: "Gs. 100.000" },
]

const STEP_TITLES = ["Datos personales", "Rol y documentos", "Facturación"]

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

export default function RegistroCTPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cedula, setCedula] = useState("")
  const [fechaNac, setFechaNac] = useState("")
  const [telefono, setTelefono] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [genero, setGenero] = useState("")
  const [nacionalidad, setNacionalidad] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Step 2
  const [rol, setRol] = useState("")
  const [tieneTitulo, setTieneTitulo] = useState(false)
  const [fotoCedula, setFotoCedula] = useState<File | null>(null)
  const [fotoCarnet, setFotoCarnet] = useState<File | null>(null)
  const [tituloFile, setTituloFile] = useState<File | null>(null)

  // Cropper
  const [carnetSrc, setCarnetSrc] = useState<string | null>(null)
  const [carnetCrop, setCarnetCrop] = useState({ x: 0, y: 0 })
  const [carnetZoom, setCarnetZoom] = useState(1)
  const [carnetCroppedArea, setCarnetCroppedArea] = useState<Area | null>(null)
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null)

  // Step 3
  const [razonSocial, setRazonSocial] = useState("")
  const [ruc, setRuc] = useState("")
  const [confirmaDatos, setConfirmaDatos] = useState(false)

  const onCarnetCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCarnetCroppedArea(croppedPixels)
  }, [])

  const handleCarnetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => { setCarnetSrc(reader.result as string); setCarnetPreview(null) }
    reader.readAsDataURL(file)
  }

  const handleCarnetCropConfirm = async () => {
    if (!carnetSrc || !carnetCroppedArea) return
    const blob = await getCroppedImg(carnetSrc, carnetCroppedArea, 500)
    setFotoCarnet(new File([blob], "foto-carnet.jpg", { type: "image/jpeg" }))
    setCarnetPreview(URL.createObjectURL(blob))
    setCarnetSrc(null)
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

  const validateStep1 = () => {
    if (!nombre || !apellido || !cedula || !fechaNac || !telefono || !ciudad || !genero || !nacionalidad || !email || !password) {
      toast({ variant: "destructive", title: "Completá todos los campos" }); return false
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" }); return false
    }
    if (password.length < 8) {
      toast({ variant: "destructive", title: "La contraseña debe tener al menos 8 caracteres" }); return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!rol) { toast({ variant: "destructive", title: "Seleccioná tu rol" }); return false }
    if (!fotoCedula) { toast({ variant: "destructive", title: "Subí la foto de tu cédula" }); return false }
    if (!fotoCarnet) { toast({ variant: "destructive", title: "Subí tu foto tipo carnet" }); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!confirmaDatos) {
      toast({ variant: "destructive", title: "Confirmá que los datos son verídicos" }); return
    }

    setLoading(true)
    try {
      const [fotoCedulaUrl, fotoCarnetUrl, tituloUrl] = await Promise.all([
        fotoCedula ? uploadFile(fotoCedula, "fotos-cedula") : null,
        fotoCarnet ? uploadFile(fotoCarnet, "fotos-carnet") : null,
        tituloFile ? uploadFile(tituloFile, "certificados") : null,
      ])

      const res = await fetch("/api/ct/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, apellido, cedula, fechaNacimiento: fechaNac, telefono, ciudad,
          genero, nacionalidad, email, password, rol,
          fotoCarnetUrl, fotoCedulaUrl, tituloEntrenadorUrl: tituloUrl,
          tieneTitulo, razonSocial, ruc,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error }); return
      }

      const data = await res.json()

      if (data.autoVerificado) {
        toast({ title: "Registro exitoso", description: "Tu pago fue verificado automáticamente. Tu solicitud será revisada pronto." })
      } else {
        toast({ title: "Registro exitoso", description: "Tu solicitud fue enviada. Recordá realizar la transferencia bancaria." })
      }

      router.push("/cuerpotecnico/login")
    } catch {
      toast({ variant: "destructive", title: "Error al registrarse" })
    } finally { setLoading(false) }
  }

  const selectedRol = ROLES_CT.find(r => r.value === rol)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center">
          <img src="/logo-cpb.jpg" alt="CPB" className="mx-auto mb-3 h-20 w-20 object-contain" />
          <CardTitle className="text-xl">Registro — Cuerpo Técnico CPB</CardTitle>
          <CardDescription>Paso {step} de 3 — {STEP_TITLES[step - 1]}</CardDescription>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-gray-200"}`} />
            ))}
          </div>
        </CardHeader>

        {/* STEP 1 */}
        {step === 1 && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre *</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} /></div>
              <div className="space-y-1"><Label>Apellido *</Label><Input value={apellido} onChange={e => setApellido(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Número de CI *</Label><Input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="1234567" /></div>
            <div className="space-y-1"><Label>Fecha de nacimiento *</Label><Input type="date" value={fechaNac} onChange={e => setFechaNac(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Género *</Label>
                <Select value={genero} onValueChange={setGenero}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nacionalidad *</Label>
                <Combobox
                  options={NACIONALIDADES}
                  value={nacionalidad}
                  onValueChange={setNacionalidad}
                  placeholder="Seleccioná"
                  searchPlaceholder="Escribí para buscar..."
                  emptyMessage="Nacionalidad no encontrada"
                />
              </div>
            </div>
            <div className="space-y-1"><Label>Teléfono *</Label><Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="0981..." /></div>
            <div className="space-y-1">
              <Label>Ciudad *</Label>
              <Combobox
                options={CIUDADES_PARAGUAY}
                value={ciudad}
                onValueChange={setCiudad}
                placeholder="Seleccioná tu ciudad"
                searchPlaceholder="Escribí para buscar ciudad..."
                emptyMessage="Ciudad no encontrada"
              />
            </div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Contraseña *</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín 8 caracteres" /></div>
              <div className="space-y-1"><Label>Confirmar *</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
            </div>
          </CardContent>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Tu rol *</Label>
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger><SelectValue placeholder="Seleccioná tu rol" /></SelectTrigger>
                <SelectContent>
                  {ROLES_CT.map(r => <SelectItem key={r.value} value={r.value}>{r.label} — {r.precio}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foto tipo carnet *</Label>
              <p className="text-xs text-muted-foreground">Foto de frente, fondo claro. Se recorta a 500x500.</p>
              {carnetPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={carnetPreview} alt="Preview" className="h-28 w-28 rounded-xl object-cover border-2 border-green-200" />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setCarnetPreview(null); setFotoCarnet(null) }}>Cambiar</Button>
                </div>
              ) : carnetSrc ? (
                <div className="space-y-3">
                  <div className="relative w-full aspect-square max-w-[250px] mx-auto rounded-xl overflow-hidden bg-black">
                    <Cropper image={carnetSrc} crop={carnetCrop} zoom={carnetZoom} aspect={1} onCropChange={setCarnetCrop} onZoomChange={setCarnetZoom} onCropComplete={onCarnetCropComplete} />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button type="button" size="sm" onClick={handleCarnetCropConfirm}>Confirmar</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCarnetSrc(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-primary/50">
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Seleccionar foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleCarnetFile} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Foto de cédula (frente y dorso) *</Label>
              <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-primary/50">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{fotoCedula ? fotoCedula.name : "Seleccionar archivo"}</span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFotoCedula(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="titulo" checked={tieneTitulo} onCheckedChange={c => setTieneTitulo(c === true)} />
              <label htmlFor="titulo" className="text-sm cursor-pointer">Tengo título de entrenador de basketball</label>
            </div>
            {tieneTitulo && (
              <div className="space-y-2">
                <Label>Adjuntar título</Label>
                <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{tituloFile ? tituloFile.name : "Seleccionar archivo"}</span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setTituloFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
          </CardContent>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <CardContent className="space-y-5">
            {selectedRol && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800">Habilitación como <strong>{selectedRol.label}</strong></p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{selectedRol.precio}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-yellow-800 text-sm">Datos para transferencia bancaria</p>
              <div className="text-sm text-yellow-900 space-y-1">
                <p><strong>Banco:</strong> Banco Nacional de Fomento</p>
                <p><strong>N° de cuenta:</strong> 055009155423</p>
                <p className="bg-red-100 border border-red-300 rounded px-2 py-1"><strong>Para otros bancos:</strong> 0001055009155423</p>
                <p><strong>Titular:</strong> Confederación Paraguaya de Basquetbol</p>
                <p><strong>RUC:</strong> 80028130-6</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Razón Social (para factura)</Label>
              <Input value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="Nombre o razón social" />
            </div>
            <div className="space-y-2">
              <Label>RUC</Label>
              <Input value={ruc} onChange={e => setRuc(e.target.value)} placeholder="12345678-9" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="confirma" checked={confirmaDatos} onCheckedChange={c => setConfirmaDatos(c === true)} />
              <label htmlFor="confirma" className="text-sm cursor-pointer">Confirmo que los datos ingresados son verídicos</label>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)} disabled={loading}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Atrás
            </Button>
          )}
          {step < 3 ? (
            <Button className="flex-1" onClick={() => {
              if (step === 1 && !validateStep1()) return
              if (step === 2 && !validateStep2()) return
              setStep(s => s + 1)
            }}>
              Siguiente <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar solicitud
            </Button>
          )}
        </CardFooter>
        {step === 1 && (
          <p className="text-sm text-muted-foreground text-center pb-4">
            ¿Ya tenés cuenta? <Link href="/cuerpotecnico/login" className="text-primary hover:underline font-semibold">Iniciá sesión</Link>
          </p>
        )}
      </Card>
    </div>
  )
}
