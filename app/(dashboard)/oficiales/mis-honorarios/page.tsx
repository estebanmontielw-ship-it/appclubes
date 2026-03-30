"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Honorario {
  id: string
  monto: number
  estado: string
  pagadoEn: string | null
  partido: { equipoLocal: string; equipoVisit: string; fecha: string; categoria: string }
  designacion: { rol: string }
}

const ROL_LABELS: Record<string, string> = {
  ARBITRO_PRINCIPAL: "Árbitro Principal", ARBITRO_ASISTENTE_1: "Asistente 1", ARBITRO_ASISTENTE_2: "Asistente 2",
  MESA_ANOTADOR: "Anotador", MESA_CRONOMETRADOR: "Cronometrador", MESA_OPERADOR_24S: "Op. 24s",
  MESA_ASISTENTE: "Asistente Mesa", ESTADISTICO: "Estadístico",
}

export default function MisHonorariosPage() {
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [totalPendiente, setTotalPendiente] = useState(0)
  const [totalPagado, setTotalPagado] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mis-honorarios")
      .then((res) => res.json())
      .then((data) => {
        setHonorarios(data.honorarios || [])
        setTotalPendiente(Number(data.totalPendiente || 0))
        setTotalPagado(Number(data.totalPagado || 0))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mis Honorarios</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Pendiente de cobro</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{formatCurrency(totalPendiente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total cobrado</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalPagado)}</p>
          </CardContent>
        </Card>
      </div>

      {honorarios.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          No tenés honorarios registrados
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {honorarios.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{h.partido.equipoLocal} vs {h.partido.equipoVisit}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(h.partido.fecha)} — {ROL_LABELS[h.designacion.rol] || h.designacion.rol}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">{formatCurrency(Number(h.monto))}</p>
                  <Badge variant={h.estado === "PAGADO" ? "success" : "warning"}>
                    {h.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
