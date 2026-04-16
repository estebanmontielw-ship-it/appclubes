import Image from "next/image"
import { Trophy, TrendingUp, Users, Activity } from "lucide-react"

export interface StandingRow {
  rank: number
  teamId: string | number
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  gamesPlayed: number
  wins: number
  losses: number
  winPct: number | null
  pointsFor: number | null
  pointsAgainst: number | null
  pointDiff: number | null
}

export interface LeaderEntry {
  rank: number
  playerName: string
  teamName: string
  teamSigla: string | null
  teamLogo: string | null
  photoUrl?: string | null
  value: number
  statLabel: string
}

interface Props {
  standings: StandingRow[]
  scoringLeaders: LeaderEntry[]
  reboundsLeaders: LeaderEntry[]
  assistsLeaders: LeaderEntry[]
  error: string | null
  /** Competition label shown in the table header. Default "LNB 2026". */
  competitionLabel?: string
}

function TeamLogo({ logo, name, size = 32 }: { logo: string | null; name: string; size?: number }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="object-contain rounded-full bg-white border border-gray-100"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-400"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

function LeadersCard({
  title,
  icon,
  leaders,
  unit,
}: {
  title: string
  icon: React.ReactNode
  leaders: LeaderEntry[]
  unit: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <h3 className="font-black text-sm uppercase tracking-wide text-[#0a1628]">{title}</h3>
      </div>
      {leaders.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 text-center">
          Estadísticas disponibles cuando haya partidos jugados.
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {leaders.map((l) => (
            <li key={l.rank} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 text-center text-xs font-black text-gray-300">
                {l.rank}
              </span>
              {l.photoUrl
                ? <img src={l.photoUrl} alt={l.playerName} width={28} height={28} className="rounded-full object-cover border border-gray-100 shrink-0" style={{width:28,height:28}} />
                : <TeamLogo logo={l.teamLogo} name={l.teamName} size={28} />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0a1628] truncate">{l.playerName}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{l.teamSigla ?? l.teamName}</p>
              </div>
              <span className="text-base font-black text-[#0a1628] tabular-nums">
                {l.value.toFixed(1)}
                <span className="text-[9px] font-semibold text-gray-400 ml-0.5">{unit}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function LNBStandings({
  standings,
  scoringLeaders,
  reboundsLeaders,
  assistsLeaders,
  error,
  competitionLabel = "LNB 2026",
}: Props) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-semibold mb-1">No se pudo cargar la tabla de posiciones</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Standings table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="font-black text-sm uppercase tracking-wide text-[#0a1628]">
            Clasificación — {competitionLabel}
          </h2>
        </div>

        {standings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">La tabla de posiciones estará disponible cuando inicien los partidos.</p>
            <p className="text-sm text-gray-400 mt-1">Volvé a revisar después de la primera fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 text-gray-400 text-[10px] font-black uppercase tracking-wide">
                  <th className="text-left px-4 sm:px-6 py-3 w-8">#</th>
                  <th className="text-left px-2 py-3">Equipo</th>
                  <th className="text-center px-2 py-3 hidden sm:table-cell">PJ</th>
                  <th className="text-center px-2 py-3">G</th>
                  <th className="text-center px-2 py-3">P</th>
                  <th className="text-center px-2 py-3">Pts</th>
                  <th className="text-center px-2 py-3">%</th>
                  <th className="text-center px-2 py-3 hidden md:table-cell">PF</th>
                  <th className="text-center px-2 py-3 hidden md:table-cell">PC</th>
                  <th className="text-center px-2 py-3 hidden md:table-cell">Dif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {standings.map((row, idx) => (
                  <tr
                    key={row.teamId}
                    className={`hover:bg-gray-50/40 transition-colors ${idx === 0 ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="px-4 sm:px-6 py-3 font-black text-gray-300 text-xs w-8">
                      {row.rank}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <TeamLogo logo={row.teamLogo} name={row.teamName} size={28} />
                        <div>
                          <p className="font-bold text-[#0a1628] leading-tight text-xs sm:text-sm">
                            {row.teamName}
                          </p>
                          {row.teamSigla && (
                            <p className="text-[9px] text-gray-400 font-semibold">{row.teamSigla}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center text-gray-500 hidden sm:table-cell">
                      {row.gamesPlayed}
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-[#0a1628]">{row.wins}</td>
                    <td className="px-2 py-3 text-center text-gray-400">{row.losses}</td>
                    <td className="px-2 py-3 text-center font-black text-[#0a1628]">
                      {row.wins * 2 + row.losses}
                    </td>
                    <td className="px-2 py-3 text-center font-semibold text-gray-600">
                      {row.winPct != null ? (row.winPct * 100).toFixed(0) + "%" : "—"}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 hidden md:table-cell">
                      {row.pointsFor ?? "—"}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 hidden md:table-cell">
                      {row.pointsAgainst ?? "—"}
                    </td>
                    <td className={`px-2 py-3 text-center font-semibold hidden md:table-cell ${(row.pointDiff ?? 0) > 0 ? "text-green-600" : (row.pointDiff ?? 0) < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {row.pointDiff != null ? (row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaders */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Líderes estadísticos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LeadersCard
            title="Anotación"
            icon={<Activity className="w-4 h-4" />}
            leaders={scoringLeaders}
            unit="pts"
          />
          <LeadersCard
            title="Rebotes"
            icon={<Users className="w-4 h-4" />}
            leaders={reboundsLeaders}
            unit="reb"
          />
          <LeadersCard
            title="Asistencias"
            icon={<TrendingUp className="w-4 h-4" />}
            leaders={assistsLeaders}
            unit="ast"
          />
        </div>
      </div>
    </div>
  )
}
