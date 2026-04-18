import type { Metadata } from "next"
import ProgramacionLNBClient from "@/components/website/ProgramacionLNBClient"
import { loadLnbSchedule } from "@/lib/programacion-lnb"

// force-dynamic so generateMetadata can read ?comp= for per-competition OG images
export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://cpb.com.py"

const COMP_META: Record<string, { title: string; description: string }> = {
  lnb:  { title: "Programación LNB",           description: "Programación confirmada de la Liga Nacional de Básquetbol. Filtrá por fecha, club o condición." },
  lnbf: { title: "Programación LNBF",          description: "Programación confirmada de la Liga Nacional Femenina de Básquetbol 2026." },
  u22m: { title: "Programación U22 Masculino", description: "Programación del Torneo de Desarrollo U22 Masculino 2026." },
  u22f: { title: "Programación U22 Femenino",  description: "Programación del Torneo de Desarrollo U22 Femenino 2026." },
}

export async function generateMetadata({ searchParams }: { searchParams: { comp?: string } }): Promise<Metadata> {
  const comp = searchParams?.comp ?? "lnb"
  const meta = COMP_META[comp] ?? COMP_META.lnb
  const ogImage = `${BASE_URL}/api/og/programacion?comp=${comp}`
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false },
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  }
}

export default async function ProgramacionLNBPage() {
  let data: Awaited<ReturnType<typeof loadLnbSchedule>> | null = null
  let error: string | null = null

  try {
    data = await loadLnbSchedule()
  } catch (e: any) {
    error = e?.message || "Error cargando la programación"
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {error || !data ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-semibold mb-1">No se pudo cargar la programación</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-3 text-red-600/80">
              Revisá que la API de Genius Sports esté respondiendo y que la competencia LNB
              esté activa. También podés definir GENIUS_LNB_COMPETITION_ID en las variables
              de entorno para forzar una competencia específica.
            </p>
          </div>
        ) : (
          <ProgramacionLNBClient
            competitionName={data.competition.name}
            teams={data.teams}
            matches={data.matches}
            updatedAt={data.updatedAt}
            showCompetitionSwitch={true}
          />
        )}
      </div>
    </div>
  )
}
