import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Selecciones Nacionales",
  description: "Selecciones nacionales de básquetbol de Paraguay - Confederación Paraguaya de Básquetbol",
}

export default async function SeleccionesPage() {
  let selecciones: any[] = []

  try {
    selecciones = await prisma.seleccion.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
  } catch {
    // Table may not exist yet
  }

  const masculinas = selecciones.filter((s) => s.genero === "Masculina")
  const femeninas = selecciones.filter((s) => s.genero === "Femenina")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Selecciones Nacionales"
        subtitle="Representantes del básquetbol paraguayo a nivel internacional"
      />

      {selecciones.length > 0 ? (
        <div className="mt-8 space-y-10">
          {[
            { label: "Selecciones Masculinas", items: masculinas },
            { label: "Selecciones Femeninas", items: femeninas },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{group.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((sel) => (
                    <div
                      key={sel.id}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {sel.imagenUrl && (
                        <img
                          src={sel.imagenUrl}
                          alt={sel.nombre}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-5">
                        <h4 className="font-bold text-gray-900">{sel.nombre}</h4>
                        <p className="text-sm text-gray-500 mt-1">{sel.categoria}</p>
                        {sel.entrenador && (
                          <p className="text-sm text-gray-500 mt-1">
                            DT: {sel.entrenador}
                          </p>
                        )}
                        {sel.descripcion && (
                          <div
                            className="mt-3 text-sm text-gray-600 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: sel.descripcion }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="mt-12 text-center py-12">
          <p className="text-gray-400 text-lg">Próximamente</p>
          <p className="text-gray-400 text-sm mt-1">
            La información de las selecciones nacionales estará disponible pronto
          </p>
        </div>
      )}
    </div>
  )
}
