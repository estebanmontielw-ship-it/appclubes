"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, User } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CursoItem {
  id: string
  nombre: string
  descripcion: string
  disciplina: string
  nivel: string
  precio: number
  esGratuito: boolean
  modulos: { id: string }[]
  instructor: { nombre: string; apellido: string } | null
  inscripciones?: { id: string; estado: string }[]
}

const DISCIPLINA_LABELS: Record<string, string> = {
  ARBITROS: "Árbitros", MESA: "Mesa", ESTADISTICOS: "Estadísticos",
}
const NIVEL_LABELS: Record<string, string> = {
  A_INICIAL: "Inicial", B_ACTUALIZACION: "Actualización", C_AVANZADO: "Avanzado",
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<CursoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroDisciplina, setFiltroDisciplina] = useState("")

  useEffect(() => {
    fetch("/api/cursos")
      .then((res) => res.json())
      .then((data) => setCursos(data.cursos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = cursos.filter(
    (c) => !filtroDisciplina || c.disciplina === filtroDisciplina
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cursos</h1>

      <div className="flex gap-2">
        <Button variant={!filtroDisciplina ? "default" : "outline"} size="sm" onClick={() => setFiltroDisciplina("")}>Todos</Button>
        <Button variant={filtroDisciplina === "ARBITROS" ? "default" : "outline"} size="sm" onClick={() => setFiltroDisciplina("ARBITROS")}>Árbitros</Button>
        <Button variant={filtroDisciplina === "MESA" ? "default" : "outline"} size="sm" onClick={() => setFiltroDisciplina("MESA")}>Mesa</Button>
        <Button variant={filtroDisciplina === "ESTADISTICOS" ? "default" : "outline"} size="sm" onClick={() => setFiltroDisciplina("ESTADISTICOS")}>Estadísticos</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay cursos disponibles</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((curso) => {
            const inscripcion = curso.inscripciones?.[0]
            const isInscrito = !!inscripcion

            return (
              <Link key={curso.id} href={`/oficiales/cursos/${curso.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      {isInscrito && (
                        <Badge variant={inscripcion.estado === "ACTIVO" ? "success" : inscripcion.estado === "COMPLETADO" ? "default" : "warning"} className="text-xs">
                          {inscripcion.estado === "ACTIVO" ? "En curso" : inscripcion.estado === "COMPLETADO" ? "Completado" : "Pendiente pago"}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold mb-1">{curso.nombre}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{curso.descripcion}</p>

                    <div className="flex gap-2 flex-wrap mb-3">
                      <Badge variant="outline" className="text-xs">{DISCIPLINA_LABELS[curso.disciplina]}</Badge>
                      <Badge variant="outline" className="text-xs">{NIVEL_LABELS[curso.nivel]}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {curso.modulos.length} módulos</span>
                        {curso.instructor && (
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {curso.instructor.nombre}</span>
                        )}
                      </div>
                      {curso.esGratuito ? (
                        <Badge variant="success" className="text-xs">Gratis</Badge>
                      ) : (
                        <span className="font-semibold text-sm">{formatCurrency(Number(curso.precio))}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
