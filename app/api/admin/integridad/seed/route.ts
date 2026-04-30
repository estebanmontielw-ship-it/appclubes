import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import { handleApiError } from "@/lib/api-errors"
import { normalizeName } from "@/lib/integridad"
import type { IntegridadTier } from "@prisma/client"

export const dynamic = "force-dynamic"

interface SeedJugador {
  nombre: string
  club: string
  clubSigla: string
  numero: number | null
  tier: IntegridadTier
  notas: string
}

/**
 * Lista inicial de jugadores bajo seguimiento — caso CPB / LNB Apertura 2026.
 * Basada en los reportes de Sportradar UFDS y las 3 alertas IBIA confirmadas.
 *
 * Estos jugadores NO están "acusados" de nada — están bajo monitoreo por
 * patrones estadísticos anómalos detectados en partidos previos.
 */
const SEED_JUGADORES: SeedJugador[] = [
  // SAN ALFONZO
  { nombre: "Maxsuel Urnau", club: "SAN ALFONZO", clubSigla: "ALF", numero: 13, tier: "TIER_1",
    notas: "Capitán. Cuenta personal usada para fondos del club. Posible mismo jugador que Maxsuel Roque." },
  { nombre: "Renan Dos Santos", club: "SAN ALFONZO", clubSigla: "ALF", numero: 5, tier: "TIER_1",
    notas: "Patrón de TLs fallados. Falta antideportiva en momento clave 20 abr." },
  { nombre: "Victor Silva", club: "SAN ALFONZO", clubSigla: "ALF", numero: 11, tier: "TIER_1",
    notas: "0 puntos en 2 partidos sospechosos consecutivos." },
  { nombre: "Santiago Peralta", club: "SAN ALFONZO", clubSigla: "ALF", numero: 10, tier: "TIER_2",
    notas: "Patrón ambivalente." },
  { nombre: "Cristian Lora", club: "SAN ALFONZO", clubSigla: "ALF", numero: 15, tier: "TIER_2",
    notas: "Turnovers anormales, secuencias fallidas." },
  { nombre: "Juan Medina", club: "SAN ALFONZO", clubSigla: "ALF", numero: 4, tier: "TIER_2",
    notas: "Bajos porcentajes en partidos sospechosos." },

  // DEPORTIVO CAMPOALTO
  { nombre: "Jefferson Arguello", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 23, tier: "TIER_1",
    notas: "6 escalated matches Sportradar. 0/3 FG en partido confirmado manipulado." },
  { nombre: "Octavio Caputo", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 12, tier: "TIER_1",
    notas: "6 escalated matches. Juega 1-2 min, perfil información." },
  { nombre: "Francisco Bogarin", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 2, tier: "TIER_2",
    notas: "Selección anómala de tiros: 75% en 2pt pero 0/4 en 3pt." },
  { nombre: "Juan Marti", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 0, tier: "TIER_2",
    notas: "5 escalated matches. PG controlador de ritmo." },
  { nombre: "Jose Carlos Dos Santos", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 13, tier: "TIER_2",
    notas: "3 escalated matches." },
  { nombre: "Bryan Burns", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: 91, tier: "TIER_2",
    notas: "4 escalated matches. Rara vez juega." },
  { nombre: "Guillermo Araujo", club: "DEPORTIVO CAMPOALTO", clubSigla: "CAM", numero: null, tier: "TIER_2",
    notas: "5 escalated matches." },

  // CIUDAD NUEVA
  { nombre: "Jorge Sequera", club: "CIUDAD NUEVA", clubSigla: "CIU", numero: 13, tier: "TIER_2",
    notas: "0/4 todos triples en 27 min. Cero intentos de 2pt." },
  { nombre: "Michael Kamary", club: "CIUDAD NUEVA", clubSigla: "CIU", numero: 21, tier: "TIER_2",
    notas: "2/11 FG vs 8/10 cinco días antes. Falta técnica → banco Q4." },
]

async function requireSuperAdmin() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  const adminRoles = await prisma.usuarioRol.findMany({
    where: { usuarioId: user.id, rol: "SUPER_ADMIN" },
  })
  if (adminRoles.length === 0) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { user }
}

/**
 * POST — precarga la lista inicial de jugadores tier (idempotente).
 * Si un jugador ya existe (mismo nombreNorm + club), lo deja como está.
 *
 * Devuelve: { creados, existentes, total }
 */
export async function POST() {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return auth.error

    let creados = 0
    let existentes = 0

    for (const j of SEED_JUGADORES) {
      const nombreNorm = normalizeName(j.nombre)
      const yaExiste = await prisma.integridadJugadorTier.findUnique({
        where: { nombreNorm_club: { nombreNorm, club: j.club } },
      })
      if (yaExiste) {
        existentes++
        continue
      }
      await prisma.integridadJugadorTier.create({
        data: {
          nombre: j.nombre,
          nombreNorm,
          club: j.club,
          clubSigla: j.clubSigla,
          numero: j.numero,
          tier: j.tier,
          notas: j.notas,
          creadoPor: auth.user!.id,
        },
      })
      creados++
    }

    await prisma.integridadAuditLog.create({
      data: {
        accion: "seed_jugadores",
        userId: auth.user!.id,
        userEmail: auth.user!.email,
        detalles: { creados, existentes, total: SEED_JUGADORES.length } as any,
      },
    })

    return NextResponse.json({
      creados,
      existentes,
      total: SEED_JUGADORES.length,
    })
  } catch (error) {
    return handleApiError(error, { context: "POST /api/admin/integridad/seed" })
  }
}
