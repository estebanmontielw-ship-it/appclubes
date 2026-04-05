import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"
import { FileText, Download } from "lucide-react"

// Revalidate regulations every 2 hours
export const revalidate = 7200

export const metadata: Metadata = {
  title: "Reglamentos",
  description: "Reglamentos, estatutos y documentos oficiales de la Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Reglamentos | CPB",
    description: "Reglamentos, estatutos y documentos oficiales de la Confederación Paraguaya de Básquetbol",
    url: "/reglamentos",
  },
}

const categoryLabels: Record<string, string> = {
  REGLAMENTO_JUEGO: "Reglamentos de Juego",
  REGLAMENTO_COMPETENCIA: "Reglamentos de Competencia",
  ESTATUTO: "Estatutos",
  CIRCULAR: "Circulares",
  OTRO: "Otros Documentos",
}

export default async function ReglamentosPage() {
  let reglamentos: any[] = []

  try {
    reglamentos = await prisma.reglamento.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { orden: "asc" }],
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        archivoUrl: true,
        categoria: true,
      },
    })
  } catch {
    // Table may not exist yet
  }

  // Group by category
  const grouped = reglamentos.reduce((acc: Record<string, any[]>, reg) => {
    const cat = reg.categoria
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(reg)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Reglamentos y Documentos"
        subtitle="Documentación oficial de la CPB"
      />

      {Object.keys(grouped).length > 0 ? (
        <div className="mt-8 space-y-8">
          {Object.entries(grouped).map(([cat, docs]) => (
            <div key={cat}>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {categoryLabels[cat] ?? cat}
              </h3>
              <div className="space-y-2">
                {(docs as any[]).map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {doc.titulo}
                      </p>
                      {doc.descripcion && (
                        <p className="text-sm text-gray-500 mt-0.5">{doc.descripcion}</p>
                      )}
                    </div>
                    <Download className="h-4 w-4 text-gray-400 group-hover:text-primary shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center py-12">
          <p className="text-gray-400 text-lg">Próximamente</p>
          <p className="text-gray-400 text-sm mt-1">
            Los reglamentos y documentos estarán disponibles pronto
          </p>
        </div>
      )}
    </div>
  )
}
