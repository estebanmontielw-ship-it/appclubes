import type { Metadata } from "next"
import Script from "next/script"
import { Bebas_Neue, Source_Sans_3 } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import PWARegister from "@/components/PWARegister"
import ManifestSwitcher from "@/components/ManifestSwitcher"
import PushNotifications from "@/components/PushNotifications"

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
})

const sourceSans = Source_Sans_3({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    <html lang="es" className={`${bebasNeue.variable} ${sourceSans.variable}`}>
      <head>
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* PWA */}
        {/* Manifest set dynamically by ManifestSwitcher */}
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APP CPB" />
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
      </body>
    </html>
  )
}
