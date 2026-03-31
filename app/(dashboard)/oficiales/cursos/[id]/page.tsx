"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle,
  Lock,
  Upload,
  Loader2,
  User,
  Video,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface ModuloView {
  id: string
  titulo: string
  descripcion: string | null
  contenido: string | null
  videoUrl: string | null
  orden: number
  duracion: number | null
  examen: { id: string; titulo: string } | null
  progresos?: { completado: boolean }[]
}

interface CursoView {
  id: string
  nombre: string
  descripcion: string
  disciplina: string
  nivel: string
  precio: number
  esGratuito: boolean
  modulos: ModuloView[]
  instructor: { nombre: string; apellido: string } | null
  inscripciones?: { id: string; estado: string }[]
}

export default function CursoDetallePage() {
  const params = useParams()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get("preview") === "true"
  const [curso, setCurso] = useState<CursoView | null>(null)
  const [loading, setLoading] = useState(true)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [completando, setCompletando] = useState<string | null>(null)

  const loadCurso = async () => {
    try {
      const res = await fetch(`/api/cursos/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCurso(data.curso)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCurso() }, [params.id])

  const inscripcion = curso?.inscripciones?.[0]
  const isActive = isPreview || inscripcion?.estado === "ACTIVO" || inscripcion?.estado === "COMPLETADO"

  const handleInscribir = async () => {
    setInscribiendo(true)
    try {
      const res = await fetch(`/api/cursos/${params.id}/inscribir`, { method: "POST" })
      if (res.ok) {
        toast({ title: curso?.esGratuito ? "Te inscribiste al curso" : "Inscripción registrada. Enviá el comprobante de pago." })
        loadCurso()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setInscribiendo(false)
    }
  }

  const handleComplete = async (moduloId: string) => {
    setCompletando(moduloId)
    try {
      const res = await fetch(`/api/cursos/${params.id}/progreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduloId }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: data.completed >= data.total ? "Curso completado" : "Módulo completado" })
        loadCurso()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally {
      setCompletando(null)
    }
  }

  if (loading || !curso) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  const completedCount = curso.modulos.filter((m) => m.progresos?.[0]?.completado).length
  const totalModulos = curso.modulos.length
  const progressPct = totalModulos > 0 ? Math.round((completedCount / totalModulos) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Preview banner */}
      {isPreview && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-purple-600 text-lg">🔍</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-800">Modo vista previa</p>
            <p className="text-xs text-purple-600">Todos los módulos y exámenes están desbloqueados. Los cambios no se guardan.</p>
          </div>
          <Link href={`/oficiales/admin/cursos/${params.id}`}>
            <Button size="sm" variant="outline" className="text-purple-700 border-purple-300">Volver al admin</Button>
          </Link>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link href={isPreview ? `/oficiales/admin/cursos/${params.id}` : "/oficiales/cursos"}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{curso.nombre}</h1>
          {curso.instructor && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <User className="h-3.5 w-3.5" /> {curso.instructor.nombre} {curso.instructor.apellido}
            </p>
          )}
        </div>
      </div>

      {/* Course info */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground mb-4">{curso.descripcion}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline">{curso.disciplina}</Badge>
              <Badge variant="outline">{curso.nivel}</Badge>
              <Badge variant="outline">{totalModulos} módulos</Badge>
            </div>
            {curso.esGratuito ? (
              <Badge variant="success">Gratis</Badge>
            ) : (
              <span className="font-bold">{formatCurrency(Number(curso.precio))}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inscription button */}
      {!inscripcion && !isPreview && (
        <Button className="w-full" size="lg" onClick={handleInscribir} disabled={inscribiendo}>
          {inscribiendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {curso.esGratuito ? "Inscribirme gratis" : "Inscribirme"}
        </Button>
      )}

      {inscripcion?.estado === "PENDIENTE_PAGO" && (
        <PagoForm cursoId={curso.id} monto={Number(curso.precio)} onSuccess={loadCurso} />
      )}

      {/* Certificate */}
      {inscripcion?.estado === "COMPLETADO" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center space-y-2">
            <p className="font-medium text-green-800">Curso completado</p>
            <Button size="sm" onClick={() => window.open(`/api/cursos/${curso.id}/certificado`, "_blank")}>
              Ver certificado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      {isActive && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso</span>
              <span className="text-sm text-muted-foreground">{completedCount}/{totalModulos} módulos · {progressPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules list */}
      <Card>
        <CardHeader><CardTitle>Módulos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {curso.modulos.map((m, idx) => {
            const isCompleted = m.progresos?.[0]?.completado
            const prevCompleted = idx === 0 || curso.modulos[idx - 1]?.progresos?.[0]?.completado
            const isAccessible = isPreview || (isActive && (idx === 0 || prevCompleted))
            const isLocked = !isPreview && isActive && !isAccessible

            const moduleContent = (
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCompleted ? "bg-green-50/50 border-green-100" : isLocked ? "opacity-50" : "hover:bg-gray-50 hover:border-gray-200"
                } ${isAccessible || isCompleted ? "cursor-pointer" : ""}`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isCompleted ? "text-green-700" : ""} ${isLocked ? "text-muted-foreground" : "font-medium"}`}>
                    {idx + 1}. {m.titulo}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {m.duracion && <span>{m.duracion} min</span>}
                    {m.videoUrl && <span className="flex items-center gap-0.5"><Video className="h-3 w-3" /> Video</span>}
                    {m.examen && <Badge variant="outline" className="text-[10px] py-0">Examen</Badge>}
                  </div>
                </div>
                {isActive && isAccessible && !isCompleted && (
                  <Badge variant="outline" className="text-xs">Abrir</Badge>
                )}
                {isCompleted && (
                  <Badge variant="success" className="text-xs">Leer</Badge>
                )}
              </div>
            )

            return isAccessible || isCompleted ? (
              <Link key={m.id} href={`/oficiales/cursos/${curso.id}/modulo/${m.id}${isPreview ? "?preview=true" : ""}`}>
                {moduleContent}
              </Link>
            ) : (
              <div key={m.id}>{moduleContent}</div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function PagoForm({ cursoId, monto, onSuccess }: { cursoId: string; monto: number; onSuccess: () => void }) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [referencia, setReferencia] = useState("")
  const [notas, setNotas] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Subí el comprobante de transferencia" })
      return
    }
    setUploading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", "comprobantes-pago")
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Error uploading")
      const { url } = await uploadRes.json()

      // Create payment
      const res = await fetch(`/api/cursos/${cursoId}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprobanteUrl: url, referencia, notas, monto }),
      })
      if (res.ok) {
        toast({ title: "Comprobante enviado. Te avisaremos cuando sea revisado." })
        onSuccess()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error al enviar comprobante" })
    } finally { setUploading(false) }
  }

  return (
    <Card className="border-yellow-200">
      <CardHeader><CardTitle className="text-lg">Pago por transferencia</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 rounded-lg p-4 text-sm space-y-1">
          <p><strong>Banco:</strong> {process.env.NEXT_PUBLIC_BANCO_NOMBRE || "Consultar"}</p>
          <p><strong>Cuenta:</strong> {process.env.NEXT_PUBLIC_BANCO_CUENTA || "Consultar"}</p>
          <p><strong>Titular:</strong> {process.env.NEXT_PUBLIC_BANCO_TITULAR || "CPB"}</p>
          <p><strong>Monto:</strong> Gs. {monto.toLocaleString("es-PY")}</p>
        </div>
        <div className="space-y-2">
          <Label>Comprobante de transferencia *</Label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">{file ? file.name : "Click para subir"}</span>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div className="space-y-2">
          <Label>Referencia bancaria (opcional)</Label>
          <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Nro. de transferencia" />
        </div>
        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Algún detalle extra..." />
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={uploading}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar comprobante
        </Button>
      </CardContent>
    </Card>
  )
}
