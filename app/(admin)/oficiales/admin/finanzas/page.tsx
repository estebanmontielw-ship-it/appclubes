"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { DollarSign, CheckCircle, Loader2, Plus } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Honorario {
  id: string
  monto: number
  estado: string
  pagadoEn: string | null
  usuario: { nombre: string; apellido: string }
  partido: { equipoLocal: string; equipoVisit: string; fecha: string }
  designacion: { rol: string }
}

interface Arancel {
  id: string
  categoria: string
  rol: string
  monto: number
  descripcion: string | null
}

const CATEGORIAS = [
  "PRIMERA_DIVISION", "SEGUNDA_DIVISION", "FEMENINO", "U21", "U18", "U16", "U14", "ESPECIAL",
]
const ROLES_DESIG = [
  "ARBITRO_PRINCIPAL", "ARBITRO_ASISTENTE_1", "ARBITRO_ASISTENTE_2",
  "MESA_ANOTADOR", "MESA_CRONOMETRADOR", "MESA_OPERADOR_24S", "MESA_ASISTENTE", "ESTADISTICO",
]

export default function AdminFinanzasPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<"dashboard" | "aranceles" | "honorarios">("dashboard")
  const [stats, setStats] = useState<any>(null)
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [aranceles, setAranceles] = useState<Arancel[]>([])
  const [loading, setLoading] = useState(true)

  // Arancel form
  const [showArancelForm, setShowArancelForm] = useState(false)
  const [arCat, setArCat] = useState("")
  const [arRol, setArRol] = useState("")
  const [arMonto, setArMonto] = useState("")
  const [savingArancel, setSavingArancel] = useState(false)

  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === "dashboard") {
        const res = await fetch("/api/admin/finanzas?tipo=stats")
        if (res.ok) setStats(await res.json())
      } else if (tab === "aranceles") {
        const res = await fetch("/api/admin/finanzas?tipo=aranceles")
        if (res.ok) { const data = await res.json(); setAranceles(data.aranceles) }
      } else {
        const res = await fetch("/api/admin/finanzas?tipo=honorarios")
        if (res.ok) { const data = await res.json(); setHonorarios(data.honorarios) }
      }
    } catch {} finally { setLoading(false) }
  }

  const handleCreateArancel = async () => {
    if (!arCat || !arRol || !arMonto) { toast({ variant: "destructive", title: "Completá todos los campos" }); return }
    setSavingArancel(true)
    try {
      const res = await fetch("/api/admin/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "crear_arancel", categoria: arCat, rol: arRol, monto: Number(arMonto) }),
      })
      if (res.ok) {
        toast({ title: "Arancel guardado" }); setShowArancelForm(false); setArCat(""); setArRol(""); setArMonto(""); loadData()
      }
    } catch { toast({ variant: "destructive", title: "Error" }) }
    finally { setSavingArancel(false) }
  }

  const handleMarkPaid = async (honorarioId: string) => {
    setMarkingPaid(honorarioId)
    try {
      const res = await fetch("/api/admin/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "marcar_pagado", honorarioId }),
      })
      if (res.ok) { toast({ title: "Honorario marcado como pagado" }); loadData() }
    } catch { toast({ variant: "destructive", title: "Error" }) }
    finally { setMarkingPaid(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas — Oficiales</h1>
        <p className="text-sm text-muted-foreground mt-1">Honorarios y pagos a oficiales por partidos trabajados</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "dashboard" ? "default" : "outline"} size="sm" onClick={() => setTab("dashboard")}>Dashboard</Button>
        <Button variant={tab === "aranceles" ? "default" : "outline"} size="sm" onClick={() => setTab("aranceles")}>Aranceles</Button>
        <Button variant={tab === "honorarios" ? "default" : "outline"} size="sm" onClick={() => setTab("honorarios")}>Honorarios</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando...</div>
      ) : tab === "dashboard" && stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total pendiente</p><p className="text-3xl font-bold text-yellow-600 mt-1">{formatCurrency(Number(stats.totalPendiente))}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total pagado</p><p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(Number(stats.totalPagado))}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Honorarios totales</p><p className="text-3xl font-bold mt-1">{stats.honorariosCount}</p></CardContent></Card>
        </div>
      ) : tab === "aranceles" ? (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setShowArancelForm(!showArancelForm)}><Plus className="mr-1 h-4 w-4" /> Nuevo arancel</Button>
          {showArancelForm && (
            <Card><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Categoría</Label>
                  <Select value={arCat} onValueChange={setArCat}><SelectTrigger className="h-9"><SelectValue placeholder="Cat." /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Rol</Label>
                  <Select value={arRol} onValueChange={setArRol}><SelectTrigger className="h-9"><SelectValue placeholder="Rol" /></SelectTrigger>
                    <SelectContent>{ROLES_DESIG.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Monto (Gs.)</Label><Input type="number" className="h-9" value={arMonto} onChange={(e) => setArMonto(e.target.value)} /></div>
              </div>
              <Button size="sm" onClick={handleCreateArancel} disabled={savingArancel}>{savingArancel && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Guardar</Button>
            </CardContent></Card>
          )}
          {aranceles.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay aranceles configurados</CardContent></Card>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left p-3">Categoría</th><th className="text-left p-3">Rol</th><th className="text-right p-3">Monto</th></tr></thead>
              <tbody>{aranceles.map((a) => (
                <tr key={a.id} className="border-b"><td className="p-3">{a.categoria}</td><td className="p-3">{a.rol}</td><td className="p-3 text-right font-medium">{formatCurrency(Number(a.monto))}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      ) : tab === "honorarios" ? (
        honorarios.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay honorarios registrados</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {honorarios.map((h) => (
              <Card key={h.id}><CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{h.usuario.nombre} {h.usuario.apellido}</p>
                  <p className="text-sm text-muted-foreground">{h.partido.equipoLocal} vs {h.partido.equipoVisit} — {formatDate(h.partido.fecha)}</p>
                  <p className="text-xs text-muted-foreground">{h.designacion.rol}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">{formatCurrency(Number(h.monto))}</p>
                  {h.estado === "PAGADO" ? (
                    <Badge variant="success">Pagado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" disabled={markingPaid === h.id} onClick={() => handleMarkPaid(h.id)}>
                      {markingPaid === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />} Pagar
                    </Button>
                  )}
                </div>
              </CardContent></Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  )
}
