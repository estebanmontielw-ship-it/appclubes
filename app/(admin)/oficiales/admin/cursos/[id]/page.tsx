"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical } from "lucide-react"

interface Modulo {
  id: string
  titulo: string
  descripcion: string | null
  contenido: string | null
  videoUrl: string | null
  orden: number
  duracion: number | null
  examen: { id: string; titulo: string } | null
}

interface CursoDetalle {
  id: string
  nombre: string
  descripcion: string
  disciplina: string
  nivel: string
  precio: number
  esGratuito: boolean
  estado: string
  modulos: Modulo[]
  _count: { inscripciones: number }
}

export default function AdminCursoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [curso, setCurso] = useState<CursoDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit curso state
  const [editingCurso, setEditingCurso] = useState(false)
  const [cursoEstado, setCursoEstado] = useState("")
  const [savingCurso, setSavingCurso] = useState(false)

  // New modulo form
  const [showModuloForm, setShowModuloForm] = useState(false)
  const [moduloTitulo, setModuloTitulo] = useState("")
  const [moduloDescripcion, setModuloDescripcion] = useState("")
  const [moduloContenido, setModuloContenido] = useState("")
  const [moduloVideoUrl, setModuloVideoUrl] = useState("")
  const [moduloDuracion, setModuloDuracion] = useState("")
  const [savingModulo, setSavingModulo] = useState(false)

  const loadCurso = async () => {
    try {
      const res = await fetch(`/api/admin/cursos/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setCurso(data.curso)
        setCursoEstado(data.curso.estado)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadCurso() }, [params.id])

  const handleUpdateEstado = async () => {
    setSavingCurso(true)
    try {
      const res = await fetch(`/api/admin/cursos/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: cursoEstado }),
      })
      if (res.ok) {
        toast({ title: "Estado actualizado" })
        setEditingCurso(false)
        loadCurso()
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally { setSavingCurso(false) }
  }

  const handleCreateModulo = async () => {
    if (!moduloTitulo.trim()) {
      toast({ variant: "destructive", title: "El título es requerido" })
      return
    }
    setSavingModulo(true)
    try {
      const res = await fetch(`/api/admin/cursos/${params.id}/modulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: moduloTitulo,
          descripcion: moduloDescripcion || null,
          contenido: moduloContenido || null,
          videoUrl: moduloVideoUrl || null,
          duracion: moduloDuracion ? parseInt(moduloDuracion) : null,
        }),
      })
      if (res.ok) {
        toast({ title: "Módulo creado" })
        setShowModuloForm(false)
        setModuloTitulo(""); setModuloDescripcion(""); setModuloContenido(""); setModuloVideoUrl(""); setModuloDuracion("")
        loadCurso()
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    } finally { setSavingModulo(false) }
  }

  const handleDeleteModulo = async (moduloId: string) => {
    try {
      const res = await fetch(`/api/admin/modulos/${moduloId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Módulo eliminado" })
        loadCurso()
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteCurso = async () => {
    try {
      const res = await fetch(`/api/admin/cursos/${params.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Curso eliminado" })
        router.push("/oficiales/admin/cursos")
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error" })
    }
  }

  if (loading || !curso) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  const ESTADO_COLOR: Record<string, "success" | "warning" | "secondary"> = {
    ACTIVO: "success", BORRADOR: "warning", INACTIVO: "secondary",
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{curso.nombre}</h1>
          <p className="text-sm text-muted-foreground">{curso._count.inscripciones} inscriptos</p>
        </div>
        <Badge variant={ESTADO_COLOR[curso.estado]}>{curso.estado}</Badge>
      </div>

      {/* Course info + state management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del curso</CardTitle>
            <div className="flex gap-2">
              {editingCurso ? (
                <>
                  <Select value={cursoEstado} onValueChange={setCursoEstado}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BORRADOR">Borrador</SelectItem>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleUpdateEstado} disabled={savingCurso}>
                    {savingCurso && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCurso(false)}>Cancelar</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditingCurso(true)}>Cambiar estado</Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Eliminar</Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{curso.descripcion}</p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">{curso.disciplina}</Badge>
            <Badge variant="outline">{curso.nivel}</Badge>
            {curso.esGratuito ? <Badge variant="success">Gratis</Badge> : <Badge variant="secondary">Gs. {Number(curso.precio).toLocaleString("es-PY")}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-red-800">¿Estás seguro que querés eliminar este curso?</p>
            <p className="text-sm text-red-700">
              Se eliminarán todos los módulos, secciones, exámenes, inscripciones, pagos y certificados asociados. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteCurso}>
                Sí, eliminar curso
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Módulos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Módulos ({curso.modulos.length})</CardTitle>
            <Button size="sm" onClick={() => setShowModuloForm(!showModuloForm)}>
              <Plus className="mr-1 h-4 w-4" /> Agregar módulo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showModuloForm && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label>Título del módulo *</Label>
                  <Input value={moduloTitulo} onChange={(e) => setModuloTitulo(e.target.value)} placeholder="Ej: Introducción a las reglas" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={moduloDescripcion} onChange={(e) => setModuloDescripcion(e.target.value)} placeholder="Breve descripción..." />
                </div>
                <div className="space-y-2">
                  <Label>Contenido (texto/Markdown)</Label>
                  <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={moduloContenido} onChange={(e) => setModuloContenido(e.target.value)} placeholder="Contenido del módulo..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL de video (opcional)</Label>
                    <Input value={moduloVideoUrl} onChange={(e) => setModuloVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Duración (minutos)</Label>
                    <Input type="number" value={moduloDuracion} onChange={(e) => setModuloDuracion(e.target.value)} placeholder="30" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleCreateModulo} disabled={savingModulo}>
                    {savingModulo && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Crear módulo
                  </Button>
                  <Button variant="outline" onClick={() => setShowModuloForm(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {curso.modulos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay módulos. Agregá el primer módulo del curso.
            </p>
          ) : (
            curso.modulos.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50/50">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.titulo}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {m.duracion && <span>{m.duracion} min</span>}
                    {m.videoUrl && <span>· Video</span>}
                    {m.examen && <Badge variant="outline" className="text-[10px]">Examen</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteModulo(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
