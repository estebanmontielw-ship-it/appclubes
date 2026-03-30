"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Video, Link2, Image, Search, ExternalLink } from "lucide-react"
import type { TipoRecurso, CategoriaRecurso, DisciplinaCurso } from "@prisma/client"

interface Recurso {
  id: string
  titulo: string
  descripcion: string | null
  tipo: TipoRecurso
  categoria: CategoriaRecurso
  url: string
  disciplina: DisciplinaCurso | null
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-5 w-5 text-red-500" />,
  VIDEO: <Video className="h-5 w-5 text-blue-500" />,
  LINK: <Link2 className="h-5 w-5 text-green-500" />,
  IMAGEN: <Image className="h-5 w-5 text-purple-500" />,
}

const CAT_LABELS: Record<string, string> = {
  REGLAMENTO: "Reglamento",
  MANUAL: "Manual",
  VIDEO_INSTRUCTIVO: "Video instructivo",
  FORMULARIO: "Formulario",
  OTRO: "Otro",
}

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")

  useEffect(() => {
    fetch("/api/admin/recursos")
      .then((res) => res.json())
      .then((data) => setRecursos(data.recursos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = recursos.filter((r) => {
    const matchSearch = !buscar || r.titulo.toLowerCase().includes(buscar.toLowerCase())
    const matchCat = !filtroCategoria || r.categoria === filtroCategoria
    return matchSearch && matchCat
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-pulse text-muted-foreground">Cargando...</div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recursos</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar recurso..." className="pl-9" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={!filtroCategoria ? "default" : "outline"} size="sm" onClick={() => setFiltroCategoria("")}>Todos</Button>
          {Object.entries(CAT_LABELS).map(([key, label]) => (
            <Button key={key} variant={filtroCategoria === key ? "default" : "outline"} size="sm" onClick={() => setFiltroCategoria(key)}>{label}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron recursos</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-gray-50">
                    {TIPO_ICONS[r.tipo] || <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{r.titulo}</p>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    {r.descripcion && <p className="text-sm text-muted-foreground mt-1">{r.descripcion}</p>}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{r.tipo}</Badge>
                      <Badge variant="secondary" className="text-xs">{CAT_LABELS[r.categoria] || r.categoria}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
