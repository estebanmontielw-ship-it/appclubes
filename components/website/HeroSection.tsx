import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-blue-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Confederación Paraguaya
            <span className="block text-amber-300">de Básquetbol</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed">
            Ente rector del básquetbol en Paraguay. Calendario, posiciones, estadísticas y toda la información del básquetbol paraguayo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/calendario"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg"
            >
              Ver Calendario
            </Link>
            <Link
              href="/posiciones"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              Tabla de Posiciones
            </Link>
            <Link
              href="/noticias"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              Últimas Noticias
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
