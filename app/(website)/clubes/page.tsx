import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"

// Revalidate clubs every 1 hour
export const revalidate = 3600

export const metadata: Metadata = {
  title: "Clubes Afiliados",
  description: "Clubes afiliados a la Confederación Paraguaya de Básquetbol",
  openGraph: {
    title: "Clubes Afiliados | CPB",
    description: "Clubes afiliados a la Confederación Paraguaya de Básquetbol",
    url: "/clubes",
  },
}

// Logo mapping for clubs with local logos
const logoMap: Record<string, string> = {
  "Olimpia Kings": "",
  "Colonias Gold": "/logos/Colonias_Gold.png",
  "Deportivo San Jose": "/logos/San_Jose_De_Concepcion.jpg",
  "Felix Perez Cardozo": "",
  "Deportivo Amambay": "",
  "Deportivo Campo Alto": "",
  "San Alfonzo": "/logos/Club_San_Alfonzo.jpg",
  "Ciudad Nueva": "",
  "Olimpia Queens": "",
  "Sol de America": "",
  "San Lorenzo": "",
}

const ligas = [
  {
    nombre: "LNB Masculino — Primera 2026",
    color: "from-blue-600 to-blue-800",
    equipos: [
      "Olimpia Kings",
      "Colonias Gold",
      "Deportivo San Jose",
      "Felix Perez Cardozo",
      "Deportivo Amambay",
      "Deportivo Campo Alto",
      "San Alfonzo",
      "Ciudad Nueva",
    ],
  },
  {
    nombre: "LNB Femenino — Primera 2026",
    color: "from-pink-600 to-pink-800",
    equipos: [
      "Felix Perez Cardozo",
      "Deportivo San Jose",
      "Olimpia Queens",
      "Sol de America",
    ],
  },
  {
    nombre: "Liga de Desarrollo U22 Femenino 2026",
    color: "from-purple-600 to-purple-800",
    equipos: [
      "Olimpia Queens",
      "Felix Perez Cardozo",
      "Deportivo San Jose",
      "Sol de America",
      "Ciudad Nueva",
      "San Lorenzo",
    ],
  },
]

function ClubCard({ nombre }: { nombre: string }) {
  const logo = logoMap[nombre]
  const initials = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {logo ? (
        <img
          src={logo}
          alt={nombre}
          className="w-16 h-16 object-contain mx-auto mb-3"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg font-bold text-primary">{initials}</span>
        </div>
      )}
      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{nombre}</h3>
    </div>
  )
}

export default async function ClubesPage() {
  let clubes: any[] = []

  try {
    clubes = await prisma.club.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        sigla: true,
        logoUrl: true,
        ciudad: true,
        sitioWeb: true,
        instagram: true,
        facebook: true,
      },
    })
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Ligas y Clubes"
        subtitle="Temporada 2026 — Confederación Paraguaya de Básquetbol"
      />

      {/* Active Leagues */}
      <div className="mt-8 space-y-10">
        {ligas.map((liga) => (
          <section key={liga.nombre}>
            <div className={`bg-gradient-to-r ${liga.color} rounded-xl px-6 py-4 mb-5`}>
              <h2 className="text-white font-bold text-lg">{liga.nombre}</h2>
              <p className="text-white/70 text-sm">{liga.equipos.length} equipos</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {liga.equipos.map((equipo) => (
                <ClubCard key={equipo} nombre={equipo} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* All affiliated clubs */}
      {clubes.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Todos los Clubes Afiliados</h2>
          <p className="text-sm text-gray-500 mb-6">Instituciones deportivas afiliadas a la CPB</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </div>
      )}
    </div>
  )
}
