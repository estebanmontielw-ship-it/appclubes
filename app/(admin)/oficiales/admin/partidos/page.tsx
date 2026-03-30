"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Loader2, Users, MapPin, Calendar, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ROL_LABELS } from "@/lib/constants"

interface Designacion {
  id: string
  rol: string
  usuario: { id: string; nombre: string; apellido: string }
}

interface Partido {
  id: string
  fecha: string
  hora: string
  cancha: string
  ciudad: string
  categoria: string
  equipoLocal: string
  equipoVisit: string
  estado: string
  designaciones: Designacion[]
  _count: { designaciones: number }
}

interface UsuarioOption {
  id: string
  nombre: string
  apellido: string
}

const CATEGORIAS = [
  { value: "PRIMERA_DIVISION", label: "Primera División" },
  { value: "SEGUNDA_DIVISION", label: "Segunda División" },
  { value: "FEMENINO", label: "Femenino" },
  { value: "U21", label: "Sub-21" },
  { value: "U18", label: "Sub-18" },
  { value: "U16", label: "Sub-16" },
  { value: "U14", label: "Sub-14" },
  { value: "ESPECIAL", label: "Especial" },
]

const ROLES_DESIGNACION = [
  { value: "ARBITRO_PRINCIPAL", label: "Árbitro Principal" },
  { value: "ARBITRO_ASISTENTE_1", label: "Árbitro Asistente 1" },
  { value: "ARBITRO_ASISTENTE_2", label: "Árbitro Asistente 2" },
  { value: "MESA_ANOTADOR", label: "Anotador" },
  { value: "MESA_CRONOMETRADOR", label: "Cronometrador" },
  { value: "MESA_OPERADOR_24S", label: "Operador 24s" },
  { value: "MESA_ASISTENTE", label: "Asistente de Mesa" },
  { value: "ESTADISTICO", label: "Estadístico" },
]

const ESTADO_COLOR: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  PROGRAMADO: "warning", EN_CURSO: "success", FINALIZADO: "secondary", SUSPENDIDO: "destructive", CANCELADO: "destructive",
}

export default function AdminPartidosPage() {
  const { toast } = useToast()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // New partido form
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [cancha, setCancha] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [categoria, setCategoria] = useState("")
  const [equipoLocal, setEquipoLocal] = useState("")
  const [equipoVisit, setEquipoVisit] = useState("")

  // Designación
  const [designandoPartido, setDesignandoPartido] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([])
  const [desigUsuario, setDesigUsuario] = useState("")
  const [desigRol, setDesigRol] = useState("")
  const [savingDesig, setSavingDesig] = useState(false)

  const loadPartidos = async () => {
    try {
      const res = await fetch("/api/admin/partidos")
      if (res.ok) { const data = await res.json(); setPartidos(data.partidos) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadPartidos() }, [])

  const loadUsuarios = async () => {
    const res = await fetch("/api/admin/usuarios/verificados")
    if (res.ok) { const data = await res.json(); setUsuarios(data.usuarios) }
  }

  const handleCreate = async () => {
    if (!fecha || !hora || !cancha || !ciudad || !categoria || !equipoLocal || !equipoVisit) {
      toast({ variant: "destructive", title: "Completá todos los campos" }); return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/partidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora, cancha, ciudad, categoria, equipoLocal, equipoVisit }),
      })
      if (res.ok) {
        toast({ title: "Partido creado" })
        setShowForm(false)
        setFecha(""); setHora(""); setCancha(""); setCiudad(""); setCategoria(""); setEquipoLocal(""); setEquipoVisit("")
        loadPartidos()
      }
    } catch { toast({ variant: "destructive", title: "Error" }) }
    finally { setSaving(false) }
  }

  const handleDesignar = async (partidoId: string) => {
    if (!desigUsuario || !desigRol) {
      toast({ variant: "destructive", title: "Seleccioná usuario y rol" }); return
    }
    setSavingDesig(true)
    try {
      const res = await fetch(`/api/admin/partidos/${partidoId}/designaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: desigUsuario, rol: desigRol }),
      })
      if (res.ok) {
        toast({ title: "Oficial designado" })
        setDesigUsuario(""); setDesigRol("")
        loadPartidos()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch { toast({ variant: "destructive", title: "Error" }) }
    finally { setSavingDesig(false) }
  }

  const handleRemoveDesig = async (partidoId: string, designacionId: string) => {
    try {
      await fetch(`/api/admin/partidos/${partidoId}/designaciones`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designacionId }),
      })
      loadPartidos()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> Nuevo partido</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha *</Label><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
              <div className="space-y-2"><Label>Hora *</Label><Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cancha *</Label><Input value={cancha} onChange={(e) => setCancha(e.target.value)} placeholder="Ej: Polideportivo SND" /></div>
              <div className="space-y-2"><Label>Ciudad *</Label><Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej: Asunción" /></div>
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Equipo Local *</Label><Input value={equipoLocal} onChange={(e) => setEquipoLocal(e.target.value)} /></div>
              <div className="space-y-2"><Label>Equipo Visitante *</Label><Input value={equipoVisit} onChange={(e) => setEquipoVisit(e.target.value)} /></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Crear partido</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando...</div>
      ) : partidos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay partidos creados</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {partidos.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg">{p.equipoLocal} vs {p.equipoVisit}</p>
                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.fecha)} — {p.hora}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.cancha}, {p.ciudad}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={ESTADO_COLOR[p.estado] || "secondary"}>{p.estado}</Badge>
                    <Badge variant="outline" className="text-xs">{CATEGORIAS.find((c) => c.value === p.categoria)?.label || p.categoria}</Badge>
                  </div>
                </div>

                {/* Designaciones */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium flex items-center gap-1"><Users className="h-4 w-4" /> Oficiales designados ({p.designaciones.length})</p>
                    <Button size="sm" variant="outline" onClick={() => { setDesignandoPartido(designandoPartido === p.id ? null : p.id); loadUsuarios() }}>
                      {designandoPartido === p.id ? "Cerrar" : "Designar"}
                    </Button>
                  </div>

                  {p.designaciones.length > 0 && (
                    <div className="space-y-1">
                      {p.designaciones.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                          <span><strong>{ROLES_DESIGNACION.find((r) => r.value === d.rol)?.label || d.rol}:</strong> {d.usuario.nombre} {d.usuario.apellido}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveDesig(p.id, d.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {designandoPartido === p.id && (
                    <div className="mt-3 flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Oficial</Label>
                        <Select value={desigUsuario} onValueChange={setDesigUsuario}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                          <SelectContent>{usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Rol</Label>
                        <Select value={desigRol} onValueChange={setDesigRol}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                          <SelectContent>{ROLES_DESIGNACION.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" onClick={() => handleDesignar(p.id)} disabled={savingDesig}>
                        {savingDesig && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Asignar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
