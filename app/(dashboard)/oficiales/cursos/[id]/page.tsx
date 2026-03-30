"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Circle,
  Lock,
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
  const isActive = inscripcion?.estado === "ACTIVO" || inscripcion?.estado === "COMPLETADO"

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
      <div className="flex items-center gap-4">
        <Link href="/oficiales/cursos">
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
      {!inscripcion && (
        <Button className="w-full" size="lg" onClick={handleInscribir} disabled={inscribiendo}>
          {inscribiendo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {curso.esGratuito ? "Inscribirme gratis" : "Inscribirme"}
        </Button>
      )}

      {inscripcion?.estado === "PENDIENTE_PAGO" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="font-medium text-yellow-800">Inscripción pendiente de pago</p>
            <p className="text-sm text-yellow-700 mt-1">
              Realizá la transferencia y subí el comprobante (Sprint 4).
            </p>
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
            const isAccessible = isActive && (idx === 0 || prevCompleted)
            const isLocked = isActive && !isAccessible

            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCompleted ? "bg-green-50/50 border-green-100" : isLocked ? "opacity-50" : ""
                }`}
              >
                {/* Status icon */}
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}

                {/* Info */}
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

                {/* Action */}
                {isActive && isAccessible && !isCompleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleComplete(m.id)}
                    disabled={completando === m.id}
                  >
                    {completando === m.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Completar"
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
