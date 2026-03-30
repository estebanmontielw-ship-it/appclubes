"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Plus, BookOpen, Loader2, Eye, Users } from "lucide-react"

interface CursoRow {
  id: string
  nombre: string
  disciplina: string
  nivel: string
  precio: number
  esGratuito: boolean
  estado: string
  modulos: { id: string }[]
  _count: { inscripciones: number }
  instructor: { nombre: string; apellido: string } | null
}

const DISCIPLINA_LABELS: Record<string, string> = {
  ARBITROS: "Árbitros", MESA: "Mesa", ESTADISTICOS: "Estadísticos",
}
const NIVEL_LABELS: Record<string, string> = {
  A_INICIAL: "Inicial", B_ACTUALIZACION: "Actualización", C_AVANZADO: "Avanzado",
}
const ESTADO_COLOR: Record<string, "success" | "warning" | "secondary"> = {
  ACTIVO: "success", BORRADOR: "warning", INACTIVO: "secondary",
}

export default function AdminCursosPage() {
  const { toast } = useToast()
  const [cursos, setCursos] = useState<CursoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [disciplina, setDisciplina] = useState("")
  const [nivel, setNivel] = useState("")
  const [precio, setPrecio] = useState("")
  const [esGratuito, setEsGratuito] = useState(false)

  const loadCursos = async () => {
    try {
      const res = await fetch("/api/admin/cursos")
      if (res.ok) { const data = await res.json(); setCursos(data.cursos) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadCursos() }, [])

  const handleCreate = async () => {
    if (!nombre.trim() || !descripcion.trim() || !disciplina || !nivel) {
      toast({ variant: "destructive", title: "Completá todos los campos obligatorios" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion, disciplina, nivel, precio: esGratuito ? 0 : Number(precio), esGratuito }),
      })
      if (res.ok) {
        toast({ title: "Curso creado" })
        setShowForm(false)
        setNombre(""); setDescripcion(""); setDisciplina(""); setNivel(""); setPrecio(""); setEsGratuito(false)
        loadCursos()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Cursos</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo curso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Curso Inicial para Árbitros" />
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del curso..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disciplina *</Label>
                <Select value={disciplina} onValueChange={setDisciplina}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARBITROS">Árbitros</SelectItem>
                    <SelectItem value="MESA">Mesa</SelectItem>
                    <SelectItem value="ESTADISTICOS">Estadísticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel *</Label>
                <Select value={nivel} onValueChange={setNivel}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_INICIAL">A - Inicial</SelectItem>
                    <SelectItem value="B_ACTUALIZACION">B - Actualización</SelectItem>
                    <SelectItem value="C_AVANZADO">C - Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="gratuito" checked={esGratuito} onCheckedChange={(c) => setEsGratuito(c === true)} />
                <label htmlFor="gratuito" className="text-sm">Curso gratuito</label>
              </div>
              {!esGratuito && (
                <div className="flex-1 space-y-1">
                  <Label>Precio (Gs.)</Label>
                  <Input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear curso
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando...</div>
      ) : cursos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay cursos creados</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {cursos.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{c.nombre}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{DISCIPLINA_LABELS[c.disciplina]}</Badge>
                    <Badge variant="outline" className="text-xs">{NIVEL_LABELS[c.nivel]}</Badge>
                    <Badge variant={ESTADO_COLOR[c.estado]} className="text-xs">{c.estado}</Badge>
                    {c.esGratuito ? <Badge variant="success" className="text-xs">Gratis</Badge> : <Badge variant="secondary" className="text-xs">Gs. {Number(c.precio).toLocaleString("es-PY")}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.modulos.length} módulos · {c._count.inscripciones} inscriptos
                    {c.instructor && ` · Instructor: ${c.instructor.nombre} ${c.instructor.apellido}`}
                  </p>
                </div>
                <Link href={`/oficiales/admin/cursos/${c.id}`}>
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> Gestionar</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
