"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, FileText, Video, Link2, Image } from "lucide-react"
import type { TipoRecurso, CategoriaRecurso, DisciplinaCurso } from "@prisma/client"

interface Recurso {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TipoRecurso
  categoria: CategoriaRecurso
  url: string
  disciplina: DisciplinaCurso | null
  createdAt: string
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-4 w-4" />,
  VIDEO: <Video className="h-4 w-4" />,
  LINK: <Link2 className="h-4 w-4" />,
  IMAGEN: <Image className="h-4 w-4" />,
}

export default function AdminRecursosPage() {
  const { toast } = useToast()
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<string>("")
  const [categoria, setCategoria] = useState<string>("OTRO")
  const [url, setUrl] = useState("")
  const [disciplina, setDisciplina] = useState<string>("")

  const loadRecursos = async () => {
    try {
      const res = await fetch("/api/admin/recursos")
      if (res.ok) {
        const data = await res.json()
        setRecursos(data.recursos)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecursos() }, [])

  const handleCreate = async () => {
    if (!titulo.trim() || !tipo || !url.trim()) {
      toast({ variant: "destructive", title: "Completá título, tipo y URL" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/recursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, tipo, categoria, url, disciplina: disciplina || null }),
      })
      if (res.ok) {
        toast({ title: "Recurso creado" })
        setShowForm(false)
        setTitulo(""); setDescripcion(""); setTipo(""); setUrl(""); setDisciplina("")
        loadRecursos()
      } else {
        const err = await res.json()
        toast({ variant: "destructive", title: "Error", description: err.error })
      }
    } catch {
      toast({ variant: "destructive", title: "Error de conexión" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/recursos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      setRecursos((prev) => prev.filter((r) => r.id !== id))
      toast({ title: "Recurso eliminado" })
    } catch {
      toast({ variant: "destructive", title: "Error" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recursos</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo recurso
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo recurso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Reglamento FIBA 2025" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Breve descripción..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="LINK">Link</SelectItem>
                    <SelectItem value="IMAGEN">Imagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGLAMENTO">Reglamento</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="VIDEO_INSTRUCTIVO">Video instructivo</SelectItem>
                    <SelectItem value="FORMULARIO">Formulario</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL del recurso *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Disciplina (opcional)</Label>
              <Select value={disciplina} onValueChange={setDisciplina}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARBITROS">Árbitros</SelectItem>
                  <SelectItem value="MESA">Mesa</SelectItem>
                  <SelectItem value="ESTADISTICOS">Estadísticos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando...</div>
      ) : recursos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay recursos cargados</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {recursos.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  {TIPO_ICONS[r.tipo] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.titulo}</p>
                  {r.descripcion && <p className="text-sm text-muted-foreground truncate">{r.descripcion}</p>}
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{r.tipo}</Badge>
                    <Badge variant="secondary" className="text-xs">{r.categoria}</Badge>
                    {r.disciplina && <Badge variant="secondary" className="text-xs">{r.disciplina}</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Abrir</Button>
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
