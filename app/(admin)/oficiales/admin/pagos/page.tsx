"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle, ExternalLink, DollarSign } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

interface PagoRow {
  id: string
  monto: number
  comprobanteUrl: string
  referencia: string | null
  notas: string | null
  estado: string
  motivoRechazo: string | null
  createdAt: string
  inscripcion: {
    usuario: { id: string; nombre: string; apellido: string; email: string }
    curso: { id: string; nombre: string; precio: number }
  }
}

const TABS = [
  { label: "Pendientes", value: "PENDIENTE_REVISION" },
  { label: "Confirmados", value: "CONFIRMADO" },
  { label: "Rechazados", value: "RECHAZADO" },
]

export default function AdminPagosPage() {
  const { toast } = useToast()
  const [pagos, setPagos] = useState<PagoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("PENDIENTE_REVISION")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rechazoId, setRechazoId] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState("")

  const loadPagos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pagos?estado=${tab}`)
      if (res.ok) { const data = await res.json(); setPagos(data.pagos) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadPagos() }, [tab])

  const handleAction = async (pagoId: string, accion: string, motivo?: string) => {
    setActionLoading(pagoId)
    try {
      const res = await fetch("/api/admin/pagos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagoId, accion, motivoRechazo: motivo }),
      })
      if (res.ok) {
        toast({ title: accion === "confirmar" ? "Pago confirmado" : "Pago rechazado" })
        setRechazoId(null)
        setMotivoRechazo("")
        loadPagos()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Pagos</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button key={t.value} variant={tab === t.value ? "default" : "outline"} size="sm" onClick={() => setTab(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando...</div>
      ) : pagos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay pagos en esta categoría</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pagos.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.inscripcion.usuario.nombre} {p.inscripcion.usuario.apellido}</p>
                    <p className="text-sm text-muted-foreground">{p.inscripcion.curso.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(Number(p.monto))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <a href={p.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver comprobante
                  </a>
                  {p.referencia && <span className="text-muted-foreground">Ref: {p.referencia}</span>}
                </div>

                {p.notas && <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">Nota del usuario: {p.notas}</p>}
                {p.motivoRechazo && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">Motivo: {p.motivoRechazo}</p>}

                {p.estado === "PENDIENTE_REVISION" && (
                  <>
                    {rechazoId === p.id ? (
                      <div className="space-y-2">
                        <Label>Motivo del rechazo *</Label>
                        <Input value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Ej: Comprobante ilegible" />
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" disabled={actionLoading === p.id} onClick={() => handleAction(p.id, "rechazar", motivoRechazo)}>
                            {actionLoading === p.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Confirmar rechazo
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setRechazoId(null); setMotivoRechazo("") }}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={actionLoading === p.id} onClick={() => handleAction(p.id, "confirmar")}>
                          {actionLoading === p.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          <CheckCircle className="mr-1 h-4 w-4" /> Confirmar pago
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setRechazoId(p.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
