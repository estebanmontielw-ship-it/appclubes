"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DollarSign, CheckCircle, Loader2, Plus, Pencil, Trash2,
  TrendingUp, Calendar, Search, Download, X, ChevronDown
} from "lucide-react"

// ─── Constants ──────────────────────────────────────────────
const CATEGORIAS: { value: string; label: string }[] = [
  { value: "PRIMERA_DIVISION", label: "LNB (Primera División)" },
  { value: "SEGUNDA_DIVISION", label: "Segunda División" },
  { value: "FEMENINO", label: "Femenino" },
  { value: "U22", label: "U22" },
  { value: "U18", label: "U18" },
  { value: "U16", label: "U16" },
  { value: "U14", label: "U14" },
  { value: "ESPECIAL", label: "Especial" },
]

const ROLES: { value: string; label: string }[] = [
  { value: "ARBITRO_PRINCIPAL",   label: "Crew Chief" },
  { value: "ARBITRO_ASISTENTE_1", label: "Auxiliar 1" },
  { value: "ARBITRO_ASISTENTE_2", label: "Auxiliar 2" },
  { value: "MESA_ANOTADOR",       label: "Apuntador" },
  { value: "MESA_CRONOMETRADOR",  label: "Cronómetro" },
  { value: "MESA_OPERADOR_24S",   label: "Lanzamiento 24s" },
  { value: "MESA_ASISTENTE",      label: "Relator" },
  { value: "ESTADISTICO",         label: "Estadístico" },
]

const catLabel = (v: string) => CATEGORIAS.find(c => c.value === v)?.label || v
const rolLabel  = (v: string) => ROLES.find(r => r.value === v)?.label || v

// Last 12 months for filter
function lastMonths(n = 12) {
  const months = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString("es-PY", { month: "long", year: "numeric" })
    months.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return months
}

// ─── Types ────────────────────────────────────────────────────
interface Honorario {
  id: string
  monto: number
  montoIva: number | null
  montoTotal: number
  aplicaIva: boolean
  estado: string
  pagadoEn: string | null
  cobradoEn: string | null
  notas: string | null
  usuario: { nombre: string; apellido: string; esEmpresa: boolean }
  partido: { equipoLocal: string; equipoVisit: string; fecha: string; categoria: string }
  designacion: { rol: string; esManual: boolean }
}

interface Arancel {
  id: string
  categoria: string
  rol: string
  monto: number
}

interface Stats {
  totalPendiente: number
  totalPagado: number
  honorariosCount: number
  pagadoEsteMes: number
}

// ─── Main Component ───────────────────────────────────────────
type Tab = "dashboard" | "aranceles" | "honorarios"

