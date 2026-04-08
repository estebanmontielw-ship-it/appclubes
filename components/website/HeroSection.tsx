"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface HeroSlide {
  id: string
  imageUrl: string
  focalDesktopX: number
  focalDesktopY: number
  focalMobileX: number
  focalMobileY: number
}

interface HeroSectionProps {
  slides?: HeroSlide[]
}

const FALLBACK_SLIDE: HeroSlide = {
  id: "fallback",
  imageUrl:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1920&q=80",
  focalDesktopX: 50,
  focalDesktopY: 50,
  focalMobileX: 50,
  focalMobileY: 50,
}

const ROTATION_MS = 5000

export default function HeroSection({ slides }: HeroSectionProps) {
  const effectiveSlides = slides && slides.length > 0 ? slides : [FALLBACK_SLIDE]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (effectiveSlides.length < 2) return
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % effectiveSlides.length)
    }, ROTATION_MS)
    return () => clearInterval(t)
  }, [effectiveSlides.length])

  return (
    <section className="relative bg-[#0a1628] text-white overflow-hidden min-h-[85vh] flex items-center">
      {/* Rotating background images with crossfade */}
      <div className="absolute inset-0">
        {effectiveSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: idx === current ? 1 : 0 }}
            aria-hidden={idx !== current}
          >
            {/* Desktop image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt=""
              className="hidden md:block w-full h-full object-cover opacity-25"
              style={{ objectPosition: `${slide.focalDesktopX}% ${slide.focalDesktopY}%` }}
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Mobile image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.imageUrl}
              alt=""
              className="block md:hidden w-full h-full object-cover opacity-25"
              style={{ objectPosition: `${slide.focalMobileX}% ${slide.focalMobileY}%` }}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/95 to-[#0a1628]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-[#0a1628]/30" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 border border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
      <div className="absolute top-32 right-20 w-48 h-48 border border-amber-400/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute bottom-20 right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />


      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="animate-slide-in-left inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-200">Temporada 2026 en curso</span>
            <ChevronRight className="h-3.5 w-3.5 text-blue-300" />
          </div>

          <h1 className="font-heading tracking-wide leading-none">
            <span className="block text-5xl sm:text-6xl lg:text-8xl text-red-500 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              Confederación
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-8xl text-white animate-slide-in-left" style={{ animationDelay: "0.2s" }}>
              Paraguaya
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-8xl text-blue-400 animate-slide-in-left" style={{ animationDelay: "0.3s" }}>
              de Básquetbol
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-blue-100/70 max-w-xl leading-relaxed animate-slide-in-left" style={{ animationDelay: "0.5s" }}>
            Ente rector del básquetbol en Paraguay. Calendario, posiciones, estadísticas y toda la información del básquetbol paraguayo.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-slide-in-up" style={{ animationDelay: "0.7s" }}>
            <Link
              href="/calendario"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#0a1628] font-bold text-sm hover:bg-amber-400 transition-all shadow-lg hover:shadow-amber-400/20 hover:-translate-y-0.5"
            >
              Ver Calendario
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/posiciones"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm"
            >
              Tabla de Posiciones
            </Link>
            <Link
              href="/noticias"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/15 backdrop-blur-sm"
            >
              Últimas Noticias
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
