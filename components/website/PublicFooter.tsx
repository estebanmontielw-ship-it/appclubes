import Link from "next/link"

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-cpb.jpg" alt="CPB" className="h-10 w-10 object-contain rounded" />
              <div>
                <p className="font-bold text-white text-sm">CPB</p>
                <p className="text-xs text-gray-400">Confederación Paraguaya de Básquetbol</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ente rector del básquetbol en Paraguay, afiliado a FIBA y miembro de FIBA Américas.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              {[
                { label: "Calendario", href: "/calendario" },
                { label: "Posiciones", href: "/posiciones" },
                { label: "Estadísticas", href: "/estadisticas" },
                { label: "Noticias", href: "/noticias" },
                { label: "Reglamentos", href: "/reglamentos" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institution */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Institucional</h3>
            <ul className="space-y-2">
              {[
                { label: "Sobre la CPB", href: "/institucional" },
                { label: "Clubes Afiliados", href: "/clubes" },
                { label: "Selecciones", href: "/selecciones" },
                { label: "Contacto", href: "/contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Asunción, Paraguay</li>
              <li>
                <a href="mailto:cpb@cpb.com.py" className="hover:text-white transition-colors">
                  cpb@cpb.com.py
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Confederación Paraguaya de Básquetbol. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-500">
            Afiliada a FIBA
          </p>
        </div>
      </div>
    </footer>
  )
}
