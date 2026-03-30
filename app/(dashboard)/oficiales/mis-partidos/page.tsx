"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface PartidoDesignacion {
  id: string
  rol: string
  estado: string
  partido: {
    id: string
    fecha: string
    hora: string
    cancha: string
    ciudad: string
    categoria: string
    equipoLocal: string
    equipoVisit: string
    estado: string
  }
}

const ROL_LABELS: Record<string, string> = {
  ARBITRO_PRINCIPAL: "Árbitro Principal",
  ARBITRO_ASISTENTE_1: "Árbitro Asistente 1",
  ARBITRO_ASISTENTE_2: "Árbitro Asistente 2",
  MESA_ANOTADOR: "Anotador",
  MESA_CRONOMETRADOR: "Cronometrador",
  MESA_OPERADOR_24S: "Operador 24s",
  MESA_ASISTENTE: "Asistente de Mesa",
  ESTADISTICO: "Estadístico",
}

const CAT_LABELS: Record<string, string> = {
  PRIMERA_DIVISION: "1ra División", SEGUNDA_DIVISION: "2da División", FEMENINO: "Femenino",
  U21: "Sub-21", U18: "Sub-18", U16: "Sub-16", U14: "Sub-14", ESPECIAL: "Especial",
}

export default function MisPartidosPage() {
  const [designaciones, setDesignaciones] = useState<PartidoDesignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<"proximos" | "pasados">("proximos")

  useEffect(() => {
    fetch("/api/mis-partidos")
      .then((res) => res.json())
      .then((data) => setDesignaciones(data.designaciones || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const filtered = designaciones.filter((d) => {
    const fecha = new Date(d.partido.fecha)
    return filtro === "proximos" ? fecha >= now : fecha < now
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis Partidos</h1>

      <div className="flex gap-2">
        <Button variant={filtro === "proximos" ? "default" : "outline"} size="sm" onClick={() => setFiltro("proximos")}>Próximos</Button>
        <Button variant={filtro === "pasados" ? "default" : "outline"} size="sm" onClick={() => setFiltro("pasados")}>Pasados</Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {filtro === "proximos" ? "No tenés partidos próximos" : "No tenés partidos pasados"}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg">{d.partido.equipoLocal} vs {d.partido.equipoVisit}</p>
                    <Badge className="mt-1">{ROL_LABELS[d.rol] || d.rol}</Badge>
                  </div>
                  <Badge variant="outline">{CAT_LABELS[d.partido.categoria] || d.partido.categoria}</Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(d.partido.fecha)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {d.partido.hora}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {d.partido.cancha}, {d.partido.ciudad}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