export default function AdminFinanzasPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>("dashboard")

  const [stats, setStats] = useState<Stats | null>(null)
  const [statsDetail, setStatsDetail] = useState<{ byMes: Record<string, any>; byCat: Record<string, any> } | null>(null)
  const [honorarios, setHonorarios] = useState<Honorario[]>([])
  const [aranceles, setAranceles] = useState<Arancel[]>([])
  const [loading, setLoading] = useState(true)

  // Arancel form
  const [showArancelForm, setShowArancelForm] = useState(false)
  const [arCat, setArCat] = useState("")
  const [arRol, setArRol] = useState("")
  const [arMonto, setArMonto] = useState("")
  const [savingArancel, setSavingArancel] = useState(false)
  const [editingArancel, setEditingArancel] = useState<{ id: string; monto: string } | null>(null)

  // Import
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState("")
  const [importing, setImporting] = useState(false)

  // Honorario filters
  const [filtroMes, setFiltroMes] = useState("")
  const [filtroCat, setFiltroCat] = useState("")
  const [filtroQ, setFiltroQ] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")

  // Pay modal
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payIva, setPayIva] = useState(false)
  const [payNotas, setPayNotas] = useState("")
  const [savingPay, setSavingPay] = useState(false)

  const MONTHS = lastMonths()

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === "dashboard") {
        const [r1, r2] = await Promise.all([
          fetch("/api/admin/finanzas?tipo=stats"),
          fetch("/api/admin/finanzas?tipo=stats_detail"),
        ])
        if (r1.ok) setStats(await r1.json())
        if (r2.ok) setStatsDetail(await r2.json())
      } else if (tab === "aranceles") {
        const res = await fetch("/api/admin/finanzas?tipo=aranceles")
        if (res.ok) { const d = await res.json(); setAranceles(d.aranceles) }
      } else {
        loadHonorarios()
      }
    } finally { setLoading(false) }
  }

  async function loadHonorarios() {
    const params = new URLSearchParams({ tipo: "honorarios" })
    if (filtroMes) params.set("mes", filtroMes)
    if (filtroCat) params.set("categoria", filtroCat)
    if (filtroQ) params.set("q", filtroQ)
    if (filtroEstado) params.set("estado", filtroEstado)
    const res = await fetch(`/api/admin/finanzas?${params}`)
    if (res.ok) { const d = await res.json(); setHonorarios(d.honorarios) }
  }

  useEffect(() => {
    if (tab === "honorarios") loadHonorarios()
  }, [filtroMes, filtroCat, filtroQ, filtroEstado])

  async function handleCreateArancel() {
    if (!arCat || !arRol || !arMonto) { toast({ variant: "destructive", title: "Completá todos los campos" }); return }
    setSavingArancel(true)
    try {
      const res = await fetch("/api/admin/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "crear_arancel", categoria: arCat, rol: arRol, monto: Number(arMonto) }),
      })
      if (res.ok) {
        toast({ title: "Arancel guardado" })
        setShowArancelForm(false); setArCat(""); setArRol(""); setArMonto("")
        loadData()
      }
    } finally { setSavingArancel(false) }
  }

  async function handleEditArancel(id: string, monto: string) {
    const res = await fetch("/api/admin/finanzas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "editar_arancel", id, monto: Number(monto) }),
    })
    if (res.ok) { toast({ title: "Arancel actualizado" }); setEditingArancel(null); loadData() }
  }

  async function handleDeleteArancel(id: string) {
    if (!confirm("¿Desactivar este arancel?")) return
    const res = await fetch("/api/admin/finanzas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "eliminar_arancel", id }),
    })
    if (res.ok) { toast({ title: "Arancel desactivado" }); loadData() }
  }

  async function handleImport() {
    setImporting(true)
    try {
      const aranceles = JSON.parse(importJson)
      const res = await fetch("/api/admin/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "importar_aranceles", aranceles }),
      })
      if (res.ok) {
        const d = await res.json()
        toast({ title: `${d.importados} aranceles importados` })
        setShowImport(false); setImportJson(""); loadData()
      }
    } catch { toast({ variant: "destructive", title: "JSON inválido" }) }
    finally { setImporting(false) }
  }

  async function handlePay() {
    if (!payingId) return
    setSavingPay(true)
    try {
      const res = await fetch("/api/admin/finanzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "marcar_pagado", honorarioId: payingId, aplicaIva: payIva, notas: payNotas }),
      })
      if (res.ok) {
        toast({ title: "Honorario marcado como pagado" })
        setPayingId(null); setPayIva(false); setPayNotas("")
        loadHonorarios()
      }
    } finally { setSavingPay(false) }
  }

  // Group aranceles by category
  const arancelesGrupo: Record<string, Arancel[]> = {}
  for (const a of aranceles) {
    if (!arancelesGrupo[a.categoria]) arancelesGrupo[a.categoria] = []
    arancelesGrupo[a.categoria].push(a)
  }

  const payingHonorario = honorarios.find(h => h.id === payingId)
  const payTotal = payingHonorario
    ? payIva
      ? Number(payingHonorario.monto) * 1.10
      : Number(payingHonorario.monto)
    : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">Finanzas — Oficiales</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Honorarios y aranceles por partidos trabajados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(["dashboard", "aranceles", "honorarios"] as Tab[]).map(t => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)} className="shrink-0 capitalize">
            {t === "dashboard" ? "Resumen" : t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Cargando...</div>
      ) : tab === "dashboard" ? (
        <DashboardTab stats={stats} detail={statsDetail} />
      ) : tab === "aranceles" ? (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setShowArancelForm(!showArancelForm)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo arancel
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowImport(!showImport)}>
              <Download className="mr-1 h-4 w-4" /> Importar JSON
            </Button>
          </div>

          {showArancelForm && (
            <Card><CardContent className="p-4 space-y-3">
              <p className="font-medium text-sm">Nuevo arancel</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <Select value={arCat} onValueChange={setArCat}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Rol</Label>
                  <Select value={arRol} onValueChange={setArRol}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Monto neto (Gs.)</Label>
                  <Input type="number" className="h-9" value={arMonto} onChange={e => setArMonto(e.target.value)} placeholder="500000" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateArancel} disabled={savingArancel}>
                  {savingArancel && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowArancelForm(false)}>Cancelar</Button>
              </div>
            </CardContent></Card>
          )}

          {showImport && (
            <Card><CardContent className="p-4 space-y-3">
              <p className="font-medium text-sm">Importar aranceles — JSON</p>
              <p className="text-xs text-muted-foreground">Formato: <code className="bg-gray-100 px-1 rounded">[{"{"}"categoria":"PRIMERA_DIVISION","rol":"ARBITRO_PRINCIPAL","monto":500000{"}"}]</code></p>
              <textarea
                className="w-full border rounded-lg p-2 text-xs font-mono h-32 resize-none"
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder='[{"categoria":"PRIMERA_DIVISION","rol":"ARBITRO_PRINCIPAL","monto":500000}]'
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImport} disabled={importing}>
                  {importing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Importar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowImport(false)}>Cancelar</Button>
              </div>
            </CardContent></Card>
          )}

          {Object.keys(arancelesGrupo).length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No hay aranceles configurados</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(arancelesGrupo).map(([cat, items]) => (
                <Card key={cat}>
                  <div className="px-4 py-2.5 border-b bg-gray-50/60">
                    <p className="font-semibold text-sm text-gray-700">{catLabel(cat)}</p>
                  </div>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left px-4 py-2">Rol</th>
                          <th className="text-right px-4 py-2">Monto Neto</th>
                          <th className="text-right px-4 py-2">+10% IVA</th>
                          <th className="px-4 py-2 w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(a => (
                          <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50/40">
                            <td className="px-4 py-2.5 font-medium">{rolLabel(a.rol)}</td>
                            <td className="px-4 py-2.5 text-right">
                              {editingArancel?.id === a.id ? (
                                <Input
                                  type="number"
                                  className="h-7 w-28 ml-auto text-right"
                                  value={editingArancel.monto}
                                  onChange={e => setEditingArancel({ id: a.id, monto: e.target.value })}
                                />
                              ) : (
                                <span className="font-semibold">{formatCurrency(Number(a.monto))}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                              {formatCurrency(Number(a.monto) * 1.10)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {editingArancel?.id === a.id ? (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleEditArancel(a.id, editingArancel.monto)}>OK</Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditingArancel(null)}><X className="h-3 w-3" /></Button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingArancel({ id: a.id, monto: String(a.monto) })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => handleDeleteArancel(a.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* HONORARIOS TAB */
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Select value={filtroMes} onValueChange={setFiltroMes}>
              <SelectTrigger className="h-9 w-full sm:w-44">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los meses</SelectItem>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filtroCat} onValueChange={setFiltroCat}>
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-9 w-full sm:w-36">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="PAGADO">Pagados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar oficial..."
                className="h-9 pl-9"
                value={filtroQ}
                onChange={e => setFiltroQ(e.target.value)}
              />
            </div>
          </div>

          {/* Summary bar */}
          {honorarios.length > 0 && (
            <div className="flex gap-3 text-sm">
              <span className="text-muted-foreground">{honorarios.length} honorarios</span>
              <span className="text-yellow-600 font-medium">
                Pendiente: {formatCurrency(honorarios.filter(h => h.estado === "PENDIENTE").reduce((s, h) => s + Number(h.montoTotal), 0))}
              </span>
              <span className="text-green-600 font-medium">
                Pagado: {formatCurrency(honorarios.filter(h => h.estado === "PAGADO").reduce((s, h) => s + Number(h.montoTotal), 0))}
              </span>
            </div>
          )}

          {honorarios.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No hay honorarios para los filtros seleccionados</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {honorarios.map(h => (
                <Card key={h.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{h.usuario.nombre} {h.usuario.apellido}</p>
                          {h.usuario.esEmpresa && <Badge variant="outline" className="text-[10px] px-1.5">Empresa</Badge>}
                          {h.designacion.esManual && <Badge variant="outline" className="text-[10px] px-1.5 text-gray-400">Manual</Badge>}
                          {h.cobradoEn && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 text-green-700 bg-green-50">
                              Ya cobró ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.partido.equipoLocal} vs {h.partido.equipoVisit} · {formatDate(h.partido.fecha)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {catLabel(h.partido.categoria)} · {rolLabel(h.designacion.rol)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Neto: {formatCurrency(Number(h.monto))}</p>
                          {h.aplicaIva && (
                            <p className="text-xs text-blue-600">IVA 10%: +{formatCurrency(Number(h.montoIva))}</p>
                          )}
                          <p className="font-bold text-sm">{formatCurrency(Number(h.montoTotal))}</p>
                        </div>
                        {h.estado === "PAGADO" ? (
                          <Badge variant="success" className="text-xs">
                            Pagado {h.pagadoEn ? formatDate(h.pagadoEn) : ""}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => { setPayingId(h.id); setPayIva(h.usuario.esEmpresa) }}
                          >
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pay modal */}
      {payingId && payingHonorario && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-base">Marcar como pagado</h3>
            <p className="text-sm text-muted-foreground">
              {payingHonorario.usuario.nombre} {payingHonorario.usuario.apellido} —{" "}
              {payingHonorario.partido.equipoLocal} vs {payingHonorario.partido.equipoVisit}
            </p>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
              <div>
                <p className="text-xs text-muted-foreground">Monto neto</p>
                <p className="font-semibold">{formatCurrency(Number(payingHonorario.monto))}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(payTotal)}</p>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={payIva}
                onChange={e => setPayIva(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="text-sm">Aplica IVA 10% (+{formatCurrency(Number(payingHonorario.monto) * 0.10)})</span>
            </label>

            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Input
                placeholder="Ej: transferencia banco X"
                value={payNotas}
                onChange={e => setPayNotas(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setPayingId(null); setPayIva(false); setPayNotas("") }}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handlePay} disabled={savingPay}>
                {savingPay && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar pago
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────
function DashboardTab({ stats, detail }: { stats: Stats | null; detail: any }) {
  if (!stats) return null

  const catOrder = ["PRIMERA_DIVISION","SEGUNDA_DIVISION","FEMENINO","U22","U18","U16","U14","ESPECIAL"]
  const cats = detail?.byCat
    ? catOrder.filter(c => detail.byCat[c]).map(c => ({ cat: c, ...detail.byCat[c] }))
    : []

  const mesesEntries = detail?.byMes
    ? Object.entries(detail.byMes as Record<string, { pendiente: number; pagado: number; count: number }>)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
    : []

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total pendiente" value={formatCurrency(Number(stats.totalPendiente))} color="text-yellow-600" />
        <StatCard label="Total pagado" value={formatCurrency(Number(stats.totalPagado))} color="text-green-600" />
        <StatCard label="Pagado este mes" value={formatCurrency(Number(stats.pagadoEsteMes))} color="text-blue-600" />
        <StatCard label="Honorarios totales" value={String(stats.honorariosCount)} color="text-gray-700" />
      </div>

      {/* By category */}
      {cats.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-sm">Por categoría</p>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2">Categoría</th>
                  <th className="text-right px-4 py-2">Pendiente</th>
                  <th className="text-right px-4 py-2">Pagado</th>
                  <th className="text-right px-4 py-2">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {cats.map(({ cat, pendiente, pagado, count }) => (
                  <tr key={cat} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{catLabel(cat)}</td>
                    <td className="px-4 py-2.5 text-right text-yellow-600">{formatCurrency(pendiente)}</td>
                    <td className="px-4 py-2.5 text-right text-green-600">{formatCurrency(pagado)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* By month */}
      {mesesEntries.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-sm">Últimos meses</p>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2">Mes</th>
                  <th className="text-right px-4 py-2">Pendiente</th>
                  <th className="text-right px-4 py-2">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {mesesEntries.map(([mes, data]) => {
                  const d = new Date(mes + "-01")
                  const label = d.toLocaleDateString("es-PY", { month: "long", year: "numeric" })
                  return (
                    <tr key={mes} className="border-b last:border-0">
                      <td className="px-4 py-2.5 capitalize font-medium">{label}</td>
                      <td className="px-4 py-2.5 text-right text-yellow-600">{formatCurrency(data.pendiente)}</td>
                      <td className="px-4 py-2.5 text-right text-green-600">{formatCurrency(data.pagado)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
