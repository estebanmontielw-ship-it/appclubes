"use client"

// Wizard "Nuevo diseño" estilo Canva:
//   1. Elegir formato (Feed / Stories / Noticias CPB)
//   2. Elegir liga (LNB / LNBF / U22M / U22F)
//   3. Elegir plantilla (o en blanco)
//   → redirige a /editor?new=formato:liga:template

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Format = "feed" | "story" | "noticia"
type Liga = "lnb" | "lnbf" | "u22m" | "u22f"
type Template = "blank" | "pre" | "proximos-multi" | "resultado" | "resultados-multi" | "tabla" | "lideres" | "jugador" | "lanzamiento"

const FORMATS: { key: Format; label: string; sub: string; ratio: string }[] = [
  { key: "feed",    label: "Feed",         sub: "Instagram 4:5",  ratio: "aspect-[4/5]" },
  { key: "story",   label: "Stories",      sub: "IG / FB 9:16",   ratio: "aspect-[9/16]" },
  { key: "noticia", label: "Noticias CPB", sub: "Banner 16:9",    ratio: "aspect-video" },
]

const LIGAS: { key: Liga; label: string; sub: string; gradient: string }[] = [
  { key: "lnb",  label: "LNB",      sub: "Apertura Masc",  gradient: "from-indigo-500 to-violet-600" },
  { key: "lnbf", label: "LNBF",     sub: "Apertura Fem",   gradient: "from-pink-500 to-fuchsia-600" },
  { key: "u22m", label: "U22 Masc", sub: "Sub 22 Masc",    gradient: "from-cyan-500 to-blue-600" },
  { key: "u22f", label: "U22 Fem",  sub: "Sub 22 Fem",     gradient: "from-rose-500 to-orange-500" },
]

// Los presets cambian según "tipo" (partidos / estadísticas / evento)
const TEMPLATES_BY_TIPO: Record<string, { key: Template; label: string; desc: string; icon?: string }[]> = {
  partidos: [
    { key: "proximos-multi",  label: "Próximos partidos", desc: "Varios partidos de una jornada" },
    { key: "pre",             label: "Anuncio",           desc: "Un partido destacado" },
    { key: "resultados-multi",label: "Resultados",        desc: "Varios marcadores" },
    { key: "resultado",       label: "Resultado",         desc: "Un resultado destacado" },
  ],
  estadisticas: [
    { key: "tabla",           label: "Posiciones",        desc: "Tabla con logos" },
    { key: "lideres",         label: "Líderes",           desc: "Top 5 en una categoría" },
    { key: "jugador",         label: "Jugador del partido", desc: "Premio MVP" },
  ],
  evento: [
    { key: "lanzamiento",     label: "Lanzamiento",       desc: "Arranque de temporada" },
    { key: "blank",           label: "En blanco",         desc: "Empezar desde cero" },
  ],
  default: [
    { key: "proximos-multi",  label: "Próximos partidos", desc: "Jornada completa" },
    { key: "resultados-multi",label: "Resultados",        desc: "Jornada jugada" },
    { key: "tabla",           label: "Posiciones",        desc: "Tabla" },
    { key: "lideres",         label: "Líderes",           desc: "Top 5" },
    { key: "jugador",         label: "Jugador del partido", desc: "MVP" },
    { key: "lanzamiento",     label: "Lanzamiento",       desc: "Temporada" },
    { key: "pre",             label: "Anuncio (1)",       desc: "Un partido" },
    { key: "resultado",       label: "Resultado (1)",     desc: "Un resultado" },
    { key: "blank",           label: "En blanco",         desc: "Desde cero" },
  ],
}

function Wizard() {
  const router = useRouter()
  const sp = useSearchParams()
  const tipoInicial = sp.get("tipo") || "default"
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [format, setFormat] = useState<Format>("feed")
  const [liga, setLiga] = useState<Liga>("lnb")
  const templates = TEMPLATES_BY_TIPO[tipoInicial] || TEMPLATES_BY_TIPO.default

  function handlePick(tpl: Template) {
    router.push(`/oficiales/admin/diseno-v3/editor?new=${format}:${liga}:${tpl}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/oficiales/admin/diseno-v3"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
          ><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Nuevo diseño</h1>
            <p className="text-xs text-neutral-400">Paso {step} de 3</p>
          </div>
          {/* Steps bar */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1.5 w-10 rounded-full transition",
                  step >= n ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-white/10",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-2xl font-bold">¿Qué formato querés?</h2>
            <p className="mb-6 text-sm text-neutral-400">Después podés cambiarlo desde el editor.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setFormat(f.key); setStep(2) }}
                  className={cn(
                    "group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition",
                    format === f.key
                      ? "border-indigo-400 bg-indigo-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10",
                  )}
                >
                  <div className={cn("w-32 rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900", f.ratio)} />
                  <div>
                    <div className="text-base font-bold">{f.label}</div>
                    <div className="text-xs text-neutral-400">{f.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-1 text-2xl font-bold">¿Qué liga?</h2>
            <p className="mb-6 text-sm text-neutral-400">Define el tema y los sponsors por defecto.</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {LIGAS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => { setLiga(l.key); setStep(3) }}
                  className={cn(
                    "relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-5 transition",
                    liga === l.key
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30",
                  )}
                >
                  <div className={cn("h-16 w-16 rounded-xl bg-gradient-to-br", l.gradient)} />
                  <div className="text-sm font-bold">{l.label}</div>
                  <div className="text-[10px] text-neutral-400">{l.sub}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
              ><ArrowLeft className="h-4 w-4" /> Volver</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-1 text-2xl font-bold">Elegí una plantilla</h2>
            <p className="mb-6 text-sm text-neutral-400">
              O empezá en blanco. Todas las plantillas son 100% editables.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handlePick(t.key)}
                  className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm font-bold">{t.label}</div>
                    <ArrowRight className="ml-auto h-4 w-4 text-neutral-500 transition group-hover:text-white" />
                  </div>
                  <div className="text-xs text-neutral-400">{t.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
              ><ArrowLeft className="h-4 w-4" /> Volver</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DisenoV3NuevoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <Wizard />
    </Suspense>
  )
}
