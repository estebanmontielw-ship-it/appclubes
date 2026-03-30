"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle, Video, FileText, Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { PageSkeleton } from "@/components/ui/skeleton"

interface ModuloData {
  id: string
  titulo: string
  descripcion: string | null
  contenido: string | null
  videoUrl: string | null
  archivoUrl: string | null
  orden: number
  duracion: number | null
  examen: { id: string; titulo: string } | null
  progresos?: { completado: boolean }[]
}

export default function ModuloDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [modulo, setModulo] = useState<ModuloData | null>(null)
  const [allModulos, setAllModulos] = useState<ModuloData[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const loadCurso = async () => {
    try {
      const res = await fetch(`/api/cursos/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setAllModulos(data.curso.modulos)
        const mod = data.curso.modulos.find((m: ModuloData) => m.id === params.moduloId)
        setModulo(mod || null)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    loadCurso()
  }, [params.id, params.moduloId])

  const isCompleted = modulo?.progresos?.[0]?.completado

  // Find previous and next modules
  const currentIdx = allModulos.findIndex((m) => m.id === params.moduloId)
  const prevModulo = currentIdx > 0 ? allModulos[currentIdx - 1] : null
  const nextModulo = currentIdx < allModulos.length - 1 ? allModulos[currentIdx + 1] : null
  const nextIsAccessible = nextModulo && (isCompleted || nextModulo.progresos?.[0]?.completado)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const res = await fetch(`/api/cursos/${params.id}/progreso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduloId: params.moduloId }),
      })
      if (res.ok) {
        toast({ title: "Módulo completado" })
        await loadCurso()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally { setCompleting(false) }
  }

  const goToNext = () => {
    if (nextModulo) {
      router.push(`/oficiales/cursos/${params.id}/modulo/${nextModulo.id}`)
    }
  }

  const goToPrev = () => {
    if (prevModulo) {
      router.push(`/oficiales/cursos/${params.id}/modulo/${prevModulo.id}`)
    }
  }

  if (loading) return <PageSkeleton />
  if (!modulo) return <div className="text-center py-12 text-muted-foreground">Módulo no encontrado</div>

  const renderContent = (text: string) => {
    return text
      .split("\n\n")
      .map((paragraph, i) => {
        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
          return <h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3">{paragraph.replace(/\*\*/g, "")}</h3>
        }
        if (paragraph.startsWith("---")) {
          return <hr key={i} className="my-6 border-gray-200" />
        }
        if (paragraph.includes("\n-") || paragraph.startsWith("-")) {
          const lines = paragraph.split("\n")
          const title = lines[0].startsWith("-") ? null : lines[0]
          const items = lines.filter(l => l.startsWith("-") || l.startsWith("  -"))
          return (
            <div key={i} className="my-4">
              {title && <p className="font-semibold text-gray-800 mb-2">{title.replace(/\*\*/g, "")}</p>}
              <ul className="space-y-2 ml-1">
                {items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-gray-700 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: item.replace(/^-\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        if (paragraph.startsWith("Ejemplo")) {
          return (
            <div key={i} className="my-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>').replace(/→/g, '<span class="text-primary font-semibold">→</span>') }} />
            </div>
          )
        }
        if (paragraph.includes("**")) {
          return (
            <p key={i} className="text-gray-700 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }} />
          )
        }
        return <p key={i} className="text-gray-700 leading-relaxed my-3">{paragraph}</p>
      })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/oficiales/cursos/${params.id}`}>
          <Button variant="ghost" size="icon" className="mt-1"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">Módulo {modulo.orden} de {allModulos.length}</p>
          <h1 className="text-xl md:text-2xl font-bold mt-0.5">{modulo.titulo}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground mt-2">
            {modulo.duracion && (
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {modulo.duracion} min</span>
            )}
            {modulo.videoUrl && (
              <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>
            )}
            {modulo.examen && (
              <Badge variant="outline" className="text-xs">Tiene examen</Badge>
            )}
          </div>
        </div>
        {isCompleted && <Badge variant="success" className="gap-1 mt-1"><CheckCircle className="h-3 w-3" /> Completado</Badge>}
      </div>

      {/* Progress bar mini */}
      <div className="flex gap-1">
        {allModulos.map((m, idx) => (
          <div
            key={m.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              m.id === modulo.id ? "bg-primary" : m.progresos?.[0]?.completado ? "bg-green-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Video */}
      {modulo.videoUrl && (
        <Card>
          <CardContent className="p-3">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={modulo.videoUrl.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {modulo.contenido && (
        <Card>
          <CardContent className="p-5 md:p-8">
            <div className="max-w-none">
              {renderContent(modulo.contenido)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File attachment */}
      {modulo.archivoUrl && (
        <a href={modulo.archivoUrl} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-md cursor-pointer transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-50">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Material adjunto</p>
                <p className="text-xs text-muted-foreground">Click para descargar</p>
              </div>
            </CardContent>
          </Card>
        </a>
      )}

      {/* Complete + Navigate */}
      <div className="space-y-3 pt-4 border-t">
        {!isCompleted && (
          <Button className="w-full" size="lg" onClick={handleComplete} disabled={completing}>
            {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como completado
          </Button>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {prevModulo ? (
            <Button variant="outline" className="flex-1" onClick={goToPrev}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="truncate">{prevModulo.titulo}</span>
            </Button>
          ) : (
            <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-1 h-4 w-4" /> Volver al curso
              </Button>
            </Link>
          )}

          {nextModulo && nextIsAccessible ? (
            <Button variant={isCompleted ? "default" : "outline"} className="flex-1" onClick={goToNext}>
              <span className="truncate">{nextModulo.titulo}</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : nextModulo ? (
            <Button variant="outline" className="flex-1" disabled>
              <span className="truncate">Completá este módulo primero</span>
            </Button>
          ) : (
            <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
              <Button variant="default" className="w-full">
                Volver al curso <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
