"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle, Video, FileText, Loader2, Clock } from "lucide-react"
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
  const [totalModulos, setTotalModulos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cursos/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          const mod = data.curso.modulos.find((m: any) => m.id === params.moduloId)
          setModulo(mod || null)
          setTotalModulos(data.curso.modulos.length)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [params.id, params.moduloId])

  const isCompleted = modulo?.progresos?.[0]?.completado

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
        // Reload to update state
        const res2 = await fetch(`/api/cursos/${params.id}`)
        if (res2.ok) {
          const data = await res2.json()
          const mod = data.curso.modulos.find((m: any) => m.id === params.moduloId)
          setModulo(mod || null)
        }
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

  // Parse markdown-like content to HTML
  const renderContent = (text: string) => {
    return text
      .split("\n\n")
      .map((paragraph, i) => {
        // Headers
        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
          return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{paragraph.replace(/\*\*/g, "")}</h3>
        }
        // Lists
        if (paragraph.includes("\n-") || paragraph.startsWith("-")) {
          const lines = paragraph.split("\n")
          const title = lines[0].startsWith("-") ? null : lines[0]
          const items = lines.filter(l => l.startsWith("-") || l.startsWith("  -"))
          return (
            <div key={i} className="my-3">
              {title && <p className="font-semibold text-gray-800 mb-1">{title.replace(/\*\*/g, "")}</p>}
              <ul className="space-y-1.5 ml-1">
                {items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{item.replace(/^-\s*/, "").replace(/\*\*/g, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        // Bold sections
        if (paragraph.includes("**")) {
          const parts = paragraph.split("**")
          return (
            <p key={i} className="text-gray-700 leading-relaxed my-2">
              {parts.map((part, j) => j % 2 === 0 ? part : <strong key={j} className="text-gray-900">{part}</strong>)}
            </p>
          )
        }
        // Regular paragraph
        return <p key={i} className="text-gray-700 leading-relaxed my-2">{paragraph}</p>
      })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/oficiales/cursos/${params.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">Módulo {modulo.orden} de {totalModulos}</p>
          <h1 className="text-xl font-bold">{modulo.titulo}</h1>
        </div>
        {isCompleted && <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Completado</Badge>}
      </div>

      {/* Meta info */}
      <div className="flex gap-3 text-sm text-muted-foreground">
        {modulo.duracion && (
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {modulo.duracion} minutos</span>
        )}
        {modulo.videoUrl && (
          <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Incluye video</span>
        )}
        {modulo.archivoUrl && (
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Material adjunto</span>
        )}
      </div>

      {/* Video */}
      {modulo.videoUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={modulo.videoUrl.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {modulo.contenido && (
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-gray max-w-none">
              {renderContent(modulo.contenido)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File attachment */}
      {modulo.archivoUrl && (
        <a href={modulo.archivoUrl} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
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

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {!isCompleted ? (
          <Button className="flex-1" size="lg" onClick={handleComplete} disabled={completing}>
            {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar como completado
          </Button>
        ) : (
          <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              Siguiente módulo
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
