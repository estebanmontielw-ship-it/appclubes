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
import DatePickerSimple from "@/components/ui/DatePickerSimple"
import PhoneInput from "@/components/ui/PhoneInput"
import { Loader2, ArrowLeft, ArrowRight, Upload, Camera, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { CIUDADES_PY } from "@/lib/constants"

const ROLES_CT = [
  { value: "ENTRENADOR_NACIONAL", label: "Entrenador Nacional", precio: "Gs. 300.000" },
  { value: "ENTRENADOR_EXTRANJERO", label: "Entrenador Extranjero", precio: "Gs. 700.000" },
  { value: "ASISTENTE", label: "Asistente", precio: "Gs. 200.000" },
  { value: "PREPARADOR_FISICO", label: "Preparador Físico", precio: "Gs. 200.000" },
  { value: "FISIO", label: "Fisioterapeuta", precio: "Gs. 200.000" },
  { value: "UTILERO", label: "Utilero", precio: "Gs. 100.000" },
]

const ROL_MAP: Record<string, string> = {
  "ENTRENADOR_NACIONAL": "ENTRENADOR_NACIONAL",
  "ENTRENADOR_EXTRANJERO": "ENTRENADOR_EXTRANJERO",
  "ASISTENTE": "ASISTENTE",
  "PREPARADOR_FISICO": "PREPARADOR_FISICO",
  "PREPARADOR FISICO": "PREPARADOR_FISICO",
  "FISIO": "FISIO",
  "FISIOTERAPEUTA": "FISIO",
  "UTILERO": "UTILERO",
}

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

  // Pre-verificado detection
  const [isPreverificado, setIsPreverificado] = useState(false)
  const [preNombre, setPreNombre] = useState("")
  const [preRol, setPreRol] = useState("")
  const [checking, setChecking] = useState(false)

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
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)

  // Cropper
  const [carnetSrc, setCarnetSrc] = useState<string | null>(null)
  const [carnetCrop, setCarnetCrop] = useState({ x: 0, y: 0 })
  const [carnetZoom, setCarnetZoom] = useState(1)
  const [carnetCroppedArea, setCarnetCroppedArea] = useState<Area | null>(null)
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null)

  // Step 3 (solo nuevos)
  const [razonSocial, setRazonSocial] = useState("")
  const [ruc, setRuc] = useState("")
  const [confirmaDatos, setConfirmaDatos] = useState(false)

  const totalSteps = isPreverificado ? 2 : 3

  const onCarnetCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCarnetCroppedArea(croppedPixels)
  }, [])

  const checkFileSize = (file: File, maxMB = 10): boolean => {
    if (file.size > maxMB * 1024 * 1024) {
      toast({ variant: "destructive", title: `El archivo "${file.name}" es muy grande`, description: `Máximo ${maxMB}MB. Tu archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. (Error: SIZE-01)` })
      return false
    }
    return true
  }

  const handleCarnetFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    if (!checkFileSize(file)) return
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

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.type === "application/pdf") return file
    if (file.size < 500000) return file // Skip if already under 500KB

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxSize = 1200
        let w = img.width, h = img.height
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize }
          else { w = (w / h) * maxSize; h = maxSize }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file)
        }, "image/jpeg", 0.7)
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (file: File, bucket: string, retries = 2): Promise<string | null> => {
    const compressed = await compressImage(file)
    const formData = new FormData()
    formData.append("file", compressed)
    formData.append("bucket", bucket)

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.error || `Error al subir ${file.name}`)
        }
        const data = await res.json()
        return data.url
      } catch (err) {
        if (attempt === retries) throw err
        // Wait before retry
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
      }
    }
    return null
  }

  // Check if pre-registered when moving to step 2
  async function checkPreverificado() {
    setChecking(true)
    try {
      const res = await fetch("/api/ct/check-preverificado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido }),
      })
      const data = await res.json()
      if (data.found) {
        setIsPreverificado(true)
        setPreNombre(data.nombre)
        const mappedRol = ROL_MAP[data.rol?.toUpperCase()] || ""
        if (mappedRol) {
          setRol(mappedRol)
          setPreRol(mappedRol)
        }
      } else {
        setIsPreverificado(false)
        setPreRol("")
      }
    } catch {} finally { setChecking(false) }
  }

  const validateStep1 = () => {
    if (!nombre.trim() || !apellido.trim()) {
      toast({ variant: "destructive", title: "Ingresá tu nombre y apellido" }); return false
    }
    if (!cedula.trim() || !/^\d{5,10}$/.test(cedula.trim())) {
      toast({ variant: "destructive", title: "Número de cédula inválido (5-10 dígitos)" }); return false
    }
    if (!fechaNac) {
      toast({ variant: "destructive", title: "Seleccioná tu fecha de nacimiento" }); return false
    }
    if (!genero) {
      toast({ variant: "destructive", title: "Seleccioná tu género" }); return false
    }
    if (!nacionalidad) {
      toast({ variant: "destructive", title: "Seleccioná tu nacionalidad" }); return false
    }
    if (!telefono || telefono.replace(/\D/g, "").length < 8) {
      toast({ variant: "destructive", title: "Ingresá un número de teléfono válido" }); return false
    }
    if (!ciudad) {
      toast({ variant: "destructive", title: "Seleccioná tu ciudad" }); return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Ingresá un email válido" }); return false
    }
    if (!password || password.length < 8) {
      toast({ variant: "destructive", title: "La contraseña debe tener al menos 8 caracteres" }); return false
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" }); return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!isPreverificado && !rol) { toast({ variant: "destructive", title: "Seleccioná tu rol" }); return false }
    if (!fotoCarnet) { toast({ variant: "destructive", title: "Subí tu foto tipo carnet" }); return false }
    if (!fotoCedula) { toast({ variant: "destructive", title: "Subí la foto de tu cédula" }); return false }
    if (!isPreverificado && tieneTitulo && !tituloFile) {
      toast({ variant: "destructive", title: "Adjuntá tu título de entrenador o seleccioná 'No'" }); return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!confirmaDatos) {
      toast({ variant: "destructive", title: "Confirmá que los datos son verídicos" }); return
    }
    if (!isPreverificado && !comprobanteFile) {
      toast({ variant: "destructive", title: "Subí el comprobante de transferencia" }); return
    }

    setLoading(true)
    try {
      let fotoCedulaUrl = null, fotoCarnetUrl = null, tituloUrl = null, comprobanteUrl = null

      // Upload one by one for better error messages
      try {
        if (fotoCarnet) {
          toast({ title: "Subiendo foto carnet..." })
          fotoCarnetUrl = await uploadFile(fotoCarnet, "fotos-carnet")
        }
        if (fotoCedula) {
          toast({ title: "Subiendo foto cédula..." })
          fotoCedulaUrl = await uploadFile(fotoCedula, "fotos-cedula")
        }
        if (tituloFile) {
          toast({ title: "Subiendo título..." })
          tituloUrl = await uploadFile(tituloFile, "certificados")
        }
        if (comprobanteFile) {
          toast({ title: "Subiendo comprobante..." })
          comprobanteUrl = await uploadFile(comprobanteFile, "comprobantes")
        }
      } catch (uploadErr: any) {
        const msg = uploadErr?.message || ""
        let userMsg = "No se pudieron subir las fotos. "
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch")) {
          userMsg += "Problema de conexión a internet. Intentá conectarte a WiFi o esperá unos segundos y probá de nuevo. (Error: CONN-01)"
        } else if (msg.includes("10MB") || msg.includes("tamaño")) {
          userMsg += "El archivo es muy grande. Intentá con una foto más chica. (Error: SIZE-01)"
        } else {
          userMsg += `Detalle: ${msg} (Error: UPLOAD-01)`
        }
        toast({ variant: "destructive", title: "Error al subir archivos", description: userMsg, duration: 10000 })
        setLoading(false); return
      }

      const finalRol = isPreverificado && preRol ? preRol : rol

      let res
      try {
        res = await fetch("/api/ct/auth/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre, apellido, cedula, fechaNacimiento: fechaNac, telefono, ciudad,
            genero, nacionalidad, email, password, rol: finalRol,
            fotoCarnetUrl, fotoCedulaUrl, tituloEntrenadorUrl: tituloUrl,
            tieneTitulo, razonSocial, ruc, comprobanteUrl,
          }),
        })
      } catch {
        toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo conectar con el servidor. Verificá tu conexión a internet y probá de nuevo. (Error: CONN-02)", duration: 10000 })
        setLoading(false); return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        let userMsg = err.error || "Error al registrar"
        if (userMsg.includes("already been registered") || userMsg.includes("email")) {
          userMsg = "Ya existe una cuenta con ese email. Si ya te registraste, intentá iniciar sesión. (Error: REG-01)"
        } else if (userMsg.includes("cédula") || userMsg.includes("cedula")) {
          userMsg = "Ya existe un registro con esa cédula. Contactá a cpb@cpb.com.py si necesitás ayuda. (Error: REG-02)"
        } else {
          userMsg += " (Error: REG-03)"
        }
        toast({ variant: "destructive", title: "Error en el registro", description: userMsg, duration: 10000 }); return
      }

      const data = await res.json()

      if (data.autoVerificado || isPreverificado) {
        toast({ title: "Registro exitoso", description: "Tu cuenta fue creada. Tu solicitud será revisada pronto." })
      } else {
        toast({ title: "Registro exitoso", description: "Tu solicitud fue enviada. Recordá realizar la transferencia bancaria." })
      }

      router.push("/cuerpotecnico/login")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error inesperado", description: "Ocurrió un problema. Intentá de nuevo o contactá a cpb@cpb.com.py. (Error: GEN-01)", duration: 10000 })
    } finally { setLoading(false) }
  }

  const selectedRol = ROLES_CT.find(r => r.value === rol)
  const stepTitles = isPreverificado
    ? ["Datos personales", "Documentos"]
    : ["Datos personales", "Rol y documentos", "Pago y facturación"]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center">
          <img src="/favicon-cpb.png" alt="CPB" className="mx-auto mb-3 h-20 w-20 object-contain" />
          <CardTitle className="text-xl">Registro — Cuerpo Técnico CPB</CardTitle>
          <CardDescription>Paso {step} de {totalSteps} — {stepTitles[step - 1]}</CardDescription>
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`h-2 flex-1 max-w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-gray-200"}`} />
            ))}
          </div>
        </CardHeader>

        {/* STEP 1 - Datos personales (igual para todos) */}
        {step === 1 && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nombre(s) *</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Carlos" /></div>
              <div className="space-y-1"><Label>Apellido(s) *</Label><Input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: Pérez González" /></div>
            </div>
            <div className="space-y-1"><Label>Número de CI *</Label><Input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="1234567" /></div>
            <DatePickerSimple value={fechaNac} onChange={setFechaNac} />
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
                <select value={nacionalidad} onChange={e => setNacionalidad(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  style={{ fontSize: "16px" }}>
                  <option value="">Seleccionar</option>
                  <optgroup label="Sudamérica">
                    <option value="Paraguaya">Paraguaya</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Brasileña">Brasileña</option>
                    <option value="Uruguaya">Uruguaya</option>
                    <option value="Boliviana">Boliviana</option>
                    <option value="Chilena">Chilena</option>
                    <option value="Peruana">Peruana</option>
                    <option value="Colombiana">Colombiana</option>
                    <option value="Venezolana">Venezolana</option>
                  </optgroup>
                  <optgroup label="Otras">
                    <option value="Estadounidense">Estadounidense</option>
                    <option value="Española">Española</option>
                    <option value="Italiana">Italiana</option>
                    <option value="Otra">Otra</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="space-y-1"><Label>Teléfono *</Label><PhoneInput value={telefono} onChange={setTelefono} /></div>
            <div className="space-y-1">
              <Label>Ciudad *</Label>
              <Select value={ciudad} onValueChange={setCiudad}>
                <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                <SelectContent>{CIUDADES_PY.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Contraseña *</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín 8 caracteres" /></div>
              <div className="space-y-1"><Label>Confirmar *</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
            </div>
          </CardContent>
        )}

        {/* STEP 2 - Documentos */}
        {step === 2 && (
          <CardContent className="space-y-5">
            {/* Pre-verificado badge */}
            {isPreverificado && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Encontramos tu registro previo</p>
                  <p className="text-xs text-green-600">Tu pago ya fue verificado. Solo necesitamos tus documentos.</p>
                </div>
              </div>
            )}

            {/* Rol selector - solo para nuevos */}
            {!isPreverificado && (
              <div className="space-y-2">
                <Label>Tu rol *</Label>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná tu rol" /></SelectTrigger>
                  <SelectContent>
                    {ROLES_CT.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pre-verificado: show detected rol */}
            {isPreverificado && preRol && (
              <div className="text-sm text-gray-600">
                Rol detectado: <strong>{ROLES_CT.find(r => r.value === preRol)?.label || preRol}</strong>
              </div>
            )}

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
              <Label>Foto de cédula (frente) *</Label>
              <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-primary/50">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{fotoCedula ? fotoCedula.name : "Seleccionar archivo"}</span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f && checkFileSize(f)) setFotoCedula(f) }} />
              </label>
            </div>

            {/* Título - solo para nuevos */}
            {!isPreverificado && (
              <>
                <div className="space-y-1">
                  <Label>¿Tenés título de entrenador?</Label>
                  <select value={tieneTitulo ? "si" : "no"} onChange={e => setTieneTitulo(e.target.value === "si")}
                    className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    style={{ fontSize: "16px" }}>
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                  </select>
                </div>
                {tieneTitulo && (
                  <div className="space-y-2">
                    <Label>Adjuntar título</Label>
                    <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50">
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">{tituloFile ? tituloFile.name : "Seleccionar archivo"}</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f && checkFileSize(f)) setTituloFile(f) }} />
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Pre-verificado: confirmación directa */}
            {isPreverificado && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="confirma" checked={confirmaDatos} onCheckedChange={c => setConfirmaDatos(c === true)} />
                <label htmlFor="confirma" className="text-sm cursor-pointer">Confirmo que los datos son verídicos</label>
              </div>
            )}
          </CardContent>
        )}

        {/* STEP 3 - Solo para NUEVOS (no pre-registrados) */}
        {step === 3 && !isPreverificado && (
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
              <Label>Comprobante de transferencia *</Label>
              <label className="flex flex-col items-center border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-primary/50">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">{comprobanteFile ? comprobanteFile.name : "Subir comprobante"}</span>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f && checkFileSize(f)) setComprobanteFile(f) }} />
              </label>
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
          {step < totalSteps ? (
            <Button className="flex-1" disabled={checking} onClick={async () => {
              if (step === 1) {
                if (!validateStep1()) return
                await checkPreverificado()
              }
              if (step === 2 && !validateStep2()) return
              setStep(s => s + 1)
            }}>
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
