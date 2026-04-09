import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Globe, AtSign, Share2, MapPin, Phone, Mail, ExternalLink, ChevronLeft, Trophy, Calendar, CheckCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { loadLnbSchedule } from "@/lib/programacion-lnb"
import type { NormalizedMatch } from "@/lib/programacion-lnb"

export const revalidate = 300

// Same slugify used in the seed route
function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function normalizeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

function namesMatch(a: string, b: string) {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

// Which leagues each club belongs to (hardcoded to match clubes/page.tsx)
const LNB_LEAGUES: Record<string, string[]> = {
  "olimpia":                    ["LNB Masculino", "LNB Femenino", "U22 Femenino"],
  "colonias-gold":              ["LNB Masculino"],
  "deportivo-san-jose":         ["LNB Masculino", "LNB Femenino", "U22 Femenino"],
  "felix-perez-cardozo":        ["LNB Masculino", "LNB Femenino", "U22 Femenino"],
  "club-deportivo-amambay":     ["LNB Masculino"],
  "club-deportivo-campo-alto":  ["LNB Masculino"],
  "club-san-alfonzo":           ["LNB Masculino"],
  "club-atletico-ciudad-nueva": ["LNB Masculino", "U22 Femenino"],
  "sol-de-america":             ["LNB Femenino", "U22 Femenino"],
  "sportivo-sanlorenzo":        ["U22 Femenino"],
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function fmtDate(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return "Por confirmar"
  const d = new Date(dateStr + "T00:00:00Z")
  const day = d.getUTCDate()
  const month = MONTHS[d.getUTCMonth()]
  const time = timeStr ? timeStr.slice(0, 5) : null
  return time ? `${day} ${month} · ${time}` : `${day} ${month}`
}

export async function generateStaticParams() {
  try {
    const clubs = await prisma.club.findMany({
      where: { activo: true },
      select: { slug: true },
    })
    return clubs.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const club = await prisma.club.findUnique({
      where: { slug: params.slug, activo: true },
      select: { nombre: true, ciudad: true, descripcion: true, logoUrl: true },
    })
    if (!club) return { title: "Club no encontrado" }
    return {
      title: `${club.nombre} | CPB`,
      description: club.descripcion || `${club.nombre} — ${club.ciudad} — Club afiliado a la CPB`,
      openGraph: {
        title: `${club.nombre} | CPB`,
        description: club.descripcion || `${club.nombre} — ${club.ciudad}`,
        url: `/clubes/${params.slug}`,
        images: club.logoUrl ? [{ url: club.logoUrl }] : undefined,
      },
    }
  } catch {
    return { title: "Club" }
  }
}

function MatchCard({ m, clubName }: { m: NormalizedMatch; clubName: string }) {
  const isHome = namesMatch(m.homeName, clubName)
  const isComplete = m.status === "COMPLETE"
  const isLive = m.status === "STARTED" || m.status === "LIVE" || m.status === "IN_PROGRESS"
  const hasScore = m.homeScore != null && m.awayScore != null

  const myScore = isHome ? m.homeScore : m.awayScore
  const oppScore = isHome ? m.awayScore : m.homeScore
  const oppName = isHome ? m.awayName : m.homeName
  const oppSigla = isHome ? m.awaySigla : m.homeSigla
  const oppLogo = isHome ? m.awayLogo : m.homeLogo

  let resultColor = ""
  let resultLabel = ""
  if (isComplete && hasScore && myScore != null && oppScore != null) {
    if (myScore > oppScore) { resultColor = "text-green-600 bg-green-50 border-green-100"; resultLabel = "G" }
    else if (myScore < oppScore) { resultColor = "text-red-500 bg-red-50 border-red-100"; resultLabel = "P" }
    else { resultColor = "text-gray-500 bg-gray-50 border-gray-100"; resultLabel = "E" }
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border bg-white ${isLive ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>
      {/* Opponent logo */}
      <div className="shrink-0">
        {oppLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={oppLogo} alt={oppName} className="w-9 h-9 object-contain rounded-full border border-gray-100 bg-white" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-400">
            {(oppSigla || oppName).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />}
          <p className="text-sm font-bold text-[#0a1628] truncate">
            {isHome ? "vs" : "en"} {oppSigla || oppName}
          </p>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {isLive ? "En curso" : fmtDate(m.date, m.time)}
          {m.venue && <span className="ml-1.5 text-gray-300">· {m.venue}</span>}
        </p>
        {m.roundLabel && (
          <p className="text-[10px] text-gray-300 font-semibold mt-0.5 uppercase tracking-wide">{m.roundLabel}</p>
        )}
      </div>

      {/* Score / Result */}
      {(isComplete || isLive) && hasScore ? (
        <div className="shrink-0 text-right">
          <span className={`text-base font-black tabular-nums ${isLive ? "text-red-500" : "text-[#0a1628]"}`}>
            {myScore}–{oppScore}
          </span>
          {isComplete && resultLabel && (
            <div className={`text-[10px] font-black text-center mt-0.5 px-1.5 py-0.5 rounded-full border ${resultColor}`}>
              {resultLabel}
            </div>
          )}
        </div>
      ) : (
        m.statsUrl ? (
          <a href={m.statsUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500 hover:text-blue-700">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : null
      )}
    </div>
  )
}

export default async function ClubDetailPage({ params }: { params: { slug: string } }) {
  const club = await prisma.club.findUnique({
    where: { slug: params.slug, activo: true },
  })

  if (!club) notFound()

  const leagues = LNB_LEAGUES[params.slug] ?? []
  const isLnbClub = leagues.length > 0

  // Load LNB schedule if this is an LNB club
  let lnbMatches: NormalizedMatch[] = []
  let teamLogo: string | null = null
  let standing: { wins: number; losses: number; gamesPlayed: number; winPct: number | null } | null = null

  if (isLnbClub) {
    try {
      const { matches, teams } = await loadLnbSchedule()

      // Find this club in the LNB teams list
      const lnbTeam = teams.find((t) => namesMatch(t.name, club.nombre))

      if (lnbTeam) {
        teamLogo = lnbTeam.logo
        // Filter matches for this club (by team ID or name)
        lnbMatches = matches.filter(
          (m) =>
            m.homeId === lnbTeam.id ||
            m.awayId === lnbTeam.id ||
            namesMatch(m.homeName, club.nombre) ||
            namesMatch(m.awayName, club.nombre)
        )
      } else {
        // Fallback: filter by name only
        lnbMatches = matches.filter(
          (m) => namesMatch(m.homeName, club.nombre) || namesMatch(m.awayName, club.nombre)
        )
        if (lnbMatches.length > 0) {
          const first = lnbMatches[0]
          const isHome = namesMatch(first.homeName, club.nombre)
          teamLogo = isHome ? first.homeLogo : first.awayLogo
        }
      }

      // Calculate standing from completed matches
      const completed = lnbMatches.filter((m) => m.status === "COMPLETE" && m.homeScore != null && m.awayScore != null)
      if (completed.length > 0) {
        let wins = 0
        for (const m of completed) {
          const isHome = namesMatch(m.homeName, club.nombre)
          const myScore = isHome ? m.homeScore! : m.awayScore!
          const oppScore = isHome ? m.awayScore! : m.homeScore!
          if (myScore > oppScore) wins++
        }
        const gp = completed.length
        standing = { wins, losses: gp - wins, gamesPlayed: gp, winPct: gp > 0 ? wins / gp : null }
      }
    } catch {
      // API unavailable — show club info only
    }
  }

  const now = new Date().toISOString().slice(0, 10)
  const upcoming = lnbMatches
    .filter((m) => m.status !== "COMPLETE" && (m.date ?? "9999") >= now)
    .sort((a, b) => (a.isoDateTime ?? "").localeCompare(b.isoDateTime ?? ""))
    .slice(0, 3)

  const recent = lnbMatches
    .filter((m) => m.status === "COMPLETE")
    .slice(-3)
    .reverse()

  const displayLogo = club.logoUrl || teamLogo

  // FibaLiveStats link: use first match that has a statsUrl
  const statsBaseUrl = lnbMatches.find((m) => m.statsUrl)?.statsUrl?.replace(/\/\d+\/$/, "") ?? null

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cpb.com.py"
  const clubSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: club.nombre,
    url: `${siteUrl}/clubes/${params.slug}`,
    logo: displayLogo ?? undefined,
    sport: "Basketball",
    location: club.ciudad
      ? { "@type": "Place", name: club.ciudad, address: { "@type": "PostalAddress", addressLocality: club.ciudad, addressCountry: "PY" } }
      : undefined,
    memberOf: {
      "@type": "SportsOrganization",
      name: "Confederación Paraguaya de Básquetbol",
      url: siteUrl,
    },
    ...(club.email && { email: club.email }),
    ...(club.telefono && { telephone: club.telefono }),
    ...(club.sitioWeb && { sameAs: [club.sitioWeb] }),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubSchema) }}
      />
      {/* Back link */}
      <Link href="/clubes" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Clubes
      </Link>

      {/* Club Header */}
      <div className="bg-gradient-to-r from-[#0a1628] to-[#132043] rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Logo */}
        <div className="shrink-0">
          {displayLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayLogo}
              alt={club.nombre}
              className="w-24 h-24 object-contain rounded-2xl bg-white/10 p-2"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-3xl font-black text-white/60">
                {club.nombre.split(" ").filter((w) => w.length > 2).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name + info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {leagues.map((l) => (
              <span key={l} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {l}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{club.nombre}</h1>
          {club.sigla && (
            <p className="text-sm text-blue-300 font-bold mt-0.5 uppercase tracking-wider">{club.sigla}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/60">
            {club.ciudad && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {club.ciudad}
              </span>
            )}
            {standing && (
              <span className="flex items-center gap-1 text-white/80 font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {standing.wins}G–{standing.losses}P
                {standing.winPct != null && (
                  <span className="text-white/40 font-normal ml-1">({(standing.winPct * 100).toFixed(0)}%)</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: LNB matches */}
        <div className="lg:col-span-2 space-y-6">
          {isLnbClub ? (
            <>
              {/* Upcoming matches */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-black uppercase tracking-wide text-[#0a1628]">Próximos partidos</h2>
                </div>
                {upcoming.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-5 text-center text-sm text-gray-400">
                    No hay partidos programados próximamente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((m) => (
                      <MatchCard key={m.id} m={m} clubName={club.nombre} />
                    ))}
                  </div>
                )}
              </section>

              {/* Recent results */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <h2 className="text-sm font-black uppercase tracking-wide text-[#0a1628]">Últimos resultados</h2>
                </div>
                {recent.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-5 text-center text-sm text-gray-400">
                    No hay resultados disponibles todavía.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recent.map((m) => (
                      <MatchCard key={m.id} m={m} clubName={club.nombre} />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 font-semibold">Este club no participa en la LNB 2026</p>
              <p className="text-xs text-gray-400 mt-1">Los partidos de liga estarán disponibles cuando el club clasifique a competencias nacionales.</p>
            </div>
          )}
        </div>

        {/* Right: Club info */}
        <div className="space-y-4">
          {/* Description */}
          {club.descripcion && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-sm text-gray-600 leading-relaxed">{club.descripcion}</p>
            </div>
          )}

          {/* Contact info */}
          {(club.telefono || club.email || club.direccion) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Contacto</h3>
              {club.telefono && (
                <a href={`tel:${club.telefono}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {club.telefono}
                </a>
              )}
              {club.email && (
                <a href={`mailto:${club.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition-colors">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {club.email}
                </a>
              )}
              {club.direccion && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  {club.direccion}
                </div>
              )}
            </div>
          )}

          {/* Social & web links */}
          {(club.sitioWeb || club.instagram || club.facebook) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Links</h3>
              {club.sitioWeb && (
                <a href={club.sitioWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  Sitio web oficial
                </a>
              )}
              {club.instagram && (
                <a href={`https://instagram.com/${club.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                  <AtSign className="w-3.5 h-3.5 shrink-0" />
                  @{club.instagram.replace("@", "")}
                </a>
              )}
              {club.facebook && (
                <a href={club.facebook.startsWith("http") ? club.facebook : `https://facebook.com/${club.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  Facebook
                </a>
              )}
            </div>
          )}

          {/* FibaLiveStats link */}
          {statsBaseUrl && (
            <a
              href={statsBaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 bg-[#0a1628] hover:bg-[#132043] text-white rounded-xl p-3.5 transition-colors"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-300">FibaLiveStats</p>
                <p className="text-sm font-bold mt-0.5">Estadísticas en vivo</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/50 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
