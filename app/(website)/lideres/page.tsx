import type { Metadata } from "next"
import SectionTitle from "@/components/website/SectionTitle"
import { resolveLnbCompetitionIdPublic } from "@/lib/programacion-lnb"
import { getLeadersFromMatches, type LeaderEntry } from "@/lib/genius-sports"
import { TrendingUp, Activity, Users, BarChart2, Hash, Star } from "lucide-react"

export const revalidate = 300

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
      <img src={entry.photoUrl} alt={entry.playerName} className="w-8 h-8 object-cover rounded-full border border-gray-100 shrink-0" />
    )
  }
  if (entry.teamLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={entry.teamLogo} alt={entry.teamName} className="w-8 h-8 object-contain rounded-full border border-gray-100 bg-white p-0.5 shrink-0" />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400 shrink-0">
      {(entry.teamSigla ?? entry.teamName).slice(0, 2)}
    </div>
  )
}

function LeaderTable({
  title,
  icon,
  unit,
  rows,
  valueDecimals = 1,
}: {
  title: string
  icon: React.ReactNode
  unit: string
  rows: LeaderEntry[]
  valueDecimals?: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
        <span className="text-blue-600">{icon}</span>
        <h2 className="font-black text-base uppercase tracking-wide text-[#0a1628]">{title}</h2>
        <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-gray-300">{unit}</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <BarChart2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-semibold">
            Estadísticas disponibles cuando haya partidos jugados.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {rows.map((r) => (
            <li key={r.personId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/40 transition-colors">
              <span className="w-6 text-center text-xs font-black text-gray-200">{r.rank}</span>
              <PlayerAvatar entry={r} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0a1628] truncate">{r.playerName}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{r.teamSigla ?? r.teamName}</p>
              </div>
              <span className="text-lg font-black text-[#0a1628] tabular-nums">
                {valueDecimals === 0 ? r.value : r.value.toFixed(valueDecimals)}
              </span>
            </li>
          ))}
        </ul>
      )}
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

        {/* Promedios */}
        <p className="mt-6 mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">Promedios por partido</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <LeaderTable title="Anotación" icon={<Activity className="w-4 h-4" />} unit="pts/partido" rows={scoring} />
          <LeaderTable title="Rebotes" icon={<Users className="w-4 h-4" />} unit="reb/partido" rows={rebounds} />
          <LeaderTable title="Asistencias" icon={<TrendingUp className="w-4 h-4" />} unit="ast/partido" rows={assists} />
        </div>

        {/* Totales */}
        <p className="mt-8 mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">Totales en la temporada</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <LeaderTable title="Puntos Totales" icon={<Star className="w-4 h-4" />} unit="pts totales" rows={totalScoring} valueDecimals={0} />
          <LeaderTable title="Triples" icon={<Hash className="w-4 h-4" />} unit="3pt totales" rows={totalThreePointers} valueDecimals={0} />
          <LeaderTable title="Asistencias Tot." icon={<TrendingUp className="w-4 h-4" />} unit="ast totales" rows={totalAssists} valueDecimals={0} />
        </div>
      </div>
    </div>
  )
}
