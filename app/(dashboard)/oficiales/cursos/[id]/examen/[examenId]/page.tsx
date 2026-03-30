"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle, Trophy } from "lucide-react"
import { PageSkeleton } from "@/components/ui/skeleton"

interface Opcion {
  id: string
  texto: string
  orden: number
}

interface Pregunta {
  id: string
  texto: string
  tipo: string
  orden: number
  puntaje: number
  opciones: Opcion[]
}

interface ExamenData {
  id: string
  titulo: string
  instrucciones: string | null
  notaMinima: number
  preguntas: Pregunta[]
}

interface Resultado {
  nota: number
  aprobado: boolean
  pendienteRevision: boolean
  obtenidos: number
  totalPuntos: number
  notaMinima: number
}

export default function ExamenPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [examen, setExamen] = useState<ExamenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  // Respuestas: { preguntaId: opcionId }
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  const [respuestasTexto, setRespuestasTexto] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cursos/${params.id}/examen/${params.examenId}`)
        if (res.ok) {
          const data = await res.json()
          setExamen(data.examen)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [params.id, params.examenId])

  const handleSelectOption = (preguntaId: string, opcionId: string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: opcionId }))
  }

  const handleTextChange = (preguntaId: string, texto: string) => {
    setRespuestasTexto((prev) => ({ ...prev, [preguntaId]: texto }))
  }

  const allAnswered = examen?.preguntas.every((p) => {
    if (p.tipo === "OPCION_MULTIPLE") return !!respuestas[p.id]
    return !!respuestasTexto[p.id]?.trim()
  })

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast({ variant: "destructive", title: "Respondé todas las preguntas antes de enviar" })
      return
    }

    setSubmitting(true)
    try {
      const respuestasArray = examen!.preguntas.map((p) => ({
        preguntaId: p.id,
        opcionId: p.tipo === "OPCION_MULTIPLE" ? respuestas[p.id] : undefined,
        respuestaTexto: p.tipo === "TEXTO_ABIERTO" ? respuestasTexto[p.id] : undefined,
      }))

      const res = await fetch(`/api/cursos/${params.id}/examen/${params.examenId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: respuestasArray }),
      })

      if (res.ok) {
        const data = await res.json()
        setResultado(data)
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error al enviar" })
    } finally { setSubmitting(false) }
  }

  if (loading) return <PageSkeleton />
  if (!examen) return <div className="text-center py-12 text-muted-foreground">Examen no encontrado</div>

  // Show result screen
  if (resultado) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            {resultado.aprobado ? (
              <>
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Trophy className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-700">Aprobado</h2>
                <p className="text-muted-foreground">Felicitaciones, aprobaste el examen</p>
              </>
            ) : resultado.pendienteRevision ? (
              <>
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-blue-700">En revisión</h2>
                <p className="text-muted-foreground">Tu examen tiene preguntas abiertas que serán revisadas por el instructor</p>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-700">No aprobado</h2>
                <p className="text-muted-foreground">No alcanzaste la nota mínima. Podés volver a intentarlo.</p>
              </>
            )}

            {/* Score */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-2">
              <div className="text-5xl font-bold">{resultado.nota}%</div>
              <p className="text-sm text-muted-foreground">
                {resultado.obtenidos} de {resultado.totalPuntos} puntos
              </p>
              <p className="text-xs text-muted-foreground">
                Nota mínima: {resultado.notaMinima}%
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href={`/oficiales/cursos/${params.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Volver al curso
                </Button>
              </Link>
              {!resultado.aprobado && !resultado.pendienteRevision && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setResultado(null)
                    setRespuestas({})
                    setRespuestasTexto({})
                  }}
                >
                  Reintentar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const answeredCount = examen.preguntas.filter((p) => {
    if (p.tipo === "OPCION_MULTIPLE") return !!respuestas[p.id]
    return !!respuestasTexto[p.id]?.trim()
  }).length

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/oficiales/cursos/${params.id}`}>
          <Button variant="ghost" size="icon" className="mt-1"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">Examen</p>
          <h1 className="text-xl md:text-2xl font-bold mt-0.5">{examen.titulo}</h1>
          {examen.instrucciones && (
            <p className="text-sm text-muted-foreground mt-2">{examen.instrucciones}</p>
          )}
        </div>
        <Badge variant="outline" className="mt-1">
          Mínimo {examen.notaMinima}%
        </Badge>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {answeredCount} de {examen.preguntas.length} respondidas
        </span>
        <div className="flex gap-1">
          {examen.preguntas.map((p, idx) => {
            const answered = p.tipo === "OPCION_MULTIPLE" ? !!respuestas[p.id] : !!respuestasTexto[p.id]?.trim()
            return (
              <div
                key={p.id}
                className={`h-2 w-6 rounded-full transition-colors ${answered ? "bg-primary" : "bg-gray-200"}`}
              />
            )
          })}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {examen.preguntas.map((pregunta, idx) => (
          <Card key={pregunta.id} className={respuestas[pregunta.id] || respuestasTexto[pregunta.id]?.trim() ? "border-primary/30" : ""}>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{idx + 1}</span>
                </div>
                <p className="font-medium text-gray-900 leading-relaxed pt-0.5">{pregunta.texto}</p>
              </div>

              {pregunta.tipo === "OPCION_MULTIPLE" ? (
                <div className="space-y-2 ml-10">
                  {pregunta.opciones.map((opcion) => {
                    const isSelected = respuestas[pregunta.id] === opcion.id
                    return (
                      <button
                        key={opcion.id}
                        onClick={() => handleSelectOption(pregunta.id, opcion.id)}
                        className={`w-full text-left p-3.5 rounded-lg border-2 transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/5 text-gray-900"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? "border-primary bg-primary" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm">{opcion.texto}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="ml-10">
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3.5 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Escribí tu respuesta..."
                    value={respuestasTexto[pregunta.id] || ""}
                    onChange={(e) => handleTextChange(pregunta.id, e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-4 pt-4">
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {allAnswered
                  ? "Todas las preguntas respondidas"
                  : `Faltan ${examen.preguntas.length - answeredCount} preguntas`}
              </p>
              <p className="text-xs text-muted-foreground">Nota mínima: {examen.notaMinima}%</p>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Enviar examen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
