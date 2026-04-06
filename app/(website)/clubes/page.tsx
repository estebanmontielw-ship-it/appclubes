import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"

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

interface Equipo {
  nombre: string
  federacion: string
  ciudad: string
  logo: string
}

const equipos: Equipo[] = [
  { nombre: "Academia de Pilar", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "/logos/Academia_de_Pilar.png" },
  { nombre: "Club 12 de Junio Coronel Oviedo", federacion: "Federación Ovetense", ciudad: "Coronel Oviedo", logo: "/logos/Club_12_de_Junio_Coronel_Oviedo.jpg" },
  { nombre: "Asu Academy", federacion: "Metropolitano", ciudad: "Asunción", logo: "/logos/Asu_Academy.jpg" },
  { nombre: "Escuela de Basquetbol San Ignacio", federacion: "Federación de San Ignacio", ciudad: "San Ignacio", logo: "" },
  { nombre: "Prode", federacion: "Federación Encarnacena", ciudad: "Encarnación", logo: "/logos/Prode.png" },
  { nombre: "Club Minga Guazú", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/Club_Minga_Guazu.jpg" },
  { nombre: "Don Bosco Basquet", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/Don_Bosco_Basquet.jpg" },
  { nombre: "Club Nacional For Ever", federacion: "Federación Concepcionera", ciudad: "Concepción", logo: "/logos/CLUB_NACIONAL_FOR_EVER.png" },
  { nombre: "Club Independencia FC", federacion: "Federación Concepcionera", ciudad: "Concepción", logo: "/logos/CLUB_INDEPENDENCIA_FOOTBALL_CLUB.png" },
  { nombre: "Club Náutico El Dorado", federacion: "Federación Concepcionera", ciudad: "Concepción", logo: "/logos/Club_Nautico_El_Dorado.jpg" },
  { nombre: "Club Social y Deportivo Santa Mónica", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/Club_Social_y_Deportivo_Santa_Monica.png" },
  { nombre: "Club Ayo Basket", federacion: "Federación de Ayolas", ciudad: "Ayolas", logo: "/logos/Club_Ayo_Basket.png" },
  { nombre: "PAI Coronel", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/PAI_CORONEL.png" },
  { nombre: "Fomento del Barrio Crucecita", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "/logos/Fomento_del_barrio_crucecita.jpeg" },
  { nombre: "Club Atlético Independiente", federacion: "Federación de Colonias Unidas", ciudad: "Obligado", logo: "/logos/Club_Atletico_Independiente.png" },
  { nombre: "Club Deportivo Emanuel", federacion: "Federación de Hernandarias", ciudad: "Hernandarias", logo: "" },
  { nombre: "Pumas Campo 9", federacion: "Metropolitano", ciudad: "J. Eulogio Estigarribia", logo: "/logos/Pumas_Campo_9.png" },
  { nombre: "Club Capitán Bado", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "/logos/Club_Capitan_Bado.jpg" },
  { nombre: "Colonias Gold", federacion: "Federación de Colonias Unidas", ciudad: "Obligado", logo: "/logos/Colonias_Gold.png" },
  { nombre: "Club San Alfonzo", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/Club_San_Alfonzo.jpg" },
  { nombre: "Club Primero de Mayo", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "/logos/Club_Primero_de_mayo.jpeg" },
  { nombre: "Club Atlético Sacachispas", federacion: "Federación Encarnacena", ciudad: "Encarnación", logo: "/logos/Club_Atletico_Sacachispas.jpg" },
  { nombre: "Club Nanawa", federacion: "Federación Concepcionera", ciudad: "Nanawa", logo: "/logos/Club_Nanawa.png" },
  { nombre: "Club Área 4", federacion: "Federación Paranaense", ciudad: "Ciudad del Este", logo: "/logos/Club_Area_4.jpg" },
  { nombre: "Franco Basquet Club", federacion: "Federación Franqueña", ciudad: "Presidente Franco", logo: "/logos/Franco_Basquet_Club.png" },
  { nombre: "Club Unión de Bella Vista", federacion: "Federación de Colonias Unidas", ciudad: "Bella Vista Sur", logo: "/logos/Club_Union_de_Bella_Vista.jpg" },
  { nombre: "Club Social y Deportivo Obrero", federacion: "Federación Alberdeña", ciudad: "Alberdi", logo: "/logos/Club_Social_y_Deportivo_Obrero.jpg" },
  { nombre: "Club Deportivo Juan José", federacion: "Federación de Minga Guazú", ciudad: "Minga Guazú", logo: "/logos/Club_Deportivo_Juan_Jose.jpg" },
  { nombre: "San José de Concepción", federacion: "Federación Concepcionera", ciudad: "Concepción", logo: "/logos/San_Jose_De_Concepcion.jpg" },
  { nombre: "América de Pilar", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "/logos/America_de_Pilar.png" },
  { nombre: "Juventud María Auxiliadora", federacion: "Federación de María Auxiliadora", ciudad: "Tomás Romero Pereira", logo: "/logos/Juventud_Maria_Auxiliadora.png" },
  { nombre: "Cerro Porteño", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Escuela Caaguaceña de Basquetbol", federacion: "Federación Caaguaceña", ciudad: "Caaguazú", logo: "" },
  { nombre: "Sajonia", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Juventud", federacion: "Federación de Colonias Unidas", ciudad: "Hohenau", logo: "" },
  { nombre: "Sportivo Sanlorenzo", federacion: "Federación Sanlorenzana", ciudad: "San Lorenzo", logo: "" },
  { nombre: "Club Deportivo Central", federacion: "Metropolitano", ciudad: "Capiatá", logo: "" },
  { nombre: "Club Atlético Pilarense", federacion: "Asociación Pilarense", ciudad: "Pilar", logo: "" },
  { nombre: "Deportivo Yacaré", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Club Atlético Ciudad Nueva", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Club Deportivo Amambay", federacion: "Federación de Amambay", ciudad: "Pedro Juan Caballero", logo: "" },
  { nombre: "Guaireña Basquet Club", federacion: "Federación Guaireña", ciudad: "Villarrica", logo: "" },
  { nombre: "Club Cerro Porteño del Barrio Azucena", federacion: "Federación Ovetense", ciudad: "Coronel Oviedo", logo: "" },
  { nombre: "Club Deportivo Internacional", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Club Pettirossi", federacion: "Federación Encarnacena", ciudad: "Encarnación", logo: "" },
  { nombre: "Club Sportivo Luqueño Basquetbol", federacion: "Metropolitano", ciudad: "Luque", logo: "" },
  { nombre: "Gorillas Basquet", federacion: "Federación de Hernandarias", ciudad: "Ciudad del Este", logo: "" },
  { nombre: "Club Atlético Paranaense", federacion: "Federación Encarnacena", ciudad: "Encarnación", logo: "" },
  { nombre: "Colonias Unidas Basket Club", federacion: "Federación de Colonias Unidas", ciudad: "Obligado", logo: "" },
  { nombre: "Club Deportivo Campo Alto", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Sol de América", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Club Deportivo Británico", federacion: "Federación Paranaense", ciudad: "Ciudad del Este", logo: "" },
  { nombre: "Deportivo San José", federacion: "Metropolitano", ciudad: "Asunción", logo: "/logos/San_Jose_De_Concepcion.jpg" },
  { nombre: "Félix Pérez Cardozo", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
  { nombre: "Olimpia", federacion: "Metropolitano", ciudad: "Asunción", logo: "" },
]

const ligas = [
  {
    nombre: "LNB Masculino — Primera 2026",
    color: "from-blue-600 to-blue-800",
    equipoNames: [
      "Olimpia",
      "Colonias Gold",
      "Deportivo San José",
      "Félix Pérez Cardozo",
      "Club Deportivo Amambay",
      "Club Deportivo Campo Alto",
      "Club San Alfonzo",
      "Club Atlético Ciudad Nueva",
    ],
  },
  {
    nombre: "LNB Femenino — Primera 2026",
    color: "from-pink-600 to-pink-800",
    equipoNames: [
      "Félix Pérez Cardozo",
      "Deportivo San José",
      "Olimpia",
      "Sol de América",
    ],
  },
  {
    nombre: "Liga de Desarrollo U22 Femenino 2026",
    color: "from-purple-600 to-purple-800",
    equipoNames: [
      "Olimpia",
      "Félix Pérez Cardozo",
      "Deportivo San José",
      "Sol de América",
      "Club Atlético Ciudad Nueva",
      "Sportivo Sanlorenzo",
    ],
  },
]

function getEquipo(name: string): Equipo {
  const found = equipos.find((e) => e.nombre === name)
  if (found) return found
  return { nombre: name, federacion: "", ciudad: "", logo: "" }
}

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function LeagueTeamCard({ equipo }: { equipo: Equipo }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {equipo.logo ? (
        <img src={equipo.logo} alt={equipo.nombre} className="w-16 h-16 object-contain mx-auto mb-3" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
          <span className="text-lg font-bold text-primary">{getInitials(equipo.nombre)}</span>
        </div>
      )}
      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{equipo.nombre}</h3>
      <p className="text-xs text-gray-400 mt-1">{equipo.ciudad}</p>
    </div>
  )
}

export default async function ClubesPage() {
  let clubesDB: any[] = []

  try {
    clubesDB = await prisma.club.findMany({
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

  // Group all clubs by federation
  const federaciones = new Map<string, Equipo[]>()
  for (const eq of equipos) {
    const fed = eq.federacion
    if (!federaciones.has(fed)) federaciones.set(fed, [])
    federaciones.get(fed)!.push(eq)
  }
  const fedEntries = Array.from(federaciones.entries()).sort((a, b) => b[1].length - a[1].length)

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
              <p className="text-white/70 text-sm">{liga.equipoNames.length} equipos</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {liga.equipoNames.map((name) => (
                <LeagueTeamCard key={name} equipo={getEquipo(name)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* All 55 affiliated clubs grouped by federation */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Clubes Afiliados</h2>
        <p className="text-sm text-gray-500 mb-8">{equipos.length} instituciones deportivas afiliadas a la CPB</p>

        <div className="space-y-10">
          {fedEntries.map(([fed, eqs]) => (
            <section key={fed}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{fed}</h3>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {eqs.map((eq) => (
                  <div key={eq.nombre} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
                    {eq.logo ? (
                      <img src={eq.logo} alt={eq.nombre} className="w-14 h-14 object-contain mx-auto mb-2" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-base font-bold text-primary">{getInitials(eq.nombre)}</span>
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 text-xs leading-tight">{eq.nombre}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{eq.ciudad}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* DB clubs if any extra exist */}
      {clubesDB.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Otros Clubes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clubesDB.map((club) => (
              <div key={club.id} className="bg-white rounded-xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.nombre} className="w-20 h-20 object-contain mx-auto mb-4" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{club.sigla || club.nombre.charAt(0)}</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-900">{club.nombre}</h3>
                {club.sigla && <p className="text-sm text-gray-400">{club.sigla}</p>}
                <p className="text-sm text-gray-500 mt-1">{club.ciudad}</p>
                {(club.sitioWeb || club.instagram || club.facebook) && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {club.sitioWeb && (
                      <a href={club.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Sitio web
                      </a>
                    )}
                    {club.instagram && (
                      <a href={`https://instagram.com/${club.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
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
