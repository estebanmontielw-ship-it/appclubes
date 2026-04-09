import Link from "next/link"
import { Home, ChevronLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* CPB Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/favicon-cpb.png"
            alt="CPB"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* 404 number */}
        <p className="text-8xl font-black text-[#0a1628] leading-none mb-2">404</p>

        {/* Blue accent line */}
        <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mb-5" />

        {/* Message */}
        <h1 className="text-xl font-bold text-gray-800 mb-2">Página no encontrada</h1>
        <p className="text-sm text-gray-500 mb-8">
          El contenido que buscás no existe o fue movido.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#0a1628] hover:bg-[#132043] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>
          <Link
            href="/noticias"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-3 rounded-xl border border-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Ver noticias
          </Link>
        </div>
      </div>
    </div>
  )
}
