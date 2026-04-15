import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-errors"

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

const ROL_ORDER = [
  "ARBITRO",
  "ARBITRO_NAC",
  "ARBITRO_INTL",
  "OFICIAL_MESA",
  "AUXILIAR",
  "ESTADISTICO",
  "RELATOR",
]

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const adminRoles = await prisma.usuarioRol.findMany({
      where: { usuarioId: user.id, rol: { in: ["SUPER_ADMIN", "DESIGNADOR"] } },
    })
    if (adminRoles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const torneo = searchParams.get("torneo") || "LNB_MASC"

    const rows = await prisma.arancelLnb.findMany({
      where: { torneo, activo: true },
      orderBy: [{ fase: "asc" }, { rol: "asc" }],
    })

    // Agrupar por fase manteniendo el orden correcto
    const byFase: Record<string, typeof rows> = {}
    for (const row of rows) {
      if (!byFase[row.fase]) byFase[row.fase] = []
      byFase[row.fase].push(row)
    }

    // Ordenar roles dentro de cada fase
    for (const fase of Object.keys(byFase)) {
      byFase[fase].sort(
        (a, b) => ROL_ORDER.indexOf(a.rol) - ROL_ORDER.indexOf(b.rol)
      )
    }

    // Usar orden fijo por torneo si existe; si no, orden de inserción en DB
    const faseOrder = FASE_ORDER_MAP[torneo]
    const fasesOrdenadas = faseOrder
      ? faseOrder.filter((f) => byFase[f])
      : Object.keys(byFase)

    // Construir array ordenado de fases
    const fases = fasesOrdenadas.map((f) => ({
      fase: f,
      faseNombre: byFase[f][0].faseNombre,
      roles: byFase[f].map((r) => ({
        id: r.id,
        rol: r.rol,
        montoUnitario: Number(r.montoUnitario),
        cantPersonas: r.cantPersonas,
        esManual: r.esManual,
        subtotal: r.esManual ? null : Number(r.montoUnitario) * r.cantPersonas,
      })),
      netoCalculable: byFase[f]
        .filter((r) => !r.esManual)
        .reduce((acc, r) => acc + Number(r.montoUnitario) * r.cantPersonas, 0),
      tieneManual: byFase[f].some((r) => r.esManual),
    }))

    return NextResponse.json({ torneo, fases })
  } catch (error) {
    return handleApiError(error, { context: "admin/aranceles-lnb" })
  }
}
