import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import ContactForm from "@/components/website/ContactForm"
import { Mail, MapPin, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacto con la Confederación Paraguaya de Básquetbol. Escribinos o visitanos en Asunción, Paraguay.",
  openGraph: {
    title: "Contacto | CPB",
    description: "Contacto con la Confederación Paraguaya de Básquetbol. Escribinos o visitanos en Asunción, Paraguay.",
    url: "/contacto",
  },
}

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SectionTitle
        title="Contacto"
        subtitle="Ponete en contacto con la Confederación Paraguaya de Básquetbol"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Dirección</p>
                <p className="text-sm text-gray-500 mt-0.5">Asunción, Paraguay</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Email</p>
                <a
                  href="mailto:cpb@cpb.com.py"
                  className="text-sm text-primary hover:underline"
                >
                  cpb@cpb.com.py
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Teléfono</p>
                <p className="text-sm text-gray-500 mt-0.5">Contactar por email</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Envianos un mensaje</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
