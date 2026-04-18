"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const CATEGORIAS = [
  { id: "lnb", label: "Liga Nacional Masculina", sublabel: "LNB" },
  { id: "lnbf", label: "Liga Nacional Femenina", sublabel: "LNBF" },
]

interface Club { id: number; nombre: string; ciudad: string; logoUrl: string | null; sigla: string | null }


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
    fetch("/api/website/clubes/nacionales")
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
              {/* Club favorito — visual grid with logos */}
              <div className="space-y-2">
                <Label>Club favorito <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <p className="text-xs text-gray-500">Tocá tu club de la LNB o LNBF</p>

                {clubes.length === 0 ? (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {clubes.map(club => {
                      const selected = clubFavorito === club.nombre
                      return (
                        <button
                          type="button"
                          key={club.id}
                          onClick={() => setClubFavorito(selected ? "" : club.nombre)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                            selected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-gray-100 hover:border-gray-200 bg-gray-50"
                          )}
                          title={club.nombre}
                        >
                          {club.logoUrl ? (
                            <img src={club.logoUrl} alt={club.nombre} className="h-8 w-8 object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-gray-500">{club.sigla ?? club.nombre.slice(0, 3)}</span>
                            </div>
                          )}
                          <span className="text-[9px] font-medium text-gray-600 text-center leading-tight line-clamp-2">
                            {club.sigla ?? club.nombre.split(" ").slice(-1)[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {clubFavorito && (
                  <div className="mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
                    {clubes.find(c => c.nombre === clubFavorito)?.logoUrl && (
                      <img src={clubes.find(c => c.nombre === clubFavorito)!.logoUrl!} alt="" className="h-6 w-6 object-contain" />
                    )}
                    <p className="flex-1 text-xs font-semibold text-primary truncate">{clubFavorito}</p>
                    <button
                      type="button"
                      onClick={() => setClubFavorito("")}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Categorías — cards con toggle */}
              <div className="space-y-2">
                <Label>Categorías de interés <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <p className="text-xs text-gray-500">Recibí alertas sobre los partidos que te interesan</p>
                <div className="space-y-2 pt-1">
                  {CATEGORIAS.map(cat => {
                    const active = categorias.includes(cat.id)
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategoria(cat.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                          active ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200 bg-gray-50"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                          active ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                        )}>
                          {cat.sublabel}
                        </div>
                        <span className={cn("flex-1 font-medium text-sm", active ? "text-primary" : "text-gray-700")}>
                          {cat.label}
                        </span>
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                          active ? "border-primary bg-primary" : "border-gray-300"
                        )}>
                          {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    )
                  })}
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
