import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "CPB Oficiales — Confederación Paraguaya de Basketball",
  description: "Portal de gestión de árbitros, oficiales de mesa y estadísticos de la CPB",
  icons: {
    icon: "/logo-cpb.jpg",
    apple: "/logo-cpb.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
