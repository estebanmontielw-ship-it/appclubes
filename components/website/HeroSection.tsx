import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative bg-[#0a1628] text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-[#0a1628] to-[#0a1628]" />
        {/* Basketball court lines pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `
            radial-gradient(circle at 80% 50%, white 200px, transparent 200px),
            linear-gradient(90deg, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)
          `,
          backgroundSize: "100% 100%, 100% 100%",
        }} />
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-200">Temporada 2025 en curso</span>
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-8xl tracking-wide leading-none animate-fade-in-up">
            Confederación
            <br />
            Paraguaya
            <span className="block text-amber-400">de Básquetbol</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-blue-100/80 max-w-xl leading-relaxed animate-fade-in-up animate-fade-in-delay-2">
            Ente rector del básquetbol en Paraguay. Calendario, posiciones, estadísticas y toda la información del básquetbol paraguayo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up animate-fade-in-delay-3">
            <Link
              href="/calendario"
              className="inline-flex items-center px-7 py-3.5 rounded-xl bg-white text-[#0a1628] font-semibold text-sm hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Ver Calendario
            </Link>
            <Link
              href="/posiciones"
              className="inline-flex items-center px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm"
            >
              Tabla de Posiciones
            </Link>
            <Link
              href="/noticias"
              className="inline-flex items-center px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm"
            >
              Últimas Noticias
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
