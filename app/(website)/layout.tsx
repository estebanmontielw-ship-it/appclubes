import type { Metadata } from "next"
import PublicNavbar from "@/components/website/PublicNavbar"
import PublicFooter from "@/components/website/PublicFooter"
import ChatWidget from "@/components/website/ChatWidget"
import InstallPrompt from "@/components/website/InstallPrompt"
import ServiceWorkerRegister from "@/components/website/ServiceWorkerRegister"

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"

export const metadata: Metadata = {
  title: {
    template: "%s | CPB - Confederación Paraguaya de Básquetbol",
    default: "CPB - Confederación Paraguaya de Básquetbol",
  },
  description:
    "Sitio oficial de la Confederación Paraguaya de Básquetbol. Calendario, posiciones, estadísticas, noticias y toda la información del básquetbol paraguayo.",
  icons: {
    icon: "/favicon-cpb.png",
    apple: "/favicon-cpb.png",
  },
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "es_PY",
    siteName: "CPB - Confederación Paraguaya de Básquetbol",
    title: "CPB - Confederación Paraguaya de Básquetbol",
    description:
      "Sitio oficial de la Confederación Paraguaya de Básquetbol. Calendario, posiciones, estadísticas, noticias y toda la información del básquetbol paraguayo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CPB - Confederación Paraguaya de Básquetbol",
    description:
      "Sitio oficial de la Confederación Paraguaya de Básquetbol. Calendario, posiciones, estadísticas, noticias y toda la información del básquetbol paraguayo.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: "Confederación Paraguaya de Básquetbol",
  alternateName: "CPB",
  url: baseUrl,
  logo: `${baseUrl}/favicon-cpb.png`,
  description:
    "Organismo rector del básquetbol en Paraguay. Organiza la Liga Nacional de Básquetbol (LNB) y las selecciones nacionales.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "PY",
    addressLocality: "Asunción",
  },
  sport: "Basketball",
  sameAs: [
    "https://www.instagram.com/cpboficial",
    "https://www.facebook.com/CPBoficial",
  ],
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <ChatWidget />
      <InstallPrompt />
      <ServiceWorkerRegister />
    </div>
  )
}
