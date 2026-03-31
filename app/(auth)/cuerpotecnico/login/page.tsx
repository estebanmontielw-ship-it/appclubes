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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Email o contraseña incorrectos" })
        return
      }
      // Check if user is cuerpo técnico
      const res = await fetch("/api/ct/me")
      if (res.ok) {
        router.push("/oficiales/perfil")
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
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center">
          <img src="/logo-cpb.jpg" alt="CPB" className="mx-auto mb-3 h-24 w-24 object-contain" />
          <CardTitle className="text-2xl">Cuerpo Técnico CPB</CardTitle>
          <CardDescription>Habilitación anual — Iniciá sesión</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" className="h-11" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" className="h-11" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
            <p className="text-sm text-gray-500 text-center">
              ¿No tenés cuenta? <Link href="/cuerpotecnico/registro" className="text-primary hover:underline font-semibold">Registrate</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
