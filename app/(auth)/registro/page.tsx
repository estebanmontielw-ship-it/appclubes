"use client"

import Link from "next/link"
import { User, Users, Shirt } from "lucide-react"

const TIPOS = [
  {
    icon: User,
    title: "Aficionado",
    description: "Seguí tu club, recibí alertas de partidos y llevate las estadísticas en el bolsillo.",
    href: "/registro/aficionado",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300",
    textColor: "text-blue-700",
  },
  {
    icon: Shirt,
    title: "Oficial",
    description: "Árbitro, Oficial de Mesa o Estadístico. Gestioná tus partidos y honorarios.",
    href: "/oficiales/registro",
    color: "from-orange-500 to-red-600",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300",
    textColor: "text-orange-700",
  },
  {
    icon: Users,
    title: "Cuerpo Técnico",
    description: "Entrenador, Asistente o Preparador. Accedé a estadísticas y el calendario de competencias.",
    href: "/cuerpotecnico/registro",
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300",
    textColor: "text-green-700",
  },
]

export default function RegistroSelectorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <img src="/favicon-cpb.png" alt="CPB" className="mx-auto mb-4 h-20 w-20 object-contain drop-shadow-sm" />
          <h1 className="text-3xl font-bold text-gray-900">Creá tu cuenta CPB</h1>
          <p className="mt-2 text-gray-500">Elegí el tipo de cuenta que mejor te describe</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TIPOS.map(({ icon: Icon, title, description, href, bg, textColor, color }) => (
            <Link
              key={href}
              href={href}
              className={`group flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all duration-200 ${bg}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${textColor}`}>{title}</h2>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
              </div>
              <div className={`text-sm font-semibold ${textColor} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                Registrarme →
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
