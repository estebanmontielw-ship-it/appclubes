import Link from "next/link"
import { Calendar, Trophy, BarChart3, Shield } from "lucide-react"

const links = [
  {
    label: "Calendario",
    href: "/calendario",
    desc: "Próximos partidos",
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Posiciones",
    href: "/posiciones",
    desc: "Tabla de posiciones",
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Estadísticas",
    href: "/estadisticas",
    desc: "Stats de jugadores",
    icon: BarChart3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Clubes",
    href: "/clubes",
    desc: "Clubes afiliados",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/5",
  },
]

export default function QuickLinks() {
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className={`shrink-0 w-11 h-11 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
