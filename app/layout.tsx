import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    template: "%s | CPB",
    default: "CPB - Confederación Paraguaya de Básquetbol",
  },
  description: "Confederación Paraguaya de Básquetbol - Sitio oficial",
  icons: {
    icon: "/favicon-cpb.png",
    apple: "/favicon-cpb.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F7PJ5NRZ7V"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F7PJ5NRZ7V');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
