import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Orden lógico de fases por torneo (inicio → final)
const FASE_ORDER_MAP: Record<string, string[]> = {
  LNB_MASC: [
    "LNB_ETAPA1_ASU", "LNB_ETAPA1_INT",
    "LNB_COMUNEROS_ASU", "LNB_COMUNEROS_INT",
    "LNB_FINAL_COM",
    "LNB_TOP4_ASU", "LNB_TOP4_INT", "LNB_TOP4_EXT",
    "LNB_FINAL_TOP4", "LNB_FINAL_EXT",
  ],
  LNB_FEM: [
    "LNB_FEM_ETAPA1", "LNB_FEM_ETAPA2", "LNB_FEM_FINAL", "LNB_FEM_EXT",
  ],
  U22_FEM: [
    "U22_FEM_ETAPA1", "U22_FEM_ETAPA2", "U22_FEM_FINAL",
  ],
  U22_MASC: [
    "U22_MASC_ETAPA1", "U22_MASC_ETAPA2", "U22_MASC_FINAL",
  ],
  INF_FEM: [
    "INF_FEM_ETAPA1", "INF_FEM_ETAPA1_UNICA",
    "INF_FEM_ETAPA2_PLATA", "INF_FEM_ETAPA2_ORO",
    "INF_FEM_FINAL_PLATA", "INF_FEM_FINAL_ORO",
    "INF_FEM_INTERIOR_1", "INF_FEM_INTERIOR_2",
  ],
  INF_MASC_U1517: [
    "INF_U1517_ETAPA1", "INF_U1517_ETAPA1_UNICA",
    "INF_U1517_CTOS_PLATA", "INF_U1517_SEMI_PLATA",
    "INF_U1517_CTOS_ORO", "INF_U1517_SEMI_ORO",
    "INF_U1517_FINAL_PLATA", "INF_U1517_FINAL_ORO",
    "INF_U1517_INTERIOR_1", "INF_U1517_INTERIOR_2",
  ],
  INF_MASC_U19: [
    "INF_U19_ETAPA1", "INF_U19_CUARTOS", "INF_U19_SEMIS", "INF_U19_FINAL",
    "INF_U19_INTERIOR_1", "INF_U19_INTERIOR_2",
  ],
}

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

    // Usar orden lógico si existe para el torneo; si no, orden de inserción
    const faseOrder = FASE_ORDER_MAP[torneo]
    const fasesOrdenadas = faseOrder
      ? faseOrder.filter((f) => byFase[f])
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
