"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, Bell, Mail, FileText, Search, Sparkles, Wand2, Smartphone } from "lucide-react"

const DESTINATARIOS_GRUPOS = [
  {
    label: "OFICIALES",
    items: [
      { value: "TODOS", label: "Todos los oficiales" },
      { value: "VERIFICADOS", label: "Solo verificados (habilitados)" },
      { value: "PENDIENTES", label: "Pendientes de verificación" },
      { value: "ARBITRO", label: "Árbitros" },
      { value: "MESA", label: "Oficiales de Mesa" },
      { value: "ESTADISTICO", label: "Estadísticos" },
    ],
  },
  {
    label: "CUERPO TÉCNICO",
    items: [
      { value: "CT_TODOS", label: "Cuerpo Técnico — Todos" },
      { value: "CT_HABILITADOS", label: "Cuerpo Técnico — Habilitados" },
      { value: "CT_PENDIENTES", label: "Cuerpo Técnico — Pendientes" },
      { value: "CT_ENTRENADORES", label: "Entrenadores (Nac. + Extran.)" },
      { value: "CT_ASISTENTES", label: "Asistentes" },
    ],
  },
  {
    label: "TODOS",
    items: [
      { value: "TODOS_SISTEMA", label: "Todos — Oficiales + Cuerpo Técnico" },
    ],
  },
  {
    label: "INDIVIDUAL",
    items: [
      { value: "USUARIO_ESPECIFICO", label: "Persona específica (buscar)" },
    ],
  },
]

// Flat list for lookups
const DESTINATARIOS = DESTINATARIOS_GRUPOS.flatMap((g) => g.items)

const PLANTILLAS = [
  {
    nombre: "Bienvenida general",
    titulo: "Bienvenidos al portal CPB Oficiales",
    mensaje: "Les damos la bienvenida al nuevo portal de la Confederación Paraguaya de Básquetbol.\n\nDesde acá van a poder gestionar su carnet digital, inscribirse a cursos de capacitación, ver sus designaciones de partidos y mucho más.\n\nCualquier duda pueden contactarnos.\n\nSaludos,\nCPB Paraguay",
  },
  {
    nombre: "Actualizar foto de perfil",
    titulo: "Actualizá tu foto de perfil",
    mensaje: "Te pedimos que actualices tu foto tipo carnet desde la sección Mi Perfil del portal.\n\nLa foto debe ser de frente, fondo claro, sin sombras. El sistema la recorta automáticamente a tamaño carnet.\n\nEsto es necesario para que tu carnet digital se vea correctamente.\n\nGracias,\nCPB Paraguay",
  },
  {
    nombre: "Nuevo curso disponible",
    titulo: "Nuevo curso de capacitación disponible",
    mensaje: "Informamos que hay un nuevo curso de capacitación disponible en el portal CPB Oficiales.\n\nIngresá a la sección Cursos para ver el contenido, los módulos y los requisitos.\n\nLos cupos son limitados.\n\nSaludos,\nCPB Paraguay",
  },
  {
    nombre: "Recordatorio de pago",
    titulo: "Recordatorio: pago pendiente de curso",
    mensaje: "Te recordamos que tenés un pago pendiente para completar tu inscripción al curso.\n\nPor favor realizá la transferencia bancaria y subí el comprobante desde la sección del curso en el portal.\n\nSi ya realizaste el pago, ignorá este mensaje.\n\nGracias,\nCPB Paraguay",
  },
  {
    nombre: "Fotos en formato incorrecto",
    titulo: "Tus fotos necesitan ser actualizadas",
    mensaje: "Detectamos que tus fotos se subieron en un formato que no es compatible con el portal (posiblemente HEIC de iPhone).\n\nPor favor ingresá a Mi Perfil y volvé a subir tu foto tipo carnet. El sistema ahora convierte automáticamente cualquier formato a JPEG.\n\nTambién podés actualizar tu foto de cédula si es necesario.\n\nGracias por tu paciencia,\nCPB Paraguay",
  },
  {
    nombre: "Nuevo reglamento FIBA",
    titulo: "Nuevo reglamento FIBA disponible",
    mensaje: "Informamos que se actualizó el reglamento oficial FIBA para la temporada vigente.\n\nPodés descargarlo desde la sección Recursos del portal.\n\nEs importante que todos los oficiales estén al día con las reglas actualizadas.\n\nSaludos,\nCPB Paraguay",
  },
]

