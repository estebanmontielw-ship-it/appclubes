import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    template: "%s | CPB",
    default: "CPB - Confederación Paraguaya de Básquetbol",
  },
  description: "Confederación Paraguaya de Básquetbol - Sitio oficial",
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
