"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react"

const DESTINATARIOS = [
  { value: "TODOS", label: "Todos los usuarios" },
  { value: "VERIFICADOS", label: "Solo verificados" },
  { value: "ARBITRO", label: "Árbitros" },
  { value: "MESA", label: "Oficiales de Mesa" },
  { value: "ESTADISTICO", label: "Estadísticos" },
]

export default function AdminNotificacionesPage() {
  const { toast } = useToast()
  const [titulo, setTitulo] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [destinatarios, setDestinatarios] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!titulo.trim() || !mensaje.trim() || !destinatarios) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completá todos los campos",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, mensaje, destinatarios }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Notificación enviada",
          description: `Se envió a ${data.sent} de ${data.total} usuarios`,
        })
        setTitulo("")
        setMensaje("")
        setDestinatarios("")
      } else {
        const error = await res.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error,
        })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Enviar Notificación</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nueva notificación masiva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destinatarios">Destinatarios</Label>
            <Select value={destinatarios} onValueChange={setDestinatarios}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná los destinatarios" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATARIOS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ej: Nuevo reglamento FIBA disponible"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje</Label>
            <textarea
              id="mensaje"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Escribí el mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
          </div>

          <Button onClick={handleSend} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar notificación
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
