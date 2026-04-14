import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Orden de display para las fases del LNB Masc (los otros torneos no tienen orden fijo)
const LNB_FASE_ORDER = [
  "LNB_ETAPA1_ASU", "LNB_ETAPA1_INT",
  "LNB_COMUNEROS_ASU", "LNB_COMUNEROS_INT",
  "LNB_FINAL_COM",
  "LNB_TOP4_ASU", "LNB_TOP4_INT", "LNB_TOP4_EXT",
  "LNB_FINAL_TOP4", "LNB_FINAL_EXT",
]

// Mapa categoría + rama → clave de torneo en aranceles_lnb
const TORNEO_MAP: Record<string, { masc: string | null; fem: string | null }> = {
  LNB:     { masc: "LNB_MASC",       fem: null         },
  LNBF:    { masc: null,             fem: "LNB_FEM"    },
  U22:     { masc: "U22_MASC",       fem: "U22_FEM"    },
  U19:     { masc: "INF_MASC_U19",   fem: null         },
  U17:     { masc: "INF_MASC_U1517", fem: "INF_FEM"    },
  U15:     { masc: "INF_MASC_U1517", fem: "INF_FEM"    },
  U13:     { masc: "INF_MASC_U1517", fem: "INF_FEM"    },
  ESPECIAL:{ masc: "ESP_MASC",       fem: "ESP_FEM"    },
}

// GET ?categoria=LNB&rama=Masculino
// Devuelve fases con montos unitarios por rol, solo para torneos configurados
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const categoriaRaw = searchParams.get("categoria")
    const ramaRaw      = searchParams.get("rama")

    if (!categoriaRaw) return NextResponse.json({ fases: [], torneo: null })

    const entry  = TORNEO_MAP[categoriaRaw]
    const torneo = entry ? (ramaRaw === "Femenino" ? entry.fem : entry.masc) : null

    if (!torneo) {
      return NextResponse.json({ fases: [], torneo: null })
    }

    const rows = await prisma.arancelLnb.findMany({
      where: { torneo, activo: true },
      orderBy: { createdAt: "asc" },
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

    // Para LNB usamos orden fijo; para el resto, orden de inserción
    const fasesOrdenadas = torneo === "LNB_MASC"
      ? LNB_FASE_ORDER.filter((f) => byFase[f])
      : Object.keys(byFase)

    const fases = fasesOrdenadas.map((f) => ({
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
