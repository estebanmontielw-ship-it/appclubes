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
    hoverBorder: "hover:border-blue-200",
  },
  {
    label: "Posiciones",
    href: "/posiciones",
    desc: "Tabla de posiciones",
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50",
    hoverBorder: "hover:border-amber-200",
  },
  {
    label: "Estadísticas",
    href: "/estadisticas",
    desc: "Stats de jugadores",
    icon: BarChart3,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    hoverBorder: "hover:border-emerald-200",
  },
  {
    label: "Clubes",
    href: "/clubes",
    desc: "Clubes afiliados",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/5",
    hoverBorder: "hover:border-primary/30",
  },
]

export default function QuickLinks() {
  return (
    <section className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {links.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`card-soft flex items-center gap-4 p-5 border border-transparent ${item.hoverBorder} group animate-fade-in-up animate-fade-in-delay-${i + 1}`}
            >
              <div className={`shrink-0 w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
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
