import type { Metadata } from "next"
import Link from "next/link"
import SectionTitle from "@/components/website/SectionTitle"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getLeadersFromMatches, type LeaderEntry } from "@/lib/genius-sports"
import { TrendingUp, Activity, Users, BarChart2, Hash, Star } from "lucide-react"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Líderes | CPB - Confederación Paraguaya de Básquetbol",
  description:
    "Líderes estadísticos de la Liga Nacional de Básquetbol — mejores anotadores, reboteadores y asistidores.",
  openGraph: {
    title: "Líderes Estadísticos | CPB",
    description: "Los mejores jugadores en cada categoría estadística.",
    url: "/lideres",
  },
}

function PlayerAvatar({ entry }: { entry: LeaderEntry }) {
  if (entry.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={entry.photoUrl} alt={entry.playerName} className="w-9 h-9 object-cover rounded-full border border-gray-100 shrink-0" />
    )
  }
  if (entry.teamLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={entry.teamLogo} alt={entry.teamName} className="w-9 h-9 object-contain rounded-full border border-gray-100 bg-white p-0.5 shrink-0" />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0">
      {(entry.teamSigla ?? entry.teamName).slice(0, 2)}
    </div>
  )
}

function LeaderTable({
  title, icon, unit, rows, valueDecimals = 1,
}: {
  title: string; icon: React.ReactNode; unit: string
  rows: LeaderEntry[]; valueDecimals?: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
        <span className="text-blue-600">{icon}</span>
        <h2 className="font-black text-sm uppercase tracking-wide text-[#0a1628]">{title}</h2>
        <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-gray-300 whitespace-nowrap">{unit}</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <BarChart2 className="w-7 h-7 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400 font-semibold">Sin partidos jugados aún.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {rows.map((r) => (
            <Link key={r.personId} href={`/jugador/${r.personId}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50/50 active:bg-blue-50 transition-colors">
              <span className="w-5 text-center text-xs font-black text-gray-200 shrink-0">{r.rank}</span>
              <PlayerAvatar entry={r} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0a1628] truncate leading-tight">{r.playerName}</p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">{r.teamSigla ?? r.teamName}</p>
              </div>
              <span className="text-base font-black text-[#0a1628] tabular-nums shrink-0">
                {valueDecimals === 0 ? r.value : r.value.toFixed(valueDecimals)}
              </span>
            </Link>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Swipeable row of 3 cards on mobile, grid-cols-3 on desktop */
function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-3 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
      {children}
    </div>
  )
}

function SwipeCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-[82vw] sm:min-w-[55vw] md:min-w-0 snap-start shrink-0 md:shrink">
      {children}
    </div>
  )
}

export default async function LideresPage() {
  const { id: competitionId } = await resolveLnbCompetitionIdPublic()

  let scoring: LeaderEntry[] = []
  let rebounds: LeaderEntry[] = []
  let assists: LeaderEntry[] = []
  let totalScoring: LeaderEntry[] = []
  let totalThreePointers: LeaderEntry[] = []
  let totalAssists: LeaderEntry[] = []

  if (competitionId) {
    try {
      const leaders = await getLeadersFromMatches(competitionId)
      scoring = leaders.scoring
      rebounds = leaders.rebounds
      assists = leaders.assists
      totalScoring = leaders.totalScoring
      totalThreePointers = leaders.totalThreePointers
      totalAssists = leaders.totalAssists
    } catch {
      // show empty state
    }
  }

  return (
    <div className="bg-[#f5f7fb] min-h-[calc(100vh-200px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <SectionTitle
          title="Líderes"
          subtitle="Los mejores jugadores de la LNB 2026 en cada categoría"
        />

        {/* Totales */}
        <div className="mt-6 flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Totales en la temporada</p>
          <p className="text-[10px] text-gray-300 md:hidden">← deslizá</p>
        </div>
        <CardRow>
          <SwipeCard><LeaderTable title="Puntos" icon={<Star className="w-4 h-4" />} unit="pts totales" rows={totalScoring} valueDecimals={0} /></SwipeCard>
          <SwipeCard><LeaderTable title="Triples" icon={<Hash className="w-4 h-4" />} unit="3pt totales" rows={totalThreePointers} valueDecimals={0} /></SwipeCard>
          <SwipeCard><LeaderTable title="Asistencias" icon={<TrendingUp className="w-4 h-4" />} unit="ast totales" rows={totalAssists} valueDecimals={0} /></SwipeCard>
        </CardRow>

        {/* Promedios */}
        <div className="mt-8 flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Promedios por partido</p>
          <p className="text-[10px] text-gray-300 md:hidden">← deslizá</p>
        </div>
        <CardRow>
          <SwipeCard><LeaderTable title="Anotación" icon={<Activity className="w-4 h-4" />} unit="pts/partido" rows={scoring} /></SwipeCard>
          <SwipeCard><LeaderTable title="Rebotes" icon={<Users className="w-4 h-4" />} unit="reb/partido" rows={rebounds} /></SwipeCard>
          <SwipeCard><LeaderTable title="Asistencias" icon={<TrendingUp className="w-4 h-4" />} unit="ast/partido" rows={assists} /></SwipeCard>
        </CardRow>
      </div>
    </div>
  )
}
