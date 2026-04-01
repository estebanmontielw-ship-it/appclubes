"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showNotFound, setShowNotFound] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes("Invalid login")) {
          setShowNotFound(true)
        } else {
          toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: "Email o contraseña incorrectos",
          })
        }
        return
      }

      router.push("/oficiales")
      router.refresh()
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo conectar con el servidor",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-gray-200/50">
        <CardHeader className="text-center pb-2">
          <img src="/logo-cpb.jpg" alt="CPB" className="mx-auto mb-3 h-24 w-24 object-contain drop-shadow-sm" />
          <CardTitle className="text-2xl font-bold text-gray-900">CPB Oficiales</CardTitle>
          <CardDescription className="text-gray-500">
            Confederación Paraguaya de Básquetbol
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                className="h-11"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                <Link
                  href="/oficiales/recuperar"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
            <p className="text-sm text-gray-500 text-center">
              ¿No tenés cuenta?{" "}
              <Link href="/oficiales/registro" className="text-primary hover:underline font-semibold">
                Registrate
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Not found popup */}
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
              <Link href="/oficiales/registro" className="block">
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