export default function AdminNotificacionesPage() {
  const { toast } = useToast()
  const [titulo, setTitulo] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [destinatarios, setDestinatarios] = useState("")
  const [enviarNotificacion, setEnviarNotificacion] = useState(true)
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [enviarPush, setEnviarPush] = useState(true)
  const [loading, setLoading] = useState(false)
  const [emailEspecifico, setEmailEspecifico] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  const [instruccionIA, setInstruccionIA] = useState("")
  const [generandoIA, setGenerandoIA] = useState(false)

  const buscarUsuario = async (q: string) => {
    setBusqueda(q)
    if (q.length < 2) { setResultados([]); return }
    setBuscando(true)
    try {
      // Search oficiales
      const res1 = await fetch(`/api/admin/usuarios?buscar=${encodeURIComponent(q)}&limite=5`)
      const data1 = await res1.json()
      const oficiales = (data1.usuarios || []).map((u: any) => ({ nombre: `${u.nombre} ${u.apellido}`, email: u.email, tipo: "Oficial" }))

      // Search CT
      const res2 = await fetch(`/api/admin/cuerpotecnico?buscar=${encodeURIComponent(q)}&limite=5`)
      const data2 = await res2.json()
      const cts = (data2.miembros || []).map((c: any) => ({ nombre: `${c.nombre} ${c.apellido}`, email: c.email, tipo: "Cuerpo Técnico" }))

      setResultados([...oficiales, ...cts])
    } catch {} finally { setBuscando(false) }
  }

  const handlePlantilla = (plantilla: typeof PLANTILLAS[0]) => {
    setTitulo(plantilla.titulo)
    setMensaje(plantilla.mensaje)
  }

  const generarConIA = async () => {
    if (!instruccionIA.trim()) {
      toast({ variant: "destructive", title: "Describí qué querés comunicar" })
      return
    }
    setGenerandoIA(true)
    try {
      const destinatarioLabel = DESTINATARIOS.find(d => d.value === destinatarios)?.label || ""
      const res = await fetch("/api/ai/comunicado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruccion: instruccionIA, destinatarios: destinatarioLabel }),
      })
      if (res.ok) {
        const data = await res.json()
        setTitulo(data.titulo)
        setMensaje(data.mensaje)
        toast({ title: "Comunicado generado", description: "Revisá y editá antes de enviar." })
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setGenerandoIA(false)
    }
  }

  const handleSend = async () => {
    if (!titulo.trim() || !mensaje.trim() || !destinatarios) {
      toast({ variant: "destructive", title: "Completá todos los campos" })
      return
    }

    if (!enviarNotificacion && !enviarEmail && !enviarPush) {
      toast({ variant: "destructive", title: "Seleccioná al menos un canal (notificación o email)" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          mensaje,
          destinatarios,
          enviarNotificacion,
          enviarEmail,
          emailEspecifico: destinatarios === "USUARIO_ESPECIFICO" ? emailEspecifico : undefined,
        }),
      })

      // Send push notifications
      let pushSent = 0
      if (enviarPush) {
        try {
          const pushRes = await fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titulo,
              mensaje,
              destinatarios: destinatarios === "TODOS_SISTEMA" ? "all" : destinatarios.startsWith("CT_") ? "ct" : destinatarios === "USUARIO_ESPECIFICO" ? "all" : "oficiales",
            }),
          })
          if (pushRes.ok) {
            const pushData = await pushRes.json()
            pushSent = pushData.sent || 0
          }
        } catch {}
      }

      if (res.ok) {
        const data = await res.json()
        const parts = []
        if (data.notifSent > 0) parts.push(`${data.notifSent} notificaciones`)
        if (data.emailSent > 0) parts.push(`${data.emailSent} emails`)
        if (pushSent > 0) parts.push(`${pushSent} push`)
        const desc = parts.length > 0
          ? `Se envió ${parts.join(" y ")} a ${data.total} destinatarios`
          : `Notificación guardada para ${data.total} destinatarios`
        const warning = data.emailSkipped > 0
          ? ` (${data.emailSkipped} emails fallaron)`
          : ""
        toast({
          title: parts.length > 0 ? "Enviado" : "Atención",
          description: desc + warning,
          variant: data.emailSkipped > 0 ? "destructive" : "default",
        })
        setTitulo("")
        setMensaje("")
        setDestinatarios("")
      } else {
        const error = await res.json()
        toast({ variant: "destructive", title: "Error", description: error.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enviar comunicación</h1>
        <p className="text-sm text-muted-foreground mt-1">Enviá notificaciones y/o emails a los oficiales</p>
      </div>

      {/* Plantillas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Plantillas rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PLANTILLAS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePlantilla(p)}
                className="text-left p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
              >
                <p className="font-medium text-gray-900">{p.nombre}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generador IA */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" /> Generar con IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Describí brevemente qué querés comunicar y la IA redacta el título y mensaje.</p>
          <textarea
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Ej: Informar a los árbitros que el torneo clausura empieza el 15 de abril y deben confirmar disponibilidad..."
            value={instruccionIA}
            onChange={(e) => setInstruccionIA(e.target.value)}
          />
          <Button onClick={generarConIA} disabled={generandoIA} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
            {generandoIA ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {generandoIA ? "Generando..." : "Generar comunicado"}
          </Button>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Componer mensaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Destinatarios *</Label>
            <Select value={destinatarios} onValueChange={setDestinatarios}>
              <SelectTrigger>
                <SelectValue placeholder="¿A quién va dirigido?" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATARIOS_GRUPOS.map((grupo, gi) => (
                  <SelectGroup key={grupo.label}>
                    {gi > 0 && <div className="my-1 h-px bg-gray-100" />}
                    <div className="px-2 py-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{grupo.label}</p>
                    </div>
                    {grupo.items.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buscar persona específica */}
          {destinatarios === "USUARIO_ESPECIFICO" && (
            <div className="space-y-2">
              <Label>Buscar persona</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={busqueda}
                  onChange={(e) => buscarUsuario(e.target.value)}
                  placeholder="Nombre o email..."
                  className="pl-9"
                />
              </div>
              {resultados.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {resultados.map((r, i) => (
                    <button key={i} onClick={() => { setEmailEspecifico(r.email); setBusqueda(r.nombre); setResultados([]) }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 flex items-center justify-between border-b border-gray-50 last:border-0 ${emailEspecifico === r.email ? "bg-primary/5" : ""}`}>
                      <div>
                        <p className="font-medium text-gray-900">{r.nombre}</p>
                        <p className="text-xs text-gray-500">{r.email}</p>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.tipo}</span>
                    </button>
                  ))}
                </div>
              )}
              {emailEspecifico && (
                <p className="text-xs text-green-600">Enviar a: {emailEspecifico}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Asunto / Título *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Nuevo reglamento FIBA disponible"
            />
          </div>

          <div className="space-y-2">
            <Label>Mensaje *</Label>
            <textarea
              className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Escribí el mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">El mensaje se envía tal cual lo escribís. Usá saltos de línea para separar párrafos.</p>
          </div>

          {/* Canales */}
          <div className="space-y-3 pt-2">
            <Label>Canales de envío</Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notif"
                  checked={enviarNotificacion}
                  onCheckedChange={(c) => setEnviarNotificacion(c === true)}
                />
                <label htmlFor="notif" className="text-sm cursor-pointer flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-gray-500" />
                  Notificación interna
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={enviarEmail}
                  onCheckedChange={(c) => setEnviarEmail(c === true)}
                />
                <label htmlFor="email" className="text-sm cursor-pointer flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-500" />
                  Email
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="push"
                  checked={enviarPush}
                  onCheckedChange={(c) => setEnviarPush(c === true)}
                />
                <label htmlFor="push" className="text-sm cursor-pointer flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                  Push (celular)
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleSend} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar comunicación
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
