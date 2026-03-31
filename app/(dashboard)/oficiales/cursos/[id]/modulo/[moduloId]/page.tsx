"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Video,
  FileText,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { PageSkeleton } from "@/components/ui/skeleton"
import SeccionRenderer from "@/components/curso/SeccionRenderer"

interface Seccion {
  id: string
  titulo: string
  contenido: string
  tipo: string
  orden: number
  metadata: string | null
}

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
  secciones: Seccion[]
}

export default function ModuloDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [modulo, setModulo] = useState<ModuloData | null>(null)
  const [allModulos, setAllModulos] = useState<ModuloData[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

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
    setCurrentSection(0)
    loadCurso()
  }, [params.id, params.moduloId])

  const isCompleted = modulo?.progresos?.[0]?.completado
  const hasSections = modulo && modulo.secciones.length > 0
  const totalSections = hasSections ? modulo.secciones.length : 0
  const isLastSection = currentSection >= totalSections - 1

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

  if (loading) return <PageSkeleton />
  if (!modulo) return <div className="text-center py-12 text-muted-foreground">Módulo no encontrado</div>

  // Fallback: render old-style contenido if no sections
  const renderOldContent = (text: string) => {
    return text.split("\n\n").map((paragraph, i) => {
      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
        return <h3 key={i} className="text-lg font-bold text-gray-900 mt-8 mb-3">{paragraph.replace(/\*\*/g, "")}</h3>
      }
      if (paragraph.includes("**")) {
        return <p key={i} className="text-gray-700 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }} />
      }
      if (paragraph.includes("\n-") || paragraph.startsWith("-")) {
        const lines = paragraph.split("\n")
        const title = lines[0].startsWith("-") ? null : lines[0]
        const items = lines.filter(l => l.startsWith("-"))
        return (
          <div key={i} className="my-4">
            {title && <p className="font-semibold text-gray-800 mb-2">{title.replace(/\*\*/g, "")}</p>}
            <ul className="space-y-2 ml-1">{items.map((item, j) => (
              <li key={j} className="flex items-start gap-2.5 text-gray-700"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" /><span>{item.replace(/^-\s*/, "")}</span></li>
            ))}</ul>
          </div>
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
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">
            Módulo {modulo.orden} de {allModulos.length}
          </p>
          <h1 className="text-xl md:text-2xl font-bold mt-0.5">{modulo.titulo}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground mt-2">
            {modulo.duracion && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {modulo.duracion} min</span>}
            {modulo.examen && <Badge variant="outline" className="text-xs">Tiene examen</Badge>}
          </div>
        </div>
        {isCompleted && <Badge variant="success" className="gap-1 mt-1"><CheckCircle className="h-3 w-3" /> Completado</Badge>}
      </div>

      {/* Section progress dots */}
      {hasSections && (
        <div className="flex items-center gap-1.5 justify-center">
          {modulo.secciones.map((_, idx) => (
            <button
              key={idx}
              onClick={() => idx <= currentSection && setCurrentSection(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === currentSection
                  ? "w-8 bg-primary"
                  : idx < currentSection
                  ? "w-2 bg-primary/40 cursor-pointer"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}

      {/* Video */}
      {modulo.videoUrl && currentSection === 0 && (
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

      {/* Section content */}
      {hasSections ? (
        <div className="space-y-4">
          {/* Section title */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-500">
              {modulo.secciones[currentSection]?.titulo}
            </h2>
            <span className="text-xs text-muted-foreground">
              {currentSection + 1} / {totalSections}
            </span>
          </div>

          {/* Render current section */}
          <Card>
            <CardContent className="p-5 md:p-8">
              <SeccionRenderer seccion={modulo.secciones[currentSection]} />
            </CardContent>
          </Card>

          {/* Section navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={currentSection === 0}
              onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            {!isLastSection ? (
              <Button
                className="flex-1"
                onClick={() => setCurrentSection((s) => Math.min(totalSections - 1, s + 1))}
              >
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      ) : modulo.contenido ? (
        /* Fallback: old content */
        <Card>
          <CardContent className="p-5 md:p-8">
            <div className="max-w-none">{renderOldContent(modulo.contenido)}</div>
          </CardContent>
        </Card>
      ) : null}

      {/* File attachment */}
      {modulo.archivoUrl && (
        <a href={modulo.archivoUrl} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-md cursor-pointer transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-50"><FileText className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="font-medium text-sm">Material adjunto</p>
                <p className="text-xs text-muted-foreground">Click para descargar</p>
              </div>
            </CardContent>
          </Card>
        </a>
      )}

      {/* Exam link */}
      {modulo.examen && (isLastSection || !hasSections) && (
        <Link href={`/oficiales/cursos/${params.id}/examen/${modulo.examen.id}`}>
          <Card className="border-2 border-primary/20 hover:border-primary/40 hover:shadow-md cursor-pointer transition-all bg-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{modulo.examen.titulo}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Rendí el examen para avanzar</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Complete + Module navigation */}
      {(isLastSection || !hasSections) && (
        <div className="space-y-3 pt-4 border-t">
          {!isCompleted && (
            <Button className="w-full" size="lg" onClick={handleComplete} disabled={completing}>
              {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como completado
            </Button>
          )}

          <div className="flex gap-3">
            {prevModulo ? (
              <Button variant="outline" className="flex-1" onClick={() => router.push(`/oficiales/cursos/${params.id}/modulo/${prevModulo.id}`)}>
                <ChevronLeft className="mr-1 h-4 w-4" /><span className="truncate">{prevModulo.titulo}</span>
              </Button>
            ) : (
              <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
                <Button variant="outline" className="w-full"><ArrowLeft className="mr-1 h-4 w-4" /> Volver al curso</Button>
              </Link>
            )}
            {nextModulo && nextIsAccessible ? (
              <Button variant={isCompleted ? "default" : "outline"} className="flex-1" onClick={() => router.push(`/oficiales/cursos/${params.id}/modulo/${nextModulo.id}`)}>
                <span className="truncate">{nextModulo.titulo}</span><ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : nextModulo ? (
              <Button variant="outline" className="flex-1" disabled>Completá este módulo primero</Button>
            ) : (
              <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
                <Button variant="default" className="w-full">Volver al curso <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
