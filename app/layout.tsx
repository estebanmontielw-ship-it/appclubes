import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import PWARegister from "@/components/PWARegister"
import ManifestSwitcher from "@/components/ManifestSwitcher"
import PushNotifications from "@/components/PushNotifications"
import CapacitorLinkHandler from "@/components/CapacitorLinkHandler"

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // TODO: user-scalable should only apply in Capacitor native shell
  userScalable: false,
}

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
        {/* Viewport is injected automatically by Next.js from the exported `viewport` const above */}
        {/* PWA */}
        {/* Manifest set dynamically by ManifestSwitcher */}
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APP CPB" />
        {/* Google Fonts - Bebas Neue (headings) + Source Sans 3 (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TRBHLSQN');`}
        </Script>
        {/* Google Analytics */}
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TRBHLSQN"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <Toaster />
        <PWARegister />
        <ManifestSwitcher />
        <PushNotifications />
        <CapacitorLinkHandler />
      </body>
    </html>
  )
}
