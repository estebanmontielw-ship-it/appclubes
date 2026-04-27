import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import DenunciaForm from "@/components/website/DenunciaForm"
import { ShieldCheck, Lock, Eye } from "lucide-react"

export const metadata: Metadata = {
  title: "Canal de Denuncias – Integridad",
  description:
    "Canal confidencial habilitado por la Confederación Paraguaya de Básquetbol para recibir información sobre posibles intentos de manipulación de resultados o irregularidades vinculadas a apuestas deportivas.",
  openGraph: {
    title: "Canal de Denuncias – Integridad | CPB",
    description:
      "Reportá de forma confidencial — y opcionalmente anónima — situaciones que comprometan la integridad del básquetbol paraguayo.",
    url: "/contacto/denuncias",
  },
}

export default function DenunciasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Canal de Denuncias – Integridad del Básquetbol Paraguayo"
        subtitle="Reportá de forma confidencial situaciones que comprometan la integridad de la competencia"
      />

      {/* Intro */}
      <div className="mt-6 bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl border border-primary/10 p-6">
        <p className="text-sm text-gray-700 leading-relaxed">
          La <strong>Confederación Paraguaya de Básquetbol</strong> habilita este canal para recibir
          información sobre posibles intentos de manipulación de resultados deportivos o irregularidades
          vinculadas a apuestas deportivas.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          Las denuncias pueden realizarse de forma <strong>totalmente anónima</strong>. Si el denunciante lo
          desea, también puede dejar sus datos de contacto para ampliar la información.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/60">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Confidencial</p>
              <p className="text-[11px] text-gray-500 leading-snug">Tratada con estricta confidencialidad</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/60">
            <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Anónimo opcional</p>
              <p className="text-[11px] text-gray-500 leading-snug">Vos decidís si dejás tus datos</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/60">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-gray-900">Sin tu IP real</p>
              <p className="text-[11px] text-gray-500 leading-snug">Sólo un hash anónimo anti-spam</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <DenunciaForm />
      </div>
    </div>
  )
}
