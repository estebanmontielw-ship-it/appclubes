import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import prisma from "@/lib/prisma"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Selecciones Nacionales",
  description: "Selecciones nacionales de básquetbol de Paraguay 2026 - Calendario internacional, entrenamientos y más",
  openGraph: {
    title: "Selecciones Nacionales | CPB",
    description: "Selecciones nacionales de básquetbol de Paraguay 2026 - Calendario internacional",
    url: "/selecciones",
  },
}

interface Evento {
  nombre: string
  modalidad: string
  categoria: string
  genero: string
  fecha: string
  sede: string
  confirmado: boolean
  destacado?: boolean
}

const eventos2026: Evento[] = [
  {
    nombre: "ODESUR Juvenil",
    modalidad: "3x3",
    categoria: "U19",
    genero: "Femenino y Masculino",
    fecha: "20 al 26 de abril",
    sede: "Panamá",
    confirmado: true,
    destacado: true,
  },
  {
    nombre: "AmeriCup Femenino",
    modalidad: "5x5",
    categoria: "Mayores",
    genero: "Femenino",
    fecha: "Junio 2026",
    sede: "Por confirmar",
    confirmado: false,
  },
  {
    nombre: "3x3 Nation League U23",
    modalidad: "3x3",
    categoria: "U23",
    genero: "Femenino y Masculino",
    fecha: "19 al 27 de julio",
    sede: "Asunción, Paraguay",
    confirmado: true,
    destacado: true,
  },
  {
    nombre: "Sudamericano Mayores Femenino",
    modalidad: "5x5",
    categoria: "Mayores",
    genero: "Femenino",
    fecha: "Agosto 2026",
    sede: "Por confirmar",
    confirmado: false,
  },
  {
    nombre: "ODESUR 3x3 Mayores",
    modalidad: "3x3",
    categoria: "Mayores",
    genero: "Femenino y Masculino",
    fecha: "20 al 27 de septiembre",
    sede: "Santa Fe, Argentina",
    confirmado: true,
  },
  {
    nombre: "Sudamericano U15 Masculino",
    modalidad: "5x5",
    categoria: "U15",
    genero: "Masculino",
    fecha: "Octubre 2026 (Finales)",
    sede: "Por confirmar",
    confirmado: false,
  },
  {
    nombre: "AmeriCup 3x3 Femenino Mayores",
    modalidad: "3x3",
    categoria: "Mayores",
    genero: "Femenino",
    fecha: "4 al 7 de noviembre",
    sede: "El Salvador",
    confirmado: true,
  },
  {
    nombre: "Sudamericano U15 Femenino",
    modalidad: "5x5",
    categoria: "U15",
    genero: "Femenino",
    fecha: "Noviembre 2026 (comienzos)",
    sede: "Por confirmar",
    confirmado: false,
  },
  {
    nombre: "Juegos Olímpicos de la Juventud",
    modalidad: "3x3",
    categoria: "U18",
    genero: "Femenino y Masculino",
    fecha: "Diciembre 2026",
    sede: "Dakar, Senegal",
    confirmado: false,
    destacado: true,
  },
  {
    nombre: "Women Series 3x3 Tour",
    modalidad: "3x3",
    categoria: "Mayores",
    genero: "Femenino",
    fecha: "A partir de junio — todo el año",
    sede: "Gira por Europa — Rumbo a Los Ángeles 2028",
    confirmado: true,
    destacado: true,
  },
]

function getModalidadColor(modalidad: string) {
  return modalidad === "3x3"
    ? "bg-orange-100 text-orange-700"
    : "bg-blue-100 text-blue-700"
}

function getGeneroIcon(genero: string) {
  if (genero.includes("Femenino") && genero.includes("Masculino")) return "Mixto"
  if (genero.includes("Femenino")) return "Fem"
  return "Masc"
}

function getGeneroColor(genero: string) {
  if (genero.includes("Femenino") && genero.includes("Masculino")) return "bg-purple-100 text-purple-700"
  if (genero.includes("Femenino")) return "bg-pink-100 text-pink-700"
  return "bg-sky-100 text-sky-700"
}

export default async function SeleccionesPage() {
  let selecciones: any[] = []

  try {
    selecciones = await prisma.seleccion.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        genero: true,
        categoria: true,
        imagenUrl: true,
        entrenador: true,
        descripcion: true,
      },
    })
  } catch {
    // Table may not exist yet
  }

  const masculinas = selecciones.filter((s) => s.genero === "Masculina")
  const femeninas = selecciones.filter((s) => s.genero === "Femenina")

  const eventosProximos = eventos2026.filter((e) => e.destacado)
  const eventosResto = eventos2026.filter((e) => !e.destacado)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Selecciones Nacionales"
        subtitle="Paraguay en el mundo — Temporada 2026"
      />

      {/* Hero: Próximos eventos destacados */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Eventos Destacados 2026
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventosProximos.map((ev) => (
            <div
              key={ev.nombre}
              className="relative bg-gradient-to-br from-[#0a1628] to-[#1a2d50] rounded-2xl p-6 text-white overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.modalidad === "3x3" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"}`}>
                    {ev.modalidad}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {ev.categoria}
                  </span>
                  {ev.confirmado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                      Confirmado
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl leading-tight">{ev.nombre}</h3>
                <p className="text-blue-200 text-sm mt-1">{ev.genero}</p>
                <div className="mt-4 space-y-1">
                  <p className="text-sm text-white/80 flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {ev.fecha}
                  </p>
                  <p className="text-sm text-white/80 flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {ev.sede}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendario completo */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Calendario Internacional 2026</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[1fr] divide-y divide-gray-100">
            {eventos2026.map((ev, i) => (
              <div
                key={ev.nombre + i}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 ${ev.destacado ? "bg-primary/[0.02]" : ""}`}
              >
                <div className="flex items-center gap-2 sm:w-48 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getModalidadColor(ev.modalidad)}`}>
                    {ev.modalidad}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getGeneroColor(ev.genero)}`}>
                    {getGeneroIcon(ev.genero)}
                  </span>
                  <span className="text-[10px] text-gray-400">{ev.categoria}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{ev.nombre}</h3>
                  <p className="text-xs text-gray-500">{ev.genero}</p>
                </div>
                <div className="text-right sm:w-56 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{ev.fecha}</p>
                  <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                    {ev.confirmado ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                    )}
                    {ev.sede}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Sede confirmada</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" /> Por confirmar</span>
        </div>
      </div>

      {/* Selecciones from DB */}
      {selecciones.length > 0 && (
        <div className="mt-16 space-y-10">
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
                          <p className="text-sm text-gray-500 mt-1">DT: {sel.entrenador}</p>
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
      )}
    </div>
  )
}
