"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoginCTPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showNotFound, setShowNotFound] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes("Invalid login")) {
          setShowNotFound(true)
        } else {
          toast({ variant: "destructive", title: "Error", description: "Email o contraseña incorrectos" })
        }
        return
      }
      // Check if user is cuerpo técnico
      const res = await fetch("/api/ct/me")
      if (res.ok) {
        router.push("/cuerpotecnico")
        router.refresh()
      } else {
        toast({ variant: "destructive", title: "Error", description: "Esta cuenta no pertenece a Cuerpo Técnico" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-gray-200/50">
        <CardHeader className="text-center pb-2">
          <img src="/favicon-cpb.png" alt="CPB" className="mx-auto mb-3 h-24 w-24 object-contain drop-shadow-sm" />
          <CardTitle className="text-2xl font-bold text-gray-900">Cuerpo Técnico CPB</CardTitle>
          <CardDescription className="text-gray-500">
            Portal de gestión para entrenadores y cuerpo técnico
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                className="h-11"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
              <Input
                id="password"
                type="password"
                className="h-11"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
            <p className="text-sm text-gray-500 text-center">
              ¿No tenés cuenta?{" "}
              <Link href="/cuerpotecnico/registro" className="text-primary hover:underline font-semibold">
                Registrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {showNotFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNotFound(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤔</span>
              </div>
              <h3 className="font-bold text-lg">No encontramos tu cuenta</h3>
              <p className="text-sm text-muted-foreground mt-2">
                El email o contraseña no coinciden con ninguna cuenta registrada. ¿Puede ser que todavía no te hayas registrado?
              </p>
            </div>
            <div className="space-y-2">
              <Link href="/cuerpotecnico/registro" className="block">
                <Button className="w-full">Crear mi cuenta</Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={() => setShowNotFound(false)}>
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
