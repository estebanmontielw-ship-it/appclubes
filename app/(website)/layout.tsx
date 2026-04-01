import type { Metadata } from "next"
import PublicNavbar from "@/components/website/PublicNavbar"
import PublicFooter from "@/components/website/PublicFooter"
import ChatWidget from "@/components/website/ChatWidget"
import InstallPrompt from "@/components/website/InstallPrompt"
import ServiceWorkerRegister from "@/components/website/ServiceWorkerRegister"

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
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <ChatWidget />
      <InstallPrompt />
      <ServiceWorkerRegister />
    </div>
  )
}
