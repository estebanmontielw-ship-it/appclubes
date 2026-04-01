import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Institucional",
  description: "Sobre la Confederación Paraguaya de Básquetbol - Historia, autoridades e información institucional",
}

export default async function InstitucionalPage() {
  let paginas: any[] = []

  try {
    paginas = await prisma.paginaContenido.findMany({
      where: {
        activo: true,
        clave: { startsWith: "institucional" },
      },
      orderBy: { clave: "asc" },
    })
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Institucional"
        subtitle="Confederación Paraguaya de Básquetbol"
      />

      {paginas.length > 0 ? (
        <div className="mt-8 space-y-12">
          {paginas.map((pagina) => (
            <section key={pagina.id}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{pagina.titulo}</h2>
              {pagina.imagenUrl && (
                <img
                  src={pagina.imagenUrl}
                  alt={pagina.titulo}
                  className="w-full rounded-xl mb-6 max-h-80 object-cover"
                />
              )}
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: pagina.contenido }}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-12 bg-white rounded-xl border border-gray-100 p-8">
          <div className="prose prose-gray max-w-none">
            <p>
              La <strong>Confederación Paraguaya de Básquetbol (CPB)</strong> es el ente rector
              del básquetbol en Paraguay, afiliada a la <strong>FIBA</strong> (Federación
              Internacional de Básquetbol) y miembro de <strong>FIBA Américas</strong>.
            </p>
            <p>
              La CPB se encarga de organizar y regular todas las competencias de básquetbol
              a nivel nacional, así como la formación y certificación de árbitros, oficiales
              de mesa y estadísticos.
            </p>
            <p>
              También tiene a su cargo las selecciones nacionales de básquetbol en todas
              sus categorías.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
