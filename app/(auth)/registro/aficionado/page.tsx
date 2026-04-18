"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const CATEGORIAS = [
  { id: "lnb", label: "Liga Nacional Masculina (LNB)" },
  { id: "lnbf", label: "Liga Nacional Femenina (LNBF)" },
  { id: "u22m", label: "Sub-22 Masculino" },
  { id: "u22f", label: "Sub-22 Femenino" },
]

interface Club { id: number; nombre: string; ciudad: string }

export default function RegistroAficionadoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [clubes, setClubes] = useState<Club[]>([])

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [clubFavorito, setClubFavorito] = useState("")
  const [categorias, setCategorias] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/website/clubes")
      .then(r => r.json())
      .then(d => setClubes(d.clubes || []))
      .catch(() => {})
  }, [])

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = "Requerido"
    if (!apellido.trim()) e.apellido = "Requerido"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido"
    if (password.length < 8) e.password = "Mínimo 8 caracteres"
    if (password !== confirm) e.confirm = "Las contraseñas no coinciden"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/registro/aficionado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, email, password, clubFavorito: clubFavorito || null, alertasCategorias: categorias }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error al registrarse", description: data.error || "Intentá de nuevo" })
        return
      }
      setDone(true)
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar con el servidor" })
    } finally {
      setLoading(false)
    }
  }

  const toggleCategoria = (id: string) => {
    setCategorias(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">¡Cuenta creada!</h2>
          <p className="text-gray-500 mt-2">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-gray-200/50">
        <CardHeader className="text-center pb-2">
          <img src="/favicon-cpb.png" alt="CPB" className="mx-auto mb-3 h-16 w-16 object-contain drop-shadow-sm" />
          <CardTitle className="text-xl font-bold text-gray-900">
            {step === 1 ? "Tus datos" : "Tus preferencias"}
          </CardTitle>
          <CardDescription className="text-gray-500">
            Paso {step} de 2 — Registro de aficionado
          </CardDescription>
          <div className="flex gap-2 justify-center mt-3">
            <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-gray-200"}`} />
            <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-gray-200"}`} />
          </div>
        </CardHeader>

        {step === 1 ? (
          <>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" className="h-11" />
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" value={apellido} onChange={e => setApellido(e.target.value)} placeholder="García" className="h-11" />
                  {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="h-11" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="h-11" />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmá la contraseña</Label>
                <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetí tu contraseña" className="h-11" />
                {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button className="w-full h-11" onClick={handleNext}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-gray-500 text-center">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">Iniciá sesión</Link>
              </p>
            </CardFooter>
          </>
        ) : (
          <>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-1.5">
                <Label>Club favorito <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <Select value={clubFavorito || undefined} onValueChange={setClubFavorito}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Seleccioná un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubes.map(c => (
                      <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categorías de interés <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <p className="text-xs text-gray-500">Recibí alertas sobre los partidos que te interesan</p>
                <div className="space-y-2.5 pt-1">
                  {CATEGORIAS.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <Checkbox
                        id={cat.id}
                        checked={categorias.includes(cat.id)}
                        onCheckedChange={() => toggleCategoria(cat.id)}
                      />
                      <label htmlFor={cat.id} className="text-sm text-gray-700 cursor-pointer">{cat.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button className="w-full h-11 text-base font-semibold" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear mi cuenta
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
