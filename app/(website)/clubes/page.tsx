import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Clubes Afiliados",
  description: "Clubes afiliados a la Confederación Paraguaya de Básquetbol",
}

export default async function ClubesPage() {
  let clubes: any[] = []

  try {
    clubes = await prisma.club.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    })
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Clubes Afiliados"
        subtitle="Instituciones deportivas afiliadas a la CPB"
      />

      {clubes.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clubes.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow"
            >
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt={club.nombre}
                  className="w-20 h-20 object-contain mx-auto mb-4"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">
                    {club.sigla || club.nombre.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="font-bold text-gray-900">{club.nombre}</h3>
              {club.sigla && <p className="text-sm text-gray-400">{club.sigla}</p>}
              <p className="text-sm text-gray-500 mt-1">{club.ciudad}</p>
              {(club.sitioWeb || club.instagram || club.facebook) && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {club.sitioWeb && (
                    <a
                      href={club.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Sitio web
                    </a>
                  )}
                  {club.instagram && (
                    <a
                      href={`https://instagram.com/${club.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center py-12">
          <p className="text-gray-400 text-lg">Próximamente</p>
          <p className="text-gray-400 text-sm mt-1">
            La lista de clubes afiliados estará disponible pronto
          </p>
        </div>
      )}
    </div>
  )
}
