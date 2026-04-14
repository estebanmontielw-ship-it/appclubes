import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const FASE_ORDER = [
  "LNB_ETAPA1_ASU", "LNB_ETAPA1_INT",
  "LNB_COMUNEROS_ASU", "LNB_COMUNEROS_INT",
  "LNB_FINAL_COM",
  "LNB_TOP4_ASU", "LNB_TOP4_INT", "LNB_TOP4_EXT",
  "LNB_FINAL_TOP4", "LNB_FINAL_EXT",
]

// GET ?categoria=PRIMERA_DIVISION&rama=Masculino
// Devuelve fases con montos unitarios por rol, solo para torneos configurados
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get("categoria")
    const rama = searchParams.get("rama")

    // Mapear categoria+rama al torneo key en ArancelLnb
    const TORNEO_MAP: Record<string, Record<string, string>> = {
      PRIMERA_DIVISION: { Masculino: "LNB_MASC" },
      FEMENINO:         { Femenino: "LNB_FEM" },
      SEGUNDA_DIVISION: { Masculino: "SEG_MASC", Femenino: "SEG_FEM" },
      U21:              { Masculino: "U21_MASC", Femenino: "U21_FEM" },
      U18:              { Masculino: "U18_MASC", Femenino: "U18_FEM" },
      U16:              { Masculino: "U16_MASC", Femenino: "U16_FEM" },
      U14:              { Masculino: "U14_MASC", Femenino: "U14_FEM" },
      ESPECIAL:         { Masculino: "ESP_MASC", Femenino: "ESP_FEM" },
    }
    const torneo: string | null = TORNEO_MAP[categoria]?.[rama] ?? null

    if (!torneo) {
      return NextResponse.json({ fases: [], torneo: null })
    }

    const rows = await prisma.arancelLnb.findMany({
      where: { torneo, activo: true },
    })

    if (rows.length === 0) {
      return NextResponse.json({ fases: [], torneo })
    }

    // Agrupar por fase
    const byFase: Record<string, typeof rows> = {}
    for (const row of rows) {
      if (!byFase[row.fase]) byFase[row.fase] = []
      byFase[row.fase].push(row)
    }

    const fases = FASE_ORDER.filter((f) => byFase[f]).map((f) => ({
      fase: f,
      faseNombre: byFase[f][0].faseNombre,
      // mapa rol → montoUnitario (solo los no manuales)
      montosPorRol: Object.fromEntries(
        byFase[f]
          .filter((r) => !r.esManual)
          .map((r) => [r.rol, Number(r.montoUnitario)])
      ),
    }))

    return NextResponse.json({ torneo, fases })
  } catch {
    return NextResponse.json({ fases: [], torneo: null })
  }
}
